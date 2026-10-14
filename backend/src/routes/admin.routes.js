const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. List users
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const users = await db('users')
      .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
      .orderBy('id', 'asc');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// 2. Update user role
router.patch('/users/:id/role', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'analyst', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be one of: admin, analyst, viewer.' });
    }

    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db('users').where({ id: req.params.id }).update({ role, updated_at: db.fn.now() });

    await db('audit_events').insert({
      user_id: req.user.id,
      action: 'CHANGE_USER_ROLE',
      details_json: JSON.stringify({ targetUserId: req.params.id, newRole: role })
    });

    const updated = await db('users').where({ id: req.params.id }).select('id', 'name', 'email', 'role').first();
    res.json({ message: 'User role updated successfully.', user: updated });
  } catch (err) {
    next(err);
  }
});

// 3. View audit events
router.get('/audit', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const events = await db('audit_events')
      .leftJoin('users', 'audit_events.user_id', 'users.id')
      .select('audit_events.*', 'users.name as user_name', 'users.email as user_email')
      .orderBy('audit_events.created_at', 'desc')
      .limit(100);

    const formatted = events.map(e => ({
      ...e,
      details: e.details_json ? JSON.parse(e.details_json) : null
    }));

    res.json({ events: formatted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
