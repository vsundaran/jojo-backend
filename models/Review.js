// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  call: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  type: {
    type: String,
    enum: ['creator', 'participant'],
    required: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ call: 1, fromUser: 1 }, { unique: true });
reviewSchema.index({ toUser: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);