// routes/calls.js
const express = require('express');
const { body } = require('express-validator');
const callController = require('../controllers/callController');
const { auth } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(auth);

// Initiate call
router.post(
  '/initiate',
  [
    body('category')
      .isIn(['wishes', 'motivation', 'songs', 'blessings', 'celebrations', 'all'])
      .withMessage('Invalid category')
  ],
  handleValidationErrors,
  callController.initiateCall
);

// End call
router.post('/:callId/end', callController.endCall);

// Get call history
router.get('/history', callController.getCallHistory);

module.exports = router;