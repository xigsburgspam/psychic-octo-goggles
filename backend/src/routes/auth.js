/**
 * Auth routes: anonymous session, optional Google OAuth
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { strictLimiter } = require('../middleware/rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * POST /api/auth/anonymous
 * Create an anonymous session
 */
router.post('/anonymous', strictLimiter, (req, res) => {
  const sessionId = uuidv4();
  const nickname = `User_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const token = jwt.sign(
    { sessionId, nickname, isAnonymous: true, isAdmin: false },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, sessionId, nickname });
});

/**
 * POST /api/auth/register
 * Register with nickname (no password needed for basic accounts)
 */
router.post('/register',
  strictLimiter,
  [
    body('nickname').trim().isLength({ min: 2, max: 30 }).escape(),
    body('interests').optional().isArray({ max: 10 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nickname, interests = [] } = req.body;
    const userId = uuidv4();

    const token = jwt.sign(
      { userId, nickname, interests, isAnonymous: false, isAdmin: false },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, userId, nickname });
  }
);

/**
 * GET /api/auth/verify
 * Verify a token
 */
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
