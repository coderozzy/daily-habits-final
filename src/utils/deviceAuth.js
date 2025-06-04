import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_URL, DEVICE_ID_KEY, API_KEY_KEY, ENDPOINTS } from '../config/apiConfig';
import { TIMEOUTS, FEATURES } from '../config';


const isWeb = Platform.OS === 'web';
let registrationPromise = null;
const storage = {
  async getItem(key) {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async setItem(key, value) {
    if (isWeb) {
      return await AsyncStorage.setItem(key, value);
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  },
  async deleteItem(key) {
    if (isWeb) {
      return await AsyncStorage.removeItem(key);
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  }
};

const generateDeviceId = () => {
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const deviceInfo = Platform.OS + '-' + (Device.modelName || 'Unknown') + '-' + (Device.brand || 'Unknown');
  
  return `${deviceInfo}-${timestamp}-${randomStr}`;
};

export const getDeviceId = async () => {
  try {
    let deviceId = await storage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      await storage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    throw error;
  }
};

export const getApiKey = async () => {
  try {
    return await storage.getItem(API_KEY_KEY);
  } catch (error) {
    return null;
  }
};

export const storeApiKey = async (apiKey) => {
  try {
    await storage.setItem(API_KEY_KEY, apiKey);
  } catch (error) {
    throw error;
  }
};

export const registerDevice = async () => {
  if (registrationPromise) {
    return await registrationPromise;
  }

  registrationPromise = performRegistration();
  
  try {
    const result = await registrationPromise;
    return result;
  } finally {
    registrationPromise = null;
  }
};

const performRegistration = async () => {
  if (FEATURES.OFFLINE_MODE === false) {
    throw new Error('Device registration is disabled in offline mode');
  }

  try {
    const deviceId = await getDeviceId();
    const deviceInfo = {
      deviceId,
      model: Device.modelName || 'Unknown',
      osName: Platform.OS || 'Unknown',
      osVersion: Platform.Version ? Platform.Version.toString() : 'Unknown'
    };
    
    const registrationUrl = `${API_URL}${ENDPOINTS.REGISTER}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEVICE_REGISTRATION);
    
    try {
      const response = await fetch(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deviceInfo),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }
      
      await storeApiKey(data.apiKey);
      
      return data.apiKey;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const clearAuthData = async () => {
  try {
    await storage.deleteItem(DEVICE_ID_KEY);
    await storage.deleteItem(API_KEY_KEY);
  } catch (error) {
    throw error;
  }
};

export const ensureRegistered = async () => {
  if (FEATURES.OFFLINE_MODE === false) {
    const existingKey = await getApiKey();
    if (existingKey) {
      return existingKey;
    }
    throw new Error('No existing API key found and registration is disabled in offline mode');
  }

  let apiKey = await getApiKey();
  
  if (!apiKey) {
    apiKey = await registerDevice();
  }
  
  return apiKey;
}; 