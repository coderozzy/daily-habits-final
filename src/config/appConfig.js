// ==================== TIMING CONFIGURATION ====================
export const TIMEOUTS = {
  API_REQUEST: 8000,              
  DEVICE_REGISTRATION: 8000,      
  
  APP_PERSISTENCE: 18000,         
  REDUX_PERSIST: 10000,           
  APP_INITIALIZATION_DELAY: 500,  
  
  LOADING_INDICATOR: 1000,        
  ERROR_MESSAGE_DISPLAY: 5000,    
  SUCCESS_MESSAGE_DISPLAY: 3000,  
};

export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

export const INTERVALS = {
  SYNC_HABITS: 15 * 60 * 1000,    
  
  NETWORK_CHECK: 30 * 1000,       
  SERVER_HEALTH_CHECK: 5 * 60 * 1000, 
  
  STATUS_INDICATOR_UPDATE: 2000,   
  STATS_REFRESH: 10 * 1000,      
};

// ==================== DEFAULT VALUES ====================

export const DEFAULTS = {
  NOTIFICATION_TIME: '09:00',   
  HABIT_FREQUENCY: 'daily',       
  SYNC_ENABLED: true,
  THEME: 'auto',
  
  THEME_MODE: 'light',            
  NOTIFICATIONS_ENABLED: true,    
  
  MAX_HABIT_NAME_LENGTH: 50,      
  MAX_HABITS_PER_USER: 100,        
};

export const APP_BEHAVIOR = {
  MAX_RETRY_ATTEMPTS: 3,       
  RETRY_DELAY_BASE: 1000,         
  
  DEBOUNCE_DELAY: 300,             
  THROTTLE_DELAY: 1000,           
  
  AUTO_CLEANUP_DAYS: 30,           
  BATCH_SIZE: 20,                  
};

// ==================== UI CONFIGURATION ====================

export const UI_CONFIG = {
  ANIMATION_FAST: 200,
  ANIMATION_MEDIUM: 400,
  ANIMATION_SLOW: 600,
  ANIMATION_VERY_SLOW: 800,
  
  WEB_ANIMATION_FAST: 150,
  WEB_ANIMATION_MEDIUM: 250,
  WEB_ANIMATION_SLOW: 400,
  
  SAFE_AREA_PADDING: 16,
  CONTAINER_PADDING: 20,
  CARD_PADDING: 15,
  SMALL_PADDING: 8,
  MEDIUM_PADDING: 12,
  INPUT_PADDING: 15,
  EXTRA_SMALL_PADDING: 6,
  VERY_SMALL_PADDING: 4,
  LARGE_PADDING: 24,
  EXTRA_LARGE_PADDING: 36,
  ZERO_PADDING: 0,
  
  CARD_BORDER_RADIUS: 12,
  BUTTON_BORDER_RADIUS: 10,
  INPUT_BORDER_RADIUS: 10,
  LARGE_BORDER_RADIUS: 20,
  SMALL_BORDER_RADIUS: 5,
  EXTRA_SMALL_BORDER_RADIUS: 4,
  
  BUTTON_HEIGHT: 48,
  HABIT_ITEM_MIN_HEIGHT: 80,
  CHECKBOX_SIZE: 24,
  PICKER_HEIGHT: 50,
  DAY_BUTTON_MIN_WIDTH: 40,
  
  VERY_SMALL_ICON_SIZE: 14,
  SMALL_ICON_SIZE: 20,
  MEDIUM_ICON_SIZE: 24,
  LARGE_ICON_SIZE: 48,
  HEADER_FONT_SIZE: 28,
  
  OVERLAY_OPACITY: 0.5,
  DISABLED_OPACITY: 0.6,
  FOCUS_OPACITY: 0.8,
  SHADOW_OPACITY: 0.2,
  SHADOW_MEDIUM_OPACITY: 0.25,
  WEB_SHADOW_OPACITY: 0.1,
  
  VERY_SMALL_MARGIN: 2,
  SMALL_MARGIN: 5,
  MEDIUM_MARGIN: 10,
  LARGE_MARGIN: 15,
  EXTRA_LARGE_MARGIN: 20,
  EXTRA_EXTRA_LARGE_MARGIN: 30,
  NEGATIVE_LARGE_MARGIN: -32,
  ZERO_MARGIN: 0,
  
  SMALL_ELEVATION: 2,
  MEDIUM_ELEVATION: 3,
  LARGE_ELEVATION: 5,
  EXTRA_LARGE_ELEVATION: 6,
  
  THIN_BORDER: 1,
  MEDIUM_BORDER: 2,
  
  VERY_SMALL_FONT_SIZE: 12,
  SMALL_FONT_SIZE: 13,
  MEDIUM_FONT_SIZE: 14,
  LARGE_FONT_SIZE: 16,
  EXTRA_LARGE_FONT_SIZE: 18,
  SUBTITLE_FONT_SIZE: 20,
  TITLE_FONT_SIZE: 24,
  LARGE_TITLE_FONT_SIZE: 28,
  
  SMALL_LINE_HEIGHT: 20,
  MEDIUM_LINE_HEIGHT: 24,
  
  SETTINGS_ICON_SIZE: 22,
};

// ==================== VALIDATION RULES ====================

export const VALIDATION = {
  HABIT_NAME_MIN_LENGTH: 3,
  HABIT_NAME_MAX_LENGTH: DEFAULTS.MAX_HABIT_NAME_LENGTH,
  
  NOTIFICATION_TIME_FORMAT: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  
  VALID_FREQUENCIES: ['daily', 'weekly', 'monthly', 'custom'],
  VALID_WEEKDAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

// ==================== FEATURE FLAGS ====================

let runtimeFeatures = {
  NOTIFICATIONS_ENABLED: true,
  DARK_THEME: true,
  OFFLINE_MODE: true,
};

export const FEATURES = {
  get NOTIFICATIONS_ENABLED() {
    return runtimeFeatures.NOTIFICATIONS_ENABLED;
  },
  get DARK_THEME() {
    return runtimeFeatures.DARK_THEME;
  },
  get OFFLINE_MODE() {
    return runtimeFeatures.OFFLINE_MODE;
  },
};

export const updateFeatureFlag = (feature, enabled) => {
  if (runtimeFeatures.hasOwnProperty(feature)) {
    runtimeFeatures[feature] = enabled;
    return true;
  }
  return false;
};

export const getFeatureFlags = () => {
  return { ...runtimeFeatures };
};

export const resetFeatureFlags = () => {
  runtimeFeatures = {
    NOTIFICATIONS_ENABLED: true,
    DARK_THEME: true,
    OFFLINE_MODE: true,
  };
};

// ==================== ENVIRONMENT-SPECIFIC CONFIG ====================

export const ENV_CONFIG = {
  DEV: {
    LOG_LEVEL: 'debug',
    ENABLE_FLIPPER: true,
    MOCK_API_CALLS: false,
  },
  
  PROD: {
    LOG_LEVEL: 'error',
    ENABLE_FLIPPER: false,
    MOCK_API_CALLS: false,
  },
  
  TEST: {
    LOG_LEVEL: 'silent',
    ENABLE_FLIPPER: false,
    MOCK_API_CALLS: true,
  },
};

// ==================== EXPORT CURRENT ENVIRONMENT CONFIG ====================

const getCurrentEnvConfig = () => {
  if (__DEV__) return ENV_CONFIG.DEV;
  if (process.env.NODE_ENV === 'test') return ENV_CONFIG.TEST;
  return ENV_CONFIG.PROD;
};

export const CURRENT_ENV = getCurrentEnvConfig();

export const PICKER_OPTIONS = {
  FREQUENCY: [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' },
  ],
};

export const FREQUENCY_DISPLAY_MAP = {
  daily: 'Daily',
  weekly: 'Weekly', 
  monthly: 'Monthly',
  custom: 'Custom'
}; 