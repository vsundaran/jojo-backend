// routes/reviews.js
const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(auth);

// Submit review
router.post(
  '/',
  [
    body('callId')
      .notEmpty()
      .withMessage('Call ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
  ],
  handleValidationErrors,
  reviewController.submitReview
);

// Get user reviews
router.get('/', reviewController.getUserReviews);

module.exports = router;