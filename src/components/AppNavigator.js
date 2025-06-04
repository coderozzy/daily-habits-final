import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SCREEN_NAMES, TAB_ICONS, SCREEN_TITLES } from '../config/navigationConfig';
import HomeScreen from '../screens/HomeScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import EditHabitScreen from '../screens/EditHabitScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SyncScreen from '../screens/SyncScreen';
import DebugScreen from '../screens/DebugScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = TAB_ICONS[route.name];
          const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{ title: SCREEN_TITLES[SCREEN_NAMES.HOME] }}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.STATS}
        component={StatsScreen}
        options={{ title: SCREEN_TITLES[SCREEN_NAMES.STATS] }}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.SETTINGS}
        component={SettingsScreen}
        options={{ title: SCREEN_TITLES[SCREEN_NAMES.SETTINGS] }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.background,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Main tab-based screens */}
        <Stack.Screen 
          name={SCREEN_NAMES.MAIN_TABS}
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        
        {/* Modal/Push screens */}
        <Stack.Screen 
          name={SCREEN_NAMES.ADD_HABIT}
          component={AddHabitScreen}
          options={{ 
            title: SCREEN_TITLES[SCREEN_NAMES.ADD_HABIT],
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="EditHabit"
          component={EditHabitScreen}
          options={{ 
            title: 'Edit Habit',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name={SCREEN_NAMES.SYNC_SCREEN}
          component={SyncScreen}
          options={{ title: SCREEN_TITLES[SCREEN_NAMES.SYNC_SCREEN] }}
        />
        <Stack.Screen 
          name={SCREEN_NAMES.DEBUG_SCREEN}
          component={DebugScreen}
          options={{ title: SCREEN_TITLES[SCREEN_NAMES.DEBUG_SCREEN] }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 