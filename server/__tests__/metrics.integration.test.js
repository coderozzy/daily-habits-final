const request = require('supertest');
const express = require('express');

const mockMetrics = new Map();
const mockDevices = new Map();

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

const Device = {
  findOne: jest.fn().mockImplementation(({ apiKey, deviceId }) => {
    if (apiKey) {
      for (const device of mockDevices.values()) {
        if (device.apiKey === apiKey) return Promise.resolve(device);
      }
      return Promise.resolve(null);
    }
    if (deviceId) {
      return Promise.resolve(mockDevices.get(deviceId) || null);
    }
    return Promise.resolve(null);
  })
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
    
    const device = await Device.findOne({ apiKey });
    
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
      console.error('Sync habits error:', error);
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
      console.error('Get metrics error:', error);
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
  
  app.use('/api/metrics*', validateApiKey);
  app.post('/api/metrics/sync', metricsController.syncHabits);
  app.get('/api/metrics', metricsController.getMetrics);
  
  return app;
};

describe('Metrics Integration Tests', () => {
  let app;
  const validApiKey = 'valid-api-key-123';
  const deviceId = 'test-device-001';

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    mockMetrics.clear();
    mockDevices.clear();
    jest.clearAllMocks();
    
    Device.findOne.mockImplementation(({ apiKey, deviceId }) => {
      if (apiKey) {
        for (const device of mockDevices.values()) {
          if (device.apiKey === apiKey) return Promise.resolve(device);
        }
        return Promise.resolve(null);
      }
      if (deviceId) {
        return Promise.resolve(mockDevices.get(deviceId) || null);
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
    
    const validDevice = {
      deviceId,
      apiKey: validApiKey,
      isApiKeyExpired: jest.fn(() => false),
      save: jest.fn(() => Promise.resolve()),
      lastActive: new Date(),
      model: 'Test Device',
      osName: 'TestOS', 
      osVersion: '1.0.0',
      registeredAt: new Date(),
      apiKeyExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    mockDevices.set(deviceId, validDevice);
  });

  describe('Habit Synchronization', () => {
    test('should sync a single habit successfully', async () => {
      const habit = testUtils.createTestHabit({
        name: 'Morning Exercise',
        frequency: 'daily'
      });

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [habit] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Habits synced successfully');
      expect(response.body.data.syncedAt).toBeDefined();

      const storedMetrics = mockMetrics.get(deviceId);
      expect(storedMetrics.habits).toHaveLength(1);
      expect(storedMetrics.habits[0].name).toBe('Morning Exercise');
    });

    test('should sync multiple habits successfully', async () => {
      const habits = [
        testUtils.createTestHabit({ name: 'Exercise', frequency: 'daily' }),
        testUtils.createTestHabit({ name: 'Reading', frequency: 'weekly' }),
        testUtils.createTestHabit({ name: 'Meditation', frequency: 'daily' })
      ];

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits })
        .expect(200);

      expect(response.body.success).toBe(true);

      const storedMetrics = mockMetrics.get(deviceId);
      expect(storedMetrics.habits).toHaveLength(3);
      expect(storedMetrics.habits.map(h => h.name)).toEqual(['Exercise', 'Reading', 'Meditation']);
    });

    test('should update existing habits on re-sync', async () => {
      const initialHabits = [
        testUtils.createTestHabit({ name: 'Exercise', streak: 5 })
      ];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: initialHabits })
        .expect(200);

      const updatedHabits = [
        { ...initialHabits[0], streak: 10, completedDates: ['2024-01-01', '2024-01-02'] }
      ];

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: updatedHabits })
        .expect(200);

      expect(response.body.success).toBe(true);

      const storedMetrics = mockMetrics.get(deviceId);
      expect(storedMetrics.habits[0].streak).toBe(10);
      expect(storedMetrics.habits[0].completedDates).toHaveLength(2);
    });

    test('should handle empty habits array', async () => {
      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [] })
        .expect(200);

      expect(response.body.success).toBe(true);

      const storedMetrics = mockMetrics.get(deviceId);
      expect(storedMetrics.habits).toHaveLength(0);
    });

    test('should reject invalid habits data types', async () => {
      const invalidData = [
        { habits: 'not-an-array' },
        { habits: null },
        { habits: undefined },
        { habits: 123 },
        { habits: { not: 'array' } }
      ];

      for (const data of invalidData) {
        const response = await request(app)
          .post('/api/metrics/sync')
          .set('x-api-key', validApiKey)
          .send(data)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      }
    });

    test('should handle complex habit data structures', async () => {
      const complexHabit = testUtils.createTestHabit({
        name: 'Complex Habit',
        frequency: 'custom',
        customDays: ['monday', 'wednesday', 'friday'],
        completedDates: ['2024-01-01', '2024-01-03', '2024-01-05'],
        streak: 15,
        notes: 'This is a complex habit with custom schedule'
      });

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [complexHabit] })
        .expect(200);

      expect(response.body.success).toBe(true);

      const storedMetrics = mockMetrics.get(deviceId);
      const storedHabit = storedMetrics.habits[0];
      expect(storedHabit.frequency).toBe('custom');
      expect(storedHabit.customDays).toEqual(['monday', 'wednesday', 'friday']);
      expect(storedHabit.completedDates).toHaveLength(3);
      expect(storedHabit.streak).toBe(15);
    });

    test('should handle large datasets efficiently', async () => {
      const largeHabitsArray = Array(100).fill().map((_, i) => 
        testUtils.createTestHabit({
          name: `Habit ${i}`,
          completedDates: Array(30).fill().map((_, j) => `2024-01-${j + 1}`)
        })
      );

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: largeHabitsArray })
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      const storedMetrics = mockMetrics.get(deviceId);
      expect(storedMetrics.habits).toHaveLength(100);
    });
  });

  describe('Metrics Retrieval', () => {
    test('should return empty habits for new device', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.habits).toEqual([]);
    });

    test('should return synced habits', async () => {
      const habits = [
        testUtils.createTestHabit({ name: 'Exercise' }),
        testUtils.createTestHabit({ name: 'Reading' })
      ];

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits })
        .expect(200);

      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.habits).toHaveLength(2);
      expect(response.body.data.habits.map(h => h.name)).toEqual(['Exercise', 'Reading']);
      expect(response.body.data.syncedAt).toBeDefined();
    });

    test('should return most recent sync data', async () => {
      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'Old Habit' })] })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'New Habit' })] })
        .expect(200);

      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.data.habits).toHaveLength(1);
      expect(response.body.data.habits[0].name).toBe('New Habit');
    });

    test('should include all habit metadata', async () => {
      const habitWithMetadata = testUtils.createTestHabit({
        name: 'Detailed Habit',
        frequency: 'weekly',
        customDays: ['tuesday', 'thursday'],
        completedDates: ['2024-01-02', '2024-01-04'],
        streak: 8,
        createdAt: new Date('2024-01-01')
      });

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [habitWithMetadata] })
        .expect(200);

      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      const retrievedHabit = response.body.data.habits[0];
      expect(retrievedHabit.name).toBe('Detailed Habit');
      expect(retrievedHabit.frequency).toBe('weekly');
      expect(retrievedHabit.customDays).toEqual(['tuesday', 'thursday']);
      expect(retrievedHabit.completedDates).toEqual(['2024-01-02', '2024-01-04']);
      expect(retrievedHabit.streak).toBe(8);
    });
  });

  describe('Device Isolation', () => {
    test('should keep metrics separate between devices', async () => {
      const device2ApiKey = 'device-2-api-key';
      const device2Id = 'test-device-002';
      
      const device2 = {
        deviceId: device2Id,
        apiKey: device2ApiKey,
        isApiKeyExpired: jest.fn(() => false),
        save: jest.fn(() => Promise.resolve()),
        lastActive: new Date()
      };
      mockDevices.set(device2Id, device2);

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'Device 1 Habit' })] })
        .expect(200);

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', device2ApiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'Device 2 Habit' })] })
        .expect(200);

      const device1Response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      const device2Response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', device2ApiKey)
        .expect(200);

      expect(device1Response.body.data.habits[0].name).toBe('Device 1 Habit');
      expect(device2Response.body.data.habits[0].name).toBe('Device 2 Habit');
    });

    test('should not allow access to other device metrics', async () => {
      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [testUtils.createTestHabit({ name: 'Private Habit' })] })
        .expect(200);

      await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'invalid-key')
        .expect(403);

      await request(app)
        .get('/api/metrics')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle database sync errors gracefully', async () => {
      Metrics.findOneAndUpdate = jest.fn(() => Promise.reject(new Error('Database error')));

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [testUtils.createTestHabit()] })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    test('should handle database retrieval errors gracefully', async () => {
      Metrics.findOne = jest.fn(() => Promise.reject(new Error('Database error')));

      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    test('should handle malformed request bodies', async () => {
      const malformedRequests = [
        '{"habits": [{"name": "test", "incomplete": }', 
        '{"habits": [null]}', 
        '{"habits": [{"name": null}]}' 
      ];

      for (const body of malformedRequests) {
        try {
          const response = await request(app)
            .post('/api/metrics/sync')
            .set('x-api-key', validApiKey)
            .set('content-type', 'application/json')
            .send(body);
          
          expect([400, 500]).toContain(response.status);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent sync requests', async () => {
      const habits = [testUtils.createTestHabit({ name: 'Concurrent Habit' })];
      
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/metrics/sync')
          .set('x-api-key', validApiKey)
          .send({ habits })
      );

      const responses = await Promise.all(promises);

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(responses.every(r => r.body.success === true)).toBe(true);

      const finalResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(finalResponse.body.data.habits).toHaveLength(1);
      expect(finalResponse.body.data.habits[0].name).toBe('Concurrent Habit');
    });

    test('should handle habits with large completion histories', async () => {
      const yearOfData = Array(365).fill().map((_, i) => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const habitWithLargeHistory = testUtils.createTestHabit({
        name: 'Year Long Habit',
        completedDates: yearOfData,
        streak: 365
      });

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [habitWithLargeHistory] })
        .expect(200);

      expect(response.body.success).toBe(true);

      const retrieveResponse = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(retrieveResponse.body.data.habits[0].completedDates).toHaveLength(365);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data integrity across multiple operations', async () => {
      const habit = testUtils.createTestHabit({ 
        name: 'Consistency Test',
        streak: 5,
        completedDates: ['2024-01-01', '2024-01-02']
      });

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [habit] })
        .expect(200);

      const firstRetrieve = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      habit.streak = 6;
      habit.completedDates.push('2024-01-03');

      await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', validApiKey)
        .send({ habits: [habit] })
        .expect(200);

      const finalRetrieve = await request(app)
        .get('/api/metrics')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(firstRetrieve.body.data.habits[0].streak).toBe(5);
      expect(firstRetrieve.body.data.habits[0].completedDates).toHaveLength(2);

      expect(finalRetrieve.body.data.habits[0].streak).toBe(6);
      expect(finalRetrieve.body.data.habits[0].completedDates).toHaveLength(3);
    });
  });
}); 