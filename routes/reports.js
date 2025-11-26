// routes/reports.js
const express = require('express');
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(auth);

// Submit report
router.post(
  '/',
  [
    body('callId')
      .notEmpty()
      .withMessage('Call ID is required'),
    body('issueType')
      .isIn(['harassment', 'spam', 'inappropriate_content', 'fake_profile', 'other'])
      .withMessage('Invalid issue type'),
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
  ],
  handleValidationErrors,
  reportController.submitReport
);

// Start recording
router.post('/:callId/start-recording', reportController.startRecording);

module.exports = router;