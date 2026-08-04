const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const InternalMarks = require('../models/InternalMarks');
const Notification = require('../models/Notification');
const Event = require('../models/Event');
const DailyAttendance = require('../models/DailyAttendance');

/**
 * @desc    Get student dashboard data
 * @route   GET /api/student/dashboard
 * @access  Private (Student)
 */
const getDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('department', 'name code')
      .populate('mentor', 'name email phone');

    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Get attendance summary
    const attendanceRecords = await Attendance.find({
      'records.student': student._id,
      semester: student.semester,
    }).populate('subject', 'name code');

    const attendanceSummary = {};
    let totalClasses = 0, totalPresent = 0;

    attendanceRecords.forEach((att) => {
      const record = att.records.find((r) => r.student.toString() === student._id.toString());
      if (!record) return;
      const subKey = att.subject._id.toString();
      if (!attendanceSummary[subKey]) {
        attendanceSummary[subKey] = { subject: att.subject, total: 0, present: 0 };
      }
      attendanceSummary[subKey].total++;
      totalClasses++;
      if (record.status === 'present') {
        attendanceSummary[subKey].present++;
        totalPresent++;
      }
    });

    const overallAttendance = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;

    // Get marks summary
    const marks = await InternalMarks.find({ student: student._id, semester: student.semester })
      .populate('subject', 'name code');

    // Get notifications
    const notifications = await Notification.find({
      $or: [{ recipients: req.user._id }, { targetRole: 'student' }, { targetRole: 'all' }],
    }).sort({ createdAt: -1 }).limit(5);

    // Get upcoming events
    const events = await Event.find({
      startDate: { $gte: new Date() },
      $or: [{ targetDepartment: student.department._id }, { isPublic: true }],
    }).sort({ startDate: 1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        student,
        overallAttendance: parseFloat(overallAttendance),
        attendanceSummary: Object.values(attendanceSummary),
        marks,
        notifications,
        events,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student attendance details
 * @route   GET /api/student/attendance
 * @access  Private (Student)
 */
const getAttendance = async (req, res, next) => {
  try {
    const { month, year, subjectId } = req.query;
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const query = { 'records.student': student._id };
    if (subjectId) query.subject = subjectId;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const formatted = records.map((att) => {
      const myRecord = att.records.find((r) => r.student.toString() === student._id.toString());
      return {
        _id: att._id,
        subject: att.subject,
        date: att.date,
        hour: att.hour,
        status: myRecord ? myRecord.status : 'absent',
      };
    });

    res.status(200).json({ success: true, data: formatted, count: formatted.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student internal marks
 * @route   GET /api/student/marks
 * @access  Private (Student)
 */
const getMarks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { semester } = req.query;
    const query = { student: student._id };
    if (semester) query.semester = parseInt(semester);

    const marks = await InternalMarks.find(query)
      .populate('subject', 'name code type credits')
      .sort({ 'subject.name': 1 });

    // Calculate rank among same section/semester
    const allStudentMarks = await InternalMarks.find({
      semester: student.semester,
      subject: marks[0]?.subject?._id,
    });
    const totalOfStudents = allStudentMarks.map((m) => m.total).sort((a, b) => b - a);
    const studentTotal = marks.reduce((sum, m) => sum + m.total, 0);
    const avg = marks.length > 0 ? (studentTotal / marks.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: { marks, average: parseFloat(avg), total: studentTotal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student profile
 * @route   GET /api/student/profile
 * @access  Private (Student)
 */
const getProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('department', 'name code')
      .populate('mentor', 'name email phone');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, data: { user: req.user, student } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student IoT daily attendance
 * @route   GET /api/student/iot-attendance
 * @access  Private (Student)
 */
const getIotAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Send the last 30 days of attendance by default
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const records = await DailyAttendance.find({
      student: student._id,
      date: { $gte: dateStr }
    }).sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getAttendance, getMarks, getProfile, getIotAttendance };
