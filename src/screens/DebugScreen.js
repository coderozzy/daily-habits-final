import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { useNotificationManager } from '../hooks/useNotificationManager';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { 
  registerForPushNotificationsAsync, 
  sendTestNotification, 
  getNotificationPermissionStatus 
} from '../utils/notifications';
import { clearAuthData, getApiKey, getDeviceId, registerDevice } from '../utils/deviceAuth';
import { SERVER_URL, ENDPOINTS } from '../config/apiConfig';
import { createShadowStyle } from '../theme';
import { TIMEOUTS, UI_CONFIG } from '../config';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/crossPlatformAlert';


const isWeb = Platform.OS === 'web';
const testStorage = {
  async setItem(key, value) {
    if (isWeb) {
      return await AsyncStorage.setItem(key, value);
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key) {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async deleteItem(key) {
    if (isWeb) {
      return await AsyncStorage.removeItem(key);
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  }
};

const DebugScreen = () => {
  const { theme } = useTheme();
  const habits = useSelector((state) => state.habits.habits);
  const {
    notificationStatus: hookNotificationStatus,
    totalScheduledNotifications,
    isNotificationSupported,
    syncAllNotifications,
    clearAllNotifications,
    clearAllNotificationsForce,
  } = useNotificationManager();

  const [deviceInfo, setDeviceInfo] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [secureStoreStatus, setSecureStoreStatus] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const [isClearingAuth, setIsClearingAuth] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [isManagingNotifications, setIsManagingNotifications] = useState(false);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      setDeviceInfo({
        brand: Device.brand || 'Unknown',
        modelName: Device.modelName || 'Unknown',
        osName: Platform.OS || 'Unknown',
        osVersion: Platform.Version?.toString() || 'Unknown',
        isDevice: Device.isDevice,
        isEmulator: Device.isEmulator,
      });

      const status = await getNotificationPermissionStatus();
      setNotificationStatus(status);

      try {
        await testStorage.setItem('test_key', 'test_value');
        const value = await testStorage.getItem('test_key');
        await testStorage.deleteItem('test_key');
        setSecureStoreStatus(value === 'test_value' ? 'working' : 'error');
      } catch (error) {
        console.error('Storage test error:', error);
        setSecureStoreStatus('error');
      }

      try {
        const deviceId = await getDeviceId();
        const apiKey = await getApiKey();
        setAuthInfo({
          deviceId,
          hasApiKey: !!apiKey,
          apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'None'
        });
      } catch (error) {
        console.error('Error getting auth info:', error);
        setAuthInfo({
          deviceId: 'Error',
          hasApiKey: false,
          apiKeyPreview: 'Error'
        });
      }

      const unsubscribe = NetInfo.addEventListener(state => {
        setNetworkStatus({
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
        });
      });

      return () => {
        unsubscribe();
      };
    };

    loadDeviceInfo();
  }, []);

  useEffect(() => {
    if (hookNotificationStatus && hookNotificationStatus !== 'unknown') {
      setNotificationStatus(hookNotificationStatus);
    }
  }, [hookNotificationStatus]);

  const requestNotificationPermission = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      const status = await getNotificationPermissionStatus();
      setNotificationStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handleTestNotification = () => {
    showConfirmAlert(
      'Send Test Notification',
      'This will send a test notification to verify that notifications are working properly on your device.',
      async () => {
        setIsSendingNotification(true);
        try {
          await sendTestNotification();
          showSuccessAlert('Test notification sent!');
        } catch (error) {
          console.error('Test notification error:', error);
          showErrorAlert('Failed to send test notification');
        } finally {
          setIsSendingNotification(false);
        }
      },
      undefined,
      'Send',
      'Cancel'
    );
  };

  const handleClearAuthData = async () => {
    showConfirmAlert(
      'Clear Authentication Data',
      'This will clear your device ID and API key, forcing the app to re-register with the server. This might fix API authentication issues.',
      async () => {
        setIsClearingAuth(true);
        try {
          await clearAuthData();
          const deviceId = await getDeviceId();
          const apiKey = await getApiKey();
          setAuthInfo({
            deviceId,
            hasApiKey: !!apiKey,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'None'
          });
          showSuccessAlert('Authentication data cleared. The app will re-register on next API call.');
        } catch (error) {
          console.error('Error clearing auth data:', error);
          showErrorAlert('Failed to clear authentication data');
        } finally {
          setIsClearingAuth(false);
        }
      },
      undefined,
      'Clear',
      'Cancel'
    );
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      console.log('Testing connection to server...');
      
      const healthResponse = await fetch(`${SERVER_URL}${ENDPOINTS.HEALTH}`, {
        method: 'GET',
        timeout: TIMEOUTS.API_REQUEST
      });
      
      const healthData = await healthResponse.json();
      console.log('Health check result:', healthData);
      
      if (healthData.status === 'ok') {
        setConnectionTestResult('✅ Server reachable');
        
        try {
          await registerDevice();
          setConnectionTestResult('✅ Registration successful');
          
          const deviceId = await getDeviceId();
          const apiKey = await getApiKey();
          setAuthInfo({
            deviceId,
            hasApiKey: !!apiKey,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'None'
          });
        } catch (regError) {
          console.error('Registration test failed:', regError);
          setConnectionTestResult(`❌ Registration failed: ${regError.message}`);
        }
      } else {
        setConnectionTestResult('❌ Server health check failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTestResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncAllNotifications = () => {
    showConfirmAlert(
      'Sync All Notifications',
      `This will reschedule notifications for all ${habits.length} habits. Any existing notifications will be cleared first.`,
      async () => {
        setIsManagingNotifications(true);
        try {
          const result = await syncAllNotifications();
          if (result.success) {
            showSuccessAlert(`Notifications synced successfully! ${result.result?.successful?.length || 0} habits scheduled.`);
          } else {
            showErrorAlert(`Failed to sync notifications: ${result.error}`);
          }
        } catch (error) {
          console.error('Error syncing notifications:', error);
          showErrorAlert('Failed to sync notifications');
        } finally {
          setIsManagingNotifications(false);
        }
      },
      undefined,
      'Sync',
      'Cancel'
    );
  };

  const handleClearAllNotifications = () => {
    showConfirmAlert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications for your habits. You can re-enable them by syncing notifications again.',
      async () => {
        setIsManagingNotifications(true);
        try {
          const result = await clearAllNotifications();
          if (result.success) {
            showSuccessAlert('All notifications cleared successfully!');
          } else {
            showErrorAlert(`Failed to clear notifications: ${result.error}`);
          }
        } catch (error) {
          console.error('Error clearing notifications:', error);
          showErrorAlert('Failed to clear notifications');
        } finally {
          setIsManagingNotifications(false);
        }
      },
      undefined,
      'Clear',
      'Cancel'
    );
  };

  const handleForceClearNotifications = () => {
    showConfirmAlert(
      'Force Clear All Notifications',
      'This will forcefully clear ALL scheduled notifications on your device, even if they are not related to habits. Use this only if you have notification issues.',
      async () => {
        setIsManagingNotifications(true);
        try {
          const result = await clearAllNotificationsForce();
          if (result.success) {
            showSuccessAlert('All notifications force cleared successfully!');
          } else {
            showErrorAlert(`Failed to force clear notifications: ${result.error}`);
          }
        } catch (error) {
          console.error('Error force clearing notifications:', error);
          showErrorAlert('Failed to force clear notifications');
        } finally {
          setIsManagingNotifications(false);
        }
      },
      undefined,
      'Force Clear',
      'Cancel'
    );
  };

  const handleRequestNotificationPermission = () => {
    showConfirmAlert(
      'Request Notification Permission',
      'This will prompt you to grant notification permissions if they are currently denied or unknown.',
      async () => {
        setIsManagingNotifications(true);
        try {
          const granted = await requestNotificationPermission();
          if (granted) {
            showSuccessAlert('Notification permissions granted successfully!');
          } else {
            showErrorAlert('Notification permissions were denied. Please enable them in your device settings.');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          showErrorAlert('Failed to request notification permissions');
        } finally {
          setIsManagingNotifications(false);
        }
      },
      undefined,
      'Request',
      'Cancel'
    );
  };

  const FeatureCard = ({ title, icon, children }) => (
    <View style={[
      styles.card, 
      { backgroundColor: theme.colors.card },
      createShadowStyle(theme, 'medium')
    ]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={UI_CONFIG.MEDIUM_ICON_SIZE} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <FeatureCard title="Device Information" icon="phone-portrait">
          {deviceInfo && (
            <>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Brand: {deviceInfo.brand}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Model: {deviceInfo.modelName}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                OS: {deviceInfo.osName} {deviceInfo.osVersion}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Is Device: {deviceInfo.isDevice ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Is Emulator: {deviceInfo.isEmulator ? 'Yes' : 'No'}
              </Text>
            </>
          )}
        </FeatureCard>

        <FeatureCard title="Notification Management" icon="notifications">
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Status: {notificationStatus || 'Checking...'}
          </Text>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Total Habits: {habits.length}
          </Text>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Scheduled Notifications: {totalScheduledNotifications}
          </Text>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Platform Support: {isNotificationSupported ? 'Yes' : 'No'}
          </Text>
          
          {isNotificationSupported && notificationStatus !== 'granted' && (
            <TouchableOpacity
              style={[
                styles.testButton,
                { backgroundColor: theme.colors.warning },
                isManagingNotifications && styles.testButtonDisabled
              ]}
              onPress={handleRequestNotificationPermission}
              disabled={isManagingNotifications}
            >
              <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                {isManagingNotifications ? 'Requesting...' : 'Request Notification Permission'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.primary },
              isSendingNotification && styles.testButtonDisabled
            ]}
            onPress={handleTestNotification}
            disabled={isSendingNotification}
          >
            <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
              {isSendingNotification ? 'Sending...' : 'Send Test Notification'}
            </Text>
          </TouchableOpacity>

          {isNotificationSupported && notificationStatus === 'granted' && (
            <>
              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.success },
                  isManagingNotifications && styles.testButtonDisabled
                ]}
                onPress={handleSyncAllNotifications}
                disabled={isManagingNotifications}
              >
                <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                  {isManagingNotifications ? 'Syncing...' : 'Sync All Notifications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.warning },
                  isManagingNotifications && styles.testButtonDisabled
                ]}
                onPress={handleClearAllNotifications}
                disabled={isManagingNotifications}
              >
                <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                  {isManagingNotifications ? 'Clearing...' : 'Clear All Notifications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.error },
                  isManagingNotifications && styles.testButtonDisabled
                ]}
                onPress={handleForceClearNotifications}
                disabled={isManagingNotifications}
              >
                <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                  {isManagingNotifications ? 'Force Clearing...' : 'Force Clear All'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </FeatureCard>

        <FeatureCard title="Secure Storage" icon="lock-closed">
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Status: {secureStoreStatus || 'Checking...'}
          </Text>
        </FeatureCard>

        <FeatureCard title="Authentication" icon="key">
          {authInfo ? (
            <>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Device ID: {authInfo.deviceId}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Has API Key: {authInfo.hasApiKey ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                API Key: {authInfo.apiKeyPreview}
              </Text>
              {connectionTestResult && (
                <Text style={[styles.text, { color: theme.colors.text, marginTop: UI_CONFIG.MEDIUM_MARGIN }]}>
                  {connectionTestResult}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.primary },
                  isTestingConnection && styles.testButtonDisabled
                ]}
                onPress={handleTestConnection}
                disabled={isTestingConnection}
              >
                <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                  {isTestingConnection ? 'Testing...' : 'Test Connection & Register'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.testButton,
                  { backgroundColor: theme.colors.error, marginTop: UI_CONFIG.SMALL_MARGIN },
                  isClearingAuth && styles.testButtonDisabled
                ]}
                onPress={handleClearAuthData}
                disabled={isClearingAuth}
              >
                <Text style={[styles.testButtonText, { color: theme.colors.buttonText }]}>
                  {isClearingAuth ? 'Clearing...' : 'Clear Auth Data'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.text, { color: theme.colors.text }]}>
              Loading...
            </Text>
          )}
        </FeatureCard>

        <FeatureCard title="Network Status" icon="wifi">
          {networkStatus && (
            <>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Connected: {networkStatus.isConnected ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Type: {networkStatus.type}
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Internet Reachable: {networkStatus.isInternetReachable ? 'Yes' : 'No'}
              </Text>
            </>
          )}
        </FeatureCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: UI_CONFIG.CONTAINER_PADDING,
  },
  card: {
    borderRadius: UI_CONFIG.BUTTON_BORDER_RADIUS,
    padding: UI_CONFIG.CARD_PADDING,
    marginBottom: UI_CONFIG.LARGE_MARGIN,
    elevation: UI_CONFIG.LARGE_ELEVATION,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.MEDIUM_MARGIN,
  },
  cardTitle: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: 'bold',
    marginLeft: UI_CONFIG.MEDIUM_MARGIN,
  },
  cardContent: {
    marginLeft: UI_CONFIG.EXTRA_EXTRA_LARGE_MARGIN,
  },
  text: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginBottom: UI_CONFIG.SMALL_MARGIN,
  },
  testButton: {
    marginTop: UI_CONFIG.MEDIUM_MARGIN,
    padding: UI_CONFIG.MEDIUM_MARGIN,
    borderRadius: UI_CONFIG.SMALL_BORDER_RADIUS,
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: UI_CONFIG.DISABLED_OPACITY,
  },
  testButtonText: {
    fontWeight: 'bold',
  },
});

export default DebugScreen; 