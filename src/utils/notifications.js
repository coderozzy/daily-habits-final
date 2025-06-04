import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { lightTheme } from '../theme';
import { TIME_CONSTANTS, PICKER_OPTIONS, FEATURES } from '../config';
import { 
  requestWebNotificationPermission, 
  getWebNotificationPermissionStatus,
  scheduleWebNotification,
  cancelWebNotifications,
  cancelAllWebNotifications,
  getScheduledWebNotifications,
  initializeWebNotifications,
  showWebNotification
} from './webNotifications';


const notificationHandler = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => notificationHandler,
});

async function scheduleNotification(habit, scheduledTime) {
  try {
    const now = new Date();
    const secondsUntilTrigger = Math.floor((scheduledTime - now) / TIME_CONSTANTS.SECOND);

    if (secondsUntilTrigger <= 0) {
      console.warn(`Scheduled time is in the past for habit ${habit.name}, skipping`);
      return; 
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Reminder',
        body: `Time to work on your habit: ${habit.name}`,
        data: { habitId: habit.id },
      },
      trigger: {
        seconds: secondsUntilTrigger,
        repeats: true,
      },
    });
    
  } catch (error) {
    console.error(`Failed to schedule individual notification for habit ${habit.name}:`, error.message);
    throw error;
  }
}

function getNextOccurrence(hours, minutes, daysToAdd = 0) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);

  if (daysToAdd === 0 && scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime;
}

export async function registerForPushNotificationsAsync() {
  if (!FEATURES.NOTIFICATIONS_ENABLED) {
    console.log('Notifications are disabled via feature flag');
    return null;
  }

  if (Platform.OS === 'web') {
    const permission = await requestWebNotificationPermission();
    if (permission === 'granted') {
      console.log('Web notification permission granted');
      return 'web-notifications-enabled';
    } else {
      console.warn('Web notification permission denied');
      return null;
    }
  }

  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: lightTheme.colors.notificationLight,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (tokenError) {
        console.warn(tokenError.message);
        return null;
      }
    } else {
      console.log('Notifications not supported on simulator/emulator');
      return null;
    }
  } catch (error) {
    console.warn(error.message);
    return null;
  }

  return token || null;
}

export async function scheduleHabitNotification(habit) {
  if (!FEATURES.NOTIFICATIONS_ENABLED) {
    console.log('Habit notifications are disabled via feature flag');
    return { success: false, habitId: habit.id, error: 'Notifications disabled' };
  }

  try {
    const { frequency, customDays, notificationTime } = habit;
    
    if (!notificationTime || typeof notificationTime !== 'string') {
      console.warn(`Invalid notification time for habit ${habit.name}:`, notificationTime);
      return { success: false, habitId: habit.id, error: 'Invalid notification time' };
    }
    
    const [hours, minutes] = notificationTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid notification time format: ${notificationTime}`);
    }

    await cancelHabitNotifications(habit.id);

    const now = new Date();

    const dailyFreq = PICKER_OPTIONS.FREQUENCY.find(f => f.value === 'daily')?.value;
    const weeklyFreq = PICKER_OPTIONS.FREQUENCY.find(f => f.value === 'weekly')?.value;
    const customFreq = PICKER_OPTIONS.FREQUENCY.find(f => f.value === 'custom')?.value;

    if (frequency === dailyFreq) {
      const scheduledTime = getNextOccurrence(hours, minutes);
      if (Platform.OS === 'web') {
        scheduleWebNotification(habit.id, habit.name, scheduledTime);
      } else {
        await scheduleNotification(habit, scheduledTime);
      }
    } else if (frequency === weeklyFreq) {
      const scheduledTime = getNextOccurrence(hours, minutes);
      const daysUntilMonday = (8 - scheduledTime.getDay()) % 7;
      scheduledTime.setDate(scheduledTime.getDate() + daysUntilMonday);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 7);
      }

      if (Platform.OS === 'web') {
        scheduleWebNotification(habit.id, habit.name, scheduledTime);
      } else {
        await scheduleNotification(habit, scheduledTime);
      }
    } else if (frequency === customFreq && customDays.length > 0) {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (const day of customDays) {
        const weekday = weekdays.indexOf(day);
        if (weekday === -1) {
          console.warn(`Invalid custom day: ${day}`);
          continue;
        }
        
        const dayScheduledTime = getNextOccurrence(hours, minutes);
        
        const daysUntilNext = (weekday - dayScheduledTime.getDay() + 7) % 7;
        dayScheduledTime.setDate(dayScheduledTime.getDate() + daysUntilNext);

        if (dayScheduledTime <= now) {
          dayScheduledTime.setDate(dayScheduledTime.getDate() + 7);
        }

        if (Platform.OS === 'web') {
          scheduleWebNotification(habit.id, habit.name, dayScheduledTime);
        } else {
          await scheduleNotification(habit, dayScheduledTime);
        }
      }
    }
    
    return { success: true, habitId: habit.id };
  } catch (error) {
    console.error(error.message);
    return { success: false, habitId: habit.id, error: error.message };
  }
}

export async function cancelHabitNotifications(habitId) {
  if (Platform.OS === 'web') {
    return cancelWebNotifications(habitId);
  }
  
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const habitNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.habitId === habitId
    );
    
    if (habitNotifications.length > 0) {
      await Promise.all(
        habitNotifications.map(notification =>
          Notifications.cancelScheduledNotificationAsync(notification.identifier)
        )
      );
    }
    
    return { success: true, cancelled: habitNotifications.length };
  } catch (error) {
    console.warn(error.message);
    return { success: false, error: error.message };
  }
}

export async function setupInitialNotifications() {
  if (Platform.OS === 'web') {
    initializeWebNotifications();
    return { success: true, message: 'Web notifications initialized' };
  }
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { success: true, message: 'Initial setup completed' };
  } catch (error) {
    console.warn(error.message);
    return { success: false, error: error.message };
  }
}

export async function sendTestNotification() {
  if (!FEATURES.NOTIFICATIONS_ENABLED) {
    console.log('Test notifications are disabled via feature flag');
    return { success: false, error: 'Notifications disabled' };
  }

  if (Platform.OS === 'web') {
    const notification = showWebNotification(
      'Test Notification',
      'This is a test notification from Daily Habits Debug Screen',
      { type: 'test' }
    );
    
    if (notification) {
      return { success: true, notificationId: 'web-test-notification' };
    } else {
      return { success: false, error: 'Web notification failed - permission may be denied' };
    }
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from Daily Habits Debug Screen',
        data: { type: 'test' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });
    return { success: true, notificationId };
  } catch (error) {
    console.error('Failed to send test notification:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getNotificationPermissionStatus() {
  if (Platform.OS === 'web') {
    return getWebNotificationPermissionStatus();
  }
  
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.warn('Failed to get notification permission status:', error.message);
    return 'unknown';
  }
}

export async function scheduleAllHabitNotifications(habits) {
  if (!FEATURES.NOTIFICATIONS_ENABLED) {
    console.log('Bulk habit notifications are disabled via feature flag');
    return { successful: [], failed: [] };
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const habit of habits) {
    try {
      const result = await scheduleHabitNotification(habit);
      if (result && result.success) {
        results.successful.push(habit.id);
      } else {
        results.failed.push({ habitId: habit.id, error: result?.error || 'Unknown error' });
      }
    } catch (error) {
      console.error(`Failed to schedule notification for habit ${habit.name}:`, error.message);
      results.failed.push({ habitId: habit.id, error: error.message });
    }
  }

  return results;
}

export async function cancelAllHabitNotifications(habitIds = []) {
  if (Platform.OS === 'web') {
    if (habitIds.length === 0) {
      const result = cancelAllWebNotifications();
      return { successful: ['all'], failed: [] };
    }
    
    const results = {
      successful: [],
      failed: []
    };

    for (const habitId of habitIds) {
      try {
        const result = cancelWebNotifications(habitId);
        if (result && result.success) {
          results.successful.push(habitId);
        } else {
          results.failed.push({ habitId, error: result?.error || 'Failed to cancel' });
        }
      } catch (error) {
        console.error(`Failed to cancel web notifications for habit ${habitId}:`, error.message);
        results.failed.push({ habitId, error: error.message });
      }
    }

    return results;
  }

  const results = {
    successful: [],
    failed: []
  };

  if (habitIds.length === 0) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { successful: ['all'], failed: [] };
    } catch (error) {
      return { successful: [], failed: [{ habitId: 'all', error: error.message }] };
    }
  }

  for (const habitId of habitIds) {
    try {
      const result = await cancelHabitNotifications(habitId);
      if (result && result.success) {
        results.successful.push(habitId);
      } else {
        results.failed.push({ habitId, error: result?.error || 'Failed to cancel' });
      }
    } catch (error) {
      console.error(`Failed to cancel notifications for habit ${habitId}:`, error.message);
      results.failed.push({ habitId, error: error.message });
    }
  }

  return results;
}

export async function rescheduleHabitNotification(habit) {
  if (!FEATURES.NOTIFICATIONS_ENABLED) {
    console.log('Habit notification rescheduling is disabled via feature flag');
    return { success: false, habitId: habit.id, error: 'Notifications disabled' };
  }

  try {
    const cancelResult = await cancelHabitNotifications(habit.id);
    if (!cancelResult || !cancelResult.success) {
      console.warn(`Failed to cancel existing notifications: ${cancelResult?.error || 'Unknown error'}`);
    }
    
    const scheduleResult = await scheduleHabitNotification(habit);
    if (scheduleResult && scheduleResult.success) {
      return { success: true, habitId: habit.id };
    } else {
      return { success: false, habitId: habit.id, error: scheduleResult?.error || 'Failed to schedule' };
    }
  } catch (error) {
    console.error(`Failed to reschedule notifications for habit ${habit.name}:`, error.message);
    return { success: false, habitId: habit.id, error: error.message };
  }
}

export async function hasScheduledNotifications(habitId) {
  if (Platform.OS === 'web') {
    const webNotifications = getScheduledWebNotifications(habitId);
    return webNotifications.length > 0;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.some(
      notification => notification.content.data?.habitId === habitId
    );
  } catch (error) {
    console.warn(`Failed to check scheduled notifications for habit ${habitId}:`, error.message);
    return false;
  }
}

export async function getHabitNotificationCount(habitId) {
  if (Platform.OS === 'web') {
    const webNotifications = getScheduledWebNotifications(habitId);
    return webNotifications.length;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.filter(
      notification => notification.content.data?.habitId === habitId
    ).length;
  } catch (error) {
    console.warn(`Failed to get notification count for habit ${habitId}:`, error.message);
    return 0;
  }
} 