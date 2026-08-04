const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const monitoringController = require('../controllers/monitoringController');

const firmwareUpload = multer({
  storage: upload.storage || undefined,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(protect);

router.get('/live-classrooms', authorize('admin', 'hod', 'mentor'), monitoringController.getLiveClassrooms);
router.post('/classrooms/start', authorize('admin', 'mentor'), monitoringController.startLecture);
router.post('/classrooms/end', authorize('admin', 'mentor'), monitoringController.endLecture);

router.post('/devices/:deviceId/heartbeat', monitoringController.updateHeartbeat);
router.get('/devices/:deviceId/diagnostics', authorize('admin', 'hod'), monitoringController.getDeviceDiagnostics);
router.post('/devices/:deviceId/firmware', authorize('admin'), upload.single('firmware'), monitoringController.uploadFirmware);
router.post('/devices/:deviceId/firmware/rollback', authorize('admin'), express.json(), monitoringController.rollbackFirmware);
router.post('/devices/:deviceId/offline-sync', monitoringController.syncOfflineAttendance);

router.get('/absent-students', authorize('admin', 'hod', 'mentor'), monitoringController.getAbsentStudents);
router.get('/od-tracking', authorize('admin', 'hod', 'mentor'), monitoringController.getOdTracking);
router.post('/iat/upload', authorize('admin', 'mentor'), upload.single('file'), monitoringController.uploadIatMarks);
router.get('/reports/:type', authorize('admin', 'hod', 'mentor'), monitoringController.getReports);
router.get('/reports/:type/export', authorize('admin', 'hod', 'mentor'), monitoringController.exportReport);
router.get('/insights/academic', authorize('admin', 'hod', 'mentor'), monitoringController.getAcademicInsights);
router.get('/analytics/lecture', authorize('admin', 'hod', 'mentor'), monitoringController.getLectureAnalytics);

module.exports = router;