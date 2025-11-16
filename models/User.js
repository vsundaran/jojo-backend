// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid mobile number']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  languages: [{
    type: String,
    enum: ['english', 'hindi', 'spanish', 'french', 'german', 'japanese', 'chinese']
  }],
  profileCompleted: {
    type: Boolean,
    default: false
  },
  hearts: {
    type: Number,
    default: 0
  },
  callCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ mobileNumber: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

module.exports = mongoose.model('User', userSchema);