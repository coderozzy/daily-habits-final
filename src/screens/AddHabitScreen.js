import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { addHabitWithNotifications } from '../redux/habitsSlice';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { registerForPushNotificationsAsync, setupInitialNotifications } from '../utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { createShadowStyle } from '../theme';
import { DEFAULTS, VALIDATION, UI_CONFIG, PICKER_OPTIONS } from '../config';
import { showSuccessAlert } from '../utils/crossPlatformAlert';

const AddHabitScreen = ({ navigation }) => {
  const [habitName, setHabitName] = useState('');
  const [error, setError] = useState('');
  const [frequency, setFrequency] = useState(DEFAULTS.HABIT_FREQUENCY);
  const [customDays, setCustomDays] = useState([]);
  const [time, setTime] = useState(DEFAULTS.NOTIFICATION_TIME);
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const customFreq = PICKER_OPTIONS.FREQUENCY.find(f => f.value === 'custom')?.value;

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await setupInitialNotifications();
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.warn('Error setting up notifications:', error.message);
      }
    };
    
    setupNotifications();
  }, []);

  const weekDays = VALIDATION.VALID_WEEKDAYS;

  const toggleDay = (day) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  const handleAddHabit = async () => {
    try {
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
        : DEFAULTS.NOTIFICATION_TIME;

      if (!VALIDATION.NOTIFICATION_TIME_FORMAT.test(validTime)) {
        setError('Please enter a valid time in HH:MM format');
        return;
      }

      if (frequency === customFreq && customDays.length === 0) {
        setError('Please select at least one day for custom frequency');
        return;
      }

      const habitData = {
        name: habitName.trim(),
        frequency,
        customDays: frequency === customFreq ? customDays : [],
        notificationTime: validTime,
      };

      await dispatch(addHabitWithNotifications(habitData)).unwrap();

      showSuccessAlert('Habit added successfully!', () => navigation.goBack());
    } catch (error) {
      console.error('Error adding habit:', error);
      setError('Failed to add habit. Please try again.');
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
          name="add-circle" 
          size={UI_CONFIG.LARGE_ICON_SIZE} 
          color={theme.colors.white} 
          style={{ marginBottom: UI_CONFIG.SMALL_PADDING }} 
        />
        <Text style={[styles.headerTitle, { color: theme.colors.white }]}>
          Create a New Habit
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.headerSubtitle }]}>
          Build your best self, one habit at a time!
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
          autoFocus
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
              title="Add Habit"
              onPress={handleAddHabit}
              disabled={!habitName.trim() || (frequency === customFreq && customDays.length === 0)}
              style={[
                styles.addButton,
                createShadowStyle(theme, 'small'),
                { backgroundColor: theme.colors.primary }
              ]}
              textStyle={styles.addButtonText}
            />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(UI_CONFIG.ANIMATION_VERY_SLOW)}>
            <CustomButton
              title="Add Habit"
              onPress={handleAddHabit}
              disabled={!habitName.trim() || (frequency === customFreq && customDays.length === 0)}
              style={[
                styles.addButton,
                createShadowStyle(theme, 'small'),
                { backgroundColor: theme.colors.primary }
              ]}
              textStyle={styles.addButtonText}
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
    borderRadius: UI_CONFIG.LARGE_BORDER_RADIUS,
    padding: UI_CONFIG.CONTAINER_PADDING,
    marginHorizontal: UI_CONFIG.SAFE_AREA_PADDING,
    marginTop: UI_CONFIG.NEGATIVE_LARGE_MARGIN,
    elevation: UI_CONFIG.LARGE_ELEVATION,
  },
  header: {
    paddingVertical: UI_CONFIG.EXTRA_LARGE_PADDING,
    alignItems: 'center',
    marginBottom: UI_CONFIG.SAFE_AREA_PADDING,
    elevation: UI_CONFIG.EXTRA_LARGE_ELEVATION,
  },
  headerTitle: {
    fontSize: UI_CONFIG.LARGE_TITLE_FONT_SIZE,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.VERY_SMALL_PADDING,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginBottom: UI_CONFIG.ZERO_MARGIN,
    textAlign: 'center',
  },
  card: {
    borderRadius: UI_CONFIG.LARGE_BORDER_RADIUS,
    padding: UI_CONFIG.CONTAINER_PADDING,
    marginHorizontal: UI_CONFIG.SAFE_AREA_PADDING,
    marginTop: UI_CONFIG.NEGATIVE_LARGE_MARGIN,
  },
  errorContainer: {
    padding: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: UI_CONFIG.CARD_BORDER_RADIUS,
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
  },
  errorText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    textAlign: 'center',
  },
  label: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    fontWeight: '600',
    marginBottom: UI_CONFIG.VERY_SMALL_PADDING,
    marginLeft: UI_CONFIG.VERY_SMALL_MARGIN,
  },
  pickerContainer: {
    marginVertical: UI_CONFIG.MEDIUM_MARGIN,
    borderWidth: UI_CONFIG.THIN_BORDER,
    borderRadius: UI_CONFIG.SMALL_PADDING,
    overflow: 'hidden',
    paddingHorizontal: UI_CONFIG.EXTRA_SMALL_PADDING,
    paddingTop: UI_CONFIG.VERY_SMALL_PADDING,
  },
  picker: {
    height: UI_CONFIG.BUTTON_HEIGHT,
    width: '100%',
  },
  daysContainer: {
    marginVertical: UI_CONFIG.MEDIUM_MARGIN,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: UI_CONFIG.EXTRA_SMALL_PADDING,
  },
  dayButton: {
    width: '13%',
    marginVertical: UI_CONFIG.SMALL_MARGIN,
    borderRadius: UI_CONFIG.SMALL_PADDING,
    paddingHorizontal: UI_CONFIG.ZERO_PADDING,
    paddingVertical: UI_CONFIG.ZERO_PADDING,
  },
  addButton: {
    marginTop: UI_CONFIG.EXTRA_LARGE_MARGIN,
    borderRadius: UI_CONFIG.CARD_BORDER_RADIUS,
    elevation: UI_CONFIG.SMALL_ELEVATION,
  },
  addButtonText: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePicker: {
    width: UI_CONFIG.BUTTON_HEIGHT * 2,
  },
  timeSeparator: {
    fontSize: UI_CONFIG.TITLE_FONT_SIZE,
    fontWeight: 'bold',
    marginHorizontal: UI_CONFIG.MEDIUM_MARGIN,
  },
});

export default AddHabitScreen;
