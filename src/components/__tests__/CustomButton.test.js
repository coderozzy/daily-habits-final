import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomButton from '../CustomButton';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithTheme = (component) => {
  const TestWrapper = ({ children }) => (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
  return render(component, { wrapper: TestWrapper });
};

describe('CustomButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('should render button with title', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Test Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Test Button" onPress={mockOnPress} />
    );
    
    const button = getByText('Test Button');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = renderWithTheme(
      <CustomButton title="Disabled Button" onPress={mockOnPress} disabled />
    );

    const button = getByText('Disabled Button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should render primary variant by default', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Primary Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Primary Button')).toBeTruthy();
  });

  it('should render secondary variant correctly', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Secondary Button" onPress={mockOnPress} variant="secondary" />
    );
    
    expect(getByText('Secondary Button')).toBeTruthy();
  });

  it('should render danger variant correctly', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Danger Button" onPress={mockOnPress} variant="danger" />
    );
    
    expect(getByText('Danger Button')).toBeTruthy();
  });

  it('should apply custom style prop', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = renderWithTheme(
      <CustomButton title="Styled Button" onPress={jest.fn()} style={customStyle} />
    );

    const button = getByText('Styled Button').parent;
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  it('should apply custom text style prop', () => {
    const customTextStyle = { fontWeight: 'bold' };
    const { getByText } = renderWithTheme(
      <CustomButton 
        title="Text Styled Button" 
        onPress={mockOnPress} 
        textStyle={customTextStyle}
      />
    );
    
    const buttonText = getByText('Text Styled Button');
    expect(buttonText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customTextStyle)
      ])
    );
  });

  it('should handle unknown variant gracefully', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Unknown Variant" onPress={mockOnPress} variant="unknown" />
    );
    
    expect(getByText('Unknown Variant')).toBeTruthy();
  });

  it('should show disabled styling when disabled', () => {
    const { getByText } = renderWithTheme(
      <CustomButton title="Disabled Button" onPress={jest.fn()} disabled />
    );

    const button = getByText('Disabled Button').parent;
    const buttonText = getByText('Disabled Button');

    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.5 })
      ])
    );

    expect(buttonText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.5 })
      ])
    );
  });
}); 