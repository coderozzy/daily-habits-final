import { Platform } from 'react-native';

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduledWebNotifications';


export async function requestWebNotificationPermission() {
  if (Platform.OS !== 'web' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted' ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export function getWebNotificationPermissionStatus() {
  if (Platform.OS !== 'web' || !('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}

export function showWebNotification(title, body, data = {}) {
  if (Platform.OS !== 'web' || !('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/assets/icon.png', 
      badge: '/assets/icon.png',
      data,
      requireInteraction: true,
      silent: false,
    });

    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('Error showing web notification:', error);
    return null;
  }
}

export function scheduleWebNotification(habitId, habitName, scheduledTime) {
  if (Platform.OS !== 'web') {
    return null;
  }

  const now = new Date().getTime();
  const scheduledTimeMs = scheduledTime.getTime();
  const delay = scheduledTimeMs - now;

  if (delay <= 0) {
    console.warn('Scheduled time is in the past, skipping web notification');
    return null;
  }

  const notificationId = `${habitId}_${scheduledTimeMs}`;

  const scheduledNotifications = getStoredScheduledNotifications();
  scheduledNotifications[notificationId] = {
    habitId,
    habitName,
    scheduledTime: scheduledTimeMs,
    created: now,
  };
  
  localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledNotifications));

  const timeoutId = setTimeout(() => {
    const currentScheduled = getStoredScheduledNotifications();
    if (currentScheduled[notificationId]) {
      showWebNotification(
        'Habit Reminder',
        `Time to work on your habit: ${habitName}`,
        { habitId }
      );
      
      delete currentScheduled[notificationId];
      localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(currentScheduled));
    }
  }, delay);

  console.log(`Web notification scheduled for habit "${habitName}" in ${Math.floor(delay / 1000)} seconds`);
  
  return { notificationId, timeoutId };
}

export function cancelWebNotifications(habitId) {
  if (Platform.OS !== 'web') {
    return { success: true, cancelled: 0 };
  }

  const scheduledNotifications = getStoredScheduledNotifications();
  let cancelledCount = 0;

  Object.keys(scheduledNotifications).forEach(notificationId => {
    if (scheduledNotifications[notificationId].habitId === habitId) {
      delete scheduledNotifications[notificationId];
      cancelledCount++;
    }
  });

  localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledNotifications));
  
  console.log(`Cancelled ${cancelledCount} web notifications for habit ${habitId}`);
  return { success: true, cancelled: cancelledCount };
}

export function cancelAllWebNotifications() {
  if (Platform.OS !== 'web') {
    return { success: true, cancelled: 0 };
  }

  const scheduledNotifications = getStoredScheduledNotifications();
  const cancelledCount = Object.keys(scheduledNotifications).length;
  
  localStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
  
  console.log(`Cancelled all ${cancelledCount} web notifications`);
  return { success: true, cancelled: cancelledCount };
}

export function getScheduledWebNotifications(habitId) {
  if (Platform.OS !== 'web') {
    return [];
  }

  const scheduledNotifications = getStoredScheduledNotifications();
  return Object.values(scheduledNotifications).filter(notification => 
    !habitId || notification.habitId === habitId
  );
}

export function initializeWebNotifications() {
  if (Platform.OS !== 'web') {
    return;
  }

  cleanupExpiredNotifications();
  
  restoreScheduledNotifications();
}

function restoreScheduledNotifications() {
  const scheduledNotifications = getStoredScheduledNotifications();
  const now = new Date().getTime();

  Object.entries(scheduledNotifications).forEach(([notificationId, notification]) => {
    const delay = notification.scheduledTime - now;
    
    if (delay > 0) {
      setTimeout(() => {
        const currentScheduled = getStoredScheduledNotifications();
        if (currentScheduled[notificationId]) {
          showWebNotification(
            'Habit Reminder',
            `Time to work on your habit: ${notification.habitName}`,
            { habitId: notification.habitId }
          );
          
          delete currentScheduled[notificationId];
          localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(currentScheduled));
        }
      }, delay);
    } else {
      delete scheduledNotifications[notificationId];
    }
  });

  localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledNotifications));
}

function cleanupExpiredNotifications() {
  const scheduledNotifications = getStoredScheduledNotifications();
  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  Object.keys(scheduledNotifications).forEach(notificationId => {
    const notification = scheduledNotifications[notificationId];
    if (now - notification.created > oneDayMs) {
      delete scheduledNotifications[notificationId];
    }
  });

  localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledNotifications));
}

function getStoredScheduledNotifications() {
  try {
    const stored = localStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading scheduled notifications from localStorage:', error);
    return {};
  }
} 