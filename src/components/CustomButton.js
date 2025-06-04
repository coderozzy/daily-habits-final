import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { createShadowStyle } from '../theme';
import { UI_CONFIG } from '../config';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.button,
      ...createShadowStyle(theme, 'small'),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.buttonPrimary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.buttonSecondary,
          borderWidth: UI_CONFIG.THIN_BORDER,
          borderColor: theme.colors.buttonPrimary,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.buttonDanger,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.buttonPrimary,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return {
          ...styles.text,
          color: theme.colors.buttonText,
        };
      case 'secondary':
        return {
          ...styles.text,
          color: theme.colors.buttonTextSecondary,
        };
      default:
        return {
          ...styles.text,
          color: theme.colors.buttonText,
        };
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && { 
          backgroundColor: theme.colors.disabled,
          opacity: UI_CONFIG.DISABLED_OPACITY 
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={[
        getTextStyle(),
        disabled && { 
          color: theme.colors.textSecondary,
          opacity: UI_CONFIG.DISABLED_OPACITY 
        },
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: UI_CONFIG.INPUT_PADDING,
    borderRadius: UI_CONFIG.BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: UI_CONFIG.SMALL_ELEVATION,
  },
  text: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomButton; 