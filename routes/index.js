// routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const momentRoutes = require('./moments');
const callRoutes = require('./calls');
const reviewRoutes = require('./reviews');
const reportRoutes = require('./reports');
const wallOfJoyRoutes = require('./wallOfJoy');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/moments', momentRoutes);
router.use('/calls', callRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);
router.use('/wall-of-joy', wallOfJoyRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'JoJo API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;