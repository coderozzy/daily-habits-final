const mongoose = require('mongoose');
const { CONFIG } = require('../config/serverConfig');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  apiKeyExpiry: {
    type: Date,
    required: true,
    default: () => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + CONFIG.SECURITY_CONFIG.API_KEY_EXPIRY_DAYS);
      return expiry;
    }
  },
  model: {
    type: String,
    default: 'Unknown'
  },
  osName: {
    type: String,
    default: 'Unknown'
  },
  osVersion: {
    type: String,
    default: 'Unknown'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

deviceSchema.index(
  { lastActive: 1 }, 
  { expireAfterSeconds: CONFIG.DATABASE_CONFIG.INDEXES.LAST_ACTIVE.ttl }
);

deviceSchema.methods.isApiKeyExpired = function() {
  return new Date() > this.apiKeyExpiry;
};

deviceSchema.methods.extendApiKeyExpiry = function() {
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + CONFIG.SECURITY_CONFIG.API_KEY_EXPIRY_DAYS);
  this.apiKeyExpiry = newExpiry;
  return this.save();
};

module.exports = mongoose.model('Device', deviceSchema); 