export const SCREEN_NAMES = {
  MAIN_TABS: 'MainTabs',
  HOME: 'Home',
  STATS: 'Stats',
  SETTINGS: 'Settings',
  ADD_HABIT: 'AddHabit',
  SYNC_SCREEN: 'SyncScreen',
  DEBUG_SCREEN: 'DebugScreen',
};

export const TAB_ICONS = {
  [SCREEN_NAMES.HOME]: { 
    focused: 'home', 
    unfocused: 'home-outline' 
  },
  [SCREEN_NAMES.STATS]: { 
    focused: 'stats-chart', 
    unfocused: 'stats-chart-outline' 
  },
  [SCREEN_NAMES.SETTINGS]: { 
    focused: 'settings', 
    unfocused: 'settings-outline' 
  },
};

export const SCREEN_TITLES = {
  [SCREEN_NAMES.HOME]: 'Daily Habits',
  [SCREEN_NAMES.STATS]: 'Statistics',
  [SCREEN_NAMES.SETTINGS]: 'Settings',
  [SCREEN_NAMES.ADD_HABIT]: 'Add New Habit',
  [SCREEN_NAMES.SYNC_SCREEN]: 'Sync & Backup',
  [SCREEN_NAMES.DEBUG_SCREEN]: 'Debug Information',
}; 