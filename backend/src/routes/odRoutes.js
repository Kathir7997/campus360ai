const express = require('express');
const router = express.Router();
const odController = require('../controllers/odController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Ensure this is configured for multer

// Student routes
router.post('/apply', protect, authorize('student'), upload.single('document'), odController.applyOD);
router.get('/student', protect, authorize('student'), odController.getStudentODs);

// Mentor routes
router.get('/mentor/pending', protect, authorize('mentor'), odController.getMentorPendingODs);
router.put('/mentor/approve/:id', protect, authorize('mentor'), odController.processOD);

module.exports = router;
