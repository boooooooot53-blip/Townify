const mongoose = require('mongoose');
const { mongodbUri, nodeEnv } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongodbUri, {
      autoIndex: nodeEnv !== 'production',
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
