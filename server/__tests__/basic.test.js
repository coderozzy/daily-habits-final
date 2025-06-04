describe('Basic Tests', () => {
  test('should have working test environment', () => {
    expect(typeof jest).toBe('object');
    expect(jest.fn).toBeDefined();
  });

  test('should have testUtils available', () => {
    expect(global.testUtils).toBeDefined();
    expect(typeof global.testUtils.createTestDevice).toBe('function');
  });

  test('should create test data correctly', () => {
    const device = global.testUtils.createTestDevice();
    expect(device.deviceId).toBe('test-device-123');
    expect(device.model).toBe('Test Device');

    const habit = global.testUtils.createTestHabit();
    expect(habit.name).toBe('Test Habit');
    expect(habit.frequency).toBe('daily');

    const metrics = global.testUtils.createTestMetrics();
    expect(metrics.deviceId).toBe('test-device-123');
    expect(Array.isArray(metrics.habits)).toBe(true);
  });
}); 