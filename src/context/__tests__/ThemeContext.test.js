import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestComponent = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  return (
    <>
      <Text testID="theme-name">{isDarkMode ? 'dark' : 'light'}</Text>
      <Text testID="primary-color">{theme.colors.primary}</Text>
      <Text testID="toggle-function">{typeof toggleTheme}</Text>
    </>
  );
};

const ComponentWithoutProvider = () => {
  try {
    const { theme } = useTheme();
    return <Text testID="theme-used">{theme.colors.primary}</Text>;
  } catch (error) {
    return <Text testID="error-message">{error.message}</Text>;
  }
};

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ThemeProvider', () => {
    it('should provide theme context to child components', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('theme-name')).toBeTruthy();
      expect(getByTestId('primary-color')).toBeTruthy();
      expect(getByTestId('toggle-function').children[0]).toBe('function');
    });

    it('should start with light theme by default', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('theme-name').children[0]).toBe('light');
    });

    it('should provide theme colors from light theme', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const primaryColor = getByTestId('primary-color').children[0];
      expect(typeof primaryColor).toBe('string');
      expect(primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const { getByTestId } = render(<ComponentWithoutProvider />);

      expect(getByTestId('error-message').children[0]).toContain(
        'Cannot read properties of undefined'
      );
    });

    it('should provide theme context values', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('theme-name')).toBeTruthy();
      expect(getByTestId('primary-color')).toBeTruthy();
      expect(getByTestId('toggle-function').children[0]).toBe('function');
    });
  });

  describe('Theme structure', () => {
    const ThemeStructureTest = () => {
      const { theme } = useTheme();
      return (
        <>
          <Text testID="has-colors">{theme.colors ? 'true' : 'false'}</Text>
          <Text testID="has-primary">{theme.colors.primary ? 'true' : 'false'}</Text>
          <Text testID="has-background">{theme.colors.background ? 'true' : 'false'}</Text>
          <Text testID="has-text">{theme.colors.text ? 'true' : 'false'}</Text>
          <Text testID="has-card">{theme.colors.card ? 'true' : 'false'}</Text>
        </>
      );
    };

    it('should have proper theme structure', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeStructureTest />
        </ThemeProvider>
      );

      expect(getByTestId('has-colors').children[0]).toBe('true');
      expect(getByTestId('has-primary').children[0]).toBe('true');
      expect(getByTestId('has-background').children[0]).toBe('true');
      expect(getByTestId('has-text').children[0]).toBe('true');
      expect(getByTestId('has-card').children[0]).toBe('true');
    });
  });
}); 