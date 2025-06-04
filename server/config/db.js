const mongoose = require('mongoose');
const config = require('./config');
const { CONFIG } = require('./serverConfig');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: CONFIG.SERVER_CONFIG.DB_CONNECTION_TIMEOUT,
      socketTimeoutMS: CONFIG.SERVER_CONFIG.DB_QUERY_TIMEOUT,
      connectTimeoutMS: CONFIG.SERVER_CONFIG.DB_CONNECTION_TIMEOUT,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    };

    const conn = await mongoose.connect(config.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection timeout: ${CONFIG.SERVER_CONFIG.DB_CONNECTION_TIMEOUT}ms`);
    console.log(`Query timeout: ${CONFIG.SERVER_CONFIG.DB_QUERY_TIMEOUT}ms`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 