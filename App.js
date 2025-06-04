import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/components/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { ThemedErrorScreen } from './src/components/ErrorScreen';
import SyncStatusIndicator from './src/components/SyncStatusIndicator';
import NetworkStatusIndicator from './src/components/NetworkStatusIndicator';
import { usePersistence } from './src/hooks/usePersistence';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useNotificationManager } from './src/hooks/useNotificationManager';


const AppContent = () => {
  const { isDarkMode } = useTheme();
  const { isConnected } = useAppInitialization();
  
  useNotificationManager();
  
  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Network connectivity status */}
      <NetworkStatusIndicator isConnected={isConnected} />
      
      {/* Server sync status indicator */}
      <SyncStatusIndicator showAsStatusBar={true} />
      
      <AppNavigator />
    </SafeAreaProvider>
  );
};


export default function App() {
  const { persistError, handleRetry, handlePersistenceSuccess } = usePersistence();

  if (persistError) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <ThemedErrorScreen error={persistError} retry={handleRetry} />
        </ThemeProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <PersistGate 
          loading={<LoadingScreen />} 
          persistor={persistor}
          onBeforeLift={handlePersistenceSuccess}
        >
          <AppContent />
        </PersistGate>
      </ThemeProvider>
    </Provider>
  );
}
