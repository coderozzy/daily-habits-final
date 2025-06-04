import { Platform } from 'react-native';
import {
  requestWebNotificationPermission,
  getWebNotificationPermissionStatus,
  showWebNotification,
  scheduleWebNotification,
  cancelWebNotifications,
  cancelAllWebNotifications,
  getScheduledWebNotifications,
  initializeWebNotifications
} from '../webNotifications';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

const mockNotification = jest.fn();
mockNotification.requestPermission = jest.fn();
mockNotification.permission = 'default';

// Mock global Notification
global.Notification = mockNotification;

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    Notification: mockNotification
  },
  writable: true
});

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('webNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    Platform.OS = 'web';
    global.Notification = mockNotification;
    global.window.Notification = mockNotification;
  });

  describe('requestWebNotificationPermission', () => {
    it('should request permission and return granted', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const result = await requestWebNotificationPermission();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('should return denied when permission is denied', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');
      
      const result = await requestWebNotificationPermission();
      
      expect(result).toBe('denied');
    });

    it('should return null when not on web platform', async () => {
      Platform.OS = 'ios';
      
      const result = await requestWebNotificationPermission();
      
      expect(result).toBeNull();
    });

    it('should return null when Notification not available', async () => {
      delete global.window.Notification;
      
      const result = await requestWebNotificationPermission();
      
      expect(result).toBeNull();
    });
  });

  describe('getWebNotificationPermissionStatus', () => {
    it('should return current permission status', () => {
      mockNotification.permission = 'granted';
      
      const result = getWebNotificationPermissionStatus();
      
      expect(result).toBe('granted');
    });

    it('should return denied when not on web', () => {
      Platform.OS = 'ios';
      
      const result = getWebNotificationPermissionStatus();
      
      expect(result).toBe('denied');
    });

    it('should return denied when Notification not available', () => {
      delete global.window.Notification;
      
      const result = getWebNotificationPermissionStatus();
      
      expect(result).toBe('denied');
    });
  });

  describe('showWebNotification', () => {
    it('should create and show notification when permission granted', () => {
      mockNotification.permission = 'granted';
      const mockNotificationInstance = {
        close: jest.fn()
      };
      mockNotification.mockReturnValue(mockNotificationInstance);
      
      const result = showWebNotification('Test Title', 'Test Body', { test: true });
      
      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/assets/icon.png',
        badge: '/assets/icon.png',
        data: { test: true },
        requireInteraction: true,
        silent: false,
      });
      expect(result).toBe(mockNotificationInstance);
    });

    it('should return null when permission not granted', () => {
      mockNotification.permission = 'denied';
      
      const result = showWebNotification('Test Title', 'Test Body');
      
      expect(mockNotification).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when not on web platform', () => {
      Platform.OS = 'ios';
      
      const result = showWebNotification('Test Title', 'Test Body');
      
      expect(result).toBeNull();
    });
  });

  describe('scheduleWebNotification', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule notification for future time', () => {
      const futureTime = new Date(Date.now() + 60000);
      localStorageMock.getItem.mockReturnValue('{}');
      
      const result = scheduleWebNotification('habit1', 'Test Habit', futureTime);
      
      expect(result).toHaveProperty('notificationId');
      expect(result).toHaveProperty('timeoutId');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should return null for past time', () => {
      const pastTime = new Date(Date.now() - 60000);
      
      const result = scheduleWebNotification('habit1', 'Test Habit', pastTime);
      
      expect(result).toBeNull();
    });

    it('should return null when not on web platform', () => {
      Platform.OS = 'ios';
      const futureTime = new Date(Date.now() + 60000);
      
      const result = scheduleWebNotification('habit1', 'Test Habit', futureTime);
      
      expect(result).toBeNull();
    });
  });

  describe('cancelWebNotifications', () => {
    it('should cancel notifications for specific habit', () => {
      const mockScheduled = {
        'habit1_123': { habitId: 'habit1', habitName: 'Test 1' },
        'habit2_456': { habitId: 'habit2', habitName: 'Test 2' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockScheduled));
      
      const result = cancelWebNotifications('habit1');
      
      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should return success when not on web platform', () => {
      Platform.OS = 'ios';
      
      const result = cancelWebNotifications('habit1');
      
      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(0);
    });
  });

  describe('cancelAllWebNotifications', () => {
    it('should cancel all notifications', () => {
      const mockScheduled = {
        'habit1_123': { habitId: 'habit1', habitName: 'Test 1' },
        'habit2_456': { habitId: 'habit2', habitName: 'Test 2' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockScheduled));
      
      const result = cancelAllWebNotifications();
      
      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(2);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should return success when not on web platform', () => {
      Platform.OS = 'ios';
      
      const result = cancelAllWebNotifications();
      
      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(0);
    });
  });

  describe('getScheduledWebNotifications', () => {
    it('should return scheduled notifications for habit', () => {
      const mockScheduled = {
        'habit1_123': { habitId: 'habit1', habitName: 'Test 1' },
        'habit2_456': { habitId: 'habit2', habitName: 'Test 2' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockScheduled));
      
      const result = getScheduledWebNotifications('habit1');
      
      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe('habit1');
    });

    it('should return all notifications when no habitId provided', () => {
      const mockScheduled = {
        'habit1_123': { habitId: 'habit1', habitName: 'Test 1' },
        'habit2_456': { habitId: 'habit2', habitName: 'Test 2' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockScheduled));
      
      const result = getScheduledWebNotifications();
      
      expect(result).toHaveLength(2);
    });

    it('should return empty array when not on web platform', () => {
      Platform.OS = 'ios';
      
      const result = getScheduledWebNotifications('habit1');
      
      expect(result).toEqual([]);
    });
  });

  describe('initializeWebNotifications', () => {
    it('should not error when called on web platform', () => {
      expect(() => initializeWebNotifications()).not.toThrow();
    });

    it('should return early when not on web platform', () => {
      Platform.OS = 'ios';
      
      expect(() => initializeWebNotifications()).not.toThrow();
    });
  });
}); 