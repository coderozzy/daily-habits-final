const mockFunctions = {
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, expires: 'never' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  presentNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  setNotificationHandler: jest.fn(() => {}),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test-token]' })),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
};

export default mockFunctions;

export const requestPermissionsAsync = mockFunctions.requestPermissionsAsync;
export const getPermissionsAsync = mockFunctions.getPermissionsAsync;
export const scheduleNotificationAsync = mockFunctions.scheduleNotificationAsync;
export const cancelNotificationAsync = mockFunctions.cancelNotificationAsync;
export const cancelAllScheduledNotificationsAsync = mockFunctions.cancelAllScheduledNotificationsAsync;
export const getAllScheduledNotificationsAsync = mockFunctions.getAllScheduledNotificationsAsync;
export const presentNotificationAsync = mockFunctions.presentNotificationAsync;
export const dismissNotificationAsync = mockFunctions.dismissNotificationAsync;
export const dismissAllNotificationsAsync = mockFunctions.dismissAllNotificationsAsync;
export const addNotificationReceivedListener = mockFunctions.addNotificationReceivedListener;
export const addNotificationResponseReceivedListener = mockFunctions.addNotificationResponseReceivedListener;
export const removeNotificationSubscription = mockFunctions.removeNotificationSubscription;
export const setNotificationHandler = mockFunctions.setNotificationHandler;
export const setNotificationChannelAsync = mockFunctions.setNotificationChannelAsync;
export const getExpoPushTokenAsync = mockFunctions.getExpoPushTokenAsync;
export const cancelScheduledNotificationAsync = mockFunctions.cancelScheduledNotificationAsync;

export const AndroidImportance = {
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export const IosAuthorizationStatus = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
}; 