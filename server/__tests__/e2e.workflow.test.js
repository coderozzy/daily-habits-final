const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

const mockDevices = new Map();
const mockMetrics = new Map();

const Device = {
  findOne: jest.fn(({ deviceId, apiKey }) => {
    if (deviceId) {
      return Promise.resolve(mockDevices.get(deviceId) || null);
    }
    if (apiKey) {
      for (const device of mockDevices.values()) {
        if (device.apiKey === apiKey) return Promise.resolve(device);
      }
      return Promise.resolve(null);
    }
    return Promise.resolve(null);
  }),
  prototype: {
    save: jest.fn(function() {
      mockDevices.set(this.deviceId, this);
      return Promise.resolve(this);
    }),
    isApiKeyExpired: jest.fn(() => false),
    extendApiKeyExpiry: jest.fn(function() {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      this.apiKeyExpiry = newExpiry;
      return Promise.resolve();
    })
  }
};

const Metrics = {
  findOne: jest.fn(({ deviceId }) => {
    return Promise.resolve(mockMetrics.get(deviceId) || null);
  }),
  findOneAndUpdate: jest.fn((filter, update) => {
    const deviceId = filter.deviceId;
    const metrics = {
      deviceId,
      habits: update.habits || [],
      syncedAt: update.syncedAt || new Date(),
      ...update
    };
    mockMetrics.set(deviceId, metrics);
    return Promise.resolve(metrics);
  })
};

function MockDevice(data) {
  Object.assign(this, data);
  this.registeredAt = new Date();
  this.lastActive = new Date();
  this.apiKeyExpiry = new Date();
  this.apiKeyExpiry.setDate(this.apiKeyExpiry.getDate() + 30);
  
  this.save = jest.fn(() => {
    mockDevices.set(this.deviceId, this);
    return Promise.resolve(this);
  });
  this.isApiKeyExpired = jest.fn(() => false);
  this.extendApiKeyExpiry = jest.fn(() => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    this.apiKeyExpiry = newExpiry;
    return Promise.resolve();
  });
}
MockDevice.prototype = Device.prototype;
MockDevice.findOne = Device.findOne;

const authController = {
  registerDevice: async (req, res) => {
    try {
      const { deviceId, model, osName, osVersion } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request data'
        });
      }
      
      let device = await MockDevice.findOne({ deviceId });
      
      if (device) {
        if (device.isApiKeyExpired()) {
          device.apiKey = crypto.randomBytes(32).toString('hex');
          await device.extendApiKeyExpiry();
          device.isApiKeyExpired = jest.fn(() => false);
          await device.save();
          
          return res.status(200).json({ 
            success: true, 
            apiKey: device.apiKey,
            message: 'API key renewed due to expiry'
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          apiKey: device.apiKey,
          message: 'Device already registered'
        });
      }
      
      const apiKey = crypto.randomBytes(32).toString('hex');
      
      device = new MockDevice({
        deviceId,
        apiKey,
        model: model || 'Unknown',
        osName: osName || 'Unknown',
        osVersion: osVersion || 'Unknown'
      });
      
      await device.save();
      
      res.status(201).json({ 
        success: true, 
        apiKey,
        message: 'Device registered successfully'
      });
    } catch (error) {
      console.error('Device registration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error'
      });
    }
  }
};

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'API key required'
      });
    }
    
    const device = await MockDevice.findOne({ apiKey });
    
    if (!device) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid API key'
      });
    }
    
    if (device.isApiKeyExpired()) {
      return res.status(403).json({ 
        success: false, 
        error: 'API key has expired'
      });
    }
    
    device.lastActive = new Date();
    await device.save();
    
    req.device = device;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
};

const metricsController = {
  syncHabits: async (req, res) => {
    try {
      const { habits } = req.body;
      const { deviceId } = req.device;
      
      if (!habits || !Array.isArray(habits)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request data'
        });
      }
      
      const metrics = await Metrics.findOneAndUpdate(
        { deviceId },
        {
          deviceId,
          habits,
          syncedAt: new Date()
        },
        { 
          upsert: true,
          new: true,
          runValidators: true
        }
      );
      
      res.status(200).json({
        success: true,
        message: 'Habits synced successfully',
        data: { syncedAt: metrics.syncedAt }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  getMetrics: async (req, res) => {
    try {
      const { deviceId } = req.device;
      
      const metrics = await Metrics.findOne({ deviceId });
      
      if (!metrics) {
        return res.status(200).json({
          success: true,
          data: { habits: [] }
        });
      }
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/api/auth/register', authController.registerDevice);
  
  app.use('/api/metrics*', validateApiKey);
  app.post('/api/metrics/sync', metricsController.syncHabits);
  app.get('/api/metrics', metricsController.getMetrics);
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
};

describe('End-to-End Workflow Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    mockDevices.clear();
    mockMetrics.clear();
    jest.clearAllMocks();
    
    Device.findOne.mockImplementation(({ deviceId, apiKey }) => {
      if (deviceId) {
        return Promise.resolve(mockDevices.get(deviceId) || null);
      }
      if (apiKey) {
        for (const device of mockDevices.values()) {
          if (device.apiKey === apiKey) return Promise.resolve(device);
        }
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    
    Metrics.findOne.mockImplementation(({ deviceId }) => {
      return Promise.resolve(mockMetrics.get(deviceId) || null);
    });
    
    Metrics.findOneAndUpdate.mockImplementation((filter, update) => {
      const deviceId = filter.deviceId;
      const metrics = {
        deviceId,
        habits: update.habits || [],
        syncedAt: update.syncedAt || new Date(),
        ...update
      };
      mockMetrics.set(deviceId, metrics);
      return Promise.resolve(metrics);
    });
  });

  describe('Complete User Journey', () => {
    test('should handle complete new user onboarding flow', async () => {
      const deviceId = 'new-user-device-001';
      const deviceInfo = {
        deviceId,
        model: 'iPhone 15 Pro',
        osName: 'iOS',
        osVersion: '17.1.0'
      };

      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send(deviceInfo)
        .expect(201);

      expect(registrationResponse.body.success).toBe(true);
      expect(registrationResponse.body.apiKey).toBeDefined();
      expect(registrationResponse.body.message).toBe('Device registered successfully');

      const apiKey = registrationResponse.body.apiKey;

      const initialMetricsResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(initialMetricsResponse.body.success).toBe(true);
      expect(initialMetricsResponse.body.data.habits).toEqual([]);

      const initialHabits = [
        testUtils.createTestHabit({ 
          name: 'Morning Exercise',
          frequency: 'daily'
        }),
        testUtils.createTestHabit({ 
          name: 'Read for 30 minutes',
          frequency: 'daily'
        })
      ];

      const firstSyncResponse = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: initialHabits })
        .expect(200);

      expect(firstSyncResponse.body.success).toBe(true);
      expect(firstSyncResponse.body.message).toBe('Habits synced successfully');

      const verificationResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(verificationResponse.body.data.habits).toHaveLength(2);
      expect(verificationResponse.body.data.habits.map(h => h.name))
        .toEqual(['Morning Exercise', 'Read for 30 minutes']);
    });

    test('should handle existing user returning workflow', async () => {
      const deviceId = 'returning-user-device';
      const apiKey = 'existing-api-key-123';

      const existingDevice = new MockDevice({
        deviceId,
        apiKey,
        model: 'Samsung Galaxy S23',
        osName: 'Android',
        osVersion: '14.0'
      });
      await existingDevice.save();

      const existingHabits = [
        testUtils.createTestHabit({ 
          name: 'Existing Habit',
          streak: 10,
          completedDates: ['2024-01-01', '2024-01-02']
        })
      ];

      await Metrics.findOneAndUpdate(
        { deviceId },
        { deviceId, habits: existingHabits, syncedAt: new Date() },
        { upsert: true }
      );

      const reRegistrationResponse = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(200);

      expect(reRegistrationResponse.body.success).toBe(true);
      expect(reRegistrationResponse.body.apiKey).toBe(apiKey);
      expect(reRegistrationResponse.body.message).toBe('Device already registered');

      const metricsResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(metricsResponse.body.data.habits).toHaveLength(1);
      expect(metricsResponse.body.data.habits[0].name).toBe('Existing Habit');
      expect(metricsResponse.body.data.habits[0].streak).toBe(10);

      const updatedHabits = [
        { ...existingHabits[0], streak: 11, completedDates: [...existingHabits[0].completedDates, '2024-01-03'] },
        testUtils.createTestHabit({ name: 'New Habit Added' })
      ];

      const updateResponse = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: updatedHabits })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      const finalResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(finalResponse.body.data.habits).toHaveLength(2);
      expect(finalResponse.body.data.habits[0].streak).toBe(11);
      expect(finalResponse.body.data.habits[0].completedDates).toHaveLength(3);
      expect(finalResponse.body.data.habits[1].name).toBe('New Habit Added');
    });
  });

  describe('Multi-Device Scenarios', () => {
    test('should handle multiple devices for same user', async () => {
      const devices = [
        { deviceId: 'user-phone-001', model: 'iPhone 15', osName: 'iOS' },
        { deviceId: 'user-tablet-001', model: 'iPad Pro', osName: 'iPadOS' },
        { deviceId: 'user-watch-001', model: 'Apple Watch', osName: 'watchOS' }
      ];

      const apiKeys = [];

      for (const device of devices) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(device)
          .expect(201);

        apiKeys.push(response.body.apiKey);
        expect(response.body.success).toBe(true);
      }

      const uniqueKeys = new Set(apiKeys);
      expect(uniqueKeys.size).toBe(3);

      for (let i = 0; i < devices.length; i++) {
        const habits = [testUtils.createTestHabit({ name: `Device ${i + 1} Habit` })];
        
        const response = await request(app)
          .post('/api/metrics/sync')
          .set('x-api-key', apiKeys[i])
          .send({ habits })
          .expect(200);

        expect(response.body.success).toBe(true);
      }

      for (let i = 0; i < devices.length; i++) {
        const response = await request(app)
          .get('/api/metrics')
          .set('x-api-key', apiKeys[i])
          .expect(200);

        expect(response.body.data.habits).toHaveLength(1);
        expect(response.body.data.habits[0].name).toBe(`Device ${i + 1} Habit`);
      }
    });

    test('should prevent cross-device data access', async () => {
      const device1 = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'secure-device-1' })
        .expect(201);

      const device2 = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'secure-device-2' })
        .expect(201);

      const apiKey1 = device1.body.apiKey;
      const apiKey2 = device2.body.apiKey;

      const sensitiveHabits = [testUtils.createTestHabit({ name: 'Private Habit' })];
      
      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey1)
        .send({ habits: sensitiveHabits })
        .expect(200);

      const device2Response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey2)
        .expect(200);

      expect(device2Response.body.data.habits).toEqual([]);

      await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'fake-api-key')
        .expect(403);
    });
  });

  describe('Habit Lifecycle Management', () => {
    test('should handle complete habit lifecycle', async () => {
      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'lifecycle-test-device' })
        .expect(201);

      const apiKey = registrationResponse.body.apiKey;

      const newHabit = testUtils.createTestHabit({
        name: 'Daily Walking',
        frequency: 'daily',
        streak: 0,
        completedDates: []
      });

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [newHabit] })
        .expect(200);

      newHabit.streak = 1;
      newHabit.completedDates = ['2024-01-01'];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [newHabit] })
        .expect(200);

      newHabit.streak = 4;
      newHabit.completedDates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [newHabit] })
        .expect(200);

      const secondHabit = testUtils.createTestHabit({
        name: 'Evening Reading',
        frequency: 'daily',
        streak: 0,
        completedDates: []
      });

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [newHabit, secondHabit] })
        .expect(200);

      newHabit.frequency = 'weekly';
      newHabit.customDays = ['monday', 'wednesday', 'friday'];
      secondHabit.streak = 5;
      secondHabit.completedDates = ['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14'];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [newHabit, secondHabit] })
        .expect(200);

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [secondHabit] })
        .expect(200);

      const finalResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(finalResponse.body.data.habits).toHaveLength(1);
      expect(finalResponse.body.data.habits[0].name).toBe('Evening Reading');
      expect(finalResponse.body.data.habits[0].streak).toBe(5);
    });

    test('should handle habit completion patterns', async () => {
      const device = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'pattern-test-device' })
        .expect(201);

      const apiKey = device.body.apiKey;

      const habits = [
        testUtils.createTestHabit({
          name: 'Daily Habit',
          frequency: 'daily',
          completedDates: ['2024-01-01', '2024-01-02', '2024-01-03'],
          streak: 3
        }),
        testUtils.createTestHabit({
          name: 'Weekly Habit',
          frequency: 'weekly',
          customDays: ['monday'],
          completedDates: ['2024-01-01', '2024-01-08'],
          streak: 2
        }),
        testUtils.createTestHabit({
          name: 'Custom Habit',
          frequency: 'custom',
          customDays: ['tuesday', 'thursday', 'saturday'],
          completedDates: ['2024-01-02', '2024-01-04'],
          streak: 2
        })
      ];

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits })
        .expect(200);

      expect(response.body.success).toBe(true);

      const retrieveResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      const retrievedHabits = retrieveResponse.body.data.habits;
      
      const dailyHabit = retrievedHabits.find(h => h.name === 'Daily Habit');
      expect(dailyHabit.frequency).toBe('daily');
      expect(dailyHabit.completedDates).toHaveLength(3);

      const weeklyHabit = retrievedHabits.find(h => h.name === 'Weekly Habit');
      expect(weeklyHabit.frequency).toBe('weekly');
      expect(weeklyHabit.customDays).toEqual(['monday']);

      const customHabit = retrievedHabits.find(h => h.name === 'Custom Habit');
      expect(customHabit.frequency).toBe('custom');
      expect(customHabit.customDays).toEqual(['tuesday', 'thursday', 'saturday']);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover gracefully from auth errors', async () => {
      const deviceId = 'error-recovery-device';
      
      const registration = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(201);

      const apiKey = registration.body.apiKey;

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [testUtils.createTestHabit()] })
        .expect(200);

      const device = mockDevices.get(deviceId);
      device.isApiKeyExpired = jest.fn(() => true);

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [testUtils.createTestHabit()] })
        .expect(403);

      const reRegistration = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(200);

      const newApiKey = reRegistration.body.apiKey;
      expect(newApiKey).not.toBe(apiKey);

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', newApiKey)
        .send({ habits: [testUtils.createTestHabit()] })
        .expect(200);
    });

    test('should handle partial data corruption gracefully', async () => {
      const device = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'corruption-test-device' })
        .expect(201);

      const apiKey = device.body.apiKey;

      const goodHabits = [
        testUtils.createTestHabit({ name: 'Good Habit 1' }),
        testUtils.createTestHabit({ name: 'Good Habit 2' })
      ];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: goodHabits })
        .expect(200);

      const mixedHabits = [
        testUtils.createTestHabit({ name: 'Good Habit 3' }),
        { name: null, invalid: 'data' }, // Corrupted habit
        testUtils.createTestHabit({ name: 'Good Habit 4' })
      ];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: mixedHabits });

      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('ok');

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', apiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'Recovery Habit' })] })
        .expect(200);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle rapid sequential operations', async () => {
      const device = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: 'rapid-ops-device' })
        .expect(201);

      const apiKey = device.body.apiKey;

      const operations = [];
      for (let i = 0; i < 20; i++) {
        const habit = testUtils.createTestHabit({ 
          name: `Rapid Habit ${i}`,
          streak: i 
        });
        
        operations.push(
          request(app)
            .post('/api/metrics/sync')
            .set('x-api-key', apiKey)
            .send({ habits: [habit] })
        );
      }

      const responses = await Promise.all(operations);

      expect(responses.every(r => r.status === 200)).toBe(true);

      const finalState = await request(app)
        .get('/api/metrics')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(finalState.body.data.habits).toHaveLength(1);
      expect(finalState.body.data.habits[0].name).toBe('Rapid Habit 19');
    });

    test('should maintain responsiveness under concurrent load', async () => {
      const deviceCount = 10;
      const devices = [];

      for (let i = 0; i < deviceCount; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ deviceId: `load-test-device-${i}` })
          .expect(201);
        
        devices.push({ deviceId: `load-test-device-${i}`, apiKey: response.body.apiKey });
      }

      const startTime = Date.now();
      
      const operations = devices.map(device => 
        request(app)
          .post('/api/metrics/sync')
          .set('x-api-key', device.apiKey)
          .send({ habits: [testUtils.createTestHabit({ name: `Habit for ${device.deviceId}` })] })
      );

      const responses = await Promise.all(operations);
      const endTime = Date.now();

      expect(responses.every(r => r.status === 200)).toBe(true);

      expect(endTime - startTime).toBeLessThan(5000);

      for (const device of devices) {
        const response = await request(app)
          .get('/api/metrics')
          .set('x-api-key', device.apiKey)
          .expect(200);

        expect(response.body.data.habits).toHaveLength(1);
        expect(response.body.data.habits[0].name).toBe(`Habit for ${device.deviceId}`);
      }
    });
  });
}); 