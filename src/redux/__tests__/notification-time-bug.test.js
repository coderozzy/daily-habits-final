import { configureStore } from '@reduxjs/toolkit';
import habitsReducer, { addHabit, addHabitWithNotifications } from '../habitsSlice';
import { DEFAULTS } from '../../config';

// Mock the notification utilities to avoid platform-specific issues
jest.mock('../../utils/notifications', () => ({
  scheduleHabitNotification: jest.fn(() => Promise.resolve({ success: true })),
  cancelHabitNotifications: jest.fn(() => Promise.resolve({ success: true })),
  rescheduleHabitNotification: jest.fn(() => Promise.resolve({ success: true })),
  cancelAllHabitNotifications: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('Notification Time Bug Fix', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        habits: habitsReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });
  });

  describe('addHabit reducer', () => {
    it('should handle undefined notification time correctly', () => {
      const habitWithUndefinedTime = {
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: undefined
      };

      store.dispatch(addHabit(habitWithUndefinedTime));
      const state = store.getState();
      
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].notificationTime).toBe(DEFAULTS.NOTIFICATION_TIME);
      expect(state.habits.habits[0].notificationTime).toBe('09:00');
      expect(state.habits.habits[0].notificationTime).not.toBeUndefined();
    });

    it('should handle null notification time correctly', () => {
      const habitWithNullTime = {
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: null
      };

      store.dispatch(addHabit(habitWithNullTime));
      const state = store.getState();
      
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].notificationTime).toBe(DEFAULTS.NOTIFICATION_TIME);
      expect(state.habits.habits[0].notificationTime).toBe('09:00');
      expect(state.habits.habits[0].notificationTime).not.toBeNull();
    });

    it('should handle empty string notification time correctly', () => {
      const habitWithEmptyTime = {
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: ''
      };

      store.dispatch(addHabit(habitWithEmptyTime));
      const state = store.getState();
      
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].notificationTime).toBe(DEFAULTS.NOTIFICATION_TIME);
      expect(state.habits.habits[0].notificationTime).toBe('09:00');
    });

    it('should preserve valid notification time', () => {
      const habitWithValidTime = {
        name: 'Test Habit',
        frequency: 'daily',
        notificationTime: '15:30'
      };

      store.dispatch(addHabit(habitWithValidTime));
      const state = store.getState();
      
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].notificationTime).toBe('15:30');
    });
  });

  describe('addHabitWithNotifications async thunk', () => {
    it('should handle undefined notification time in async thunk', async () => {
      const habitDataWithUndefinedTime = {
        name: 'Test Async Habit',
        frequency: 'daily',
        notificationTime: undefined
      };

      const result = await store.dispatch(addHabitWithNotifications(habitDataWithUndefinedTime));
      
      expect(result.type).toBe('habits/addWithNotifications/fulfilled');
      expect(result.payload.notificationTime).toBe(DEFAULTS.NOTIFICATION_TIME);
      expect(result.payload.notificationTime).toBe('09:00');
      expect(result.payload.notificationTime).not.toBeUndefined();

      const state = store.getState();
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].notificationTime).toBe('09:00');
    });

    it('should handle missing notification time in async thunk', async () => {
      const habitDataWithoutTime = {
        name: 'Test Async Habit No Time',
        frequency: 'daily'
        // notificationTime is completely missing
      };

      const result = await store.dispatch(addHabitWithNotifications(habitDataWithoutTime));
      
      expect(result.type).toBe('habits/addWithNotifications/fulfilled');
      expect(result.payload.notificationTime).toBe(DEFAULTS.NOTIFICATION_TIME);
      expect(result.payload.notificationTime).toBe('09:00');
      expect(result.payload.notificationTime).not.toBeUndefined();
    });
  });
}); 