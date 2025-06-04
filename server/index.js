const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const config = require('./config/config');
const { CONFIG } = require('./config/serverConfig');

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet()); // Set security headers

// Configure CORS using centralized config
app.use(cors({
  origin: CONFIG.DEBUG_CONFIG.ENABLE_CORS_ALL ? '*' : CONFIG.SERVER_CONFIG.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));

// Body parsing middleware with size limits from config
app.use(express.json({ limit: CONFIG.SERVER_CONFIG.REQUEST_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: CONFIG.SERVER_CONFIG.REQUEST_SIZE_LIMIT }));

// Logging middleware using config
app.use(morgan(CONFIG.MONITORING_CONFIG.LOG_FORMAT));

// General rate limiting using centralized config
const generalLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_CONFIG.WINDOW_MS,
  max: CONFIG.RATE_LIMIT_CONFIG.MAX_REQUESTS,
  standardHeaders: CONFIG.RATE_LIMIT_CONFIG.INCLUDE_HEADERS,
  message: { 
    success: false, 
    error: CONFIG.RESPONSE_CONFIG.MESSAGES.RATE_LIMITED
  }
});

// Auth-specific rate limiting with stricter limits
const authLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_CONFIG.AUTH_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  standardHeaders: CONFIG.RATE_LIMIT_CONFIG.INCLUDE_HEADERS,
  message: { 
    success: false, 
    error: `Too many authentication attempts, please try again in ${CONFIG.RATE_LIMIT_CONFIG.AUTH_WINDOW_MS / 1000 / 60} minutes`
  }
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/metrics', require('./routes/metrics'));

// Health check route
app.get('/health', (req, res) => {
  res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.SUCCESS).json({ 
    message: 'Welcome to Habits Tracker API',
    version: '1.0.0'
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(CONFIG.RESPONSE_CONFIG.STATUS_CODES.NOT_FOUND).json({ 
    success: false, 
    error: CONFIG.RESPONSE_CONFIG.MESSAGES.NOT_FOUND
  });
});

// Error handler middleware using config
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  const statusCode = CONFIG.RESPONSE_CONFIG.STATUS_CODES.INTERNAL_ERROR;
  const message = CONFIG.DEBUG_CONFIG.DETAILED_ERRORS && err.message 
    ? err.message 
    : CONFIG.RESPONSE_CONFIG.MESSAGES.INTERNAL_ERROR;
  
  res.status(statusCode).json({ 
    success: false, 
    error: message,
    ...(CONFIG.DEBUG_CONFIG.DETAILED_ERRORS && { stack: err.stack })
  });
});

// Start server using config
const PORT = config.PORT || CONFIG.SERVER_CONFIG.DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  console.log(`General rate limiting: ${CONFIG.RATE_LIMIT_CONFIG.MAX_REQUESTS} requests per ${CONFIG.RATE_LIMIT_CONFIG.WINDOW_MS / 1000 / 60} minutes`);
  console.log(`Auth rate limiting: ${CONFIG.RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS} requests per ${CONFIG.RATE_LIMIT_CONFIG.AUTH_WINDOW_MS / 1000 / 60} minutes`);
});
