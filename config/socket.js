// config/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

/**
 * User-Socket mapping to track connected users
 * Key: userId (string), Value: socketId (string)
 */
const userSocketMap = new Map();

/**
 * Socket-User mapping for reverse lookup
 * Key: socketId (string), Value: userId (string)
 */
const socketUserMap = new Map();

/**
 * Initialize Socket.IO with Express server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
function initializeSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user info to socket
            socket.user = {
                id: decoded.id,
                email: decoded.email
            };

            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.user.id;

        console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);

        // Store user-socket mapping
        userSocketMap.set(userId, socket.id);
        socketUserMap.set(socket.id, userId);

        // Emit connection success to the user
        socket.emit('connection:success', {
            message: 'Connected to JoJo real-time server',
            userId,
            timestamp: Date.now()
        });

        // Broadcast user online status (optional)
        socket.broadcast.emit('user:online', {
            userId,
            timestamp: Date.now()
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${userId} (Reason: ${reason})`);

            // Clean up mappings
            userSocketMap.delete(userId);
            socketUserMap.delete(socket.id);

            // Broadcast user offline status (optional)
            socket.broadcast.emit('user:offline', {
                userId,
                timestamp: Date.now()
            });
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });

        // Optional: Category room management (for Phase 2 optimization)
        socket.on('category:join', (data) => {
            const { category } = data;
            const validCategories = ['wishes', 'motivation', 'songs', 'blessings', 'celebrations', 'all'];

            if (validCategories.includes(category)) {
                socket.join(`category:${category}`);
                console.log(`User ${userId} joined category: ${category}`);

                socket.emit('category:joined', {
                    category,
                    timestamp: Date.now()
                });
            }
        });

        socket.on('category:leave', (data) => {
            const { category } = data;
            socket.leave(`category:${category}`);
            console.log(`User ${userId} left category: ${category}`);
        });
    });

    return io;
}

/**
 * Get socket ID for a specific user
 * @param {string} userId - User ID
 * @returns {string|undefined} Socket ID
 */
function getUserSocketId(userId) {
    return userSocketMap.get(userId);
}

/**
 * Get user ID for a specific socket
 * @param {string} socketId - Socket ID
 * @returns {string|undefined} User ID
 */
function getSocketUserId(socketId) {
    return socketUserMap.get(socketId);
}

/**
 * Get all connected user IDs
 * @returns {Array<string>} Array of user IDs
 */
function getConnectedUsers() {
    return Array.from(userSocketMap.keys());
}

/**
 * Get connection statistics
 * @returns {Object} Connection stats
 */
function getConnectionStats() {
    return {
        connectedUsers: userSocketMap.size,
        totalSockets: socketUserMap.size,
        users: Array.from(userSocketMap.keys())
    };
}

module.exports = {
    initializeSocket,
    getUserSocketId,
    getSocketUserId,
    getConnectedUsers,
    getConnectionStats
};
