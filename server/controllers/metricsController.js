const Metrics = require('../models/Metrics');
const { CONFIG } = require('../config/serverConfig');

exports.syncHabits = async (req, res) => {
  try {
    const { habits } = req.body;
    const { deviceId } = req.device;
    
    if (!habits || !Array.isArray(habits)) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        error: CONFIG.RESPONSE_CONFIG.MESSAGES.BAD_REQUEST
      });
    }
    
    const metrics = await Metrics.findOneAndUpdate(
      { deviceId },
      {
        deviceId,
        habits,
        syncedAt: new Date()
      },
      { 
        upsert: true,
        new: true,
        runValidators: true
      }
    );
    
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({
      success: true,
      message: CONFIG.RESPONSE_CONFIG.MESSAGES.SYNC_SUCCESS,
      data: { syncedAt: metrics.syncedAt }
    });
  } catch (error) {
    console.error('Sync habits error:', error);
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      error: CONFIG.RESPONSE_CONFIG.MESSAGES.INTERNAL_ERROR
    });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const { deviceId } = req.device;
    
    const metrics = await Metrics.findOne({ deviceId });
    
    if (!metrics) {
      return res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({
        success: true,
        data: { habits: [] }
      });
    }
    
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      error: CONFIG.RESPONSE_CONFIG.MESSAGES.INTERNAL_ERROR
    });
  }
}; 