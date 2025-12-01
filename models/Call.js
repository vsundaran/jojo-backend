// models/Call.js
const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    moment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Moment",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    languages: [String], // Stores Language IDs from constants/flags.js
    status: {
      type: String,
      enum: ["initiated", "connected", "completed", "failed", "reported"],
      default: "initiated",
    },
    creatorAcsId: {
      type: String,
      required: false,
    },
    participantAcsId: {
      type: String,
      required: false,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    creatorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    participantRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
    },
    recordingUrl: {
      type: String,
    },
    isRecordingStored: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

callSchema.index({ moment: 1 });
callSchema.index({ creator: 1, createdAt: -1 });
callSchema.index({ participant: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ isReported: 1 });

module.exports = mongoose.model("Call", callSchema);
