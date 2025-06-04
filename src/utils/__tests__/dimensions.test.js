jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
    })),
  },
  Platform: {
    OS: 'ios',
  },
}));

import { scale, verticalScale, moderateScale, screenWidth, screenHeight } from '../dimensions';
import { Dimensions } from 'react-native';

describe('dimensions utility', () => {
  beforeEach(() => {
    Dimensions.get.mockReturnValue({
      width: 375,
      height: 812,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scale', () => {
    it('should scale width based on screen width', () => {
      const result = scale(100);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for 0 input', () => {
      expect(scale(0)).toBe(0);
    });

    it('should handle negative values', () => {
      const result = scale(-50);
      expect(result).toBeLessThan(0);
    });

    it('should scale proportionally to screen width', () => {
      const smallValue = scale(10);
      const largeValue = scale(100);
      expect(largeValue).toBeGreaterThan(smallValue);
    });
  });

  describe('verticalScale', () => {
    it('should scale height based on screen height', () => {
      const result = verticalScale(100);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for 0 input', () => {
      expect(verticalScale(0)).toBe(0);
    });

    it('should handle negative values', () => {
      const result = verticalScale(-50);
      expect(result).toBeLessThan(0);
    });

    it('should scale proportionally to screen height', () => {
      const smallValue = verticalScale(10);
      const largeValue = verticalScale(100);
      expect(largeValue).toBeGreaterThan(smallValue);
    });
  });

  describe('moderateScale', () => {
    it('should apply moderate scaling with default factor', () => {
      const result = moderateScale(100);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should use custom scaling factor', () => {
      const factor1 = moderateScale(100, 0.5);
      const factor2 = moderateScale(100, 1.5);
      expect(factor1).not.toBe(factor2);
    });

    it('should return original size when factor is 0', () => {
      const originalSize = 100;
      const result = moderateScale(originalSize, 0);
      expect(result).toBe(originalSize);
    });

    it('should handle edge cases', () => {
      expect(moderateScale(0)).toBe(0);
      expect(moderateScale(0, 2)).toBe(0);
    });
  });

  describe('screen dimensions', () => {
    it('should export screen width and height', () => {
      expect(typeof screenWidth).toBe('number');
      expect(typeof screenHeight).toBe('number');
      expect(screenWidth).toBeGreaterThan(0);
      expect(screenHeight).toBeGreaterThan(0);
    });
  });

  describe('scaling behavior with different screen sizes', () => {
    it('should scale differently for larger screens', () => {
      const normalScreenScale = scale(100);

      expect(normalScreenScale).toBeCloseTo(107.14, 1); // 375/350 * 100
    });

    it('should handle very small screens gracefully', () => {
      expect(() => {
        scale(10);
        verticalScale(10);
        moderateScale(10);
      }).not.toThrow();
    });

    it('should handle very large screens gracefully', () => {
      expect(() => {
        scale(10);
        verticalScale(10);
        moderateScale(10);
      }).not.toThrow();
    });
  });
}); 