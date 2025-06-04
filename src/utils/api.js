import { getApiKey, ensureRegistered } from './deviceAuth';
import { API_URL, ENDPOINTS, REQUEST_TIMEOUT } from '../config/apiConfig';
import { FEATURES } from '../config';


const apiRequest = async (endpoint, options = {}) => {
  if (FEATURES.OFFLINE_MODE === false) {
    throw new Error('Application is in offline mode. Server communication is disabled.');
  }

  try {
    let apiKey = await getApiKey();
    if (!apiKey) {
      apiKey = await ensureRegistered();
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...(options.headers || {})
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out');
    }
    throw error;
  }
};

export const syncHabits = async (habits) => {
  if (FEATURES.OFFLINE_MODE === false) {
    throw new Error('Sync is disabled in offline mode');
  }

  return apiRequest(ENDPOINTS.SYNC, {
    method: 'POST',
    body: JSON.stringify({ habits })
  });
};

export const getMetrics = async () => {
  if (FEATURES.OFFLINE_MODE === false) {
    throw new Error('Server communication is disabled in offline mode');
  }

  return apiRequest(ENDPOINTS.METRICS);
};

export const registerDeviceApi = async () => {
  return ensureRegistered();
}; 