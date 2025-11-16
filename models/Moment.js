// models/Moment.js
const mongoose = require("mongoose");

const momentSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["wishes", "motivation", "songs", "blessings", "celebrations"],
      index: true,
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    languages: [
      {
        type: String,
        enum: [
          "english",
          "hindi",
          "spanish",
          "french",
          "german",
          "japanese",
          "chinese",
        ],
        required: true,
      },
    ],
    scheduleType: {
      type: String,
      enum: ["immediate", "later"],
      required: true,
    },
    scheduledTime: {
      type: Date,
    },
    activeTime: {
      type: Number, // in minutes
      required: true,
      enum: [30, 60, 90, 120],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    hearts: {
      type: Number,
      default: 0,
    },
    callCount: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentCall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
momentSchema.index({ category: 1, status: 1, isAvailable: 1 });
momentSchema.index({ expiresAt: 1, status: 1 });
momentSchema.index({ creator: 1, status: 1 });
momentSchema.index({ createdAt: -1 });
momentSchema.index({ hearts: -1 });
momentSchema.index({ hearts: -1, createdAt: -1 });

// Pre-save middleware to calculate expiresAt
momentSchema.pre("save", function (next) {
  if (this.scheduleType === "immediate") {
    this.expiresAt = new Date(Date.now() + this.activeTime * 60000);
  } else if (this.scheduleType === "later" && this.scheduledTime) {
    this.expiresAt = new Date(
      this.scheduledTime.getTime() + this.activeTime * 60000
    );
  }
  next();
});

module.exports = mongoose.model("Moment", momentSchema);
