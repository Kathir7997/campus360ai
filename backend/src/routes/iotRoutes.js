const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');

// Define routes
router.post('/attendance/scan', iotController.scanFace);

module.exports = router;
