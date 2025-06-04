export * from './appConfig';
export * from './apiConfig';

export { 
  TIMEOUTS, 
  INTERVALS, 
  DEFAULTS, 
  APP_BEHAVIOR, 
  UI_CONFIG, 
  VALIDATION, 
  FEATURES, 
  CURRENT_ENV,
  PICKER_OPTIONS,
  FREQUENCY_DISPLAY_MAP
} from './appConfig';

export { 
  SERVER_URL, 
  API_URL, 
  DEVICE_ID_KEY, 
  API_KEY_KEY, 
  ENDPOINTS, 
  REQUEST_TIMEOUT, 
  SYNC_INTERVAL 
} from './apiConfig';

export const CONFIG_VALIDATORS = {
  isValidTimeout: (timeout) => {
    return typeof timeout === 'number' && timeout > 0 && timeout <= 60000;
  },

  isValidInterval: (interval) => {
    return typeof interval === 'number' && interval >= 1000 && interval <= 3600000;
  },
  
  isValidHabitName: (name) => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= VALIDATION.HABIT_NAME_MIN_LENGTH && 
           trimmed.length <= VALIDATION.HABIT_NAME_MAX_LENGTH;
  },
  
  isValidNotificationTime: (time) => {
    return VALIDATION.NOTIFICATION_TIME_FORMAT.test(time);
  },
  
  isValidFrequency: (frequency) => {
    return VALIDATION.VALID_FREQUENCIES.includes(frequency);
  },
};

export const ENV_HELPERS = {
  isDevelopment: () => __DEV__ || CURRENT_ENV.LOG_LEVEL === 'debug',
  
  isProduction: () => !__DEV__ && CURRENT_ENV.LOG_LEVEL === 'error',
  
  isTest: () => process.env.NODE_ENV === 'test' || CURRENT_ENV.LOG_LEVEL === 'silent',
  
  getEnvironmentTimeout: (operation) => {
    const multiplier = ENV_HELPERS.isDevelopment() ? 1.5 : 1;
    
    switch (operation) {
      case 'api': return TIMEOUTS.API_REQUEST * multiplier;
      case 'persistence': return TIMEOUTS.APP_PERSISTENCE * multiplier;
      case 'registration': return TIMEOUTS.DEVICE_REGISTRATION * multiplier;
      default: return TIMEOUTS.API_REQUEST * multiplier;
    }
  },
}; 