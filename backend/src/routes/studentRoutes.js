const express = require('express');
const router = express.Router();
const { getDashboard, getAttendance, getMarks, getProfile, getIotAttendance } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/iot-attendance', getIotAttendance);
router.get('/marks', getMarks);
router.get('/profile', getProfile);

module.exports = router;
