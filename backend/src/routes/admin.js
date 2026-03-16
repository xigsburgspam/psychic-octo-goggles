/**
 * Admin routes — protected with admin middleware
 */
const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/auth');
const { activeUsers, waitingUsers, activePairs } = require('../services/socketService');

// All admin routes require admin auth
router.use(adminMiddleware);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  res.json({
    activeUsers: activeUsers.size,
    waitingUsers: waitingUsers.size,
    activePairs: activePairs.size / 2,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const Report = require('../models/Report');
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const reports = await Report.find({ status })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Report.countDocuments({ status });
    res.json({ reports, total, page, limit });
  } catch (e) {
    res.json({ reports: [], total: 0 });
  }
});

// POST /api/admin/ban
router.post('/ban', async (req, res) => {
  const { ip, userId, reason, durationHours = 24 } = req.body;
  const { getRedisClient } = require('../config/redis');
  const redis = getRedisClient();

  try {
    if (ip) {
      await redis.set(`banned:${ip}`, reason || 'admin_ban', {
        EX: durationHours * 3600,
      });
    }
    res.json({ success: true, message: `Banned for ${durationHours} hours` });
  } catch (e) {
    res.status(500).json({ error: 'Ban failed' });
  }
});

// POST /api/admin/reports/:id/action
router.post('/reports/:id/action', async (req, res) => {
  try {
    const Report = require('../models/Report');
    await Report.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      adminNotes: req.body.notes,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
