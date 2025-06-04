import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fetchHabitsFromServer, updateLastSynced } from '../redux/habitsSlice';
import { syncHabits } from '../utils/api';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { createShadowStyle } from '../theme';
import { showAlert, showSuccessAlert, showErrorAlert } from '../utils/crossPlatformAlert';
import { UI_CONFIG, FEATURES } from '../config';

const SyncScreen = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { habits, loading, error, lastSynced, serverSyncStatus } = useSelector(state => state.habits);
  const [isConnected, setIsConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOfflineMode = FEATURES.OFFLINE_MODE === false;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy h:mm:ss a');
  };

  const onRefresh = async () => {
    if (isOfflineMode) {
      showAlert(
        'Offline Mode', 
        'Application is running in offline mode. Server sync is disabled.'
      );
      return;
    }

    if (!isConnected) {
      showAlert(
        'Offline', 
        'You are currently offline. Please connect to the internet to sync.'
      );
      return;
    }
    
    setRefreshing(true);
    try {
      await dispatch(fetchHabitsFromServer()).unwrap();
      dispatch(updateLastSynced());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncToServer = async () => {
    if (isOfflineMode) {
      showAlert(
        'Offline Mode', 
        'Application is running in offline mode. Server sync is disabled.'
      );
      return;
    }

    if (!isConnected) {
      showAlert(
        'Offline', 
        'You are currently offline. Please connect to the internet to sync.'
      );
      return;
    }
    
    try {
      await syncHabits(habits);
      dispatch(updateLastSynced());
      showSuccessAlert('Your habits have been synced to the server.');
    } catch (error) {
      showErrorAlert(error.message || 'Could not sync to the server.');
    }
  };

  const handleFetchFromServer = async () => {
    if (isOfflineMode) {
      showAlert(
        'Offline Mode', 
        'Application is running in offline mode. Server sync is disabled.'
      );
      return;
    }

    if (!isConnected) {
      showAlert(
        'Offline', 
        'You are currently offline. Please connect to the internet to sync.'
      );
      return;
    }
    
    try {
      await dispatch(fetchHabitsFromServer()).unwrap();
      showSuccessAlert('Habits data has been updated from the server.');
    } catch (error) {
      showErrorAlert(error.message || 'Could not fetch from the server.');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <View style={[
          styles.section, 
          { backgroundColor: theme.colors.warning },
          createShadowStyle(theme, 'small')
        ]}>
          <View style={styles.statusItem}>
            <MaterialIcons 
              name="cloud-off" 
              size={UI_CONFIG.MEDIUM_ICON_SIZE} 
              color={theme.colors.buttonText} 
            />
            <Text style={[styles.offlineModeText, { color: theme.colors.buttonText }]}>
              Offline Mode Active - Server sync is disabled
            </Text>
          </View>
        </View>
      )}

      {/* Network Status */}
      <View style={[
        styles.section, 
        { backgroundColor: theme.colors.card },
        createShadowStyle(theme, 'small')
      ]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Network Status</Text>
        <View style={styles.statusItem}>
          <MaterialIcons 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={UI_CONFIG.MEDIUM_ICON_SIZE} 
            color={isConnected ? theme.colors.success : theme.colors.error} 
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Sync Status */}
      <View style={[
        styles.section, 
        { backgroundColor: theme.colors.card },
        createShadowStyle(theme, 'small')
      ]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sync Status</Text>
        <View style={styles.statusItem}>
          <MaterialIcons 
            name={
              isOfflineMode ? 'cloud-off' :
              serverSyncStatus === 'loading' ? 'sync' : 
              serverSyncStatus === 'succeeded' ? 'cloud-done' : 
              serverSyncStatus === 'offline' ? 'cloud-off' :
              'error-outline'
            } 
            size={UI_CONFIG.MEDIUM_ICON_SIZE} 
            color={
              isOfflineMode ? theme.colors.textSecondary :
              serverSyncStatus === 'loading' ? theme.colors.warning : 
              serverSyncStatus === 'succeeded' ? theme.colors.success : 
              serverSyncStatus === 'offline' ? theme.colors.textSecondary :
              theme.colors.error
            } 
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {isOfflineMode ? 'Offline Mode' :
             serverSyncStatus === 'loading' ? 'Syncing...' : 
             serverSyncStatus === 'succeeded' ? 'Synced' : 
             serverSyncStatus === 'offline' ? 'Offline' :
             'Sync Failed'}
          </Text>
        </View>
        {error && !isOfflineMode && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error: {error}
          </Text>
        )}
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Last synced: {formatDate(lastSynced)}
        </Text>
      </View>

      {/* Manual Sync */}
      <View style={[
        styles.section, 
        { backgroundColor: theme.colors.card },
        createShadowStyle(theme, 'small')
      ]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Manual Sync</Text>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: isOfflineMode || !isConnected || loading ? theme.colors.disabled : theme.colors.primary }
          ]} 
          onPress={handleSyncToServer}
          disabled={isOfflineMode || !isConnected || loading}
        >
          <MaterialIcons 
            name="cloud-upload" 
            size={UI_CONFIG.SMALL_ICON_SIZE} 
            color={theme.colors.buttonText} 
          />
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
            Sync to Server
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: isOfflineMode || !isConnected || loading ? theme.colors.disabled : theme.colors.secondary }
          ]} 
          onPress={handleFetchFromServer}
          disabled={isOfflineMode || !isConnected || loading}
        >
          <MaterialIcons 
            name="cloud-download" 
            size={UI_CONFIG.SMALL_ICON_SIZE} 
            color={theme.colors.buttonText} 
          />
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
            Fetch from Server
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
          {isOfflineMode 
            ? 'Note: Sync functions are disabled in offline mode.'
            : 'Note: Pulling data from the server will overwrite local data if the server has newer data.'
          }
        </Text>
      </View>

      {/* Instructions */}
      <View style={[
        styles.section, 
        { backgroundColor: theme.colors.card },
        createShadowStyle(theme, 'small')
      ]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Instructions</Text>
        {isOfflineMode ? (
          <>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Application is running in offline mode.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • All data is stored locally on your device.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Server synchronization is completely disabled.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Your habits will not be backed up to the server.
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Your habits are automatically synced with the server when changes are made.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • If you're offline, changes will be synced when you reconnect.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Pull down to refresh and sync with the server.
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.text }]}>
              • Use the manual sync options above if automatic sync fails.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: UI_CONFIG.MEDIUM_MARGIN,
    marginHorizontal: UI_CONFIG.SAFE_AREA_PADDING,
    borderRadius: UI_CONFIG.BUTTON_BORDER_RADIUS,
    padding: UI_CONFIG.SAFE_AREA_PADDING,
    elevation: UI_CONFIG.SMALL_ELEVATION,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.MEDIUM_PADDING,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SMALL_PADDING,
  },
  statusText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginLeft: UI_CONFIG.SMALL_PADDING,
  },
  offlineModeText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginLeft: UI_CONFIG.SMALL_PADDING,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginTop: UI_CONFIG.SMALL_PADDING,
  },
  errorText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginTop: UI_CONFIG.SMALL_PADDING,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: UI_CONFIG.SMALL_PADDING,
    marginTop: UI_CONFIG.MEDIUM_PADDING,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginLeft: UI_CONFIG.SMALL_PADDING,
  },
  noteText: {
    fontSize: UI_CONFIG.VERY_SMALL_FONT_SIZE,
    marginTop: UI_CONFIG.MEDIUM_PADDING,
    fontStyle: 'italic',
  },
  instructionText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginBottom: UI_CONFIG.SMALL_PADDING,
    lineHeight: UI_CONFIG.SMALL_LINE_HEIGHT,
  },
});

export default SyncScreen; 