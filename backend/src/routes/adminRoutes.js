const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers, createUser, updateUser, deleteUser, resetPassword,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSubjects, createSubject, updateSubject, deleteSubject,
  createNotification, getNotifications,
  createEvent, getEvents, deleteEvent,
  getAuditLogs,
  getConfigs, createConfig, updateConfig, deleteConfig,
  getDevices, createDevice, updateDevice, deleteDevice,
  getFaceRegistrations, resetFaceRegistration,
  getAttendanceOverview,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);

// Users
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);
router.put('/users/:id/reset-password', resetPassword);

// Departments
router.route('/departments').get(getDepartments).post(createDepartment);
router.route('/departments/:id').put(updateDepartment).delete(deleteDepartment);

// Subjects
router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

// Notifications
router.route('/notifications').get(getNotifications).post(createNotification);

// Events
router.route('/events').get(getEvents).post(createEvent);
router.delete('/events/:id', deleteEvent);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// IoT Configs & Devices
router.route('/configs').get(getConfigs).post(createConfig);
router.route('/configs/:id').put(updateConfig).delete(deleteConfig);

router.route('/devices').get(getDevices).post(createDevice);
router.route('/devices/:id').put(updateDevice).delete(deleteDevice);

// Face Dataset Management
router.get('/face-registrations', getFaceRegistrations);
router.delete('/face-registrations/:studentId', resetFaceRegistration);

// Attendance Overview
router.get('/attendance-overview', getAttendanceOverview);

module.exports = router;
