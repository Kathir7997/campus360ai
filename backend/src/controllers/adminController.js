const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const HOD = require('../models/HOD');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');
const InternalMarks = require('../models/InternalMarks');
const AttendanceConfig = require('../models/AttendanceConfig');
const IoTDevice = require('../models/IoTDevice');
const DailyAttendance = require('../models/DailyAttendance');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
const getDashboard = async (req, res, next) => {
  try {
    const [totalStudents, totalMentors, totalHODs, totalDepartments, totalSubjects] = await Promise.all([
      Student.countDocuments(),
      Mentor.countDocuments(),
      HOD.countDocuments(),
      Department.countDocuments(),
      Subject.countDocuments(),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
    const recentLogs = await AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(20);

    // Monthly registration trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, role: '$role' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { totalStudents, totalMentors, totalHODs, totalDepartments, totalSubjects, recentUsers, recentLogs, registrationTrend },
    });
  } catch (error) {
    next(error);
  }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, data: users, total, page: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  let user;
  try {
    const { name, email, password, role, ...profileData } = req.body;

    user = await User.create({ name, email, password, role });

    // Create associated profile
    if (role === 'student') {
      await Student.create({ user: user._id, ...profileData });
    } else if (role === 'mentor') {
      await Mentor.create({ user: user._id, ...profileData });
    } else if (role === 'hod') {
      await HOD.create({ user: user._id, ...profileData });
    }

    await AuditLog.create({
      user: req.user._id, action: 'CREATE_USER', resource: 'User', resourceId: user._id,
      details: { name, email, role }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (user) {
      await User.findByIdAndDelete(user._id);
    }
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Deactivate instead of hard delete
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset user password
 * @route   PUT /api/admin/users/:id/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── DEPARTMENT MANAGEMENT ────────────────────────────────────────────────────

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().populate('hod', 'name email');
    res.status(200).json({ success: true, data: departments });
  } catch (error) { next(error); }
};

const createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.status(200).json({ success: true, data: dept });
  } catch (error) { next(error); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) { next(error); }
};

// ─── SUBJECT MANAGEMENT ───────────────────────────────────────────────────────

const getSubjects = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    const subjects = await Subject.find(query).populate('department', 'name code');
    res.status(200).json({ success: true, data: subjects });
  } catch (error) { next(error); }
};

const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) { next(error); }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.status(200).json({ success: true, data: subject });
  } catch (error) { next(error); }
};

const deleteSubject = async (req, res, next) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (error) { next(error); }
};

// ─── NOTIFICATION MANAGEMENT ──────────────────────────────────────────────────

const createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create({ ...req.body, sender: req.user._id });
    res.status(201).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

// ─── EVENTS ───────────────────────────────────────────────────────────────────

const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ startDate: 1 }).populate('organizer', 'name');
    res.status(200).json({ success: true, data: events });
  } catch (error) { next(error); }
};

const deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) { next(error); }
};

// ─── IOT CONFIG & DEVICES ───────────────────────────────────────────────────────

const getConfigs = async (req, res, next) => {
  try {
    const configs = await AttendanceConfig.find();
    res.status(200).json({ success: true, data: configs });
  } catch (error) { next(error); }
};

const createConfig = async (req, res, next) => {
  try {
    const config = await AttendanceConfig.create(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) { next(error); }
};

const updateConfig = async (req, res, next) => {
  try {
    const config = await AttendanceConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.status(200).json({ success: true, data: config });
  } catch (error) { next(error); }
};

const deleteConfig = async (req, res, next) => {
  try {
    await AttendanceConfig.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Config deleted' });
  } catch (error) { next(error); }
};

const getDevices = async (req, res, next) => {
  try {
    const devices = await IoTDevice.find();
    res.status(200).json({ success: true, data: devices });
  } catch (error) { next(error); }
};

const createDevice = async (req, res, next) => {
  try {
    const device = await IoTDevice.create(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (error) { next(error); }
};

const updateDevice = async (req, res, next) => {
  try {
    const device = await IoTDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.status(200).json({ success: true, data: device });
  } catch (error) { next(error); }
};

const deleteDevice = async (req, res, next) => {
  try {
    await IoTDevice.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Device deleted' });
  } catch (error) { next(error); }
};

// ─── Face Dataset Management ──────────────────────────────────────────────────

const getFaceRegistrations = async (req, res, next) => {
  try {
    const { department, year, registered, page = 1, limit = 50 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (registered !== undefined) query.faceRegistered = registered === 'true';

    const students = await Student.find(query)
      .populate('user', 'name email')
      .populate('department', 'name code')
      .select('registerNumber faceRegistered faceQualityScore faceImagesCount faceRegisteredAt year section department user')
      .sort({ 'user.name': 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);
    const totalRegistered = await Student.countDocuments({ ...query, faceRegistered: true });

    res.status(200).json({
      success: true,
      data: students,
      total,
      registered: totalRegistered,
      unregistered: total - totalRegistered,
    });
  } catch (error) { next(error); }
};

const resetFaceRegistration = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      { faceRegistered: false, faceEmbedding: [], faceQualityScore: 0, faceImagesCount: 0, faceRegisteredAt: null },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, message: 'Face registration reset successfully' });
  } catch (error) { next(error); }
};

// ─── Attendance Overview ──────────────────────────────────────────────────────

const getAttendanceOverview = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = await DailyAttendance.find({ date: todayStr });

    const summary = { Present: 0, Absent: 0, Late: 0, OD: 0, Leave: 0 };
    todayRecords.forEach(r => { if (summary[r.dailyStatus] !== undefined) summary[r.dailyStatus]++; });

    res.status(200).json({ success: true, data: { today: todayStr, summary, total: todayRecords.length } });
  } catch (error) { next(error); }
};

module.exports = {
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
};
