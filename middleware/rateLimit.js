// middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: parseInt(process.env.OTPRATELIMITWINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.OTPRATELIMITMAX) || 50, // limit each IP to 50 OTP requests per windowMs
  message: {
    success: false,
    message:
      "Too many OTP requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpLimiter,
  apiLimiter,
};
