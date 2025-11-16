// routes/wallOfJoy.js
const express = require('express');
const wallOfJoyController = require('../controllers/wallOfJoyController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Get active moments
router.get('/moments', wallOfJoyController.getActiveMoments);

// Add heart to moment
router.post('/moments/:momentId/heart', wallOfJoyController.addHeart);

// Remove heart from moment
router.delete('/moments/:momentId/heart', wallOfJoyController.removeHeart);

module.exports = router;