import { Platform } from 'react-native';
import { UI_CONFIG } from './config/appConfig';

// Base theme structure
const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: UI_CONFIG.LARGE_TITLE_FONT_SIZE,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: UI_CONFIG.SUBTITLE_FONT_SIZE,
      fontWeight: '600',
    },
    h3: {
      fontSize: UI_CONFIG.EXTRA_LARGE_FONT_SIZE,
      fontWeight: '600',
    },
    body: {
      fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    },
    caption: {
      fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    },
  },
  shadows: {
    small: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: UI_CONFIG.SHADOW_OPACITY,
      shadowRadius: 1.41,
      elevation: UI_CONFIG.SMALL_ELEVATION,
    },
    medium: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: UI_CONFIG.SHADOW_MEDIUM_OPACITY,
      shadowRadius: 3.84,
      elevation: UI_CONFIG.LARGE_ELEVATION,
    },
  },
};

// Light theme
export const lightTheme = {
  ...baseTheme,
  colors: {
    // Primary colors
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#6dd5ed',
    
    // Background colors
    background: '#FFFFFF',
    card: '#F2F2F7',
    surface: '#f7faff',
    overlay: 'rgba(0,0,0,0.1)',
    
    // Text colors
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#666666',
    textMuted: '#333333',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#C6C6C8',
    borderLight: '#ddd',
    
    // Status colors
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#4A90E2',
    
    // Interactive colors
    link: '#007AFF',
    disabled: '#BDBDBD',
    
    // Button specific colors
    buttonPrimary: '#007AFF',
    buttonSecondary: 'transparent',
    buttonDanger: '#FF3B30',
    buttonText: '#FFFFFF',
    buttonTextSecondary: '#007AFF',
    
    // Input specific colors
    inputBackground: '#FFFFFF',
    inputBorder: '#ddd',
    inputText: '#000000',
    inputPlaceholder: '#999999',
    inputError: '#ff3b30',
    
    // Gradient colors
    gradientPrimary: ['#007AFF', '#6dd5ed'],
    gradientSecondary: ['#5856D6', '#2196F3'],
    
    // Shadow colors
    shadow: '#000000',
    
    // Special colors
    transparent: 'transparent',
    white: '#FFFFFF',
    black: '#000000',
    
    // Custom app colors
    habitCheckbox: '#4A90E2',
    headerSubtitle: '#f0f0f0',
    dayButtonInactive: '#e3e9f7',
    
    // Notification colors
    notificationLight: '#FF231F7C',
  },
  // Add computed shadows that use theme colors
  shadowStyles: {
    small: {
      ...baseTheme.shadows.small,
      shadowColor: '#000000',
    },
    medium: {
      ...baseTheme.shadows.medium,
      shadowColor: '#000000',
    },
  },
};

// Dark theme
export const darkTheme = {
  ...baseTheme,
  colors: {
    // Primary colors
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    accent: '#6dd5ed',
    
    // Background colors
    background: '#000000',
    card: '#1C1C1E',
    surface: '#2C2C2E',
    overlay: 'rgba(255,255,255,0.1)',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#666666',
    textMuted: '#CCCCCC',
    textInverse: '#000000',
    
    // Border colors
    border: '#38383A',
    borderLight: '#555',
    
    // Status colors
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#4A90E2',
    
    // Interactive colors
    link: '#0A84FF',
    disabled: '#666666',
    
    // Button specific colors
    buttonPrimary: '#0A84FF',
    buttonSecondary: 'transparent',
    buttonDanger: '#FF453A',
    buttonText: '#FFFFFF',
    buttonTextSecondary: '#0A84FF',
    
    // Input specific colors
    inputBackground: '#1C1C1E',
    inputBorder: '#555',
    inputText: '#FFFFFF',
    inputPlaceholder: '#8E8E93',
    inputError: '#FF453A',
    
    // Gradient colors
    gradientPrimary: ['#0A84FF', '#6dd5ed'],
    gradientSecondary: ['#5E5CE6', '#2196F3'],
    
    // Shadow colors
    shadow: '#000000',
    
    // Special colors
    transparent: 'transparent',
    white: '#FFFFFF',
    black: '#000000',
    
    // Custom app colors
    habitCheckbox: '#4A90E2',
    headerSubtitle: '#f0f0f0',
    dayButtonInactive: '#3C3C3E',
    
    // Notification colors
    notificationLight: '#FF231F7C',
  },
  // Add computed shadows that use theme colors
  shadowStyles: {
    small: {
      ...baseTheme.shadows.small,
      shadowColor: '#000000',
    },
    medium: {
      ...baseTheme.shadows.medium,
      shadowColor: '#000000',
    },
  },
};

// Default for backward compatibility
export const theme = lightTheme;

// Utility functions for styling
export const createThemedStyles = (styleFunction) => (theme) => styleFunction(theme);

export const getThemeColor = (theme, colorPath, fallback = '#000000') => {
  const keys = colorPath.split('.');
  let color = theme.colors;
  
  for (const key of keys) {
    if (color && color[key]) {
      color = color[key];
    } else {
      return fallback;
    }
  }
  
  return color;
};

export const createShadowStyle = (theme, shadowType = 'small') => {
  const shadowConfig = theme.shadowStyles?.[shadowType] || theme.shadows?.[shadowType] || {};
  
  // Return web-safe shadow styles
  if (Platform.OS === 'web') {
    const { shadowOffset, shadowOpacity, shadowRadius, shadowColor } = shadowConfig;
    return {
      boxShadow: `${shadowOffset?.width || 0}px ${shadowOffset?.height || 0}px ${shadowRadius || 0}px ${shadowColor || '#000000'}${Math.round((shadowOpacity || UI_CONFIG.WEB_SHADOW_OPACITY) * 255).toString(16).padStart(2, '0')}`,
    };
  }
  
  return shadowConfig;
}; 