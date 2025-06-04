import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { updateHabitWithNotifications } from '../redux/habitsSlice';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../utils/dimensions';
import { createShadowStyle } from '../theme';
import { showSuccessAlert } from '../utils/crossPlatformAlert';
import { 
  PICKER_OPTIONS, 
  VALIDATION, 
  UI_CONFIG,
  TIMEOUTS
} from '../config';
import Animated, { FadeIn } from 'react-native-reanimated';

const EditHabitScreen = ({ navigation, route }) => {
  const { habit } = route.params;
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [habitName, setHabitName] = useState(habit.name);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [customDays, setCustomDays] = useState(habit.customDays || []);
  const [time, setTime] = useState(habit.notificationTime || '09:00');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const customFreq = PICKER_OPTIONS.FREQUENCY.find(f => f.value === 'custom')?.value;
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Habit',
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
    });
  }, [navigation, theme]);

  const toggleDay = (day) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleUpdateHabit = async () => {
    try {
      setIsUpdating(true);
      setError('');

      if (!habitName.trim()) {
        setError('Please enter a habit name');
        return;
      }

      if (habitName.trim().length < VALIDATION.HABIT_NAME_MIN_LENGTH) {
        setError(`Habit name must be at least ${VALIDATION.HABIT_NAME_MIN_LENGTH} characters long`);
        return;
      }

      if (habitName.trim().length > VALIDATION.HABIT_NAME_MAX_LENGTH) {
        setError(`Habit name must not exceed ${VALIDATION.HABIT_NAME_MAX_LENGTH} characters`);
        return;
      }

      const validTime = (time && typeof time === 'string' && time.includes(':')) 
        ? time 
        : (habit.notificationTime || '09:00');

      if (!VALIDATION.NOTIFICATION_TIME_FORMAT.test(validTime)) {
        setError('Please enter a valid time in HH:MM format');
        return;
      }

      if (frequency === customFreq && customDays.length === 0) {
        setError('Please select at least one day for custom frequency');
        return;
      }

      const updates = {
        name: habitName.trim(),
        frequency,
        customDays: frequency === customFreq ? customDays : [],
        notificationTime: validTime,
      };

      await dispatch(updateHabitWithNotifications({
        habitId: habit.id,
        updates,
        currentHabit: habit
      })).unwrap();

      showSuccessAlert('Habit updated successfully!', () => navigation.goBack());
    } catch (error) {
      console.error('Error updating habit:', error);
      setError('Failed to update habit. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const AnimatedViewComponent = Platform.OS === 'web' ? View : Animated.View;
  const animationProps = Platform.OS === 'web' ? {} : { entering: FadeIn.duration(UI_CONFIG.ANIMATION_SLOW) };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={theme.colors.gradientPrimary}
        style={[styles.header, createShadowStyle(theme, 'medium')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons 
          name="pencil" 
          size={UI_CONFIG.LARGE_ICON_SIZE} 
          color={theme.colors.white} 
          style={{ marginBottom: UI_CONFIG.SMALL_PADDING }} 
        />
        <Text style={[styles.headerTitle, { color: theme.colors.white }]}>
          Edit Habit
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.headerSubtitle }]}>
          Update your habit details and notifications
        </Text>
      </LinearGradient>

      <AnimatedViewComponent 
        {...animationProps}
        style={[
          styles.card, 
          { backgroundColor: theme.colors.card },
          createShadowStyle(theme, 'small')
        ]}
      >
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorBackground }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: theme.colors.text }]}>Habit Name</Text>
        <CustomInput
          placeholder="Enter habit name"
          value={habitName}
          onChangeText={setHabitName}
          maxLength={VALIDATION.HABIT_NAME_MAX_LENGTH}
          style={{ marginBottom: UI_CONFIG.SMALL_PADDING }}
        />

        <View style={[
          styles.pickerContainer,
          {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surface,
          }
        ]}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Frequency
          </Text>
          <Picker
            selectedValue={frequency}
            onValueChange={(itemValue) => setFrequency(itemValue)}
            style={[styles.picker, { color: theme.colors.text }]}
            itemStyle={{ color: theme.colors.text }}
          >
            {PICKER_OPTIONS.FREQUENCY.map((option) => (
              <Picker.Item 
                key={option.value} 
                label={option.label} 
                value={option.value}
                color={theme.colors.text}
              />
            ))}
          </Picker>
        </View>

        {frequency === customFreq && (
          <View style={styles.daysContainer}>
            <Text style={[styles.label, { color: theme.colors.primary }]}>
              Select Days
            </Text>
            <View style={styles.daysRow}>
              {weekDays.map((day) => (
                <CustomButton
                  key={day}
                  title={day.slice(0, 3)}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayButton,
                    customDays.includes(day) && { backgroundColor: theme.colors.primary },
                  ]}
                  textStyle={customDays.includes(day) && { color: theme.colors.buttonText }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={[
          styles.pickerContainer,
          {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surface,
          }
        ]}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Reminder Time
          </Text>
          {Platform.OS === 'web' ? (
            <Picker
              selectedValue={time}
              onValueChange={(value) => setTime(value)}
              style={styles.picker}
            >
              {Array.from({ length: 24 }).map((_, hour) => (
                <Picker.Item
                  key={hour}
                  label={`${hour.toString().padStart(2, '0')}:00`}
                  value={`${hour.toString().padStart(2, '0')}:00`}
                />
              ))}
            </Picker>
          ) : (
            <View style={styles.timePickerContainer}>
              <Picker
                selectedValue={time && time.split ? time.split(':')[0] : '09'}
                onValueChange={(value) => {
                  const currentTime = time && time.split ? time : '09:00';
                  const [_, minutes] = currentTime.split(':');
                  setTime(`${value.padStart(2, '0')}:${minutes}`);
                }}
                style={[styles.picker, styles.timePicker]}
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <Picker.Item
                    key={hour}
                    label={`${hour.toString().padStart(2, '0')}`}
                    value={hour.toString().padStart(2, '0')}
                  />
                ))}
              </Picker>
              <Text style={styles.timeSeparator}>:</Text>
              <Picker
                selectedValue={time && time.split ? time.split(':')[1] : '00'}
                onValueChange={(value) => {
                  const currentTime = time && time.split ? time : '09:00';
                  const [hours, _] = currentTime.split(':');
                  setTime(`${hours}:${value.padStart(2, '0')}`);
                }}
                style={[styles.picker, styles.timePicker]}
              >
                {Array.from({ length: 60 }).map((_, minute) => (
                  <Picker.Item
                    key={minute}
                    label={`${minute.toString().padStart(2, '0')}`}
                    value={minute.toString().padStart(2, '0')}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {Platform.OS === 'web' ? (
          <View>
            <CustomButton
              title={isUpdating ? "Updating..." : "Update Habit"}
              onPress={handleUpdateHabit}
              disabled={!habitName.trim() || (frequency === customFreq && customDays.length === 0) || isUpdating}
              style={[
                styles.updateButton,
                createShadowStyle(theme, 'small'),
                { backgroundColor: theme.colors.primary }
              ]}
              textStyle={styles.updateButtonText}
            />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(UI_CONFIG.ANIMATION_VERY_SLOW)}>
            <CustomButton
              title={isUpdating ? "Updating..." : "Update Habit"}
              onPress={handleUpdateHabit}
              disabled={!habitName.trim() || (frequency === customFreq && customDays.length === 0) || isUpdating}
              style={[
                styles.updateButton,
                createShadowStyle(theme, 'small'),
                { backgroundColor: theme.colors.primary }
              ]}
              textStyle={styles.updateButtonText}
            />
          </Animated.View>
        )}
      </AnimatedViewComponent>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.LARGE_PADDING,
    paddingHorizontal: UI_CONFIG.MEDIUM_PADDING,
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
  },
  headerTitle: {
    fontSize: UI_CONFIG.HEADER_FONT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    textAlign: 'center',
    marginTop: UI_CONFIG.SMALL_PADDING,
  },
  card: {
    margin: UI_CONFIG.MEDIUM_PADDING,
    padding: UI_CONFIG.LARGE_PADDING,
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    elevation: UI_CONFIG.SMALL_ELEVATION,
  },
  errorContainer: {
    padding: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
  },
  errorText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    textAlign: 'center',
  },
  label: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    fontWeight: '600',
    marginBottom: UI_CONFIG.SMALL_PADDING,
    marginTop: UI_CONFIG.MEDIUM_PADDING,
  },
  pickerContainer: {
    borderWidth: UI_CONFIG.THIN_BORDER,
    borderRadius: scale(UI_CONFIG.INPUT_BORDER_RADIUS),
    marginVertical: UI_CONFIG.SMALL_PADDING,
    paddingHorizontal: UI_CONFIG.MEDIUM_PADDING,
  },
  picker: {
    height: scale(UI_CONFIG.PICKER_HEIGHT),
  },
  daysContainer: {
    marginVertical: UI_CONFIG.MEDIUM_PADDING,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingHorizontal: UI_CONFIG.SMALL_PADDING,
    paddingVertical: UI_CONFIG.VERY_SMALL_PADDING,
    marginVertical: UI_CONFIG.VERY_SMALL_PADDING,
    borderRadius: scale(UI_CONFIG.BUTTON_BORDER_RADIUS),
    minWidth: scale(UI_CONFIG.DAY_BUTTON_MIN_WIDTH),
    alignItems: 'center',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePicker: {
    flex: 1,
    height: scale(UI_CONFIG.PICKER_HEIGHT),
  },
  timeSeparator: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    fontWeight: 'bold',
    marginHorizontal: UI_CONFIG.SMALL_PADDING,
  },
  updateButton: {
    marginTop: UI_CONFIG.LARGE_PADDING,
    paddingVertical: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: scale(UI_CONFIG.BUTTON_BORDER_RADIUS),
  },
  updateButtonText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EditHabitScreen; 