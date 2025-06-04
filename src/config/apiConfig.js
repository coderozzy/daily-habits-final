import { TIMEOUTS, INTERVALS } from './appConfig';

const SERVER_CONFIG = {
  DEVELOPMENT: {
    HOST: '192.168.1.107',
    PORT: 3001,
    PROTOCOL: 'http'
  },
  PRODUCTION: {
    HOST: 'origin-server.com',
    PORT: 443,
    PROTOCOL: 'https'
  },
  TEST: {
    HOST: 'localhost', 
    PORT: 3001,
    PROTOCOL: 'http'
  }
};

const getCurrentServerConfig = () => {
  if (__DEV__) return SERVER_CONFIG.DEVELOPMENT;
  if (process.env.NODE_ENV === 'test') return SERVER_CONFIG.TEST;
  return SERVER_CONFIG.PRODUCTION;
};

const currentServerConfig = getCurrentServerConfig();

export const SERVER_URL = `${currentServerConfig.PROTOCOL}://${currentServerConfig.HOST}:${currentServerConfig.PORT}`;

export const API_URL = `${SERVER_URL}/api`;

export const DEVICE_ID_KEY = 'device_id';
export const API_KEY_KEY = 'api_key';

export const ENDPOINTS = {
  REGISTER: '/auth/register',
  SYNC: '/metrics/sync',
  METRICS: '/metrics',
  HEALTH: '/health'
};

export const REQUEST_TIMEOUT = TIMEOUTS.API_REQUEST;
export const SYNC_INTERVAL = INTERVALS.SYNC_HABITS; 