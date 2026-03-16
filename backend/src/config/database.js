/**
 * MongoDB connection configuration
 */
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/addagle';

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ MongoDB connected');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected, attempting reconnect...');
      isConnected = false;
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't crash — allow app to run without DB for basic functionality
    console.warn('⚠️  Running without MongoDB — some features disabled');
  }
}

module.exports = connectDB;
