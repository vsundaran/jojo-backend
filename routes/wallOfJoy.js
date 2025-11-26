// routes/wallOfJoy.js
const express = require('express');
const wallOfJoyController = require('../controllers/wallOfJoyController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get active moments - supports both guest and authenticated users
router.get('/moments', optionalAuth, wallOfJoyController.getActiveMoments);

// Heart actions require authentication
router.post('/moments/:momentId/heart', auth, wallOfJoyController.addHeart);
router.delete('/moments/:momentId/heart', auth, wallOfJoyController.removeHeart);

module.exports = router;