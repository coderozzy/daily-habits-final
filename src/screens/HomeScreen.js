import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import HabitItem from '../components/HabitItem';
import CustomButton from '../components/CustomButton';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { UI_CONFIG } from '../config';

const HomeScreen = ({ navigation }) => {
  const habits = useSelector((state) => state.habits.habits);
  const { theme } = useTheme();
  const { navigateToAddHabit } = useAppNavigation();

  const handleEditHabit = (habit) => {
    navigation.navigate('EditHabit', { habit });
  };

  const renderHabitItem = ({ item }) => (
    <HabitItem habit={item} onEdit={handleEditHabit} />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={habits}
        renderItem={renderHabitItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No habits added yet. Start by adding a new habit!
            </Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Add New Habit"
          onPress={navigateToAddHabit}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: UI_CONFIG.SAFE_AREA_PADDING,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.CONTAINER_PADDING,
  },
  emptyText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: UI_CONFIG.SAFE_AREA_PADDING,
  },
});

export default HomeScreen;
