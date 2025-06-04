const express = require('express');
const { syncHabits, getMetrics } = require('../controllers/metricsController');
const { validateApiKey } = require('../middleware/auth');

const router = express.Router();

router.use(validateApiKey);

router.post('/sync', syncHabits);

router.get('/', getMetrics);

module.exports = router; 