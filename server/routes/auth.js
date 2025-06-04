const express = require('express');
const { registerDevice } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerDevice);

module.exports = router; 