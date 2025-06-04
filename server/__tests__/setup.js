// Mock mongoose and database operations
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    collections: {},
    close: jest.fn().mockResolvedValue({})
  },
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    methods: {}
  })),
  model: jest.fn()
}));

// Test utilities
const testUtils = {
  createTestHabit: (customData = {}) => {
    return {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Habit',
      frequency: 'daily',
      customDays: [],
      streak: 0,
      completedDates: [],
      createdAt: new Date(),
      lastCompleted: null,
      notes: '',
      ...customData
    };
  },

  createTestDevice: (customData = {}) => {
    const defaults = {
      deviceId: 'test-device-123',
      apiKey: 'test-api-key-123',
      model: 'Test Device',
      osName: 'TestOS',
      osVersion: '1.0.0',
      registeredAt: new Date(),
      lastActive: new Date(),
      apiKeyExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    // If customData contains a flag for unique values, generate them
    if (customData._unique) {
      delete customData._unique;
      defaults.deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      defaults.apiKey = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return { ...defaults, ...customData };
  },

  createTestMetrics: (customData = {}) => {
    const defaults = {
      deviceId: 'test-device-123',
      habits: [],
      syncedAt: new Date(),
    };
    
    // If customData contains a flag for unique values, generate them
    if (customData._unique) {
      delete customData._unique;
      defaults.deviceId = `device-${Date.now()}`;
    }
    
    return { ...defaults, ...customData };
  },

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};

// Make testUtils available globally and as a direct reference
global.testUtils = testUtils;
global.testUtils = testUtils;

// Make testUtils available as a global variable (not on global object)
Object.assign(global, { testUtils });

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for all tests
jest.setTimeout(15000);

// Global cleanup after all tests
afterAll(async () => {
  // Allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}); 