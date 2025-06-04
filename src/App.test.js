import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import habitsReducer, {
  addHabit,
  toggleHabitCompletion,
  deleteHabit,
  updateHabit,
  resetHabits,
  fetchHabitsFromServer
} from './redux/habitsSlice';
import { ThemeProvider } from './context/ThemeContext';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(() => {}),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-token' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: {
    MAX: 5,
  },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      habits: habitsReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const renderWithProviders = (component, { initialState = {}, store = createTestStore(initialState) } = {}) => {
  const TestWrapper = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
  return render(component, { wrapper: TestWrapper });
};

const mockHabit = {
  id: '1',
  name: 'Test Habit',
  frequency: 'daily',
  customDays: [],
  notificationTime: '09:00',
  completedDates: [],
  streak: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockHabits = [
  mockHabit,
  {
    id: '2',
    name: 'Exercise',
    frequency: 'daily',
    customDays: [],
    notificationTime: '07:00',
    completedDates: ['2024-01-01'],
    streak: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('Daily Habits App - Complete Test Suite', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  // ===== REDUX STORE TESTS =====
  describe('Redux Store - Habits Management', () => {
    test('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState();
      
      expect(state.habits).toEqual({
        habits: [],
        loading: false,
        error: null,
        lastSynced: null,
        serverSyncStatus: 'idle',
      });
    });

    test('should add new habit correctly', () => {
      const store = createTestStore();
      
      act(() => {
        store.dispatch(addHabit({
          name: 'Test Habit',
          frequency: 'daily',
          notificationTime: '09:00'
        }));
      });

      const state = store.getState();
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits[0].name).toBe('Test Habit');
      expect(state.habits.habits[0].frequency).toBe('daily');
      expect(state.habits.habits[0].streak).toBe(0);
      expect(state.habits.habits[0].completedDates).toEqual([]);
    });

    test('should toggle habit completion correctly', () => {
      const initialState = {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
          lastSynced: null,
          serverSyncStatus: 'idle',
        }
      };
      const store = createTestStore(initialState);
      const testDate = '2024-01-01';

      act(() => {
        store.dispatch(toggleHabitCompletion({
          habitId: '1',
          date: testDate
        }));
      });

      let state = store.getState();
      expect(state.habits.habits[0].completedDates).toContain(testDate);
      expect(state.habits.habits[0].streak).toBe(1);

      act(() => {
        store.dispatch(toggleHabitCompletion({
          habitId: '1',
          date: testDate
        }));
      });

      state = store.getState();
      expect(state.habits.habits[0].completedDates).not.toContain(testDate);
      expect(state.habits.habits[0].streak).toBe(0);
    });

    test('should delete habit correctly', () => {
      const initialState = {
        habits: {
          habits: mockHabits,
          loading: false,
          error: null,
          lastSynced: null,
          serverSyncStatus: 'idle',
        }
      };
      const store = createTestStore(initialState);

      act(() => {
        store.dispatch(deleteHabit('1'));
      });

      const state = store.getState();
      expect(state.habits.habits).toHaveLength(1);
      expect(state.habits.habits.find(h => h.id === '1')).toBeUndefined();
    });

    test('should update habit correctly', () => {
      const initialState = {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
          lastSynced: null,
          serverSyncStatus: 'idle',
        }
      };
      const store = createTestStore(initialState);

      act(() => {
        store.dispatch(updateHabit({
          id: '1',
          name: 'Updated Habit Name',
          notificationTime: '10:00'
        }));
      });

      const state = store.getState();
      const updatedHabit = state.habits.habits.find(h => h.id === '1');
      expect(updatedHabit.name).toBe('Updated Habit Name');
      expect(updatedHabit.notificationTime).toBe('10:00');
    });

    test('should reset habits correctly', () => {
      const initialState = {
        habits: {
          habits: mockHabits,
          loading: false,
          error: null,
          lastSynced: null,
          serverSyncStatus: 'idle',
        }
      };
      const store = createTestStore(initialState);

      act(() => {
        store.dispatch(resetHabits());
      });

      const state = store.getState();
      expect(state.habits.habits).toEqual([]);
      expect(state.habits.loading).toBe(false);
      expect(state.habits.error).toBe(null);
    });
  });

  // ===== BUSINESS LOGIC TESTS =====
  describe('Business Logic', () => {
    test('should calculate streak correctly', () => {
      const store = createTestStore();
      const habitData = {
        name: 'Streak Test',
        frequency: 'daily',
        notificationTime: '09:00'
      };

      act(() => {
        store.dispatch(addHabit(habitData));
      });

      const habitId = store.getState().habits.habits[0].id;

      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
      dates.forEach(date => {
        act(() => {
          store.dispatch(toggleHabitCompletion({ habitId, date }));
        });
      });

      const finalState = store.getState();
      const habit = finalState.habits.habits[0];
      expect(habit.streak).toBe(3);
      expect(habit.completedDates).toEqual(dates);
    });

    test('should handle different frequency types', () => {
      const store = createTestStore();

      act(() => {
        store.dispatch(addHabit({
          name: 'Daily Habit',
          frequency: 'daily'
        }));
      });

      act(() => {
        store.dispatch(addHabit({
          name: 'Weekly Habit',
          frequency: 'weekly'
        }));
      });

      act(() => {
        store.dispatch(addHabit({
          name: 'Custom Habit',
          frequency: 'custom',
          customDays: ['monday', 'wednesday', 'friday']
        }));
      });

      const state = store.getState();
      expect(state.habits.habits).toHaveLength(3);
      expect(state.habits.habits[0].frequency).toBe('daily');
      expect(state.habits.habits[1].frequency).toBe('weekly');
      expect(state.habits.habits[2].frequency).toBe('custom');
      expect(state.habits.habits[2].customDays).toEqual(['monday', 'wednesday', 'friday']);
    });

    test('should validate habit data integrity', () => {
      const store = createTestStore();

      act(() => {
        store.dispatch(addHabit({
          name: 'Minimal Habit'
        }));
      });

      const state = store.getState();
      const habit = state.habits.habits[0];
      
      expect(habit.name).toBe('Minimal Habit');
      expect(habit.frequency).toBeDefined();
      expect(habit.completedDates).toEqual([]);
      expect(habit.streak).toBe(0);
      expect(habit.createdAt).toBeDefined();
      expect(habit.id).toBeDefined();
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    test('should complete and uncomplete habit', async () => {
      const initialState = {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
          lastSynced: null,
          serverSyncStatus: 'idle',
        }
      };
      const store = createTestStore(initialState);
      const today = new Date().toISOString().split('T')[0];

      act(() => {
        store.dispatch(toggleHabitCompletion({
          habitId: '1',
          date: today
        }));
      });

      let state = store.getState();
      expect(state.habits.habits[0].completedDates).toContain(today);
      expect(state.habits.habits[0].streak).toBe(1);

      act(() => {
        store.dispatch(toggleHabitCompletion({
          habitId: '1',
          date: today
        }));
      });

      state = store.getState();
      expect(state.habits.habits[0].completedDates).not.toContain(today);
      expect(state.habits.habits[0].streak).toBe(0);
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    test('should handle invalid habit operations', () => {
      const store = createTestStore();

      act(() => {
        store.dispatch(toggleHabitCompletion({
          habitId: 'non-existent',
          date: '2024-01-01'
        }));
      });

      const state = store.getState();
      expect(state.habits.habits).toEqual([]);
    });

    test('should handle updating non-existent habit', () => {
      const store = createTestStore();

      act(() => {
        store.dispatch(updateHabit({
          id: 'non-existent',
          name: 'Updated Name'
        }));
      });

      const state = store.getState();
      expect(state.habits.habits).toEqual([]);
    });

    test('should handle deleting non-existent habit', () => {
      const store = createTestStore();

      act(() => {
        store.dispatch(deleteHabit('non-existent'));
      });

      const state = store.getState();
      expect(state.habits.habits).toEqual([]);
    });
  });

  // ===== PERSISTENCE TESTS =====
  describe('Persistence', () => {
    test('should handle AsyncStorage operations', async () => {
      const testData = JSON.stringify({ habits: mockHabits });
      
      AsyncStorage.setItem.mockResolvedValueOnce();
      AsyncStorage.getItem.mockResolvedValueOnce(testData);

      await AsyncStorage.setItem('test-key', testData);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', testData);

      const retrievedData = await AsyncStorage.getItem('test-key');
      expect(retrievedData).toBe(testData);
    });
  });
}); 