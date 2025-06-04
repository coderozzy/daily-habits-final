const Device = require('../models/Device');
const { CONFIG } = require('../config/serverConfig');

exports.validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.UNAUTHORIZED).json({ 
        success: false, 
        error: CONFIG.RESPONSE_CONFIG.MESSAGES.UNAUTHORIZED
      });
    }
    
    const device = await Device.findOne({ apiKey });
    
    if (!device) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.FORBIDDEN).json({ 
        success: false, 
        error: CONFIG.RESPONSE_CONFIG.MESSAGES.INVALID_API_KEY
      });
    }
    
    if (device.isApiKeyExpired()) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.FORBIDDEN).json({ 
        success: false, 
        error: CONFIG.RESPONSE_CONFIG.MESSAGES.EXPIRED_API_KEY
      });
    }
    
    device.lastActive = new Date();
    await device.save();
    
    req.device = device;
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.INTERNAL_ERROR).json({ 
      success: false, 
      error: CONFIG.RESPONSE_CONFIG.MESSAGES.INTERNAL_ERROR
    });
  }
}; 