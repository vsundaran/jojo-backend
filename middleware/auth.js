// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWTSECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// Optional authentication - allows both authenticated and guest access
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    // If no token provided, continue as guest user
    if (!token) {
      req.user = null;
      return next();
    }

    // If token provided, validate it
    const decoded = jwt.verify(token, process.env.JWTSECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      // Invalid token - continue as guest
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // Token validation failed - continue as guest
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

module.exports = { auth, optionalAuth };
