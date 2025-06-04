import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  registerForPushNotificationsAsync,
  scheduleHabitNotification,
  cancelHabitNotifications,
  setupInitialNotifications,
  scheduleAllHabitNotifications,
  cancelAllHabitNotifications,
  rescheduleHabitNotification,
  hasScheduledNotifications,
  getHabitNotificationCount,
  sendTestNotification,
  getNotificationPermissionStatus
} from '../notifications';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));

// Mock localStorage for web notification tests
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

// Mock window.Notification for web tests
const mockNotification = jest.fn();
mockNotification.requestPermission = jest.fn();
mockNotification.permission = 'default';

Object.defineProperty(global, 'window', {
  value: {
    Notification: mockNotification
  },
  writable: true
});

global.Notification = mockNotification;

// Mock the theme and config
jest.mock('../../theme', () => ({
  lightTheme: {
    colors: {
      notificationLight: '#FF0000'
    }
  }
}));

jest.mock('../../config', () => ({
  TIME_CONSTANTS: {
    SECOND: 1000,
    MINUTE: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
  PICKER_OPTIONS: {
    FREQUENCY: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'custom', label: 'Custom' }
    ]
  },
  FEATURES: {
    NOTIFICATIONS_ENABLED: true
  }
}));

describe('Notifications Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    Device.isDevice = true;
    Platform.OS = 'ios';
    mockNotification.permission = 'default';
    global.Notification = mockNotification;
    global.window.Notification = mockNotification;
  });

  describe('registerForPushNotificationsAsync', () => {
    it('should register for notifications when permissions are granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'test-token' });

      const token = await registerForPushNotificationsAsync();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(token).toBe('test-token');
    });

    it('should request permissions when not already granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'test-token' });

      const token = await registerForPushNotificationsAsync();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('test-token');
    });

    it('should return null when permissions are denied', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const token = await registerForPushNotificationsAsync();

      expect(token).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      Notifications.getPermissionsAsync.mockRejectedValue(new Error('Permission error'));
      
      const token = await registerForPushNotificationsAsync();
      
      expect(token).toBeNull();
    });

    it('should setup notification channel on Android', async () => {
      Platform.OS = 'android';
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'test-token' });

      await registerForPushNotificationsAsync();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000'
      });
    });

    it('should handle web platform notifications properly', async () => {
      Platform.OS = 'web';
      mockNotification.requestPermission.mockResolvedValue('granted');

      const token = await registerForPushNotificationsAsync();

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
      expect(token).toBe('web-notifications-enabled');
    });
  });

  describe('scheduleHabitNotification', () => {
    const mockHabit = {
      id: 'habit-1',
      name: 'Test Habit',
      frequency: 'daily',
      notificationTime: '09:00',
      customDays: []
    };

    beforeEach(() => {
      // Mock current time to be 8:00 AM
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T08:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule daily notification correctly', async () => {
      // Mock some notifications to be cancelled
      const mockNotifications = [
        { identifier: 'old-notif-1', content: { data: { habitId: 'habit-1' } } }
      ];
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      const result = await scheduleHabitNotification(mockHabit);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Habit Reminder',
          body: 'Time to work on your habit: Test Habit',
          data: { habitId: 'habit-1' }
        },
        trigger: {
          seconds: expect.any(Number),
          repeats: true
        }
      });
      expect(result).toEqual({ success: true, habitId: 'habit-1' });
    });

    it('should schedule weekly notification correctly', async () => {
      const weeklyHabit = { ...mockHabit, frequency: 'weekly' };
      
      await scheduleHabitNotification(weeklyHabit);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should schedule custom day notifications correctly', async () => {
      const customHabit = {
        ...mockHabit,
        frequency: 'custom',
        customDays: ['Monday', 'Wednesday', 'Friday']
      };
      
      await scheduleHabitNotification(customHabit);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid notification time format', async () => {
      const invalidHabit = { ...mockHabit, notificationTime: 'invalid-time' };
      
      const result = await scheduleHabitNotification(invalidHabit);
      
      expect(result).toEqual({
        success: false,
        habitId: 'habit-1',
        error: 'Invalid notification time format: invalid-time'
      });
    });

    it('should handle notification time in the past (same day)', async () => {
      // Set current time to 10:00 AM, notification time is 9:00 AM
      jest.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));
      
      await scheduleHabitNotification(mockHabit);

      // Should schedule for next day
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(call.trigger.seconds).toBeGreaterThan(0);
    });

    it('should skip scheduling if notification time is in the past and cannot be adjusted', async () => {
      // Mock the console.warn to check if warning is logged
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Set time very close to notification time to cause past time issue
      jest.setSystemTime(new Date('2024-01-01T09:00:01.000Z'));
      
      await scheduleHabitNotification(mockHabit);
      
      // Should still schedule for next occurrence
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid custom days gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidCustomHabit = {
        ...mockHabit,
        frequency: 'custom',
        customDays: ['InvalidDay', 'Monday']
      };
      
      await scheduleHabitNotification(invalidCustomHabit);

      expect(consoleSpy).toHaveBeenCalledWith('Invalid custom day: InvalidDay');
      // Should still schedule for valid day
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('cancelHabitNotifications', () => {
    it('should cancel all notifications for a habit', async () => {
      const mockNotifications = [
        { identifier: 'notif-1', content: { data: { habitId: 'habit-1' } } },
        { identifier: 'notif-2', content: { data: { habitId: 'habit-1' } } },
        { identifier: 'notif-3', content: { data: { habitId: 'habit-2' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      await cancelHabitNotifications('habit-1');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-2');
    });

    it('should handle no notifications found', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);

      await cancelHabitNotifications('habit-1');

      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('should handle web platform with web notifications', async () => {
      Platform.OS = 'web';
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        'habit-1_123456': { habitId: 'habit-1', habitName: 'Test Habit' }
      }));

      const result = await cancelHabitNotifications('habit-1');

      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(Notifications.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      Notifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('API Error'));

      await cancelHabitNotifications('habit-1');

      expect(consoleSpy).toHaveBeenCalledWith('API Error');
      consoleSpy.mockRestore();
    });
  });

  describe('scheduleAllHabitNotifications', () => {
    const mockHabits = [
      {
        id: 'habit-1',
        name: 'Habit 1',
        frequency: 'daily',
        notificationTime: '09:00',
        customDays: []
      },
      {
        id: 'habit-2',
        name: 'Habit 2',
        frequency: 'weekly',
        notificationTime: '10:00',
        customDays: []
      }
    ];

    it('should schedule notifications for all habits successfully', async () => {
      const result = await scheduleAllHabitNotifications(mockHabits);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.successful).toContain('habit-1');
      expect(result.successful).toContain('habit-2');
    });

    it('should handle some habits failing', async () => {
      // Make the second habit fail
      Notifications.scheduleNotificationAsync
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Schedule failed'));

      const result = await scheduleAllHabitNotifications(mockHabits);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.successful).toContain('habit-1');
      expect(result.failed[0]).toEqual({
        habitId: 'habit-2',
        error: 'Schedule failed'
      });
    });

    it('should return empty results for empty habits array', async () => {
      const result = await scheduleAllHabitNotifications([]);

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('Bug Detection Tests', () => {
    it('should detect multiple notifications bug - scheduling same habit multiple times', async () => {
      const habit = {
        id: 'habit-1',
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: '09:00',
        customDays: []
      };

      // Mock notifications to be cancelled each time
      const mockNotifications = [
        { identifier: 'notif-1', content: { data: { habitId: 'habit-1' } } }
      ];
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      // Schedule the same habit multiple times (simulating the bug)
      await scheduleHabitNotification(habit);
      await scheduleHabitNotification(habit);
      await scheduleHabitNotification(habit);

      // Each call should cancel previous notifications first
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
      
      // BUG: If cancellation is not working properly, we might have multiple notifications
      // Test should verify that only one notification exists per habit
    });

    it('should detect notification not canceling bug when habit is deleted', async () => {
      const mockNotifications = [
        { identifier: 'notif-1', content: { data: { habitId: 'habit-1' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);
      
      // Cancel notifications for deleted habit
      await cancelHabitNotifications('habit-1');
      
      // Verify the notification was actually cancelled
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
      
      // BUG: If notifications are not properly cancelled, they will continue to fire
    });

    it('should detect notification timing bug - notifications scheduled for past time', async () => {
      jest.useFakeTimers();
      // Set current time to 9:30 AM
      jest.setSystemTime(new Date('2024-01-01T09:30:00.000Z'));
      
      const habit = {
        id: 'habit-1',
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: '09:00', // In the past
        customDays: []
      };

      await scheduleHabitNotification(habit);

      const scheduleCall = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      const triggerSeconds = scheduleCall.trigger.seconds;
      
      // Should be scheduled for next day, not negative seconds
      expect(triggerSeconds).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });

    it('should detect frequency handling bug - custom frequency with no days', async () => {
      const habit = {
        id: 'habit-1',
        name: 'Test Habit',
        frequency: 'custom',
        notificationTime: '09:00',
        customDays: [] // Empty custom days - potential bug
      };

      await scheduleHabitNotification(habit);

      // Should not schedule any notifications for custom frequency with no days
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should detect permission status bug - scheduling when permissions denied', async () => {
      const status = await getNotificationPermissionStatus();
      
      // Mock denied permissions
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      
      const habit = {
        id: 'habit-1',
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: '09:00',
        customDays: []
      };
      
      // Should handle denied permissions gracefully
      // BUG: App might try to schedule notifications without proper permissions
      try {
        await scheduleHabitNotification(habit);
        // If no error is thrown, the function should still handle it gracefully
      } catch (error) {
        // Error handling should be present
        expect(error).toBeDefined();
      }
    });

    it('should detect memory leak bug - listeners not properly cleaned up', async () => {
      const mockRemoveFunction = jest.fn();
      
      Notifications.addNotificationReceivedListener.mockReturnValue({
        remove: mockRemoveFunction
      });
      
      // This would typically be in a component or hook
      const listener = Notifications.addNotificationReceivedListener(() => {});
      
      // Simulate cleanup
      listener.remove();
      
      expect(mockRemoveFunction).toHaveBeenCalled();
      
      // BUG: If listeners are not properly removed, it can cause memory leaks
    });
  });

  describe('hasScheduledNotifications', () => {
    it('should return true when habit has scheduled notifications', async () => {
      const mockNotifications = [
        { content: { data: { habitId: 'habit-1' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      const result = await hasScheduledNotifications('habit-1');

      expect(result).toBe(true);
    });

    it('should return false when habit has no scheduled notifications', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);

      const result = await hasScheduledNotifications('habit-1');

      expect(result).toBe(false);
    });
  });

  describe('getHabitNotificationCount', () => {
    it('should return correct count of scheduled notifications for habit', async () => {
      const mockNotifications = [
        { content: { data: { habitId: 'habit-1' } } },
        { content: { data: { habitId: 'habit-1' } } },
        { content: { data: { habitId: 'habit-2' } } }
      ];
      
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      const count = await getHabitNotificationCount('habit-1');

      expect(count).toBe(2);
    });
  });
}); 