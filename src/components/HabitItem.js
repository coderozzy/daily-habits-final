import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { 
  toggleHabitCompletion, 
  decreaseStreak, 
  deleteHabitWithNotifications 
} from '../redux/habitsSlice';
import { hasScheduledNotifications } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../utils/dimensions';
import { createShadowStyle } from '../theme';
import { FREQUENCY_DISPLAY_MAP, UI_CONFIG } from '../config';

const HabitItem = ({ habit, onEdit }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completedDates?.includes(today) || false;

  const notificationProps = useMemo(() => ({
    id: habit.id,
    frequency: habit.frequency,
    customDays: habit.customDays,
    notificationTime: habit.notificationTime
  }), [habit.id, habit.frequency, habit.customDays, habit.notificationTime]);

  const notificationPropsKey = useMemo(() => 
    JSON.stringify(notificationProps), [notificationProps]
  );

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const hasScheduled = await hasScheduledNotifications(notificationProps.id);
        setHasNotifications(hasScheduled);
      } catch (error) {
        console.warn('Failed to check notifications:', error.message);
      }
    };

    checkNotifications();
  }, [notificationPropsKey, notificationProps.id]);

  const handleToggle = () => {
    dispatch(toggleHabitCompletion({ habitId: habit.id, date: today }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteHabitWithNotifications(habit.id)).unwrap();
    } catch (error) {
      console.error('Failed to delete habit:', error);
      setIsDeleting(false);
    }
  };

  const handleDecreaseStreak = () => {
    dispatch(decreaseStreak(habit.id));
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(habit);
    }
  };

  const formatNotificationTime = (time) => {
    if (!time || typeof time !== 'string') return '';
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.card },
      createShadowStyle(theme, 'small'),
      isDeleting && styles.deletingContainer
    ]}>
      <TouchableOpacity
        testID="habit-checkbox"
        style={[
          styles.checkbox, 
          {
            borderColor: theme.colors.habitCheckbox,
            backgroundColor: isCompletedToday ? theme.colors.habitCheckbox : theme.colors.transparent,
          }
        ]}
        onPress={handleToggle}
        disabled={isDeleting}
      >
        {isCompletedToday && (
          <Ionicons 
            name="checkmark" 
            size={scale(UI_CONFIG.SMALL_ICON_SIZE)} 
            color={theme.colors.white} 
          />
        )}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {habit.name}
          </Text>
          {/* Notification status indicator */}
          <View style={styles.notificationIndicator}>
            <Ionicons
              name={hasNotifications ? "notifications" : "notifications-off"}
              size={scale(UI_CONFIG.VERY_SMALL_ICON_SIZE)}
              color={hasNotifications ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>
        </View>
        
        <View style={styles.streakContainer}>
          <Text style={[styles.streakText, { color: theme.colors.textSecondary }]}>
            Streak: {habit.streak || 0} days
          </Text>
          <TouchableOpacity
            testID="decrease-streak-button"
            onPress={handleDecreaseStreak}
            disabled={habit.streak === 0 || isDeleting}
            style={[styles.decreaseButton, (!habit.streak || isDeleting) && styles.disabledButton]}
          >
            <Ionicons
              name="remove-circle-outline"
              size={scale(UI_CONFIG.SMALL_ICON_SIZE)}
              color={habit.streak > 0 && !isDeleting ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.frequencyText, { color: theme.colors.textSecondary }]}>
            {FREQUENCY_DISPLAY_MAP[habit.frequency] || 'Unknown'}
          </Text>
          {habit.notificationTime && (
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              • {formatNotificationTime(habit.notificationTime)}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity
            testID="habit-item-edit"
            style={styles.actionButton}
            onPress={handleEdit}
            disabled={isDeleting}
          >
            <Ionicons
              name="pencil"
              size={scale(UI_CONFIG.SMALL_ICON_SIZE)}
              color={isDeleting ? theme.colors.textSecondary : theme.colors.primary}
            />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          testID="habit-item-delete"
          style={styles.actionButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Ionicons
            name={isDeleting ? "hourglass" : "trash"}
            size={scale(UI_CONFIG.SMALL_ICON_SIZE)}
            color={isDeleting ? theme.colors.textSecondary : theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    padding: UI_CONFIG.MEDIUM_PADDING,
    marginVertical: UI_CONFIG.VERY_SMALL_PADDING,
    elevation: UI_CONFIG.MEDIUM_ELEVATION,
    minHeight: scale(UI_CONFIG.HABIT_ITEM_MIN_HEIGHT),
  },
  deletingContainer: {
    opacity: 0.6,
  },
  checkbox: {
    width: scale(UI_CONFIG.CHECKBOX_SIZE),
    height: scale(UI_CONFIG.CHECKBOX_SIZE),
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    borderWidth: UI_CONFIG.MEDIUM_BORDER,
    marginRight: UI_CONFIG.MEDIUM_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.VERY_SMALL_PADDING,
  },
  name: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    fontWeight: '600',
    flex: 1,
  },
  notificationIndicator: {
    marginLeft: UI_CONFIG.SMALL_PADDING,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.VERY_SMALL_PADDING,
  },
  streakText: {
    fontSize: UI_CONFIG.VERY_SMALL_FONT_SIZE,
    flex: 1,
  },
  decreaseButton: {
    padding: UI_CONFIG.SMALL_PADDING,
  },
  disabledButton: {
    opacity: UI_CONFIG.DISABLED_OPACITY,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: UI_CONFIG.VERY_SMALL_FONT_SIZE,
  },
  timeText: {
    fontSize: UI_CONFIG.VERY_SMALL_FONT_SIZE,
    marginLeft: UI_CONFIG.SMALL_PADDING,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: UI_CONFIG.SMALL_PADDING,
    marginLeft: UI_CONFIG.SMALL_PADDING,
  },
});

export default HabitItem; 