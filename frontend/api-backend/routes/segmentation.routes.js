const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

// Helper: load records for dataset
async function getDatasetRecords(datasetId) {
  const dataset = await db('datasets').where({ id: datasetId }).first();
  if (!dataset) {
    throw new Error('Dataset not found');
  }

  const customers = await db('customers').where({ dataset_id: datasetId });
  if (customers.length === 0) {
    throw new Error('Dataset contains no customer records');
  }

  const records = customers.map(c => {
    let raw = {};
    if (c.raw_data_json) {
      try { raw = JSON.parse(c.raw_data_json); } catch (e) {}
    }
    return {
      CustomerID: c.customer_id_code,
      CustomerName: c.name,
      Age: c.age,
      Gender: c.gender,
      AnnualIncome: c.annual_income,
      SpendingScore: c.spending_score,
      TotalSpend: c.total_spend,
      PurchaseFrequency: c.purchase_frequency,
      RecencyDays: c.recency_days,
      ...raw
    };
  });

  return { dataset, records };
}

// 1. POST /preview - Elbow & Silhouette analysis
router.post('/preview', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id, feature_columns, min_k = 2, max_k = 8, scaler = 'standard', missing_strategy = 'mean' } = req.body;

    if (!dataset_id) {
      return res.status(400).json({ error: 'dataset_id is required.' });
    }
    if (!feature_columns || !Array.isArray(feature_columns) || feature_columns.length === 0) {
      return res.status(400).json({ error: 'feature_columns array is required.' });
    }

    const { records } = await getDatasetRecords(dataset_id);

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/ml/elbow`, {
        records,
        feature_columns,
        min_k: parseInt(min_k, 10),
        max_k: parseInt(max_k, 10),
        scaler,
        missing_strategy
      }, { timeout: 30000 });

      res.json(mlResponse.data);
    } catch (mlErr) {
      const errMsg = mlErr.response?.data?.detail || mlErr.message || 'Failed to connect to ML service';
      return res.status(502).json({ error: `ML Service Error: ${errMsg}` });
    }
  } catch (err) {
    next(err);
  }
});

// 2. POST /run - Run real K-Means segmentation
router.post('/run', authenticateToken, requireRole(['admin', 'analyst']), async (req, res, next) => {
  try {
    const {
      dataset_id,
      run_name,
      feature_columns,
      n_clusters = 4,
      scaler = 'standard',
      missing_strategy = 'mean',
      random_state = 42,
      run_decision_tree = true
    } = req.body;

    if (!dataset_id) {
      return res.status(400).json({ error: 'dataset_id is required.' });
    }
    if (!feature_columns || !Array.isArray(feature_columns) || feature_columns.length === 0) {
      return res.status(400).json({ error: 'feature_columns array is required.' });
    }

    const { dataset, records } = await getDatasetRecords(dataset_id);

    let mlResult;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/ml/cluster`, {
        records,
        id_column: 'CustomerID',
        feature_columns,
        n_clusters: parseInt(n_clusters, 10),
        scaler,
        missing_strategy,
        random_state: parseInt(random_state, 10),
        run_decision_tree: Boolean(run_decision_tree)
      }, { timeout: 45000 });

      mlResult = mlResponse.data;
    } catch (mlErr) {
      const errMsg = mlErr.response?.data?.detail || mlErr.message || 'Failed to connect to ML service';
      return res.status(502).json({ error: `ML Service Error: ${errMsg}` });
    }

    // Persist run in database
    const [runId] = await db('segmentation_runs').insert({
      dataset_id: dataset.id,
      user_id: req.user.id,
      run_name: run_name || `K-Means (k=${n_clusters}) - ${new Date().toLocaleDateString()}`,
      algorithm: 'kmeans',
      n_clusters: mlResult.n_clusters,
      features_json: JSON.stringify(feature_columns),
      scaler,
      silhouette_score: mlResult.silhouette_score,
      davies_bouldin_index: mlResult.davies_bouldin_index,
      calinski_harabasz_score: mlResult.calinski_harabasz_score,
      profiles_json: JSON.stringify(mlResult.profiles),
      dt_rules_json: JSON.stringify(mlResult.decision_tree_rules || []),
      status: 'completed'
    });

    // Batch insert customer assignments
    const assignments = mlResult.assignments.map(a => ({
      run_id: runId,
      customer_id_code: String(a.id),
      segment_id: a.segment_id,
      segment_name: a.segment_name,
      pca_x: a.pca_x,
      pca_y: a.pca_y,
      distance_to_center: a.distance_to_center
    }));

    const chunkSize = 50;
    for (let i = 0; i < assignments.length; i += chunkSize) {
      await db('customer_segment_assignments').insert(assignments.slice(i, i + chunkSize));
    }

    // Audit event
    await db('audit_events').insert({
      user_id: req.user.id,
      action: 'RUN_SEGMENTATION',
      details_json: JSON.stringify({ runId, datasetId: dataset.id, clusters: n_clusters, features: feature_columns })
    });

    res.status(201).json({
      message: 'Segmentation run completed successfully.',
      runId,
      result: mlResult
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET /runs - List runs for dataset
router.get('/runs', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id } = req.query;
    let query = db('segmentation_runs')
      .leftJoin('datasets', 'segmentation_runs.dataset_id', 'datasets.id')
      .leftJoin('users', 'segmentation_runs.user_id', 'users.id')
      .select(
        'segmentation_runs.*',
        'datasets.name as dataset_name',
        'users.name as run_by_name'
      )
      .orderBy('segmentation_runs.created_at', 'desc');

    if (dataset_id) {
      query = query.where('segmentation_runs.dataset_id', dataset_id);
    }

    const runs = await query;
    const formatted = runs.map(r => ({
      ...r,
      features: r.features_json ? JSON.parse(r.features_json) : [],
      profiles: r.profiles_json ? JSON.parse(r.profiles_json) : [],
      dt_rules: r.dt_rules_json ? JSON.parse(r.dt_rules_json) : []
    }));

    res.json({ runs: formatted });
  } catch (err) {
    next(err);
  }
});

// 4. GET /runs/:id - Get full run details
router.get('/runs/:id', authenticateToken, async (req, res, next) => {
  try {
    const run = await db('segmentation_runs')
      .leftJoin('datasets', 'segmentation_runs.dataset_id', 'datasets.id')
      .where('segmentation_runs.id', req.params.id)
      .select('segmentation_runs.*', 'datasets.name as dataset_name')
      .first();

    if (!run) {
      return res.status(404).json({ error: 'Segmentation run not found.' });
    }

    const assignments = await db('customer_segment_assignments')
      .where({ run_id: run.id })
      .limit(500);

    res.json({
      run: {
        ...run,
        features: run.features_json ? JSON.parse(run.features_json) : [],
        profiles: run.profiles_json ? JSON.parse(run.profiles_json) : [],
        dt_rules: run.dt_rules_json ? JSON.parse(run.dt_rules_json) : []
      },
      assignments
    });
  } catch (err) {
    next(err);
  }
});

// 5. GET /runs/:id/export - Export run assignments CSV
router.get('/runs/:id/export', authenticateToken, async (req, res, next) => {
  try {
    const run = await db('segmentation_runs').where({ id: req.params.id }).first();
    if (!run) {
      return res.status(404).json({ error: 'Run not found.' });
    }

    const assignments = await db('customer_segment_assignments')
      .where({ run_id: run.id })
      .select('customer_id_code', 'segment_id', 'segment_name', 'pca_x', 'pca_y', 'distance_to_center');

    if (assignments.length === 0) {
      return res.status(404).send('No customer assignments found for this run.');
    }

    const headers = ['CustomerID', 'SegmentID', 'SegmentName', 'PCA_X', 'PCA_Y', 'DistanceToCenter'];
    const lines = [headers.join(',')];

    for (const a of assignments) {
      lines.push([
        `"${a.customer_id_code}"`,
        a.segment_id,
        `"${a.segment_name}"`,
        a.pca_x,
        a.pca_y,
        a.distance_to_center
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=segmentation_run_${run.id}_export.csv`);
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
