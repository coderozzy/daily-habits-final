const crypto = require('crypto');
const Device = require('../models/Device');
const { CONFIG } = require('../config/serverConfig');

exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, model, osName, osVersion } = req.body;
    
    if (!deviceId) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        error: CONFIG.RESPONSE_CONFIG.MESSAGES.BAD_REQUEST
      });
    }
    
    let device = await Device.findOne({ deviceId });
    
    if (device) {
      if (device.isApiKeyExpired()) {
        device.apiKey = crypto.randomBytes(CONFIG.SECURITY_CONFIG.API_KEY_LENGTH).toString('hex');
        await device.extendApiKeyExpiry();
        await device.save();
        
        return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({ 
          success: true, 
          apiKey: device.apiKey,
          message: 'API key renewed due to expiry'
        });
      }
      
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({ 
        success: true, 
        apiKey: device.apiKey,
        message: CONFIG.RESPONSE_CONFIG.MESSAGES.DEVICE_ALREADY_EXISTS
      });
    }
    
    const apiKey = crypto.randomBytes(CONFIG.SECURITY_CONFIG.API_KEY_LENGTH).toString('hex');
    
    device = new Device({
      deviceId,
      apiKey,
      model: model || 'Unknown',
      osName: osName || 'Unknown',
      osVersion: osVersion || 'Unknown'
    });
    
    await device.save();
    
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.CREATED).json({ 
      success: true, 
      apiKey,
      message: CONFIG.RESPONSE_CONFIG.MESSAGES.DEVICE_REGISTERED
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.INTERNAL_ERROR).json({ 
      success: false, 
      error: CONFIG.RESPONSE_CONFIG.MESSAGES.INTERNAL_ERROR
    });
  }
}; 