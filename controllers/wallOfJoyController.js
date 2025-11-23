// controllers/wallOfJoyController.js
const Moment = require("../models/Moment");
const Heart = require("../models/Heart");
const socketService = require("../services/socketService");

class WallOfJoyController {
  // Get all active moments for Wall of Joy
  async getActiveMoments(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      let { category } = req.query;

      category = category || "all";

      const moments = await Moment.find({
        status: "active",
        isAvailable: true,
        creator: { $ne: userId },
        category: category === "all" ? { $exists: true } : category,
        expiresAt: { $gt: new Date() },
      })
        .populate("creator", "name rating")
        .select(
          "category subCategory content languages hearts callCount createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get which moments user has already hearted
      const heartedMoments = await Heart.find({
        user: userId,
        moment: { $in: moments.map((m) => m._id) },
      }).select("moment");

      const heartedMomentIds = new Set(
        heartedMoments.map((h) => h.moment.toString())
      );

      const momentsWithHearts = moments.map((moment) => ({
        ...moment.toObject(),
        hasHearted: heartedMomentIds.has(moment._id.toString()),
      }));

      const total = await Moment.countDocuments({
        status: "active",
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        creator: { $ne: userId },
        category: category === "all" ? { $exists: true } : category,
      });

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
