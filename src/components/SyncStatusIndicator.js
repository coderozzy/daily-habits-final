import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { createShadowStyle } from '../theme';
import { UI_CONFIG, FEATURES } from '../config';


const SyncStatusIndicator = ({ showAsStatusBar = false }) => {
  const { serverSyncStatus, error } = useSelector(state => state.habits);
  const { theme, isDarkMode } = useTheme();

  const isOfflineMode = FEATURES.OFFLINE_MODE === false;

  const getStatusInfo = () => {
    if (isOfflineMode) {
      return {
        icon: 'cloud-off',
        color: theme.colors.textSecondary,
        message: 'Offline mode'
      };
    }

    if (serverSyncStatus === 'loading') {
      return {
        icon: 'sync',
        color: theme.colors.warning,
        message: 'Syncing...'
      };
    }
    
    if (error) {
      return {
        icon: 'error-outline',
        color: theme.colors.error,
        message: 'Sync failed'
      };
    }
    
    if (serverSyncStatus === 'succeeded') {
      return {
        icon: 'check-circle',
        color: theme.colors.success,
        message: 'Synced'
      };
    }

    if (serverSyncStatus === 'offline') {
      return {
        icon: 'cloud-off',
        color: theme.colors.textSecondary,
        message: 'Offline'
      };
    }
    
    return {
      icon: 'cloud-off',
      color: theme.colors.textSecondary,
      message: 'Not synced'
    };
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  if (showAsStatusBar) {
    return (
      <View style={[
        styles.statusBar,
        { backgroundColor: statusInfo.color },
        { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
      ]}>
        <Text style={[
          styles.statusBarText,
          { color: theme.colors.buttonText }
        ]}>
          {statusInfo.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.card },
      createShadowStyle(theme, 'small')
    ]}>
      <View style={styles.indicator}>
        <View style={[
          styles.dot,
          { backgroundColor: statusInfo.color }
        ]} />
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {statusInfo.message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    padding: UI_CONFIG.SMALL_PADDING,
    borderBottomWidth: UI_CONFIG.THIN_BORDER,
  },
  statusBarText: {
    fontSize: UI_CONFIG.SMALL_FONT_SIZE,
    textAlign: 'center',
    fontWeight: '500',
  },
  container: {
    padding: UI_CONFIG.MEDIUM_PADDING,
    marginHorizontal: UI_CONFIG.SAFE_AREA_PADDING,
    marginVertical: UI_CONFIG.VERY_SMALL_MARGIN,
    borderRadius: UI_CONFIG.SMALL_BORDER_RADIUS,
    elevation: UI_CONFIG.SMALL_ELEVATION,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: UI_CONFIG.SMALL_PADDING,
    height: UI_CONFIG.SMALL_PADDING,
    borderRadius: UI_CONFIG.EXTRA_SMALL_BORDER_RADIUS,
    marginRight: UI_CONFIG.MEDIUM_PADDING,
  },
  text: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
  },
});

export default SyncStatusIndicator; 