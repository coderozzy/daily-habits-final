import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  scheduleAllHabitNotifications,
  cancelAllHabitNotifications,
  registerForPushNotificationsAsync,
  setupInitialNotifications,
  getNotificationPermissionStatus,
  hasScheduledNotifications
} from '../utils/notifications';
import { FEATURES } from '../config';

export const useNotificationManager = () => {
  const habits = useSelector((state) => state.habits.habits);
  const [notificationStatus, setNotificationStatus] = useState('unknown'); // 'granted' | 'denied' | 'unknown'
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [totalScheduledNotifications, setTotalScheduledNotifications] = useState(0);

  const notificationRelevantHabits = useMemo(() => 
    habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      customDays: habit.customDays,
      notificationTime: habit.notificationTime
    })), [habits]
  );

  const notificationHabitsKey = useMemo(() => 
    JSON.stringify(notificationRelevantHabits), [notificationRelevantHabits]
  );

  const updateNotificationCount = useCallback(async () => {
    if (!FEATURES.NOTIFICATIONS_ENABLED) {
      return;
    }

    try {
      let count = 0;
      for (const habit of habits) {
        const hasNotifications = await hasScheduledNotifications(habit.id);
        if (hasNotifications) count++;
      }
      setTotalScheduledNotifications(count);
    } catch (error) {
      console.warn('Failed to count scheduled notifications:', error.message);
    }
  }, [habits]);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!FEATURES.NOTIFICATIONS_ENABLED) {
        return;
      }

      setIsInitializing(true);
      try {
        const status = await getNotificationPermissionStatus();
        setNotificationStatus(status);

        if (status === 'granted') {
          await registerForPushNotificationsAsync();
          
          await setupInitialNotifications();
          
          if (habits.length > 0) {
            const result = await scheduleAllHabitNotifications(habits);
            setLastSyncResult(result);
          }
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    const syncNotifications = async () => {
      if (!FEATURES.NOTIFICATIONS_ENABLED || 
          notificationStatus !== 'granted' ||
          isInitializing) {
        return;
      }

      try {
        await setupInitialNotifications();
        
        if (notificationRelevantHabits.length > 0) {
          const result = await scheduleAllHabitNotifications(habits);
          setLastSyncResult(result);
          await updateNotificationCount();
        } else {
          setTotalScheduledNotifications(0);
        }
      } catch (error) {
        console.error('Failed to sync notifications:', error);
      }
    };

    if (notificationStatus === 'granted' && !isInitializing) {
      syncNotifications();
    }
  }, [notificationHabitsKey, notificationStatus, isInitializing, updateNotificationCount, habits]);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      const status = await getNotificationPermissionStatus();
      setNotificationStatus(status);
      
      if (status === 'granted' && habits.length > 0) {
        await setupInitialNotifications();
        const result = await scheduleAllHabitNotifications(habits);
        setLastSyncResult(result);
        await updateNotificationCount();
      }
      
      return { success: status === 'granted', token };
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return { success: false, error: error.message };
    }
  }, [habits, updateNotificationCount]);

  const syncAllNotifications = useCallback(async () => {
    if (!FEATURES.NOTIFICATIONS_ENABLED) {
      return { success: false, error: 'Notifications not supported' };
    }

    try {
      setIsInitializing(true);
      await setupInitialNotifications();
      
      if (habits.length > 0) {
        const result = await scheduleAllHabitNotifications(habits);
        setLastSyncResult(result);
        await updateNotificationCount();
        return { success: true, result };
      }
      
      setTotalScheduledNotifications(0);
      return { success: true, result: { successful: [], failed: [] } };
    } catch (error) {
      console.error('Failed to sync all notifications:', error);
      return { success: false, error: error.message };
    } finally {
      setIsInitializing(false);
    }
  }, [habits, updateNotificationCount]);

  const clearAllNotifications = useCallback(async () => {
    if (!FEATURES.NOTIFICATIONS_ENABLED) {
      return { success: false, error: 'Notifications not supported' };
    }

    try {
      const habitIds = habits.map(habit => habit.id);
      
      if (habitIds.length > 0) {
        const result = await cancelAllHabitNotifications(habitIds);
        setLastSyncResult(null);
        setTotalScheduledNotifications(0);
        return { success: true, result };
      } else {
        await setupInitialNotifications();
        setLastSyncResult(null);
        setTotalScheduledNotifications(0);
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return { success: false, error: error.message };
    }
  }, [habits]);

  const clearAllNotificationsForce = useCallback(async () => {
    if (!FEATURES.NOTIFICATIONS_ENABLED) {
      return { success: false, error: 'Notifications not supported' };
    }

    try {
      const result = await cancelAllHabitNotifications();
      setLastSyncResult(null);
      setTotalScheduledNotifications(0);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to force clear all notifications:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    notificationStatus,
    isInitializing,
    lastSyncResult,
    totalScheduledNotifications,
    isNotificationSupported: FEATURES.NOTIFICATIONS_ENABLED,
    requestNotificationPermission,
    syncAllNotifications,
    clearAllNotifications,
    clearAllNotificationsForce,
    updateNotificationCount,
  };
}; 