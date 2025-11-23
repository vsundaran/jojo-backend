// config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "jojo",
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
