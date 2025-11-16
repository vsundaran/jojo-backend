// models/Heart.js
const mongoose = require('mongoose');

const heartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Moment',
    required: true
  }
}, {
  timestamps: true
});

heartSchema.index({ user: 1, moment: 1 }, { unique: true });
heartSchema.index({ moment: 1, createdAt: -1 });

module.exports = mongoose.model('Heart', heartSchema);