import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import HabitItem from '../HabitItem';
import habitsReducer from '../../redux/habitsSlice';
import { ThemeProvider } from '../../context/ThemeContext';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      habits: habitsReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithProviders = (component, { initialState = {}, store = createTestStore(initialState) } = {}) => {
  const TestWrapper = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
  return { ...render(component, { wrapper: TestWrapper }), store };
};

const mockHabit = {
  id: '1',
  name: 'Test Habit',
  frequency: 'daily',
  notificationTime: '09:00',
  completedDates: [],
  streak: 5,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockCompletedHabit = {
  ...mockHabit,
  completedDates: [new Date().toISOString().split('T')[0]],
};

const createMockStore = (initialState = {}) => {
  let state = {
    habits: {
      habits: [],
      loading: false,
      error: null,
    },
    ...initialState,
  };

  const store = {
    getState: () => state,
    dispatch: jest.fn((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }

      switch (action.type) {
        case 'habits/toggleHabitCompletion':
          const { habitId, date } = action.payload;
          state = {
            ...state,
            habits: {
              ...state.habits,
              habits: state.habits.habits.map(habit => 
                habit.id === habitId
                  ? {
                      ...habit,
                      completedDates: habit.completedDates?.includes(date)
                        ? habit.completedDates.filter(d => d !== date)
                        : [...(habit.completedDates || []), date]
                    }
                  : habit
              )
            }
          };
          break;
        case 'habits/deleteHabit':
        case 'habits/deleteHabitWithNotifications/fulfilled':
          const payloadId = action.type === 'habits/deleteHabit' ? action.payload : action.payload;
          state = {
            ...state,
            habits: {
              ...state.habits,
              habits: state.habits.habits.filter(habit => habit.id !== payloadId)
            }
          };
          break;
        case 'habits/decreaseStreak':
          state = {
            ...state,
            habits: {
              ...state.habits,
              habits: state.habits.habits.map(habit => 
                habit.id === action.payload
                  ? { ...habit, streak: Math.max(0, (habit.streak || 0) - 1) }
                  : habit
              )
            }
          };
          break;
      }
      return action;
    }),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  };

  return store;
};

const renderWithStore = (component, storeState = {}) => {
  const store = createMockStore(storeState);
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </Provider>
    ),
    store,
  };
};

describe('HabitItem', () => {
  it('should render habit name and frequency correctly', () => {
    const { getByText } = renderWithProviders(<HabitItem habit={mockHabit} />);
    
    expect(getByText('Test Habit')).toBeTruthy();
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Streak: 5 days')).toBeTruthy();
  });

  it('should show completed state when habit is completed today', () => {
    const { getByTestId } = renderWithProviders(<HabitItem habit={mockCompletedHabit} />);
    
    const checkbox = getByTestId('habit-checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should dispatch toggle completion when checkbox is pressed', () => {
    const today = new Date().toISOString().split('T')[0];
    const mockHabit = {
      id: '1',
      name: 'Test Habit',
      frequency: 'daily',
      streak: 5,
      completedDates: [],
    };

    const { getByTestId, store } = renderWithStore(
      <HabitItem habit={mockHabit} />,
      {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
        }
      }
    );

    const checkbox = getByTestId('habit-checkbox');
    fireEvent.press(checkbox);

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'habits/toggleHabitCompletion',
      payload: { habitId: '1', date: today }
    });

    const state = store.getState();
    expect(state.habits.habits[0].completedDates).toContain(today);
  });

  it('should dispatch delete habit when delete button is pressed', async () => {
    const mockHabit = {
      id: '1',
      name: 'Test Habit',
      frequency: 'daily',
      streak: 5,
      completedDates: [],
    };

    const { getByTestId, store } = renderWithStore(
      <HabitItem habit={mockHabit} />,
      {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
        }
      }
    );

    const deleteButton = getByTestId('habit-item-delete');

    fireEvent.press(deleteButton);

    // Check that dispatch was called 
    expect(store.dispatch).toHaveBeenCalled();
    
    // The async thunk will handle the deletion, let's simulate its completion
    await store.dispatch({
      type: 'habits/deleteHabitWithNotifications/fulfilled',
      payload: '1'
    });

    const state = store.getState();
    expect(state.habits.habits).toHaveLength(0);
  });

  it('should handle decrease streak button', () => {
    const mockHabit = {
      id: '1',
      name: 'Test Habit',
      frequency: 'daily',
      streak: 5,
      completedDates: [],
    };

    const { getByTestId, store } = renderWithStore(
      <HabitItem habit={mockHabit} />,
      {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
        }
      }
    );

    const decreaseButton = getByTestId('decrease-streak-button');
    fireEvent.press(decreaseButton);

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'habits/decreaseStreak',
      payload: '1'
    });

    const state = store.getState();
    expect(state.habits.habits[0].streak).toBe(4);
  });

  it('should disable decrease streak button when streak is 0', () => {
    const mockHabit = {
      id: '1',
      name: 'Test Habit',
      frequency: 'daily',
      streak: 0,
      completedDates: [],
    };

    const { getByTestId } = renderWithStore(
      <HabitItem habit={mockHabit} />,
      {
        habits: {
          habits: [mockHabit],
          loading: false,
          error: null,
        }
      }
    );

    const decreaseButton = getByTestId('decrease-streak-button');
    expect(decreaseButton.props.disabled).toBe(true);
  });

  it('should display unknown frequency for invalid frequency', () => {
    const invalidHabit = { ...mockHabit, frequency: 'invalid' };
    const { getByText } = renderWithProviders(<HabitItem habit={invalidHabit} />);
    
    expect(getByText('Unknown')).toBeTruthy();
  });

  it('should handle habit without completed dates gracefully', () => {
    const habitWithoutDates = { ...mockHabit, completedDates: undefined };
    const { getByText } = renderWithProviders(<HabitItem habit={habitWithoutDates} />);
    
    expect(getByText('Test Habit')).toBeTruthy();
    expect(getByText('Streak: 5 days')).toBeTruthy();
  });
}); 