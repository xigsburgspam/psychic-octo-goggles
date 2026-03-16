/**
 * User profile routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// GET /api/user/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/user/preferences
router.put('/preferences', authMiddleware, (req, res) => {
  // In a full implementation, persist to DB
  const { interests, language, mode } = req.body;
  res.json({ success: true, preferences: { interests, language, mode } });
});

module.exports = router;
