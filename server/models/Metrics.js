const mongoose = require('mongoose');
const { APP_CONSTANTS } = require('../config/serverConfig');

const metricsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    ref: 'Device',
    index: true
  },
  habits: [{
    id: String,
    name: String,
    frequency: {
      type: String,
      enum: APP_CONSTANTS.VALID_FREQUENCIES,
      default: APP_CONSTANTS.DEFAULT_FREQUENCY
    },
    customDays: [String],
    completedDates: [String],
    streak: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Metrics', metricsSchema); 