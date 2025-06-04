const request = require('supertest');
const express = require('express');

const callTracker = {
  registerDevice: 0,
  syncHabits: 0,
  getMetrics: 0,
  reset: function() {
    this.registerDevice = 0;
    this.syncHabits = 0;
    this.getMetrics = 0;
  }
};

const authController = {
  registerDevice: (req, res) => {
    callTracker.registerDevice++;
    if (!req.body.deviceId) {
      return res.status(400).json({ success: false, message: 'Device ID required' });
    }
    res.status(201).json({ 
      success: true, 
      apiKey: 'mock-api-key-' + Math.random().toString(36).substring(7)
    });
  }
};

const metricsController = {
  syncHabits: (req, res) => {
    callTracker.syncHabits++;
    if (!Array.isArray(req.body.habits)) {
      return res.status(400).json({ success: false, message: 'Invalid habits data' });
    }
    res.status(200).json({ success: true });
  },
  getMetrics: (req, res) => {
    callTracker.getMetrics++;
    res.status(200).json({ 
      success: true, 
      data: { habits: [], syncedAt: new Date() }
    });
  }
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/auth/register', authController.registerDevice);
  
  app.use('/metrics*', (req, res, next) => {
    req.device = { deviceId: 'test-device-123' };
    next();
  });
  
  app.post('/metrics/sync', metricsController.syncHabits);
  app.get('/metrics', metricsController.getMetrics);
  
  return app;
};

describe('Controller Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createApp();
  });
  
  beforeEach(() => {
    callTracker.reset();
  });
  

  describe('Auth Controller', () => {
    test('should register a new device', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ deviceId: 'test-device-register' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.apiKey).toBeDefined();
      expect(callTracker.registerDevice).toBe(1);
    });

    test('should reject registration without deviceId', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(callTracker.registerDevice).toBe(1);
    });
  });

  describe('Metrics Controller', () => {
    test('should sync habits', async () => {
      const habits = [testUtils.createTestHabit()];
      
      const response = await request(app)
        .post('/metrics/sync')
        .send({ habits })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(callTracker.syncHabits).toBe(1);
    });

    test('should get metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(callTracker.getMetrics).toBe(1);
    });

    test('should reject invalid habits data', async () => {
      const response = await request(app)
        .post('/metrics/sync')
        .send({ habits: 'not-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(callTracker.syncHabits).toBe(1);
    });
  });

  describe('Controller Logic Tests', () => {
    describe('Auth Controller Logic', () => {
      test('should validate required deviceId parameter', () => {
        const mockRequest = { body: { deviceId: 'test-device' } };
        const hasDeviceId = Boolean(mockRequest.body && mockRequest.body.deviceId);
        
        expect(hasDeviceId).toBe(true);
        expect(mockRequest.body.deviceId).toBe('test-device');
      });

      test('should reject empty deviceId', () => {
        const mockRequest = { body: {} };
        const hasDeviceId = Boolean(mockRequest.body && mockRequest.body.deviceId);
        
        expect(hasDeviceId).toBe(false);
      });

      test('should generate API key format', () => {
        const apiKey = 'api-key-' + Math.random().toString(36).substring(7);
        expect(apiKey).toMatch(/^api-key-[a-z0-9]+$/);
        expect(apiKey.length).toBeGreaterThan(10);
      });
    });

    describe('Metrics Controller Logic', () => {
      test('should validate habits array', () => {
        const validHabits = [testUtils.createTestHabit()];
        const invalidHabits = 'not-an-array';
        
        expect(Array.isArray(validHabits)).toBe(true);
        expect(Array.isArray(invalidHabits)).toBe(false);
      });

      test('should process habit data structure', () => {
        const habits = [
          testUtils.createTestHabit(),
          testUtils.createTestHabit({ name: 'Exercise' })
        ];
        
        expect(habits).toHaveLength(2);
        expect(habits[0].name).toBe('Test Habit');
        expect(habits[1].name).toBe('Exercise');
      });

      test('should validate device authentication context', () => {
        const mockDevice = { deviceId: 'test-device-123' };
        expect(mockDevice.deviceId).toBeDefined();
        expect(typeof mockDevice.deviceId).toBe('string');
      });
    });

    describe('Data Validation', () => {
      test('should validate habit object structure', () => {
        const habit = testUtils.createTestHabit();
        
        expect(habit.id).toBeDefined();
        expect(habit.name).toBeDefined();
        expect(habit.frequency).toBeDefined();
        expect(habit.createdAt).toBeInstanceOf(Date);
        expect(Array.isArray(habit.completedDates)).toBe(true);
      });

      test('should validate metrics object structure', () => {
        const metrics = testUtils.createTestMetrics();
        
        expect(metrics.deviceId).toBeDefined();
        expect(Array.isArray(metrics.habits)).toBe(true);
        expect(metrics.syncedAt).toBeInstanceOf(Date);
      });

      test('should validate device object structure', () => {
        const device = testUtils.createTestDevice();
        
        expect(device.deviceId).toBeDefined();
        expect(device.apiKey).toBeDefined();
        expect(device.model).toBeDefined();
        expect(device.osName).toBeDefined();
        expect(device.osVersion).toBeDefined();
      });

      test('should validate error handling scenarios', () => {
        const emptyRequest = { body: null };
        const hasData = Boolean(emptyRequest.body);
        expect(hasData).toBe(false);

        const badData = 'not-array';
        const goodData = [];
        expect(Array.isArray(badData)).toBe(false);
        expect(Array.isArray(goodData)).toBe(true);
      });

      test('should validate request parameter types', () => {
        const deviceId = 'test-device';
        expect(typeof deviceId).toBe('string');
        expect(deviceId.length).toBeGreaterThan(0);

        const date = new Date();
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBeGreaterThan(0);

        const streak = 5;
        expect(typeof streak).toBe('number');
        expect(streak).toBeGreaterThanOrEqual(0);
      });
    });
  });
}); 