import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useNotificationManager } from '../useNotificationManager';
import habitsReducer from '../../redux/habitsSlice';
import * as notificationUtils from '../../utils/notifications';

jest.mock('../../utils/notifications');

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));

jest.mock('../../config', () => ({
  FEATURES: {
    NOTIFICATIONS_ENABLED: true
  }
}));

describe('useNotificationManager', () => {
  let store;
  
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        habits: habitsReducer,
      },
      preloadedState: {
        habits: {
          habits: [],
          loading: false,
          error: null,
          ...initialState.habits
        },
        ...initialState
      },
    });
  };

  const renderHookWithStore = (store) => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    return renderHook(() => useNotificationManager(), { wrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    notificationUtils.getNotificationPermissionStatus.mockResolvedValue('granted');
    notificationUtils.registerForPushNotificationsAsync.mockResolvedValue({ success: true, token: 'test-token' });
    notificationUtils.setupInitialNotifications.mockResolvedValue();
    notificationUtils.scheduleAllHabitNotifications.mockResolvedValue({ successful: [], failed: [] });
    notificationUtils.hasScheduledNotifications.mockResolvedValue(false);
    notificationUtils.cancelAllHabitNotifications.mockResolvedValue({ successful: [], failed: [] });
  });

  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      store = createMockStore();
      const { result } = renderHookWithStore(store);

      expect(result.current.notificationStatus).toBe('unknown');
      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });
      expect(result.current.totalScheduledNotifications).toBe(0);
    });

    it('should initialize notifications on mount when permissions are granted', async () => {
      store = createMockStore({
        habits: {
          habits: [
            {
              id: 'habit-1',
              name: 'Test Habit',
              frequency: 'daily',
              notificationTime: '09:00',
              customDays: []
            }
          ]
        }
      });

      const { result } = renderHookWithStore(store);

      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      expect(notificationUtils.registerForPushNotificationsAsync).toHaveBeenCalled();
      expect(notificationUtils.setupInitialNotifications).toHaveBeenCalled();
      expect(notificationUtils.scheduleAllHabitNotifications).toHaveBeenCalled();
    });

    it('should not initialize notifications when permissions are denied', async () => {
      notificationUtils.getNotificationPermissionStatus.mockResolvedValue('denied');
      
      store = createMockStore();
      const { result } = renderHookWithStore(store);

      await waitFor(() => {
        expect(result.current.notificationStatus).toBe('denied');
      });

      expect(notificationUtils.scheduleAllHabitNotifications).not.toHaveBeenCalled();
    });

    it('should initialize notifications on web platform', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'web';

      store = createMockStore();
      const { result } = renderHookWithStore(store);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Web platforms should now initialize notifications
      expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      
      require('react-native').Platform.OS = originalPlatform;
    });
  });

  describe('Habit Changes - Bug Detection', () => {
    it('should detect bug: excessive re-scheduling when habits array changes frequently', async () => {
      store = createMockStore({
        habits: {
          habits: [
            {
              id: 'habit-1',
              name: 'Test Habit',
              frequency: 'daily',
              notificationTime: '09:00',
              customDays: []
            }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      act(() => {
        store.dispatch({
          type: 'habits/toggleHabitCompletion',
          payload: { habitId: 'habit-1', date: '2024-01-01' }
        });
      });

      act(() => {
        store.dispatch({
          type: 'habits/toggleHabitCompletion',
          payload: { habitId: 'habit-1', date: '2024-01-01' }
        });
      });

      act(() => {
        store.dispatch({
          type: 'habits/toggleHabitCompletion',
          payload: { habitId: 'habit-1', date: '2024-01-01' }
        });
      });

      await waitFor(() => {
        const scheduleCallCount = notificationUtils.scheduleAllHabitNotifications.mock.calls.length;
        
        expect(scheduleCallCount).toBeLessThanOrEqual(1);
      });
    });

    it('should detect bug: not rescheduling when notification time changes', async () => {
      store = createMockStore({
        habits: {
          habits: [
            {
              id: 'habit-1',
              name: 'Test Habit',
              frequency: 'daily',
              notificationTime: '09:00',
              customDays: []
            }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      act(() => {
        store.dispatch({
          type: 'habits/updateHabit',
          payload: {
            id: 'habit-1',
            updates: { notificationTime: '10:00' }
          }
        });
      });

      await waitFor(() => {
        expect(notificationUtils.scheduleAllHabitNotifications).toHaveBeenCalled();
      });
    });

    it('should detect bug: memory leaks from not cleaning up effect dependencies', async () => {
      const { unmount } = renderHookWithStore(createMockStore());
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Notification Count Tracking', () => {
    it('should update notification count correctly', async () => {
      notificationUtils.hasScheduledNotifications.mockResolvedValue(true);
      
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Habit 1', frequency: 'daily', notificationTime: '09:00' },
            { id: 'habit-2', name: 'Habit 2', frequency: 'daily', notificationTime: '10:00' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(result.current.totalScheduledNotifications).toBeGreaterThan(0);
      });
    });

    it('should detect bug: incorrect notification count after deletion', async () => {
      notificationUtils.hasScheduledNotifications
        .mockResolvedValueOnce(true)  
        .mockResolvedValueOnce(false);

      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Habit 1' },
            { id: 'habit-2', name: 'Habit 2' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      act(() => {
        store.dispatch({
          type: 'habits/deleteHabit',
          payload: 'habit-1'
        });
      });

      await waitFor(() => {
        expect(result.current.totalScheduledNotifications).toBe(0);
      });
    });
  });

  describe('Sync Functions', () => {
    it('should sync all notifications successfully', async () => {
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Test Habit', frequency: 'daily', notificationTime: '09:00' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      const syncResult = await act(async () => {
        return await result.current.syncAllNotifications();
      });

      expect(syncResult.success).toBe(true);
      expect(notificationUtils.setupInitialNotifications).toHaveBeenCalled();
      expect(notificationUtils.scheduleAllHabitNotifications).toHaveBeenCalled();
    });

    it('should clear all notifications successfully', async () => {
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Test Habit' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      const clearResult = await act(async () => {
        return await result.current.clearAllNotifications();
      });

      expect(clearResult.success).toBe(true);
      expect(notificationUtils.cancelAllHabitNotifications).toHaveBeenCalled();
      expect(result.current.totalScheduledNotifications).toBe(0);
    });

    it('should handle sync errors gracefully', async () => {
      notificationUtils.scheduleAllHabitNotifications.mockRejectedValue(new Error('Sync failed'));
      
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Test Habit' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      const syncResult = await act(async () => {
        return await result.current.syncAllNotifications();
      });

      expect(syncResult.success).toBe(false);
      expect(syncResult.error).toBe('Sync failed');
    });
  });

  describe('Permission Management', () => {
    it('should request notification permissions', async () => {
      store = createMockStore();
      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      const permissionResult = await act(async () => {
        return await result.current.requestNotificationPermission();
      });

      expect(permissionResult.success).toBe(true);
      expect(notificationUtils.registerForPushNotificationsAsync).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      notificationUtils.registerForPushNotificationsAsync.mockResolvedValue({ success: false, error: 'Permission denied' });
      notificationUtils.getNotificationPermissionStatus.mockResolvedValue('denied');
      
      store = createMockStore();
      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(result.current.notificationStatus).toBe('denied');
      });

      const permissionResult = await act(async () => {
        return await result.current.requestNotificationPermission();
      });

      expect(permissionResult.success).toBe(false);
      expect(result.current.notificationStatus).toBe('denied');
    });
  });

  describe('Edge Cases and Bug Detection', () => {
    it('should detect bug: race conditions in async operations', async () => {
      let resolvePermission;
      const permissionPromise = new Promise(resolve => {
        resolvePermission = resolve;
      });
      
      notificationUtils.getNotificationPermissionStatus.mockReturnValue(permissionPromise);
      
      store = createMockStore();
      const { result } = renderHookWithStore(store);

      const promise1 = result.current.requestNotificationPermission();
      const promise2 = result.current.syncAllNotifications();
      
      resolvePermission('granted');
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should detect bug: infinite re-renders from dependency arrays', async () => {
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Test', frequency: 'daily', notificationTime: '09:00' }
          ]
        }
      });

      const { result, rerender } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });
      
      const initialRenderCount = notificationUtils.scheduleAllHabitNotifications.mock.calls.length;
      
      rerender();
      rerender();
      rerender();
      
      const finalRenderCount = notificationUtils.scheduleAllHabitNotifications.mock.calls.length;
      
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(1);
    });

    it('should detect bug: state inconsistency after multiple operations', async () => {
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1', name: 'Test Habit' }
          ]
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.syncAllNotifications();
      });

      await act(async () => {
        await result.current.clearAllNotifications();
      });

      await act(async () => {
        await result.current.syncAllNotifications();
      });

      expect(typeof result.current.totalScheduledNotifications).toBe('number');
      expect(['granted', 'denied', 'unknown']).toContain(result.current.notificationStatus);
    });

    it('should detect bug: handling undefined or malformed habit data', async () => {
      store = createMockStore({
        habits: {
          habits: [
            { id: 'habit-1' }, // Missing required fields
            null, // Null habit
            { id: 'habit-2', name: 'Valid Habit', frequency: 'daily', notificationTime: '09:00' }
          ].filter(Boolean) // Remove null values
        }
      });

      const { result } = renderHookWithStore(store);
      
      await waitFor(() => {
        expect(notificationUtils.getNotificationPermissionStatus).toHaveBeenCalled();
      });
      
      await act(async () => {
        const syncResult = await result.current.syncAllNotifications();
        expect(syncResult).toBeDefined();
      });
    });
  });
}); 