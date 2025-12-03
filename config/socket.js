// config/socket.js
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * User-Socket mapping to track connected AUTHENTICATED users only
 * Key: userId (string), Value: socketId (string)
 * NOTE: Guest users are NOT stored in this map
 */
const userSocketMap = new Map();

/**
 * Socket-User mapping for reverse lookup (authenticated users only)
 * Key: socketId (string), Value: userId (string)
 * NOTE: Guest sockets are NOT stored in this map
 */
const socketUserMap = new Map();

/**
 * Guest-Socket mapping to track guest connections
 * Key: socketId (string), Value: guestId (string)
 * This is separate from authenticated users
 */
const guestSocketMap = new Map();

/**
 * Generate a unique guest ID
 * @returns {string} Guest ID in format: guest_<random_string>
 */
function generateGuestId() {
  const randomString = crypto.randomBytes(8).toString("hex");
  return `guest_${randomString}`;
}

/**
 * Initialize Socket.IO with Express server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      // Extract token from auth or authorization header
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      // If no token provided, treat as guest user
      if (!token) {
        console.log("🔓 No token provided - treating as guest user");

        // Generate guest ID
        const guestId = generateGuestId();

        // Attach guest info to socket
        socket.user = {
          id: guestId,
          isGuest: true,
        };

        console.log(`👤 Guest user created: ${guestId}`);
        return next();
      }

      // Token provided - verify and authenticate
      try {
        const decoded = jwt.verify(token, process.env.JWTSECRET);

        // Attach authenticated user info to socket
        socket.user = {
          id: decoded.id,
          email: decoded.email,
          isGuest: false,
        };

        console.log(`🔐 Token verified for user: ${decoded.id}`);
        next();
      } catch (jwtError) {
        console.error("❌ JWT verification failed:", jwtError.message);

        // If token is invalid, treat as guest instead of rejecting
        const guestId = generateGuestId();
        socket.user = {
          id: guestId,
          isGuest: true,
        };

        console.log(`👤 Invalid token - created guest user: ${guestId}`);
        next();
      }
    } catch (error) {
      console.error("❌ Socket middleware error:", error.message);

      // Fallback to guest on any error
      const guestId = generateGuestId();
      socket.user = {
        id: guestId,
        isGuest: true,
      };

      next();
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const isGuest = socket.user.isGuest;

    if (isGuest) {
      // Guest user connection
      console.log(`✅ Guest connected: ${userId} (Socket: ${socket.id})`);

      // Store guest in separate map (NOT in userSocketMap)
      guestSocketMap.set(socket.id, userId);

      // Emit connection success to guest
      socket.emit("connection:success", {
        message: "Connected to JoJo real-time server as guest",
        userId,
        isGuest: true,
        timestamp: Date.now(),
      });

      console.log(`📊 Guest connection established: ${userId}`);
    } else {
      // Authenticated user connection
      console.log(`✅ Authenticated user connected: ${userId} (Socket: ${socket.id})`);

      // Store user-socket mapping (only for authenticated users)
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      // Emit connection success to authenticated user
      socket.emit("connection:success", {
        message: "Connected to JoJo real-time server",
        userId,
        isGuest: false,
        timestamp: Date.now(),
      });

      // Broadcast user online status (only for authenticated users)
      socket.broadcast.emit("user:online", {
        userId,
        timestamp: Date.now(),
      });

      console.log(`📊 Authenticated connection established: ${userId}`);
    }

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      if (isGuest) {
        console.log(`❌ Guest disconnected: ${userId} (Reason: ${reason})`);

        // Clean up guest mapping
        guestSocketMap.delete(socket.id);

        console.log(`🧹 Guest cleanup completed: ${userId}`);
      } else {
        console.log(`❌ User disconnected: ${userId} (Reason: ${reason})`);

        // Clean up user mappings
        userSocketMap.delete(userId);
        socketUserMap.delete(socket.id);

        // Broadcast user offline status (only for authenticated users)
        socket.broadcast.emit("user:offline", {
          userId,
          timestamp: Date.now(),
        });

        console.log(`🧹 User cleanup completed: ${userId}`);
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      const userType = isGuest ? "guest" : "user";
      console.error(`⚠️ Socket error for ${userType} ${userId}:`, error);
    });

    // Category room management
    socket.on("category:join", (data) => {
      const { category } = data;
      const validCategories = [
        "wishes",
        "motivation",
        "songs",
        "blessings",
        "celebrations",
        "all",
      ];

      if (validCategories.includes(category)) {
        socket.join(`category:${category}`);

        const userType = isGuest ? "Guest" : "User";
        console.log(`${userType} ${userId} joined category: ${category}`);

        socket.emit("category:joined", {
          category,
          timestamp: Date.now(),
        });
      } else {
        console.warn(`⚠️ Invalid category join attempt: ${category} by ${userId}`);
      }
    });

    socket.on("category:leave", (data) => {
      const { category } = data;
      socket.leave(`category:${category}`);

      const userType = isGuest ? "Guest" : "User";
      console.log(`${userType} ${userId} left category: ${category}`);
    });
  });

  console.log("🚀 Socket.IO initialized successfully");
  return io;
}

/**
 * Get socket ID for a specific authenticated user
 * @param {string} userId - User ID
 * @returns {string|undefined} Socket ID (undefined for guests or offline users)
 */
function getUserSocketId(userId) {
  return userSocketMap.get(userId);
}

/**
 * Get user ID for a specific socket
 * @param {string} socketId - Socket ID
 * @returns {string|undefined} User ID (only for authenticated users, not guests)
 */
function getSocketUserId(socketId) {
  return socketUserMap.get(socketId);
}

/**
 * Get all connected authenticated user IDs
 * NOTE: This does NOT include guest users
 * @returns {Array<string>} Array of authenticated user IDs
 */
function getConnectedUsers() {
  return Array.from(userSocketMap.keys());
}

/**
 * Get connection statistics
 * @returns {Object} Connection stats including authenticated users and guests
 */
function getConnectionStats() {
  return {
    connectedUsers: userSocketMap.size, // Only authenticated users
    totalGuests: guestSocketMap.size,   // Guest connections
    totalConnections: userSocketMap.size + guestSocketMap.size, // All connections
    authenticatedUsers: Array.from(userSocketMap.keys()),
    guestCount: guestSocketMap.size,
  };
}

module.exports = {
  initializeSocket,
  getUserSocketId,
  getSocketUserId,
  getConnectedUsers,
  getConnectionStats,
};
