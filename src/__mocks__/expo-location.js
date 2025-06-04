export default {
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  getBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  geocodeAsync: jest.fn(() => Promise.resolve([])),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
};

export const LocationAccuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const LocationPermissionResponse = {
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
  GRANTED: 'granted',
}; 