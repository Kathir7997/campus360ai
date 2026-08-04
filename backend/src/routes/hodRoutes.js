const express = require('express');
const router = express.Router();
const { getDashboard, getStudents, getMarksAnalytics, getFaculty } = require('../controllers/hodController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('hod'));

router.get('/dashboard', getDashboard);
router.get('/students', getStudents);
router.get('/analytics/marks', getMarksAnalytics);
router.get('/faculty', getFaculty);

module.exports = router;
