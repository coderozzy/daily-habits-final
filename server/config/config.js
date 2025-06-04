const { SERVER_CONFIG } = require('./serverConfig.js');

module.exports = {
  PORT: process.env.PORT || SERVER_CONFIG.DEFAULT_PORT,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/habitsapp',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_replace_in_production'
}; 