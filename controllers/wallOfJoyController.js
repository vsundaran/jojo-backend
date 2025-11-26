// controllers/wallOfJoyController.js
const Moment = require("../models/Moment");
const Heart = require("../models/Heart");
const socketService = require("../services/socketService");

class WallOfJoyController {
  // Get all active moments for Wall of Joy
  async getActiveMoments(req, res) {
    try {
      const userId = req.user?.id; // Optional - may be undefined for guest users
      const { page = 1, limit = 20 } = req.query;
      let { category } = req.query;

      category = category || "all";

      // Build query - for authenticated users, exclude their own moments
      const query = {
        status: "active",
        isAvailable: true,
        category: category === "all" ? { $exists: true } : category,
        expiresAt: { $gt: new Date() },
      };

      // Only exclude creator's own moments if user is authenticated
      if (userId) {
        query.creator = { $ne: userId };
      }

      const moments = await Moment.find(query)
        .populate("creator", "name rating")
        .select(
          "category subCategory content languages hearts callCount createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      let momentsWithHearts;

      if (userId) {
        // For authenticated users, get which moments they have hearted
        const heartedMoments = await Heart.find({
          user: userId,
          moment: { $in: moments.map((m) => m._id) },
        }).select("moment");

        const heartedMomentIds = new Set(
          heartedMoments.map((h) => h.moment.toString())
        );

        momentsWithHearts = moments.map((moment) => ({
          ...moment.toObject(),
          hasHearted: heartedMomentIds.has(moment._id.toString()),
        }));
      } else {
        // For guest users, all moments have hasHearted: false
        momentsWithHearts = moments.map((moment) => ({
          ...moment.toObject(),
          hasHearted: false,
        }));
      }

      // Count total moments based on same query
      const countQuery = {
        status: "active",
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        category: category === "all" ? { $exists: true } : category,
      };

      if (userId) {
        countQuery.creator = { $ne: userId };
      }

      const total = await Moment.countDocuments(countQuery);

      res.json({
        success: true,
        moments: momentsWithHearts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      console.error("Get active moments error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Add heart to a moment
  async addHeart(req, res) {
    try {
      const { momentId } = req.params;
      const userId = req.user.id;

      const moment = await Moment.findOne({
        _id: momentId,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      if (!moment) {
        return res.status(404).json({
          success: false,
          message: "Moment not found or expired",
        });
      }

      // Check if already hearted
      const existingHeart = await Heart.findOne({
        user: userId,
        moment: momentId,
      });

      if (existingHeart) {
        return res.status(400).json({
          success: false,
          message: "Already hearted this moment",
        });
      }

      // Create heart record
      await Heart.create({
        user: userId,
        moment: momentId,
      });

      // Increment moment hearts count
      moment.hearts += 1;
      await moment.save();

      // Emit real-time update to all connected clients
      socketService.emitHeartUpdate(momentId, moment.hearts, moment.category);

      res.json({
        success: true,
        message: "Heart added successfully",
        hearts: moment.hearts,
      });
    } catch (error) {
      console.error("Add heart error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Remove heart from a moment
  async removeHeart(req, res) {
    try {
      const { momentId } = req.params;
      const userId = req.user.id;

      const moment = await Moment.findById(momentId);

      if (!moment) {
        return res.status(404).json({
          success: false,
          message: "Moment not found",
        });
      }

      // Remove heart record
      await Heart.findOneAndDelete({
        user: userId,
        moment: momentId,
      });

      // Decrement moment hearts count (but not below 0)
      if (moment.hearts > 0) {
        moment.hearts -= 1;
        await moment.save();
      }

      // Emit real-time update to all connected clients
      socketService.emitHeartUpdate(momentId, moment.hearts, moment.category);

      res.json({
        success: true,
        message: "Heart removed successfully",
        hearts: moment.hearts,
      });
    } catch (error) {
      console.error("Remove heart error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new WallOfJoyController();
