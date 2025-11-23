// server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const socketService = require('./services/socketService');

// Connect to database
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`JoJo server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.IO
const io = initializeSocket(server);

// Initialize socket service with io instance
socketService.initialize(io);

console.log('✅ Socket.IO initialized and ready for real-time connections');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception thrown:', err);
  process.exit(1);
});