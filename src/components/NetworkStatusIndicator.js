import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UI_CONFIG, FEATURES } from '../config';


const NetworkStatusIndicator = ({ isConnected }) => {
  const { theme } = useTheme();

  if (!FEATURES.OFFLINE_MODE || isConnected) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.warning }
    ]}>
      <Text style={[styles.text, { color: theme.colors.buttonText }]}>
        📡 You're offline. Changes will sync when reconnected.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: UI_CONFIG.SMALL_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    textAlign: 'center',
  },
});

export default NetworkStatusIndicator; 