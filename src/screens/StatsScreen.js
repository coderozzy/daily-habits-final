import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../utils/dimensions';
import { createShadowStyle } from '../theme';
import { UI_CONFIG } from '../config';

const StatsScreen = () => {
  const habits = useSelector(state => state.habits.habits);
  const { theme } = useTheme();
  const today = new Date().toISOString().split('T')[0];

  const totalHabits = habits.length;
  const completedHabits = habits.filter(habit => 
    habit.completedDates?.includes(today)
  ).length;
  const totalStreaks = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0);
  const averageStreak = totalHabits > 0 ? (totalStreaks / totalHabits).toFixed(1) : '0.0';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.statsContainer}>
        <View style={[
          styles.statCard, 
          { backgroundColor: theme.colors.card },
          createShadowStyle(theme, 'small')
        ]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{totalHabits}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Habits</Text>
        </View>
        
        <View style={[
          styles.statCard, 
          { backgroundColor: theme.colors.card },
          createShadowStyle(theme, 'small')
        ]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{completedHabits}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed Today</Text>
        </View>
        
        <View style={[
          styles.statCard, 
          { backgroundColor: theme.colors.card },
          createShadowStyle(theme, 'small')
        ]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{totalStreaks}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Streaks</Text>
        </View>
        
        <View style={[
          styles.statCard, 
          { backgroundColor: theme.colors.card },
          createShadowStyle(theme, 'small')
        ]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{averageStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Average Streak</Text>
        </View>
      </View>

      <View style={styles.habitsList}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Habit Streaks</Text>
        {habits.map(habit => (
          <View key={habit.id} style={[
            styles.habitItem, 
            { backgroundColor: theme.colors.card },
            createShadowStyle(theme, 'small')
          ]}>
            <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
            <Text style={[styles.habitStreak, { color: theme.colors.primary }]}>{habit.streak || 0} days</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: UI_CONFIG.MEDIUM_PADDING,
  },
  statCard: {
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    padding: UI_CONFIG.MEDIUM_PADDING,
    width: '48%',
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
    alignItems: 'center',
  },
  statValue: {
    fontSize: UI_CONFIG.TITLE_FONT_SIZE,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.VERY_SMALL_PADDING,
  },
  statLabel: {
    fontSize: UI_CONFIG.SMALL_FONT_SIZE,
    textAlign: 'center',
  },
  habitsList: {
    padding: UI_CONFIG.MEDIUM_PADDING,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: '600',
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
    marginBottom: UI_CONFIG.SMALL_PADDING,
  },
  habitName: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
  },
  habitStreak: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    fontWeight: '600',
  },
  cardStyle: {
    borderRadius: scale(UI_CONFIG.CARD_BORDER_RADIUS),
  },
  smallCardStyle: {
    borderRadius: scale(UI_CONFIG.SMALL_PADDING),
  },
});

export default StatsScreen; 