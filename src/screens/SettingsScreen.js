import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import CustomButton from '../components/CustomButton';
import { persistor } from '../redux/store';
import { resetHabitsWithNotifications } from '../redux/habitsSlice';
import { useTheme } from '../context/ThemeContext';
import { useFeatureSettings } from '../hooks/useFeatureSettings';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/crossPlatformAlert';
import { UI_CONFIG } from '../config';

const SettingsScreen = () => {
  const [reminders, setReminders] = useState(true);
  const dispatch = useDispatch();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { navigateToSync, navigateToDebug } = useAppNavigation();
  
  const {
    isLoading,
    updateFeatureSetting,
    notificationsEnabled,
    offlineModeEnabled,
  } = useFeatureSettings();

  const handleToggleNotifications = async (enabled) => {
    const success = await updateFeatureSetting('NOTIFICATIONS_ENABLED', enabled);
    if (success) {
      showSuccessAlert(
        enabled 
          ? 'Notifications enabled. You will receive habit reminders.' 
          : 'Notifications disabled. You will not receive any notifications.'
      );
    } else {
      showErrorAlert('Failed to update notification settings.');
    }
  };

  const handleToggleOfflineMode = async (enabled) => {
    const success = await updateFeatureSetting('OFFLINE_MODE', !enabled);
    if (success) {
      showConfirmAlert(
        enabled ? 'Offline Mode Enabled' : 'Online Mode Enabled',
        enabled 
          ? 'The app will now run in offline mode. All server communication is disabled. Your data will only be stored locally.'
          : 'The app will now run in online mode. Your habits will be synced with the server.',
        () => {
          showSuccessAlert(
            enabled 
              ? 'Offline mode activated. The app will not communicate with the server.' 
              : 'Online mode activated. The app will sync with the server.'
          );
        }
      );
    } else {
      showErrorAlert('Failed to update offline mode settings.');
    }
  };

  const handleClearData = () => {
    showConfirmAlert(
      "Clear All Data",
      "Are you sure you want to clear all your habits data and notifications? This action cannot be undone.",
      async () => {
        try {
          await dispatch(resetHabitsWithNotifications()).unwrap();
          
          await persistor.purge();
          
          showSuccessAlert("All your habits data and notifications have been cleared successfully.");
        } catch (error) {
          console.error("Error clearing data:", error);
          showErrorAlert("There was a problem clearing your data. Please try again.");
        }
      },
      undefined,
      "Clear",
      "Cancel"
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Push Notifications</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Receive reminders for your habits
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Use dark theme interface
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Offline Mode</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              {offlineModeEnabled 
                ? 'Currently offline - no server communication' 
                : 'Online mode - syncs with server'
              }
            </Text>
          </View>
          <Switch
            value={offlineModeEnabled}
            onValueChange={handleToggleOfflineMode}
            trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Daily Reminders</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Get daily reminder notifications
            </Text>
          </View>
          <Switch
            value={reminders && notificationsEnabled}
            onValueChange={setReminders}
            disabled={!notificationsEnabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Management</Text>
        
        <TouchableOpacity 
          style={[
            styles.navigationItem,
            { borderBottomColor: theme.colors.overlay }
          ]}
          onPress={navigateToSync}
        >
          <View style={styles.navigationItemContent}>
            <Ionicons 
              name={offlineModeEnabled ? "cloud-offline" : "cloud-upload"} 
              size={UI_CONFIG.SETTINGS_ICON_SIZE} 
              color={offlineModeEnabled ? theme.colors.textSecondary : theme.colors.primary} 
            />
            <View style={styles.navigationTextContainer}>
              <Text style={[styles.navigationItemText, { color: theme.colors.text }]}>
                Sync & Backup
              </Text>
              {offlineModeEnabled && (
                <Text style={[styles.navigationSubtext, { color: theme.colors.textSecondary }]}>
                  (Disabled in offline mode)
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={UI_CONFIG.SETTINGS_ICON_SIZE} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.navigationItem,
            { borderBottomColor: theme.colors.overlay }
          ]}
          onPress={navigateToDebug}
        >
          <View style={styles.navigationItemContent}>
            <Ionicons name="bug" size={UI_CONFIG.SETTINGS_ICON_SIZE} color={theme.colors.primary} />
            <Text style={[styles.navigationItemText, { color: theme.colors.text }]}>
              Debug
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={UI_CONFIG.SETTINGS_ICON_SIZE} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <CustomButton
          title="Clear All Data"
          onPress={handleClearData}
          variant="secondary"
          style={[styles.dangerButton, { borderColor: theme.colors.error }]}
        />
      </View>

      <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
        <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>Daily Habits v1.0.0</Text>
        <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>A simple app to track your daily habits and build consistency.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
  },
  section: {
    padding: UI_CONFIG.CONTAINER_PADDING,
    borderBottomWidth: UI_CONFIG.THIN_BORDER,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.LARGE_MARGIN,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.MEDIUM_MARGIN,
  },
  settingInfo: {
    flex: 1,
    marginRight: UI_CONFIG.MEDIUM_MARGIN,
  },
  settingLabel: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginBottom: UI_CONFIG.VERY_SMALL_MARGIN,
  },
  settingDescription: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    lineHeight: UI_CONFIG.SMALL_LINE_HEIGHT,
  },
  dangerButton: {
    marginTop: UI_CONFIG.EXTRA_LARGE_MARGIN,
    borderWidth: UI_CONFIG.THIN_BORDER,
  },
  aboutText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginBottom: UI_CONFIG.SMALL_MARGIN,
  },
  navigationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.LARGE_MARGIN,
    borderBottomWidth: UI_CONFIG.THIN_BORDER,
  },
  navigationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navigationTextContainer: {
    marginLeft: UI_CONFIG.MEDIUM_MARGIN,
  },
  navigationItemText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
  },
  navigationSubtext: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    fontStyle: 'italic',
  },
});

export default SettingsScreen; 