const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Attendance = require('../models/Attendance');
const InternalMarks = require('../models/InternalMarks');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const DailyAttendance = require('../models/DailyAttendance');
const ODRequest = require('../models/ODRequest');

/**
 * @desc    Get HOD dashboard stats
 * @route   GET /api/hod/dashboard
 * @access  Private (HOD)
 */
const getDashboard = async (req, res, next) => {
  try {
    const hod = await require('../models/HOD').findOne({ user: req.user._id }).populate('department');
    if (!hod) return res.status(404).json({ success: false, message: 'HOD profile not found' });

    const deptId = hod.department._id;

    // Total students per year
    const yearWise = await Student.aggregate([
      { $match: { department: deptId } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totalStudents = yearWise.reduce((sum, y) => sum + y.count, 0);

    // Total faculty
    const totalFaculty = await Mentor.countDocuments({ department: deptId });

    // Department attendance average
    const attRecords = await Attendance.find({ department: deptId });
    let totalAtt = 0, presentAtt = 0;
    attRecords.forEach((att) => att.records.forEach((r) => {
      totalAtt++;
      if (r.status === 'present') presentAtt++;
    }));
    const avgAttendance = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : 0;

    // Internal marks average
    const allStudents = await Student.find({ department: deptId });
    const studentIds = allStudents.map((s) => s._id);
    const markRecords = await InternalMarks.find({ student: { $in: studentIds } });
    const avgMarks = markRecords.length > 0
      ? (markRecords.reduce((sum, m) => sum + m.total, 0) / markRecords.length).toFixed(1)
      : 0;

    // Section-wise attendance trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAttendance = await Attendance.aggregate([
      { $match: { department: deptId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalRecords: { $sum: { $size: '$records' } },
          presentRecords: {
            $sum: {
              $size: {
                $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'present'] } },
              },
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // IoT Daily Attendance Stats for Today (Department Level)
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyRecords = await DailyAttendance.find({
      student: { $in: studentIds },
      date: todayStr
    });

    let todayPresent = 0, todayAbsent = 0, todayLate = 0;
    dailyRecords.forEach(record => {
      if (record.dailyStatus === 'Present') todayPresent++;
      if (record.dailyStatus === 'Absent') todayAbsent++;
      if (record.dailyStatus === 'Late') todayLate++;
    });

    const pendingODs = await ODRequest.countDocuments({ student: { $in: studentIds }, status: 'Pending' });
    const approvedODs = await ODRequest.countDocuments({ student: { $in: studentIds }, status: 'Approved', date: { $gte: new Date(todayStr), $lt: new Date(todayStr + 'T23:59:59.999Z') } });

    res.status(200).json({
      success: true,
      data: {
        department: hod.department,
        totalStudents,
        totalFaculty,
        avgAttendance: parseFloat(avgAttendance),
        avgMarks: parseFloat(avgMarks),
        yearWise,
        monthlyAttendance,
        // New IoT Daily Stats
        todayPresent,
        todayAbsent,
        todayLate,
        pendingODs,
        approvedODs
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students in HOD's department
 * @route   GET /api/hod/students
 * @access  Private (HOD)
 */
const getStudents = async (req, res, next) => {
  try {
    const hod = await require('../models/HOD').findOne({ user: req.user._id });
    const { year, section, search } = req.query;

    const query = { department: hod.department };
    if (year) query.year = parseInt(year);
    if (section) query.section = section.toUpperCase();

    let students = await Student.find(query)
      .populate('user', 'name email avatar')
      .populate('mentor', 'name email');

    if (search) {
      const s = search.toLowerCase();
      students = students.filter(
        (st) => st.user.name.toLowerCase().includes(s) || st.registerNumber.toLowerCase().includes(s)
      );
    }

    res.status(200).json({ success: true, data: students, count: students.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get marks analytics for department
 * @route   GET /api/hod/analytics/marks
 * @access  Private (HOD)
 */
const getMarksAnalytics = async (req, res, next) => {
  try {
    const hod = await require('../models/HOD').findOne({ user: req.user._id });
    const students = await Student.find({ department: hod.department });
    const studentIds = students.map((s) => s._id);

    const subjectWise = await InternalMarks.aggregate([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: '$subject',
          avgInternal1: { $avg: '$internal1' },
          avgInternal2: { $avg: '$internal2' },
          avgAssignment: { $avg: '$assignment' },
          avgTotal: { $avg: '$total' },
          count: { $sum: 1 },
        },
      },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      { $sort: { avgTotal: -1 } },
    ]);

    res.status(200).json({ success: true, data: subjectWise });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get faculty performance
 * @route   GET /api/hod/faculty
 * @access  Private (HOD)
 */
const getFaculty = async (req, res, next) => {
  try {
    const hod = await require('../models/HOD').findOne({ user: req.user._id });
    const mentors = await Mentor.find({ department: hod.department })
      .populate('user', 'name email avatar lastLogin')
      .populate('department', 'name');

    const facultyData = await Promise.all(
      mentors.map(async (m) => {
        const studentCount = await Student.countDocuments({ mentor: m.user._id });
        const attCount = await Attendance.countDocuments({ mentor: m.user._id });
        return { ...m.toObject(), studentCount, attendanceSessions: attCount };
      })
    );

    res.status(200).json({ success: true, data: facultyData });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getStudents, getMarksAnalytics, getFaculty };
