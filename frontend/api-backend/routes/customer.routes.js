const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 1. List customers with search, sort, pagination, segment filter
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      dataset_id,
      segment_id,
      search,
      gender,
      sort_by = 'id',
      sort_order = 'asc',
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Determine dataset to query
    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latestDataset = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latestDataset ? latestDataset.id : null;
    }

    if (!targetDatasetId) {
      return res.json({
        customers: [],
        pagination: { total: 0, page: 1, limit: limitNum, totalPages: 0 }
      });
    }

    // Get latest segmentation run for this dataset if available
    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    let query = db('customers')
      .where('customers.dataset_id', targetDatasetId);

    if (latestRun) {
      query = query
        .leftJoin('customer_segment_assignments', function () {
          this.on('customers.customer_id_code', '=', 'customer_segment_assignments.customer_id_code')
            .andOn('customer_segment_assignments.run_id', '=', db.raw('?', [latestRun.id]));
        })
        .select(
          'customers.*',
          'customer_segment_assignments.segment_id',
          'customer_segment_assignments.segment_name',
          'customer_segment_assignments.pca_x',
          'customer_segment_assignments.pca_y'
        );

      if (segment_id !== undefined && segment_id !== '') {
        query = query.where('customer_segment_assignments.segment_id', parseInt(segment_id, 10));
      }
    } else {
      query = query.select('customers.*');
    }

    if (search) {
      const s = `%${search.trim()}%`;
      query = query.where(function () {
        this.where('customers.customer_id_code', 'like', s)
          .orWhere('customers.name', 'like', s)
          .orWhere('customers.email', 'like', s);
      });
    }

    if (gender) {
      query = query.where('customers.gender', gender);
    }

    // Count query
    const totalCountQuery = query.clone().clearSelect().count('customers.id as count').first();
    const countResult = await totalCountQuery;
    const total = Number(countResult ? countResult.count : 0);

    // Allowed sort columns
    const allowedSortCols = ['id', 'customer_id_code', 'name', 'age', 'annual_income', 'spending_score', 'total_spend', 'purchase_frequency', 'recency_days', 'segment_id'];
    const safeSortBy = allowedSortCols.includes(sort_by) ? sort_by : 'id';
    const safeSortOrder = sort_order.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const customers = await query
      .orderBy(safeSortBy, safeSortOrder)
      .limit(limitNum)
      .offset(offset);

    res.json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      activeDatasetId: Number(targetDatasetId),
      activeRunId: latestRun ? latestRun.id : null
    });
  } catch (err) {
    next(err);
  }
});

// 2. Export filtered customers to CSV
router.get('/export', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id, segment_id } = req.query;
    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latestDataset = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latestDataset ? latestDataset.id : null;
    }

    if (!targetDatasetId) {
      return res.status(400).send('No dataset available for export.');
    }

    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    let query = db('customers').where('customers.dataset_id', targetDatasetId);

    if (latestRun) {
      query = query
        .leftJoin('customer_segment_assignments', function () {
          this.on('customers.customer_id_code', '=', 'customer_segment_assignments.customer_id_code')
            .andOn('customer_segment_assignments.run_id', '=', db.raw('?', [latestRun.id]));
        })
        .select(
          'customers.customer_id_code',
          'customers.name',
          'customers.email',
          'customers.age',
          'customers.gender',
          'customers.annual_income',
          'customers.spending_score',
          'customers.total_spend',
          'customers.purchase_frequency',
          'customers.recency_days',
          'customer_segment_assignments.segment_name'
        );

      if (segment_id !== undefined && segment_id !== '') {
        query = query.where('customer_segment_assignments.segment_id', parseInt(segment_id, 10));
      }
    } else {
      query = query.select(
        'customers.customer_id_code',
        'customers.name',
        'customers.email',
        'customers.age',
        'customers.gender',
        'customers.annual_income',
        'customers.spending_score',
        'customers.total_spend',
        'customers.purchase_frequency',
        'customers.recency_days'
      );
    }

    const rows = await query;
    if (rows.length === 0) {
      return res.status(404).send('No records match the requested filter.');
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const values = headers.map(h => {
        let val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_export_${Date.now()}.csv`);
    res.send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
});

// 3. Customer detail
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const customer = await db('customers').where({ id: req.params.id }).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Get assignments across segmentation runs
    const assignments = await db('customer_segment_assignments')
      .join('segmentation_runs', 'customer_segment_assignments.run_id', 'segmentation_runs.id')
      .where({ 'customer_segment_assignments.customer_id_code': customer.customer_id_code })
      .select(
        'customer_segment_assignments.*',
        'segmentation_runs.run_name',
        'segmentation_runs.algorithm',
        'segmentation_runs.n_clusters',
        'segmentation_runs.created_at as run_created_at'
      );

    res.json({
      customer: {
        ...customer,
        raw_data: customer.raw_data_json ? JSON.parse(customer.raw_data_json) : null
      },
      assignments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
