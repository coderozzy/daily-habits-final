jest.mock('../models/Device', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-device-id',
    save: jest.fn().mockResolvedValue({ _id: 'mock-device-id', ...data }),
    isApiKeyExpired: jest.fn().mockReturnValue(false),
    extendApiKeyExpiry: jest.fn().mockResolvedValue({})
  }));
});

jest.mock('../models/Metrics', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-metrics-id',
    save: jest.fn().mockResolvedValue({ _id: 'mock-metrics-id', ...data })
  }));
});

describe('Model Tests', () => {
  describe('Device Model Structure', () => {
    test('should create device data object', () => {
      const deviceData = testUtils.createTestDevice();
      expect(deviceData.deviceId).toBe('test-device-123');
      expect(deviceData.model).toBe('Test Device');
      expect(deviceData.apiKey).toBeDefined();
    });

    test('should accept custom device data', () => {
      const customDevice = testUtils.createTestDevice({
        deviceId: 'custom-device',
        model: 'Custom Model'
      });
      expect(customDevice.deviceId).toBe('custom-device');
      expect(customDevice.model).toBe('Custom Model');
    });
  });

  describe('Metrics Model Structure', () => {
    test('should create metrics data object', () => {
      const metricsData = testUtils.createTestMetrics();
      expect(metricsData.deviceId).toBe('test-device-123');
      expect(Array.isArray(metricsData.habits)).toBe(true);
      expect(metricsData.syncedAt).toBeInstanceOf(Date);
    });

    test('should accept custom metrics data', () => {
      const customMetrics = testUtils.createTestMetrics({
        deviceId: 'custom-device',
        habits: [testUtils.createTestHabit()]
      });
      expect(customMetrics.deviceId).toBe('custom-device');
      expect(customMetrics.habits).toHaveLength(1);
    });
  });

  describe('Habit Structure', () => {
    test('should create habit data object', () => {
      const habitData = testUtils.createTestHabit();
      expect(habitData.name).toBe('Test Habit');
      expect(habitData.frequency).toBe('daily');
      expect(Array.isArray(habitData.customDays)).toBe(true);
    });

    test('should accept custom habit data', () => {
      const customHabit = testUtils.createTestHabit({
        name: 'Custom Habit',
        frequency: 'weekly'
      });
      expect(customHabit.name).toBe('Custom Habit');
      expect(customHabit.frequency).toBe('weekly');
    });
  });
}); 