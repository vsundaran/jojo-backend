// routes/moments.js
const express = require('express');
const { body } = require('express-validator');
const momentController = require('../controllers/momentController');
const auth = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(auth);

// Create moment
router.post(
  '/',
  [
    body('category')
      .isIn(['wishes', 'motivation', 'songs', 'blessings', 'celebrations'])
      .withMessage('Invalid category'),
    body('subCategory')
      .notEmpty()
      .withMessage('Sub-category is required'),
    body('content')
      .isLength({ max: 500 })
      .withMessage('Content cannot exceed 500 characters'),
    body('languages')
      .isArray({ min: 1 })
      .withMessage('At least one language must be selected'),
    body('scheduleType')
      .isIn(['immediate', 'later'])
      .withMessage('Invalid schedule type'),
    body('activeTime')
      .isIn([30, 60, 90, 120])
      .withMessage('Invalid active time')
  ],
  handleValidationErrors,
  momentController.createMoment
);

// Get user's moments
router.get('/', momentController.getUserMoments);

// Update moment
router.put('/:momentId', momentController.updateMoment);

// Delete moment
router.delete('/:momentId', momentController.deleteMoment);

// Get available moments for Give Joy
router.get('/available', momentController.getAvailableMoments);

module.exports = router;