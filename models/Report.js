// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  call: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call'
  },
  issueType: {
    type: String,
    required: true,
    enum: ['harassment', 'spam', 'inappropriate_content', 'fake_profile', 'other']
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  actionTaken: {
    type: String
  }
}, {
  timestamps: true
});

reportSchema.index({ reportedUser: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);