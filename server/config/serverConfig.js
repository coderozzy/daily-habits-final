// ==================== SERVER CONFIGURATION ====================

const APP_CONSTANTS = {
  VALID_FREQUENCIES: ['daily', 'weekly', 'monthly', 'custom'],
  DEFAULT_FREQUENCY: 'daily',
  VALID_WEEKDAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const SERVER_CONFIG = {
  DEFAULT_PORT: 3001,
  
  DB_CONNECTION_TIMEOUT: 10000,     
  DB_QUERY_TIMEOUT: 5000,          
  
  REQUEST_SIZE_LIMIT: '10mb',      
  CORS_ORIGINS: ['*'],              
};

const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000,        
  MAX_REQUESTS: 100,                
  
  AUTH_WINDOW_MS: 5 * 60 * 1000,   
  AUTH_MAX_REQUESTS: 10,          
  
  INCLUDE_HEADERS: true,            
};

const SECURITY_CONFIG = {
  API_KEY_LENGTH: 32,               
  API_KEY_EXPIRY_DAYS: 365,       
};

const RESPONSE_CONFIG = {
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
  },
  
  MESSAGES: {
    SUCCESS: 'Operation completed successfully',
    CREATED: 'Resource created successfully',
    BAD_REQUEST: 'Invalid request data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    RATE_LIMITED: 'Too many requests, please try again later',
    INTERNAL_ERROR: 'Internal server error',
    DEVICE_REGISTERED: 'Device registered successfully',
    DEVICE_ALREADY_EXISTS: 'Device already registered',
    INVALID_API_KEY: 'Invalid API key',
    EXPIRED_API_KEY: 'API key has expired',
    SYNC_SUCCESS: 'Data synchronized successfully',
  },
};

const DATABASE_CONFIG = {
  COLLECTIONS: {
    DEVICES: 'devices',
    HABITS: 'habits',
    METRICS: 'metrics',
  },
  
  INDEXES: {
    DEVICE_ID: { field: 'deviceId', unique: true },
    API_KEY: { field: 'apiKey', unique: true },
    LAST_ACTIVE: { field: 'lastActive', ttl: 365 * 24 * 60 * 60 },
  },
  
  MAX_DOCUMENTS_PER_QUERY: 1000,
  DEFAULT_PAGE_SIZE: 50,
};

const MONITORING_CONFIG = {
  LOG_FORMAT: 'combined',           
  
  HEALTH_CHECK_INTERVAL: 30000,     
  DB_HEALTH_CHECK_TIMEOUT: 5000,    
};

const DEBUG_CONFIG = {
  ENABLE_CORS_ALL: true,           
  DETAILED_ERRORS: true,          
};

// ==================== ENVIRONMENT-SPECIFIC OVERRIDES ====================

const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    SERVER_CONFIG,
    RATE_LIMIT_CONFIG,
    SECURITY_CONFIG,
    RESPONSE_CONFIG,
    DATABASE_CONFIG,
    MONITORING_CONFIG,
    DEBUG_CONFIG,
  };
  
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        RATE_LIMIT_CONFIG: {
          ...RATE_LIMIT_CONFIG,
          MAX_REQUESTS: 50,          
        },
        DEBUG_CONFIG: {
          ...DEBUG_CONFIG,
          ENABLE_CORS_ALL: false,    
          DETAILED_ERRORS: false,     
        },
      };
      
    case 'test':
      return {
        ...baseConfig,
        RATE_LIMIT_CONFIG: {
          ...RATE_LIMIT_CONFIG,
          MAX_REQUESTS: 1000,        
        },
        MONITORING_CONFIG: {
          ...MONITORING_CONFIG,
          LOG_FORMAT: 'none',         
        },
      };
      
    default:
      return baseConfig;
  }
};

const CONFIG = getEnvironmentConfig();

module.exports = {
  APP_CONSTANTS,
  SERVER_CONFIG,
  RATE_LIMIT_CONFIG,
  SECURITY_CONFIG,
  RESPONSE_CONFIG,
  DATABASE_CONFIG,
  MONITORING_CONFIG,
  DEBUG_CONFIG,
  getEnvironmentConfig,
  CONFIG
}; 