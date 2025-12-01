// controllers/momentController.js
const Moment = require("../models/Moment");
const Call = require("../models/Call");
const User = require("../models/User");
const mongoose = require("mongoose");
const socketService = require("../services/socketService");

class MomentController {
  // Create a new moment
  async createMoment(req, res) {
    try {
      const {
        category,
        subCategory,
        content,
        languages,
        scheduleType,
        scheduledTime,
        activeTime,
      } = req.body;

      const creator = req.user.id;

      // Validate scheduled time for 'later' type
      if (scheduleType === "later" && !scheduledTime) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time is required for later moments",
        });
      }

      // Calculate expiresAt
      let expiresAt;
      if (scheduleType === "immediate") {
        expiresAt = new Date(Date.now() + activeTime * 60000);
      } else {
        expiresAt = new Date(
          new Date(scheduledTime).getTime() + activeTime * 60000
        );
      }

      // Validate that all provided languages exist in the master list
      const { LANGUAGES } = require("../constants/flags");
      const validLanguageIds = LANGUAGES.map((l) => l.id);

      // Ensure languages is an array
      const languagesArray = Array.isArray(languages) ? languages : [languages];

      const areAllLanguagesValid = languagesArray.every((langId) =>
        validLanguageIds.includes(langId)
      );

      if (!areAllLanguagesValid) {
        return res.status(400).json({
          success: false,
          message: "One or more selected languages are invalid",
        });
      }

      const moment = await Moment.create({
        creator,
        category,
        subCategory,
        content,
        languages: languagesArray, // Storing Language IDs
        scheduleType,
        scheduledTime: scheduleType === "later" ? scheduledTime : null,
        activeTime,
        expiresAt,
        status: "active",
      });

      // Populate creator details
      await moment.populate("creator", "name languages");

      // Emit real-time event for moment creation
      socketService.emitMomentCreated(moment);

      res.status(201).json({
        success: true,
        message: "Moment created successfully",
        moment,
      });
    } catch (error) {
      console.error("Create moment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user's moments
  async getUserMoments(req, res) {
    try {
      const userId = req.user.id;
      const { status, category } = req.query;

      const filter = { creator: userId };
      if (status) {
        filter.status = status;
      }
      if (category) {
        filter.category = category;
      }

      const moments = await Moment.find(filter)
        .populate("creator", "name languages")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        moments,
      });
    } catch (error) {
      console.error("Get user moments error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update moment
  async updateMoment(req, res) {
    try {
      const { momentId } = req.params;
      const updateData = req.body;

      const moment = await Moment.findOne({
        _id: momentId,
        creator: req.user.id,
        status: "active",
      });

      if (!moment) {
        return res.status(404).json({
          success: false,
          message: "Moment not found or not editable",
        });
      }

      // Prevent updating if moment has active call
      if (moment.currentCall) {
        return res.status(400).json({
          success: false,
          message: "Cannot update moment with active call",
        });
      }

      Object.assign(moment, updateData);
      await moment.save();

      await moment.populate("creator", "name languages");

      // Emit real-time event for moment update
      socketService.emitMomentUpdated(moment);

      res.json({
        success: true,
        message: "Moment updated successfully",
        moment,
      });
    } catch (error) {
      console.error("Update moment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Delete moment
  async deleteMoment(req, res) {
    try {
      const { momentId } = req.params;

      const moment = await Moment.findOne({
        _id: momentId,
        creator: req.user.id,
      });

      if (!moment) {
        return res.status(404).json({
          success: false,
          message: "Moment not found",
        });
      }

      // Cancel any active call
      if (moment.currentCall) {
        await Call.findByIdAndUpdate(moment.currentCall, {
          status: "failed",
          endTime: new Date(),
        });
      }

      const category = moment.category;
      moment.status = "cancelled";
      moment.isAvailable = false;
      await moment.save();

      // Emit real-time event for moment deletion
      socketService.emitMomentDeleted(momentId, category);

      res.json({
        success: true,
        message: "Moment deleted successfully",
      });
    } catch (error) {
      console.error("Delete moment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Toggle pause status
  async togglePause(req, res) {
    try {
      const { momentId } = req.params;

      const moment = await Moment.findOne({
        _id: momentId,
        creator: req.user.id,
      });

      if (!moment) {
        return res.status(404).json({
          success: false,
          message: "Moment not found",
        });
      }

      // Check if expired
      if (moment.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify expired moment",
        });
      }

      // Check if cancelled
      if (moment.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Cannot modify cancelled moment",
        });
      }

      // Toggle status
      if (moment.status === "active") {
        moment.status = "paused";
        moment.isAvailable = false;
      } else if (moment.status === "paused") {
        moment.status = "active";
        moment.isAvailable = true;
      } else {
        // Should not happen given checks above, but for safety
        return res.status(400).json({
          success: false,
          message: `Cannot toggle pause for status: ${moment.status}`,
        });
      }

      await moment.save();

      // Emit real-time event for moment status change
      socketService.emitMomentStatusChanged(
        momentId,
        moment.status,
        moment.category
      );

      res.json({
        success: true,
        message: `Moment ${moment.status === "active" ? "activated" : "paused"
          } successfully`,
        moment,
      });
    } catch (error) {
      console.error("Toggle pause error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get available moments for Give Joy
  async getAvailableMoments(req, res) {
    try {
      // const { category } = req.query;
      const userId = req.user.id;

      // const filter = {
      //   status: "active",
      //   isAvailable: true,
      //   expiresAt: { $gt: new Date() },
      //   creator: { $ne: userId }, // Exclude user's own moments
      // };

      // if (category && category !== "all") {
      //   filter.category = category;
      // }

      // const moments = await Moment.find(filter)
      //   .populate("creator", "name languages rating callCount")
      //   .select(
      //     "category subCategory content languages createdAt hearts callCount"
      //   )
      //   .sort({ hearts: -1, createdAt: -1 });

      // Get category counts
      const categoryCounts = await Moment.aggregate([
        {
          $match: {
            status: "active",
            isAvailable: true,
            expiresAt: { $gt: new Date() },
            creator: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        // moments,
        categoryCounts,
      });
    } catch (error) {
      console.error("Get available moments error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new MomentController();
