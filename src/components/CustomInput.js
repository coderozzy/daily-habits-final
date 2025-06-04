import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UI_CONFIG } from '../config';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.inputError : theme.colors.inputBorder,
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.inputText,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.colors.inputPlaceholder}
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.inputError }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: UI_CONFIG.SAFE_AREA_PADDING,
  },
  label: {
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
    marginBottom: UI_CONFIG.SMALL_PADDING,
  },
  input: {
    borderWidth: UI_CONFIG.THIN_BORDER,
    padding: UI_CONFIG.INPUT_PADDING,
    borderRadius: UI_CONFIG.INPUT_BORDER_RADIUS,
    fontSize: UI_CONFIG.LARGE_FONT_SIZE,
  },
  errorText: {
    fontSize: UI_CONFIG.MEDIUM_FONT_SIZE,
    marginTop: UI_CONFIG.VERY_SMALL_PADDING,
  },
});

export default CustomInput; 