// routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { otpLimiter } = require("../middleware/rateLimit");
const handleValidationErrors = require("../middleware/validation");

const router = express.Router();

// Send OTP
router.post(
  "/send-otp",
  otpLimiter,
  [
    body("mobileNumber")
      .isMobilePhone()
      .withMessage("Please enter a valid mobile number"),
  ],
  handleValidationErrors,
  authController.sendOTP
);

// Verify OTP
router.post(
  "/verify-otp",
  [
    body("mobileNumber")
      .isMobilePhone()
      .withMessage("Please enter a valid mobile number"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  handleValidationErrors,
  authController.verifyOTP
);

// Complete profile
router.post(
  "/complete-profile",
  auth,
  [
    body("languages")
      .isArray({ min: 1 })
      .withMessage("At least one language must be selected"),
  ],
  handleValidationErrors,
  authController.completeProfile
);

// Get user languages
router.get("/languages", auth, authController.getLanguages);

module.exports = router;
