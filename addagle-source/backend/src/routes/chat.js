/**
 * Chat routes
 */
const express = require('express');
const router = express.Router();
const { getIcebreakerSuggestions } = require('../services/moderationService');

// GET /api/chat/icebreakers?interests=music,gaming
router.get('/icebreakers', (req, res) => {
  const interests = req.query.interests
    ? req.query.interests.split(',').map(i => i.trim())
    : [];

  const suggestions = getIcebreakerSuggestions(interests);
  res.json({ suggestions });
});

// GET /api/chat/stats (active users, waiting count)
router.get('/stats', (req, res) => {
  const { activeUsers, waitingUsers } = require('../services/socketService');
  res.json({
    online: activeUsers.size,
    waiting: waitingUsers.size,
  });
});

module.exports = router;
