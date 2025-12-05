// services/socketService.js
/**
 * Socket Service - Centralized real-time event emission
 * This service handles all Socket.IO event emissions across the application
 */

let io = null;

/**
 * Initialize the socket service with Socket.IO instance
 * @param {Object} socketIO - Socket.IO instance
 */
function initialize(socketIO) {
  io = socketIO;
  console.log("✅ Socket service initialized");
}

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initialize() first.");
  }
  return io;
}

// ==================== MOMENT EVENTS ====================

/**
 * Emit heart count update for a moment
 * @param {string} momentId - Moment ID
 * @param {number} heartCount - Updated heart count
 * @param {string} category - Moment category (optional, for category rooms)
 */
function emitHeartUpdate(momentId, heartCount, category = null) {
  if (!io) return;

  const payload = {
    momentId,
    heartCount,
    timestamp: Date.now(),
  };

  // Global broadcast (Phase 1 - Simple approach)
  io.emit("moment:heart:updated", payload);

  // Optional: Category room broadcast (Phase 2 - Optimized)
  if (category) {
    io.to(`category:${category}`).emit("moment:heart:updated", payload);
  }

  console.log(
    `📡 Emitted heart update for moment ${momentId}: ${heartCount} hearts`
  );
}

/**
 * Emit moment created event
 * @param {Object} moment - Moment object
 */
function emitMomentCreated(moment) {
  if (!io) return;

  const payload = {
    momentId: moment._id,
    category: moment.category,
    creatorId: moment.creator,
    timestamp: Date.now(),
  };

  // Broadcast to all users
  io.emit("moment:created", moment);

  // Also broadcast to category room
  io.to(`category:${moment.category}`).emit("moment:created", moment);

  console.log(`📡 Emitted moment created: ${moment._id}`);
}

/**
 * Emit moment updated event
 * @param {Object} moment - Updated moment object
 */
function emitMomentUpdated(moment) {
  if (!io) return;

  io.emit("moment:updated", moment);
  io.to(`category:${moment.category}`).emit("moment:updated", moment);

  console.log(`📡 Emitted moment updated: ${moment._id}`);
}

/**
 * Emit moment deleted event
 * @param {string} momentId - Moment ID
 * @param {string} category - Moment category
 */
function emitMomentDeleted(momentId, category) {
  if (!io) return;

  const payload = {
    momentId,
    category,
    timestamp: Date.now(),
  };

  io.emit("moment:deleted", payload);
  io.to(`category:${category}`).emit("moment:deleted", payload);

  console.log(`📡 Emitted moment deleted: ${momentId}`);
}

/**
 * Emit moment status changed (paused/active)
 * @param {string} momentId - Moment ID
 * @param {string} status - New status
 * @param {string} category - Moment category
 */
function emitMomentStatusChanged(momentId, status, category) {
  if (!io) return;

  const payload = {
    momentId,
    status,
    category,
    timestamp: Date.now(),
  };

  io.emit("moment:status:changed", payload);
  io.to(`category:${category}`).emit("moment:status:changed", payload);

  console.log(`📡 Emitted moment status changed: ${momentId} -> ${status}`);
}

// ==================== CALL EVENTS ====================

/**
 * Emit call initiated event to specific user
 * @param {string} recipientUserId - User ID of the recipient
 * @param {Object} callData - Call information
 */
function emitCallInitiated(recipientUserId, callData) {
  if (!io) return;

  const payload = {
    callData,
    timestamp: Date.now(),
  };

  // Emit to specific user
  io.to(recipientUserId).emit("call:initiated", payload);

  console.log(`📡 Emitted call initiated to user ${recipientUserId}`);
}

/**
 * Emit call status update
 * @param {string} callId - Call ID
 * @param {string} status - Call status
 * @param {Array<string>} userIds - User IDs to notify
 */
function emitCallStatusUpdate(callId, status, userIds = []) {
  if (!io) return;

  const payload = {
    callId,
    status,
    timestamp: Date.now(),
  };

  // Emit to specific users involved in the call
  userIds.forEach((userId) => {
    io.to(userId).emit("call:status:updated", payload);
  });

  console.log(`📡 Emitted call status update: ${callId} -> ${status}`);
}

// ==================== USER EVENTS ====================

/**
 * Emit notification to specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
function emitNotification(userId, notification) {
  if (!io) return;

  const payload = {
    ...notification,
    timestamp: Date.now(),
  };

  io.to(userId).emit("notification", payload);

  console.log(`📡 Emitted notification to user ${userId}`);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get connection statistics
 * @returns {Object} Connection stats
 */
function getStats() {
  if (!io) return { connected: 0 };

  return {
    connected: io.engine.clientsCount,
    rooms: io.sockets.adapter.rooms.size,
  };
}

/**
 * Broadcast custom event
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @param {string} room - Optional room name
 */
function broadcast(event, data, room = null) {
  if (!io) return;

  const payload = {
    ...data,
    timestamp: Date.now(),
  };

  if (room) {
    io.to(room).emit(event, payload);
  } else {
    io.emit(event, payload);
  }

  console.log(
    `📡 Broadcasted event: ${event}${room ? ` to room ${room}` : ""}`
  );
}

module.exports = {
  initialize,
  getIO,
  emitHeartUpdate,
  emitMomentCreated,
  emitMomentUpdated,
  emitMomentDeleted,
  emitMomentStatusChanged,
  emitCallInitiated,
  emitCallStatusUpdate,
  emitNotification,
  getStats,
  broadcast,
};
