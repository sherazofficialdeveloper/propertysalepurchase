/**
 * GET /api/health - confirms server + DB are alive.
 */
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success: true,
    message: 'Property Sale Purchase API is running',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      state: states[mongoose.connection.readyState] || 'unknown',
      name: mongoose.connection.name || null,
    },
  });
});

module.exports = router;
