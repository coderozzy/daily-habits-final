import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMetrics } from '../utils/api';
import { DEFAULTS } from '../config';
import { 
  cancelHabitNotifications, 
  rescheduleHabitNotification,
  scheduleHabitNotification,
  cancelAllHabitNotifications
} from '../utils/notifications';
import { Platform } from 'react-native';

export const fetchHabitsFromServer = createAsyncThunk(
  'habits/fetchFromServer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMetrics();
      return response.data.habits || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteHabitWithNotifications = createAsyncThunk(
  'habits/deleteWithNotifications',
  async (habitId) => {
    try {
      await cancelHabitNotifications(habitId);
      
      return habitId;
    } catch (error) {
      console.warn(`Failed to cancel notifications for habit ${habitId}:`, error.message);
      return habitId;
    }
  }
);

export const updateHabitWithNotifications = createAsyncThunk(
  'habits/updateWithNotifications',
  async ({ habitId, updates, currentHabit }, { rejectWithValue }) => {
    try {
      const updatedHabit = { ...currentHabit, ...updates };
      
      const notificationFields = ['frequency', 'customDays', 'notificationTime'];
      const needsNotificationUpdate = notificationFields.some(field => 
        updates.hasOwnProperty(field) && updates[field] !== currentHabit[field]
      );
      
      if (needsNotificationUpdate) {
        const result = await rescheduleHabitNotification(updatedHabit);
        if (!result.success) {
          console.warn(`Failed to reschedule notifications: ${result.error}`);
        }
      }
      
      return { id: habitId, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addHabitWithNotifications = createAsyncThunk(
  'habits/addWithNotifications',
  async (habitData, { rejectWithValue }) => {
    try {
      const newHabit = {
        id: Date.now().toString(),
        name: habitData.name,
        frequency: habitData.frequency || DEFAULTS.HABIT_FREQUENCY,
        customDays: habitData.customDays || [],
        notificationTime: (habitData.notificationTime != null && habitData.notificationTime !== '') 
          ? habitData.notificationTime 
          : DEFAULTS.NOTIFICATION_TIME,
        completedDates: [],
        streak: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        await scheduleHabitNotification(newHabit);
      } catch (notificationError) {
        console.warn('Failed to schedule notifications:', notificationError.message);
      }

      return newHabit;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetHabitsWithNotifications = createAsyncThunk(
  'habits/resetWithNotifications',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const habitIds = state.habits.habits.map(habit => habit.id);
      
      if (habitIds.length > 0) {
        await cancelAllHabitNotifications(habitIds);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to cancel notifications during reset:', error.message);
      return true;
    }
  }
);

const initialState = {
  habits: [],
  loading: false,
  error: null,
  lastSynced: null,
  serverSyncStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit: (state, action) => {
      const providedId = action.payload.id;
      const newId = providedId || Date.now().toString();
      
      if (providedId && state.habits.some(habit => habit.id === providedId)) {
        console.warn(`Habit with ID ${providedId} already exists, skipping addition`);
        return;
      }
      
      const newHabit = {
        id: newId,
        name: action.payload.name,
        frequency: action.payload.frequency || DEFAULTS.HABIT_FREQUENCY,
        customDays: action.payload.customDays || [],
        notificationTime: (action.payload.notificationTime != null && action.payload.notificationTime !== '') 
          ? action.payload.notificationTime 
          : DEFAULTS.NOTIFICATION_TIME,
        completedDates: [],
        streak: 0,
        createdAt: new Date().toISOString(),
      };
      state.habits.push(newHabit);
    },
    toggleHabitCompletion: (state, action) => {
      const { habitId, date } = action.payload;
      const habit = state.habits.find(h => h.id === habitId);
      if (habit) {
        if (!habit.completedDates) {
          habit.completedDates = [];
        }
        
        habit.completedDates = [...new Set(habit.completedDates)];
        
        const dateIndex = habit.completedDates.indexOf(date);
        if (dateIndex === -1) {
          habit.completedDates = [...new Set([...habit.completedDates, date])];
          habit.streak += 1;
        } else {
          habit.completedDates.splice(dateIndex, 1);
          if (habit.streak > 0) {
            habit.streak -= 1;
          }
        }
      }
    },

    updateStreak: (state, action) => {
      const { habitId, streak } = action.payload;
      const habit = state.habits.find(h => h.id === habitId);
      if (habit) {
        habit.streak = Math.max(0, streak);
      }
    },

    decreaseStreak: (state, action) => {
      const habit = state.habits.find(h => h.id === action.payload);
      if (habit && habit.streak > 0) {
        habit.streak -= 1;
      }
    },

    deleteHabit: (state, action) => {
      state.habits = state.habits.filter(habit => habit.id !== action.payload);
    },

    updateHabit: (state, action) => {
      const { id, ...updates } = action.payload;
      const habit = state.habits.find(h => h.id === id);
      if (habit) {
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            habit[key] = updates[key];
          }
        });
        if (!habit.completedDates) {
          habit.completedDates = [];
        }
        if (habit.notificationTime == null || habit.notificationTime === '' || typeof habit.notificationTime !== 'string') {
          habit.notificationTime = DEFAULTS.NOTIFICATION_TIME;
        }
      }
    },

    bulkUpdateHabits: (state, action) => {
      const updates = action.payload;
      if (Array.isArray(updates)) {
        updates.forEach(({ id, updates: habitUpdates }) => {
          const habit = state.habits.find(h => h.id === id);
          if (habit && habitUpdates) {
            Object.keys(habitUpdates).forEach(key => {
              if (habitUpdates[key] !== undefined) {
                habit[key] = habitUpdates[key];
              }
            });
            if (!habit.completedDates) {
              habit.completedDates = [];
            }
          }
        });
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    updateLastSynced: (state, action) => {
      state.lastSynced = action.payload || new Date().toISOString();
    },

    updateServerSyncStatus: (state, action) => {
      state.serverSyncStatus = action.payload;
    },

    resetHabits: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchHabitsFromServer.pending, (state) => {
        state.serverSyncStatus = 'loading';
      })

      .addCase(fetchHabitsFromServer.fulfilled, (state, action) => {
        state.serverSyncStatus = 'succeeded';
        
        if (action.payload && action.payload.length > 0) {
          state.habits = action.payload;
        }
        
        state.lastSynced = new Date().toISOString();
        state.error = null;
      })

      .addCase(fetchHabitsFromServer.rejected, (state, action) => {
        state.serverSyncStatus = 'failed';
        state.error = action.payload || 'Failed to fetch habits from server';
      })

      .addCase(deleteHabitWithNotifications.fulfilled, (state, action) => {
        state.habits = state.habits.filter(habit => habit.id !== action.payload);
      })

      .addCase(deleteHabitWithNotifications.rejected, (state, action) => {
        console.error('Failed to delete habit with notifications:', action.payload);
        const habitId = action.meta.arg;
        state.habits = state.habits.filter(habit => habit.id !== habitId);
      })

      .addCase(updateHabitWithNotifications.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const habit = state.habits.find(h => h.id === id);
        if (habit) {
          Object.assign(habit, updates);
          if (!habit.completedDates) {
            habit.completedDates = [];
          }
        }
      })

      .addCase(updateHabitWithNotifications.rejected, (state, action) => {
        console.error('Failed to update habit with notifications:', action.payload);
        state.error = action.payload || 'Failed to update habit';
      })

      .addCase(addHabitWithNotifications.fulfilled, (state, action) => {
        state.habits.push(action.payload);
      })

      .addCase(addHabitWithNotifications.rejected, (state, action) => {
        console.error('Failed to add habit with notifications:', action.payload);
        state.error = action.payload || 'Failed to add habit';
      })

      .addCase(resetHabitsWithNotifications.fulfilled, (state, action) => {
        return initialState;
      })

      .addCase(resetHabitsWithNotifications.rejected, (state, action) => {
        console.error('Failed to reset habits with notifications:', action.payload);
        return initialState;
      });
  }
});

export const {
  addHabit,
  toggleHabitCompletion,
  updateStreak,
  decreaseStreak,
  deleteHabit,
  updateHabit,
  bulkUpdateHabits,
  setLoading,
  setError,
  updateLastSynced,
  updateServerSyncStatus,
  resetHabits,
} = habitsSlice.actions;

export default habitsSlice.reducer; 