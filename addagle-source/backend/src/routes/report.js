/**
 * Report routes
 */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

router.post('/',
  [
    body('reason').isIn(['inappropriate_content', 'harassment', 'spam', 'nudity', 'hate_speech', 'other']),
    body('description').optional().trim().isLength({ max: 500 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const Report = require('../models/Report');
      await Report.create({
        reporterId: req.ip,
        reportedId: req.body.reportedId || 'unknown',
        reason: req.body.reason,
        description: req.body.description,
        timestamp: new Date(),
      });
    } catch (e) {
      // DB unavailable — log it
      console.log('[REPORT]', req.body);
    }

    res.json({ success: true, message: 'Report submitted' });
  }
);

module.exports = router;
