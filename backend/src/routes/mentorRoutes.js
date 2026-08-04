const express = require('express');
const router = express.Router();
const {
  getDashboard, getStudents,
  addAttendance, getAttendance, updateAttendance, deleteAttendance,
  uploadMarks, getMarks, updateMarks, deleteMarks,
  searchStudents, updateDailyAttendance, getDailyAttendance, getAttendanceTimeline, exportAttendance,
} = require('../controllers/mentorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('mentor'));

router.get('/dashboard', getDashboard);
router.get('/students', getStudents);

// Attendance
router.route('/attendance')
  .get(getAttendance)
  .post(addAttendance);
router.route('/attendance/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

// Mentor IoT Attendance Features
router.get('/students/search', searchStudents);
router.get('/attendance/timeline/:studentId', getAttendanceTimeline);
router.get('/attendance/export', exportAttendance);
router.get('/daily-attendance', getDailyAttendance);
router.put('/daily-attendance/:studentId/:date', updateDailyAttendance);

// Marks
router.get('/marks', getMarks);
router.post('/marks/upload', upload.single('file'), uploadMarks);
router.put('/marks/:id', updateMarks);
router.delete('/marks/:id', deleteMarks);

module.exports = router;
