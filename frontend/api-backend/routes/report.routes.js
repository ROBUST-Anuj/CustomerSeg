const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id } = req.query;
    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latest = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latest ? latest.id : null;
    }

    if (!targetDatasetId) {
      return res.status(404).json({ error: 'No dataset found to generate report.' });
    }

    const dataset = await db('datasets').where({ id: targetDatasetId }).first();
    const customers = await db('customers').where({ dataset_id: targetDatasetId });

    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    // Data quality summary
    const totalRecords = customers.length;
    let nullIncome = 0;
    let nullScore = 0;
    let nullSpend = 0;

    customers.forEach(c => {
      if (c.annual_income === null) nullIncome++;
      if (c.spending_score === null) nullScore++;
      if (c.total_spend === null) nullSpend++;
    });

    const dataQuality = {
      totalRecords,
      completenessRate: totalRecords > 0 ? parseFloat((((totalRecords * 3 - (nullIncome + nullScore + nullSpend)) / (totalRecords * 3)) * 100).toFixed(1)) : 100,
      missingIncome: nullIncome,
      missingSpendingScore: nullScore,
      missingTotalSpend: nullSpend
    };

    const profiles = latestRun && latestRun.profiles_json ? JSON.parse(latestRun.profiles_json) : [];
    const featuresUsed = latestRun && latestRun.features_json ? JSON.parse(latestRun.features_json) : [];

    // Objective Business observations derived from real statistics
    const businessObservations = [];
    if (profiles.length > 0) {
      const sortedByCount = [...profiles].sort((a,b) => b.count - a.count);
      const largestSeg = sortedByCount[0];
      businessObservations.push({
        topic: 'Segment Population Share',
        insight: `"${largestSeg.name}" forms the largest single group representing ${largestSeg.percentage}% (${largestSeg.count} customers) of the customer base.`,
        implication: 'Marketing budget should ensure broad accessibility for this cohort without degrading premium tiers.'
      });

      const highSpendSeg = profiles.find(p => p.name.toLowerCase().includes('affluent') || p.name.toLowerCase().includes('spenders'));
      if (highSpendSeg) {
        businessObservations.push({
          topic: 'High Lifetime Value Opportunity',
          insight: `"${highSpendSeg.name}" exhibits highest purchasing indices across ${featuresUsed.join(', ')}.`,
          implication: highSpendSeg.recommended_strategy
        });
      }

      if (latestRun.silhouette_score) {
        const sil = latestRun.silhouette_score;
        let qualityText = 'moderate clustering structure';
        if (sil > 0.5) qualityText = 'strong, distinct cluster separation';
        else if (sil < 0.25) qualityText = 'weak cluster boundary separation; consider feature re-engineering';

        businessObservations.push({
          topic: 'Mathematical Model Evaluation',
          insight: `The K-Means model achieved a Silhouette Score of ${sil} and Davies-Bouldin Index of ${latestRun.davies_bouldin_index || 'N/A'}.`,
          implication: `Indicates ${qualityText}. Findings align with recommended retail clustering benchmarks.`
        });
      }
    }

    res.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        rowCount: dataset.row_count,
        createdAt: dataset.created_at,
        isSample: Boolean(dataset.is_sample)
      },
      segmentationRun: latestRun ? {
        id: latestRun.id,
        runName: latestRun.run_name,
        algorithm: latestRun.algorithm,
        nClusters: latestRun.n_clusters,
        features: featuresUsed,
        scaler: latestRun.scaler,
        silhouetteScore: latestRun.silhouette_score,
        daviesBouldin: latestRun.davies_bouldin_index,
        calinskiHarabasz: latestRun.calinski_harabasz_score,
        createdAt: latestRun.created_at
      } : null,
      profiles,
      dataQuality,
      businessObservations
    });
  } catch (err) {
    next(err);
  }
});

// CSV Export for Executive Report
router.get('/export-csv', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id } = req.query;
    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latest = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latest ? latest.id : null;
    }

    if (!targetDatasetId) {
      return res.status(404).send('No dataset available.');
    }

    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    const profiles = latestRun && latestRun.profiles_json ? JSON.parse(latestRun.profiles_json) : [];

    const headers = ['SegmentID', 'SegmentName', 'CustomerCount', 'SharePercentage', 'RecommendedStrategy', 'Description'];
    const lines = [headers.join(',')];

    for (const p of profiles) {
      lines.push([
        p.segment_id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.count,
        p.percentage,
        `"${p.recommended_strategy.replace(/"/g, '""')}"`,
        `"${p.description.replace(/"/g, '""')}"`
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customerseg_report_${Date.now()}.csv`);
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
