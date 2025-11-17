// controllers/reviewController.js
const Review = require("../models/Review");
const Call = require("../models/Call");
const User = require("../models/User");

class ReviewController {
  constructor() {
    this.submitReview = this.submitReview.bind(this);
    this.updateUserRating = this.updateUserRating.bind(this);
    this.getUserReviews = this.getUserReviews.bind(this);
  }

  // Submit review after call
  async submitReview(req, res) {
    try {
      const { callId, rating } = req.body;
      const fromUserId = req.user.id;

      const call = await Call.findOne({
        callId: callId,
        status: "completed",
        $or: [{ creator: fromUserId }, { participant: fromUserId }],
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: "Call not found or not completed",
        });
      }

      // Determine review type
      const isCreator = call.creator.toString() === fromUserId;
      const toUserId = isCreator ? call.participant : call.creator;
      const type = isCreator ? "creator" : "participant";
      // Check if review already exists
      const existingReview = await Review.findOne({
        call: call._id,
        fromUser: fromUserId,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "Review already submitted for this call",
        });
      }

      // Create review
      const review = await Review.create({
        call: call._id,
        fromUser: fromUserId,
        toUser: toUserId,
        rating,
        type,
      });

      // Update user rating
      await this.updateUserRating(toUserId);

      res.json({
        success: true,
        message: "Review submitted successfully",
        review,
      });
    } catch (error) {
      console.error("Submit review error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update user's average rating
  async updateUserRating(userId) {
    try {
      const reviews = await Review.find({ toUser: userId });

      if (reviews.length > 0) {
        const averageRating =
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length;

        await User.findByIdAndUpdate(userId, {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        });
      }
    } catch (error) {
      console.error("Update user rating error:", error);
    }
  }

  // Get user's reviews
  async getUserReviews(req, res) {
    try {
      const userId = req.user.id;
      const { type = "received" } = req.query;

      const filter =
        type === "given" ? { fromUser: userId } : { toUser: userId };

      const reviews = await Review.find(filter)
        .populate("fromUser", "name")
        .populate("toUser", "name")
        .populate("call")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error("Get user reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new ReviewController();
