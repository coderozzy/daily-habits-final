import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { lightTheme } from '../theme';
import { UI_CONFIG } from '../config';

export const ThemedErrorScreen = ({ error, retry }) => (
  <View style={[styles.container, { backgroundColor: lightTheme.colors.background }]}>
    <Text style={[styles.errorTitle, { color: lightTheme.colors.error }]}>
      Something went wrong
    </Text>
    <Text style={[styles.errorMessage, { color: lightTheme.colors.text }]}>
      {error || 'An unexpected error occurred'}
    </Text>
    <TouchableOpacity style={[styles.retryButton, { backgroundColor: lightTheme.colors.primary }]} onPress={retry}>
      <Text style={[styles.retryText, { color: lightTheme.colors.background }]}>
        Try Again
      </Text>
    </TouchableOpacity>
  </View>
);

const ErrorScreen = ({ error, retry }) => (
  <ThemedErrorScreen error={error} retry={retry} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.CONTAINER_PADDING,
  },
  errorTitle: {
    fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
    fontWeight: 'bold',
    marginBottom: UI_CONFIG.EXTRA_LARGE_MARGIN,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    textAlign: 'center',
    lineHeight: UI_CONFIG.MEDIUM_LINE_HEIGHT,
    marginBottom: UI_CONFIG.EXTRA_EXTRA_LARGE_MARGIN,
  },
  retryButton: {
    paddingHorizontal: UI_CONFIG.LARGE_PADDING,
    paddingVertical: UI_CONFIG.MEDIUM_PADDING,
    borderRadius: UI_CONFIG.SMALL_PADDING,
    alignItems: 'center',
  },
  retryText: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    fontWeight: '600',
  },
});

export default ErrorScreen; 