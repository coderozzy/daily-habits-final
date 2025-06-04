import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateFeatureFlag, getFeatureFlags } from '../config/appConfig';

const FEATURE_SETTINGS_KEY = 'featureSettings';

export const useFeatureSettings = () => {
  const [featureSettings, setFeatureSettings] = useState(getFeatureFlags());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatureSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(FEATURE_SETTINGS_KEY);
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          
          Object.keys(parsedSettings).forEach(feature => {
            updateFeatureFlag(feature, parsedSettings[feature]);
          });
          
          setFeatureSettings(getFeatureFlags());
        }
      } catch (error) {
        console.error('Error loading feature settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatureSettings();
  }, []);

  const saveFeatureSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(FEATURE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving feature settings:', error);
    }
  };

  const updateFeatureSetting = async (feature, enabled) => {
    const success = updateFeatureFlag(feature, enabled);
    if (success) {
      const newSettings = getFeatureFlags();
      setFeatureSettings(newSettings);
      await saveFeatureSettings(newSettings);
      return true;
    }
    return false;
  };

  const resetAllFeatureSettings = async () => {
    const defaultSettings = {
      NOTIFICATIONS_ENABLED: true,
      DARK_THEME: true,
      OFFLINE_MODE: true,
    };

    Object.keys(defaultSettings).forEach(feature => {
      updateFeatureFlag(feature, defaultSettings[feature]);
    });

    const newSettings = getFeatureFlags();
    setFeatureSettings(newSettings);
    await saveFeatureSettings(newSettings);
  };

  return {
    featureSettings,
    isLoading,
    updateFeatureSetting,
    resetAllFeatureSettings,
    
    notificationsEnabled: featureSettings.NOTIFICATIONS_ENABLED,
    darkThemeEnabled: featureSettings.DARK_THEME,
    offlineModeEnabled: !featureSettings.OFFLINE_MODE,
  };
}; 