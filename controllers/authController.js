// controllers/authController.js
const User = require("../models/User");
const OTP = require("../models/OTP");
const twilioService = require("../services/twilioService");
const jwt = require("jsonwebtoken");

class AuthController {
  // Send OTP for registration/login
  async sendOTP(req, res) {
    try {
      const { mobileNumber } = req.body;

      // Check if user exists for login or new registration
      const existingUser = await User.findOne({ mobileNumber });
      // const otp = twilioService.generateOTP();
      const otp = 123456;

      // Save OTP to database
      await OTP.create({
        mobileNumber,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      // Send OTP via SMS
      // const smsResult = await twilioService.sendOTP(mobileNumber, otp);

      // if (!smsResult.success) {
      //   return res.status(500).json({
      //     success: false,
      //     message: "Failed to send OTP",
      //   });
      // }

      res.json({
        success: true,
        message: "OTP sent successfully",
        isNewUser: !existingUser,
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Verify OTP
  async verifyOTP(req, res) {
    try {
      const { mobileNumber, otp, name = "" } = req.body;

      // Find the most recent OTP for this mobile number
      const otpRecord = await OTP.findOne({
        mobileNumber,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "OTP not found or expired",
        });
      }

      // Verify OTP
      const isVerified = await twilioService.verifyOTP(otpRecord.otp, otp);

      if (!isVerified) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Check if user exists
      let user = await User.findOne({ mobileNumber });

      if (!user) {
        // New user - create but don't mark as verified until language selection
        user = await User.create({
          name: name, // Will be updated later
          mobileNumber,
          isVerified: false,
        });
      } else {
        // Existing user - update last login
        user.lastLogin = new Date();
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWTSECRET, {
        expiresIn: process.env.JWTEXPIRE,
      });

      res.json({
        success: true,
        message: "OTP verified successfully",
        token,
        profileCompleted: user.profileCompleted,
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          profileCompleted: user.profileCompleted,
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Complete profile with languages
  async completeProfile(req, res) {
    try {
      const { languages } = req.body;
      const userId = req.user.id;

      // Validate that all provided languages exist in the master list
      const { LANGUAGES } = require("../constants/flags");
      const validLanguageIds = LANGUAGES.map((l) => l.id);
      const areAllLanguagesValid = languages.every((langId) =>
        validLanguageIds.includes(langId)
      );

      if (!areAllLanguagesValid) {
        return res.status(400).json({
          success: false,
          message: "One or more selected languages are invalid",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          languages, // Storing Language IDs
          isVerified: true,
          profileCompleted: true,
        },
        { new: true }
      );

      res.json({
        success: true,
        message: "Profile completed successfully",
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          languages: user.languages,
          profileCompleted: user.profileCompleted,
        },
      });
    } catch (error) {
      console.error("Complete profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user languages
  async getLanguages(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        languages: user.languages || [],
      });
    } catch (error) {
      console.error("Get languages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get all available languages (Master Data)
  async getAllLanguages(req, res) {
    try {
      const { LANGUAGES } = require("../constants/flags");
      res.json({
        success: true,
        languages: LANGUAGES,
      });
    } catch (error) {
      console.error("Get all languages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new AuthController();
