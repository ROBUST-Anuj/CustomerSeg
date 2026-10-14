const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Get all campaigns
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const campaigns = await db('campaign_drafts')
      .leftJoin('datasets', 'campaign_drafts.dataset_id', 'datasets.id')
      .leftJoin('users', 'campaign_drafts.user_id', 'users.id')
      .select(
        'campaign_drafts.*',
        'datasets.name as dataset_name',
        'users.name as created_by_name'
      )
      .orderBy('campaign_drafts.created_at', 'desc');

    res.json({ campaigns });
  } catch (err) {
    next(err);
  }
});

// 2. Audience count calculation helper
router.post('/calculate-audience', authenticateToken, async (req, res, next) => {
  try {
    const { dataset_id, segment_id } = req.body;
    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latest = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latest ? latest.id : null;
    }

    if (!targetDatasetId) {
      return res.json({ audienceCount: 0 });
    }

    const latestRun = await db('segmentation_runs')
      .where({ dataset_id: targetDatasetId })
      .orderBy('id', 'desc')
      .first();

    if (!latestRun) {
      const total = await db('customers').where({ dataset_id: targetDatasetId }).count('id as c').first();
      return res.json({ audienceCount: Number(total.c) });
    }

    let query = db('customer_segment_assignments').where({ run_id: latestRun.id });
    if (segment_id !== undefined && segment_id !== 'all' && segment_id !== '') {
      query = query.where({ segment_id: parseInt(segment_id, 10) });
    }

    const countRes = await query.count('id as c').first();
    res.json({ audienceCount: Number(countRes.c) });
  } catch (err) {
    next(err);
  }
});

// 3. Create campaign draft
router.post('/', authenticateToken, requireRole(['admin', 'analyst']), async (req, res, next) => {
  try {
    const { name, objective, dataset_id, segment_id, segment_name, channel, subject, message_template } = req.body;

    if (!name || !message_template) {
      return res.status(400).json({ error: 'Campaign name and message template are required.' });
    }

    let targetDatasetId = dataset_id;
    if (!targetDatasetId) {
      const latest = await db('datasets').orderBy('id', 'desc').first();
      targetDatasetId = latest ? latest.id : null;
    }

    // Calculate real audience count
    let audienceCount = 0;
    if (targetDatasetId) {
      const latestRun = await db('segmentation_runs')
        .where({ dataset_id: targetDatasetId })
        .orderBy('id', 'desc')
        .first();

      if (latestRun) {
        let q = db('customer_segment_assignments').where({ run_id: latestRun.id });
        if (segment_id !== undefined && segment_id !== 'all' && segment_id !== '') {
          q = q.where({ segment_id: parseInt(segment_id, 10) });
        }
        const c = await q.count('id as count').first();
        audienceCount = Number(c.count);
      } else {
        const total = await db('customers').where({ dataset_id: targetDatasetId }).count('id as c').first();
        audienceCount = Number(total.c);
      }
    }

    const [campaignId] = await db('campaign_drafts').insert({
      user_id: req.user.id,
      dataset_id: targetDatasetId,
      name,
      objective: objective || '',
      segment_id: segment_id !== undefined && segment_id !== 'all' ? parseInt(segment_id, 10) : null,
      segment_name: segment_name || 'All Segments',
      channel: channel || 'email',
      subject: subject || '',
      message_template,
      audience_count: audienceCount,
      status: 'draft'
    });

    const created = await db('campaign_drafts').where({ id: campaignId }).first();
    res.status(201).json({ message: 'Campaign draft saved successfully.', campaign: created });
  } catch (err) {
    next(err);
  }
});

// 4. Update campaign draft
router.patch('/:id', authenticateToken, requireRole(['admin', 'analyst']), async (req, res, next) => {
  try {
    const { name, objective, channel, subject, message_template, status } = req.body;
    const campaign = await db('campaign_drafts').where({ id: req.params.id }).first();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign draft not found.' });
    }

    // Do not allow marking as 'sent' without explicit integration
    const safeStatus = status === 'sent' ? 'scheduled' : (status || campaign.status);

    await db('campaign_drafts').where({ id: req.params.id }).update({
      name: name !== undefined ? name : campaign.name,
      objective: objective !== undefined ? objective : campaign.objective,
      channel: channel !== undefined ? channel : campaign.channel,
      subject: subject !== undefined ? subject : campaign.subject,
      message_template: message_template !== undefined ? message_template : campaign.message_template,
      status: safeStatus,
      updated_at: db.fn.now()
    });

    const updated = await db('campaign_drafts').where({ id: req.params.id }).first();
    res.json({ message: 'Campaign draft updated successfully.', campaign: updated });
  } catch (err) {
    next(err);
  }
});

// 5. Delete campaign draft
router.delete('/:id', authenticateToken, requireRole(['admin', 'analyst']), async (req, res, next) => {
  try {
    const campaign = await db('campaign_drafts').where({ id: req.params.id }).first();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign draft not found.' });
    }

    await db('campaign_drafts').where({ id: req.params.id }).del();
    res.json({ message: 'Campaign draft deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
