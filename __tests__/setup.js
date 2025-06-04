// Global test setup - mocks applied before any imports

// Mock React Native modules
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
    })),
  },
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => {
      if (Array.isArray(style)) {
        return Object.assign({}, ...style.filter(Boolean));
      }
      return style || {};
    }),
    compose: jest.fn((style1, style2) => [style1, style2].filter(Boolean)),
  },
  Text: 'Text',
  View: 'View',
  TouchableOpacity: ({ onPress, disabled, children, ...props }) => {
    const React = require('react');
    return React.createElement('TouchableOpacity', {
      ...props,
      disabled,
      onPress: disabled ? undefined : onPress,
      children,
    });
  },
  ScrollView: 'ScrollView',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Redux persistor
const mockPersistor = {
  subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
  getState: jest.fn(() => ({ bootstrapped: false })),
  purge: jest.fn(() => Promise.resolve()),
  persist: jest.fn(() => Promise.resolve()),
};

jest.mock('../src/redux/store', () => ({
  store: {
    getState: jest.fn(() => ({
      habits: {
        habits: [],
        loading: false,
        error: null,
      },
    })),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  },
  persistor: mockPersistor,
}));

// Mock Expo dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-notifications', () => ({
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
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test-token]' })),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    NONE: 0,
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

// Mock comprehensive app config with DEFAULTS
jest.mock('../src/config/appConfig', () => ({
  FEATURES: {
    DARK_THEME: true,
    NOTIFICATIONS_ENABLED: true,
    OFFLINE_MODE: true,
  },
  DEFAULTS: {
    THEME_MODE: 'light',
    NOTIFICATION_TIME: '09:00',
    HABIT_FREQUENCY: 'daily',
  },
  TIMEOUTS: {
    API_REQUEST: 8000,
    APP_PERSISTENCE: 5000,
    DEVICE_REGISTRATION: 8000,
  },
  INTERVALS: {
    SYNC_HABITS: 15 * 60 * 1000,
    NETWORK_CHECK: 30 * 1000,
  },
  UI_CONFIG: {
    SMALL_ICON_SIZE: 16,
    MEDIUM_ICON_SIZE: 24,
    LARGE_ICON_SIZE: 48,
    CARD_BORDER_RADIUS: 8,
    BUTTON_BORDER_RADIUS: 8,
    MEDIUM_PADDING: 16,
    SMALL_PADDING: 8,
    VERY_SMALL_PADDING: 4,
    INPUT_PADDING: 12,
    MEDIUM_BORDER: 2,
    THIN_BORDER: 1,
    LARGE_FONT_SIZE: 18,
    MEDIUM_FONT_SIZE: 16,
    VERY_SMALL_FONT_SIZE: 12,
    LARGE_TITLE_FONT_SIZE: 28,
    TITLE_FONT_SIZE: 24,
    DISABLED_OPACITY: 0.5,
    CHECKBOX_SIZE: 24,
    HABIT_ITEM_MIN_HEIGHT: 80,
    MEDIUM_ELEVATION: 4,
    SMALL_ELEVATION: 2,
    VERY_SMALL_MARGIN: 4,
    BUTTON_HEIGHT: 48,
  },
}));

// Mock config index with DEFAULTS
jest.mock('../src/config', () => ({
  FREQUENCY_DISPLAY_MAP: {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
  },
  FEATURES: {
    DARK_THEME: true,
    NOTIFICATIONS_ENABLED: true,
    OFFLINE_MODE: true,
  },
  DEFAULTS: {
    THEME_MODE: 'light',
    NOTIFICATION_TIME: '09:00',
    HABIT_FREQUENCY: 'daily',
  },
  TIMEOUTS: {
    API_REQUEST: 8000,
    APP_PERSISTENCE: 5000,
  },
  INTERVALS: {
    SYNC_HABITS: 15 * 60 * 1000,
  },
  UI_CONFIG: {
    SMALL_ICON_SIZE: 16,
    CARD_BORDER_RADIUS: 8,
    MEDIUM_PADDING: 16,
    VERY_SMALL_PADDING: 4,
    MEDIUM_BORDER: 2,
    LARGE_FONT_SIZE: 18,
    VERY_SMALL_FONT_SIZE: 12,
    SMALL_PADDING: 8,
    DISABLED_OPACITY: 0.5,
    CHECKBOX_SIZE: 24,
    HABIT_ITEM_MIN_HEIGHT: 80,
    MEDIUM_ELEVATION: 4,
    VERY_SMALL_MARGIN: 4,
    THIN_BORDER: 1,
    INPUT_PADDING: 12,
    BUTTON_BORDER_RADIUS: 8,
    SMALL_ELEVATION: 2,
    LARGE_TITLE_FONT_SIZE: 28,
  },
}));

// Mock theme
jest.mock('../src/theme', () => ({
  lightTheme: {
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      notification: '#FF3B30',
      white: '#FFFFFF',
      transparent: 'transparent',
      buttonPrimary: '#007AFF',
      buttonSecondary: '#FFFFFF',
      buttonDanger: '#FF3B30',
      buttonText: '#FFFFFF',
      buttonTextSecondary: '#007AFF',
      disabled: '#8E8E93',
      error: '#FF3B30',
      habitCheckbox: '#34C759',
    },
  },
  darkTheme: {
    colors: {
      primary: '#0A84FF',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      border: '#38383A',
      notification: '#FF453A',
      white: '#FFFFFF',
      transparent: 'transparent',
      buttonPrimary: '#0A84FF',
      buttonSecondary: '#1C1C1E',
      buttonDanger: '#FF453A',
      buttonText: '#FFFFFF',
      buttonTextSecondary: '#0A84FF',
      disabled: '#8E8E93',
      error: '#FF453A',
      habitCheckbox: '#32D74B',
    },
  },
  createShadowStyle: () => ({}),
}));

// Mock utils with actual scaling logic for better testing
jest.mock('../src/utils/dimensions', () => {
  const guidelineBaseWidth = 350;
  const guidelineBaseHeight = 680;
  const mockWidth = 375;
  const mockHeight = 812;
  
  return {
    scale: (size) => (mockWidth / guidelineBaseWidth) * size,
    verticalScale: (size) => (mockHeight / guidelineBaseHeight) * size,
    moderateScale: (size, factor = 0.5) => {
      const scaled = (mockWidth / guidelineBaseWidth) * size;
      return size + (scaled - size) * factor;
    },
    screenWidth: mockWidth,
    screenHeight: mockHeight,
    isIOS: true,
    isAndroid: false,
    getStatusBarHeight: () => 44,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  };
});

// Setup global console mocking
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}; 