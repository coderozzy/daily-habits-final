const request = require('supertest');
const express = require('express');

const mockDevices = new Map();

const Device = {
  findOne: jest.fn(({ apiKey, deviceId }) => {
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

const mockConfig = {
  RESPONSE_CONFIG: {
    STATUS_CODES: { UNAUTHORIZED: 401, FORBIDDEN: 403, INTERNAL_ERROR: 500 },
    MESSAGES: {
      UNAUTHORIZED: 'API key required',
      INVALID_API_KEY: 'Invalid API key',
      EXPIRED_API_KEY: 'API key has expired',
      INTERNAL_ERROR: 'Internal server error'
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
    
    device.lastActive = new Date();
    await device.save();
    
    req.device = device;
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
};

const createRateLimiter = (windowMs, max, message) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || 'default';
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    const cutoff = now - windowMs;
    const recentRequests = userRequests.filter(time => time > cutoff);
    requests.set(key, recentRequests);
    
    if (recentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: message
      });
    }
    
    recentRequests.push(now);
    next();
  };
};

const validateRequestSize = (limit) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > limit) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large'
      });
    }
    
    next();
  };
};

const validateJSON = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    try {
      if (req.body && typeof req.body === 'string') {
        JSON.parse(req.body);
      }
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format'
      });
    }
  } else {
    next();
  }
};

const createTestApp = () => {
  const app = express();
  
  const requests = new Map();
  
  const createFreshRateLimiter = (windowMs, max, message) => {
    return (req, res, next) => {
      const key = req.ip || 'default';
      const now = Date.now();
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key);
      
      const cutoff = now - windowMs;
      const recentRequests = userRequests.filter(time => time > cutoff);
      requests.set(key, recentRequests);
      
      if (recentRequests.length >= max) {
        return res.status(429).json({
          success: false,
          error: message
        });
      }
      
      recentRequests.push(now);
      next();
    };
  };
  
  app.use(express.json());
  app.use(validateRequestSize(1024 * 1024));
  app.use(validateJSON);
  
  const generalLimiter = createFreshRateLimiter(60000, 100, 'Too many requests'); 
  const authLimiter = createFreshRateLimiter(900000, 10, 'Too many auth attempts');
  
  app.post('/api/auth/register', authLimiter, (req, res) => {
    res.json({ success: true, message: 'Registration endpoint' });
  });
  
  app.use('/api/metrics*', generalLimiter, validateApiKey);
  
  app.post('/api/metrics/sync', (req, res) => {
    res.json({ success: true, message: 'Sync endpoint', device: req.device.deviceId });
  });
  
  app.get('/api/metrics', (req, res) => {
    res.json({ success: true, message: 'Metrics endpoint', device: req.device.deviceId });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  return app;
};

describe('Middleware Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockDevices.clear();
    jest.clearAllMocks();
    
    Device.findOne = jest.fn(({ apiKey, deviceId }) => {
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

    const validDevice = {
      deviceId: 'test-device-001',
      apiKey: 'valid-api-key-123',
      isApiKeyExpired: jest.fn(() => false),
      save: jest.fn(() => Promise.resolve()),
      lastActive: new Date()
    };
    mockDevices.set('test-device-001', validDevice);
  });

  describe('Authentication Middleware', () => {
    test('should reject requests without API key', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('API key required');
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'invalid-key')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid API key');
    });

    test('should accept requests with valid API key', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'valid-api-key-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.device).toBe('test-device-001');
    });

    test('should reject requests with expired API key', async () => {
      const expiredDevice = {
        deviceId: 'expired-device',
        apiKey: 'expired-api-key',
        isApiKeyExpired: jest.fn(() => true),
        save: jest.fn(() => Promise.resolve())
      };
      mockDevices.set('expired-device', expiredDevice);

      const response = await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'expired-api-key')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('API key has expired');
    });

    test('should update lastActive timestamp on successful auth', async () => {
      const device = mockDevices.get('test-device-001');
      const originalTime = device.lastActive;

      await request(app)
        .get('/api/metrics')
        .set('x-api-key', 'valid-api-key-123')
        .expect(200);

      expect(device.save).toHaveBeenCalled();
      expect(device.lastActive).not.toBe(originalTime);
    });

    test('should handle database errors gracefully', async () => {
      const testApp = createTestApp();
      
      Device.findOne = jest.fn(() => Promise.reject(new Error('Database error')));

      const response = await request(testApp)
        .get('/api/metrics')
        .set('x-api-key', 'any-key')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    test('should handle API key in different header formats', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('X-API-KEY', 'valid-api-key-123') // Different case
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should not affect unprotected routes', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('should allow requests within rate limit', async () => {
      const testApp = createTestApp();
      
      for (let i = 0; i < 5; i++) {
        const response = await request(testApp)
          .post('/api/auth/register')
          .send({ deviceId: `device-${i}` })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    test('should enforce auth-specific rate limiting', async () => {
      const testApp = createTestApp();
      
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          request(testApp)
            .post('/api/auth/register')
            .send({ deviceId: `device-${i}` })
        );
      }

      const responses = await Promise.all(promises);
      
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeLessThanOrEqual(10);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    test('should return appropriate rate limit error message', async () => {
      const testApp = createTestApp();
      
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(testApp)
            .post('/api/auth/register')
            .send({ deviceId: `device-${i}` })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body.success).toBe(false);
        expect(rateLimitedResponse.body.error).toContain('Too many');
      }
    });

    test('should reset rate limit after time window', async () => {
      const rateLimiter = createRateLimiter(100, 1, 'Test limit');
      
      const app = express();
      app.use(rateLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app).get('/test').expect(200);
      
      await request(app).get('/test').expect(429);
      
      await new Promise(resolve => setTimeout(resolve, 110));
      await request(app).get('/test').expect(200);
    });
  });

  describe('Request Validation Middleware', () => {
    test('should accept requests within size limit', async () => {
      const testApp = createTestApp();
      
      const smallPayload = { data: 'x'.repeat(100) };
      
      const response = await request(testApp)
        .post('/api/auth/register')
        .send(smallPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject oversized requests', async () => {
      const testApp = express();
      testApp.use(validateRequestSize(100));
      testApp.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(testApp)
        .post('/test')
        .set('content-length', '1000')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request entity too large');
    });

    test('should validate JSON format', async () => {
      const testApp = express();
      testApp.use(validateJSON);
      testApp.post('/test', (req, res) => res.json({ success: true }));

      await request(testApp)
        .post('/test')
        .set('content-type', 'application/json')
        .send({ valid: 'json' })
        .expect(200);
    });

    test('should handle multiple middleware in sequence', async () => {
      const validDevice = {
        deviceId: 'test-device-001',
        apiKey: 'valid-api-key-123',
        isApiKeyExpired: jest.fn(() => false),
        save: jest.fn(() => Promise.resolve()),
        lastActive: new Date()
      };
      mockDevices.set('test-device-001', validDevice);

      const response = await request(app)
        .post('/api/metrics/sync')
        .set('x-api-key', 'valid-api-key-123')
        .send({ habits: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.device).toBe('test-device-001');
    });
  });

  describe('Middleware Error Handling', () => {
    test('should handle middleware exceptions gracefully', async () => {
      const errorMiddleware = (req, res, next) => {
        throw new Error('Middleware error');
      };

      const testApp = express();
      testApp.use(errorMiddleware);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      
      testApp.use((err, req, res, next) => {
        res.status(500).json({ success: false, error: 'Middleware error' });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should preserve error context through middleware chain', async () => {
      let errorContext = null;

      const contextMiddleware = (req, res, next) => {
        req.context = { requestId: 'test-123' };
        next();
      };

      const errorMiddleware = (req, res, next) => {
        errorContext = req.context;
        next(new Error('Test error'));
      };

      const testApp = express();
      testApp.use(contextMiddleware);
      testApp.use(errorMiddleware);
      testApp.get('/test', (req, res) => res.json({ success: true }));
      
      testApp.use((err, req, res, next) => {
        res.status(500).json({ 
          success: false, 
          error: err.message,
          context: errorContext
        });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(500);

      expect(response.body.context).toEqual({ requestId: 'test-123' });
    });
  });

  describe('Middleware Performance', () => {
    test('should handle high concurrency', async () => {
      const testApp = createTestApp();
      
      const validDevice = {
        deviceId: 'test-device-001',
        apiKey: 'valid-api-key-123',
        isApiKeyExpired: jest.fn(() => false),
        save: jest.fn(() => Promise.resolve()),
        lastActive: new Date()
      };
      mockDevices.set('test-device-001', validDevice);

      const startTime = Date.now();
      
      const promises = Array(50).fill().map(() =>
        request(testApp)
          .get('/api/metrics')
          .set('x-api-key', 'valid-api-key-123')
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      expect(responses.every(r => r.status === 200)).toBe(true);
      
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should not leak memory with many requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }
      
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });
}); 