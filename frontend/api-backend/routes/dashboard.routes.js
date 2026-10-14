const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /summary - API-backed KPI metrics for overview dashboard
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id } = req.query;

    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latestDataset = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latestDataset ? latestDataset.id : null;
    }

    if (!targetDatasetId) {
      return res.json({
        totalCustomers: 0,
        activeCustomers: 0,
        numberOfSegments: 0,
        highValueCustomers: 0,
        atRiskCustomers: 0,
        avgCustomerValue: null,
        avgSpendingScore: null,
        dataset: null
      });
    }

    const dataset = await db('datasets').where({ id: targetDatasetId }).first();
    const customers = await db('customers').where({ dataset_id: targetDatasetId });
    const totalCustomers = customers.length;

    if (totalCustomers === 0) {
      return res.json({
        totalCustomers: 0,
        activeCustomers: 0,
        numberOfSegments: 0,
        highValueCustomers: 0,
        atRiskCustomers: 0,
        avgCustomerValue: null,
        dataset
      });
    }

    // Latest segmentation run
    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    const numberOfSegments = latestRun ? latestRun.n_clusters : 0;

    // Active customers: purchased within 90 days or purchase_frequency > 0
    let activeCustomers = 0;
    let highValueCustomers = 0;
    let atRiskCustomers = 0;
    let totalSpendSum = 0;
    let totalSpendCount = 0;
    let spendingScoreSum = 0;
    let spendingScoreCount = 0;

    // Calculate percentiles / thresholds dynamically from data
    const spends = customers.map(c => c.total_spend).filter(v => v !== null && !isNaN(v)).sort((a,b) => a - b);
    const hasTotalSpend = spends.length > 0;
    const spend75th = hasTotalSpend ? spends[Math.floor(spends.length * 0.75)] : 0;

    const recencies = customers.map(c => c.recency_days).filter(v => v !== null && !isNaN(v)).sort((a,b) => a - b);
    const hasRecency = recencies.length > 0;
    const recency75th = hasRecency ? recencies[Math.floor(recencies.length * 0.75)] : 90;

    customers.forEach(c => {
      // Active definition: recency <= 90 days or frequency >= 1 or spending score >= 40
      const isActive = (c.recency_days !== null && c.recency_days <= 90) ||
                       (c.purchase_frequency !== null && c.purchase_frequency >= 1) ||
                       (c.spending_score !== null && c.spending_score >= 40);
      if (isActive) activeCustomers++;

      // High-Value: total_spend >= 75th percentile OR (income >= 75 and spending >= 70)
      if (hasTotalSpend && c.total_spend >= spend75th) {
        highValueCustomers++;
      } else if (!hasTotalSpend && c.annual_income >= 75 && c.spending_score >= 70) {
        highValueCustomers++;
      }

      // At-Risk: recency > 75th percentile (long dormancy) OR (income high but spending score <= 30)
      if (hasRecency && c.recency_days >= recency75th && c.recency_days > 60) {
        atRiskCustomers++;
      } else if (!hasRecency && c.annual_income >= 70 && c.spending_score <= 35) {
        atRiskCustomers++;
      }

      if (c.total_spend !== null && !isNaN(c.total_spend)) {
        totalSpendSum += c.total_spend;
        totalSpendCount++;
      }
      if (c.spending_score !== null && !isNaN(c.spending_score)) {
        spendingScoreSum += c.spending_score;
        spendingScoreCount++;
      }
    });

    const avgCustomerValue = totalSpendCount > 0 ? parseFloat((totalSpendSum / totalSpendCount).toFixed(2)) : null;
    const avgSpendingScore = spendingScoreCount > 0 ? parseFloat((spendingScoreSum / spendingScoreCount).toFixed(1)) : null;

    res.json({
      totalCustomers,
      activeCustomers,
      numberOfSegments,
      highValueCustomers,
      atRiskCustomers,
      avgCustomerValue,
      avgSpendingScore,
      activeDatasetId: Number(targetDatasetId),
      datasetName: dataset.name,
      isSample: Boolean(dataset.is_sample),
      latestRunId: latestRun ? latestRun.id : null,
      metricExplanations: {
        activeCustomers: "Customers with recency <= 90 days or purchase frequency >= 1",
        highValueCustomers: hasTotalSpend ? "Top 25% by cumulative spend" : "High income (>=$75k) & spending score (>=70)",
        atRiskCustomers: hasRecency ? "Customers dormant > 75th percentile recency days" : "High income (>=$70k) with low engagement (spend score <= 35)",
        avgCustomerValue: hasTotalSpend ? "Mean cumulative spend across customers" : "Unavailable (dataset lacks total spend column)"
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /charts - Recharts visual analytics data
router.get('/charts', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id, segment_id } = req.query;

    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latestDataset = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latestDataset ? latestDataset.id : null;
    }

    if (!targetDatasetId) {
      return res.json({
        segmentDistribution: [],
        revenueBySegment: [],
        frequencyDistribution: [],
        spendingDistribution: [],
        segmentComparison: [],
        pcaScatter: [],
        rfmMetrics: null
      });
    }

    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    const customers = await db('customers').where({ dataset_id: targetDatasetId });

    let assignments = [];
    if (latestRun) {
      assignments = await db('customer_segment_assignments').where({ run_id: latestRun.id });
    }

    const assignmentMap = {};
    assignments.forEach(a => {
      assignmentMap[a.customer_id_code] = a;
    });

    // 1. Segment Distribution
    const segmentCounts = {};
    const segmentRevenue = {};
    const segmentStats = {};

    assignments.forEach(a => {
      const name = a.segment_name;
      segmentCounts[name] = (segmentCounts[name] || 0) + 1;
    });

    // 2. Revenue & Averages by Segment
    customers.forEach(c => {
      const assign = assignmentMap[c.customer_id_code];
      const segName = assign ? assign.segment_name : 'Unassigned';

      if (!segmentRevenue[segName]) segmentRevenue[segName] = 0;
      if (!segmentStats[segName]) {
        segmentStats[segName] = { count: 0, incomeSum: 0, spendSum: 0, freqSum: 0, totalSpendSum: 0 };
      }

      segmentStats[segName].count++;
      if (c.total_spend) {
        segmentRevenue[segName] += c.total_spend;
        segmentStats[segName].totalSpendSum += c.total_spend;
      }
      if (c.annual_income) segmentStats[segName].incomeSum += c.annual_income;
      if (c.spending_score) segmentStats[segName].spendSum += c.spending_score;
      if (c.purchase_frequency) segmentStats[segName].freqSum += c.purchase_frequency;
    });

    const segmentDistribution = Object.keys(segmentCounts).map((name, idx) => ({
      name,
      value: segmentCounts[name],
      percentage: parseFloat(((segmentCounts[name] / customers.length) * 100).toFixed(1))
    }));

    const revenueBySegment = Object.keys(segmentRevenue).map(name => ({
      name,
      revenue: parseFloat(segmentRevenue[name].toFixed(2)),
      avgSpend: segmentStats[name]?.count ? parseFloat((segmentRevenue[name] / segmentStats[name].count).toFixed(2)) : 0
    }));

    // 3. Purchase Frequency Distribution (Histogram)
    const freqBins = { '1-3 orders': 0, '4-7 orders': 0, '8-12 orders': 0, '13+ orders': 0 };
    customers.forEach(c => {
      const f = c.purchase_frequency;
      if (f !== null && f !== undefined) {
        if (f <= 3) freqBins['1-3 orders']++;
        else if (f <= 7) freqBins['4-7 orders']++;
        else if (f <= 12) freqBins['8-12 orders']++;
        else freqBins['13+ orders']++;
      }
    });

    const frequencyDistribution = Object.keys(freqBins).map(bin => ({
      range: bin,
      count: freqBins[bin]
    }));

    // 4. Spending Distribution Bins
    const spendBins = { '$0 - $500': 0, '$501 - $1,500': 0, '$1,501 - $3,000': 0, '$3,001+': 0 };
    customers.forEach(c => {
      const s = c.total_spend !== null ? c.total_spend : c.spending_score * 30; // fallback proxy if no total spend
      if (s <= 500) spendBins['$0 - $500']++;
      else if (s <= 1500) spendBins['$501 - $1,500']++;
      else if (s <= 3000) spendBins['$1,501 - $3,000']++;
      else spendBins['$3,001+']++;
    });

    const spendingDistribution = Object.keys(spendBins).map(bin => ({
      bracket: bin,
      customers: spendBins[bin]
    }));

    // 5. Segment Comparison Chart
    const segmentComparison = Object.keys(segmentStats).map(name => {
      const s = segmentStats[name];
      return {
        segment: name.replace(/^Segment \d+:\s*/, ''),
        avgIncome: s.count ? parseFloat((s.incomeSum / s.count).toFixed(1)) : 0,
        avgSpendingScore: s.count ? parseFloat((s.spendSum / s.count).toFixed(1)) : 0,
        avgFrequency: s.count ? parseFloat((s.freqSum / s.count).toFixed(1)) : 0,
        count: s.count
      };
    });

    // 6. PCA 2D Scatter Plot
    const pcaScatter = assignments.map(a => ({
      id: a.customer_id_code,
      x: a.pca_x,
      y: a.pca_y,
      segmentId: a.segment_id,
      segmentName: a.segment_name
    }));

    // 7. RFM Breakdown (Recency, Frequency, Monetary)
    const hasRFM = customers.some(c => c.recency_days !== null) && customers.some(c => c.purchase_frequency !== null);

    res.json({
      segmentDistribution,
      revenueBySegment,
      frequencyDistribution,
      spendingDistribution,
      segmentComparison,
      pcaScatter,
      hasRFM,
      profiles: latestRun && latestRun.profiles_json ? JSON.parse(latestRun.profiles_json) : []
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
