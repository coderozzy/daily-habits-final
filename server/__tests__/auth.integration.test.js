const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

const mockDevices = new Map();

const Device = {
  findOne: jest.fn().mockImplementation(({ deviceId, apiKey }) => {
    if (deviceId) {
      const device = mockDevices.get(deviceId);
      return Promise.resolve(device || null);
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

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/auth/register', authController.registerDevice);
  return app;
};

describe('Auth Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    mockDevices.clear();
    jest.clearAllMocks();
    
    Device.findOne.mockImplementation(({ deviceId, apiKey }) => {
      if (deviceId) {
        const device = mockDevices.get(deviceId);
        return Promise.resolve(device || null);
      }
      if (apiKey) {
        for (const device of mockDevices.values()) {
          if (device.apiKey === apiKey) return Promise.resolve(device);
        }
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
  });

  describe('Device Registration Flow', () => {
    test('should register a new device with minimal data', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(response.body.message).toBe('Device registered successfully');
    });

    test('should register a new device with full metadata', async () => {
      const deviceId = testUtils.generateRandomString(16);
      const deviceData = {
        deviceId,
        model: 'iPhone 15 Pro',
        osName: 'iOS',
        osVersion: '17.1.0'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(deviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.apiKey).toBeDefined();
      
      const savedDevice = mockDevices.get(deviceId);
      expect(savedDevice.model).toBe('iPhone 15 Pro');
      expect(savedDevice.osName).toBe('iOS');
      expect(savedDevice.osVersion).toBe('17.1.0');
    });

    test('should return existing device API key for re-registration', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(201);

      const originalApiKey = firstResponse.body.apiKey;

      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.apiKey).toBe(originalApiKey);
      expect(secondResponse.body.message).toBe('Device already registered');
    });

    test('should handle API key renewal for expired keys', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(201);

      const originalApiKey = response.body.apiKey;

      const device = mockDevices.get(deviceId);
      device.isApiKeyExpired = jest.fn(() => true);

      const renewalResponse = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(200);

      expect(renewalResponse.body.success).toBe(true);
      expect(renewalResponse.body.apiKey).toBeDefined();
      expect(renewalResponse.body.apiKey).not.toBe(originalApiKey);
      expect(renewalResponse.body.message).toBe('API key renewed due to expiry');
      expect(device.extendApiKeyExpiry).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    test('should reject registration without deviceId', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    test('should reject registration with empty deviceId', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    test('should reject registration with null deviceId', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: null })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    test('should handle very long deviceId gracefully', async () => {
      const longDeviceId = 'x'.repeat(1000);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: longDeviceId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.apiKey).toBeDefined();
    });

    test('should handle special characters in deviceId', async () => {
      const specialDeviceId = 'device-123!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: specialDeviceId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.apiKey).toBeDefined();
    });

    test('should set default values for missing optional fields', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(201);

      const savedDevice = mockDevices.get(deviceId);
      expect(savedDevice.model).toBe('Unknown');
      expect(savedDevice.osName).toBe('Unknown');
      expect(savedDevice.osVersion).toBe('Unknown');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      Device.findOne.mockImplementationOnce(() => Promise.reject(new Error('Database connection failed')));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: testUtils.generateRandomString(16) })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    test('should handle save errors gracefully', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const testApp = express();
      testApp.use(express.json());
      
      const testAuthController = {
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
            
            device.save = jest.fn(() => Promise.reject(new Error('Save failed')));
            
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
      
      testApp.post('/api/auth/register', testAuthController.registerDevice);

      const response = await request(testApp)
        .post('/api/auth/register')
        .send({ deviceId })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('API Key Generation', () => {
    test('should generate unique API keys for different devices', async () => {
      const device1Response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: testUtils.generateRandomString(16) })
        .expect(201);

      const device2Response = await request(app)
        .post('/api/auth/register')
        .send({ deviceId: testUtils.generateRandomString(16) })
        .expect(201);

      expect(device1Response.body.apiKey).toBeDefined();
      expect(device2Response.body.apiKey).toBeDefined();
      expect(device1Response.body.apiKey).not.toBe(device2Response.body.apiKey);
    });

    test('should generate cryptographically secure API keys', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ deviceId: testUtils.generateRandomString(16) })
          .expect(201);
        responses.push(response.body.apiKey);
      }

      const uniqueKeys = new Set(responses);
      expect(uniqueKeys.size).toBe(5);

      responses.forEach(apiKey => {
        expect(apiKey).toMatch(/^[a-f0-9]{64}$/);
      });
    });
  });

  describe('Concurrent Registration', () => {
    test('should handle multiple simultaneous registrations for same device', async () => {
      const deviceId = testUtils.generateRandomString(16);
      
      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/api/auth/register')
          .send({ deviceId })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
        expect(response.body.success).toBe(true);
        expect(response.body.apiKey).toBeDefined();
      });

      const apiKeys = responses.map(r => r.body.apiKey);
      const uniqueApiKeys = new Set(apiKeys);
      expect(uniqueApiKeys.size).toBe(1);
    });
  });
}); 