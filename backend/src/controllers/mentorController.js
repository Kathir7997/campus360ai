const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Attendance = require('../models/Attendance');
const InternalMarks = require('../models/InternalMarks');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const DailyAttendance = require('../models/DailyAttendance');
const ODRequest = require('../models/ODRequest');

/**
 * @desc    Get mentor dashboard
 * @route   GET /api/mentor/dashboard
 * @access  Private (Mentor)
 */
const getDashboard = async (req, res, next) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user._id }).populate('department');
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found' });

    const students = await Student.find({ mentor: req.user._id }).populate('user', 'name email');
    const totalStudents = students.length;

    // Get attendance stats for all assigned students
    const studentIds = students.map((s) => s._id);
    const attendanceRecords = await Attendance.find({ 'records.student': { $in: studentIds } });

    let presentCount = 0, totalCount = 0;
    attendanceRecords.forEach((att) => {
      att.records.forEach((r) => {
        if (studentIds.some((id) => id.toString() === r.student.toString())) {
          totalCount++;
          if (r.status === 'present') presentCount++;
        }
      });
    });

    const avgAttendance = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

    // Low attendance students (< 75%)
    const lowAttendanceStudents = [];
    for (const student of students) {
      let sTotal = 0, sPresent = 0;
      attendanceRecords.forEach((att) => {
        att.records.forEach((r) => {
          if (r.student.toString() === student._id.toString()) {
            sTotal++;
            if (r.status === 'present') sPresent++;
          }
        });
      });
      if (sTotal > 0 && (sPresent / sTotal) * 100 < 75) {
        lowAttendanceStudents.push({
          student,
          percentage: ((sPresent / sTotal) * 100).toFixed(1),
        });
      }
    }

    // IoT Daily Attendance Stats for Today
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyRecords = await DailyAttendance.find({
      student: { $in: studentIds },
      date: todayStr
    });

    let todayPresent = 0, todayAbsent = 0, todayLate = 0;
    // For students inside campus, we can check if they have MorningEntry but no ExitVerification
    let insideCampus = 0;

    dailyRecords.forEach(record => {
      if (record.dailyStatus === 'Present') todayPresent++;
      if (record.dailyStatus === 'Absent') todayAbsent++;
      if (record.dailyStatus === 'Late') todayLate++;
      
      if (record.morningEntry && record.morningEntry.timestamp && (!record.exitVerification || !record.exitVerification.timestamp)) {
        insideCampus++;
      }
    });

    const pendingODs = await ODRequest.countDocuments({ student: { $in: studentIds }, status: 'Pending' });

    // Recent marks uploads
    const recentMarks = await InternalMarks.find({ mentor: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('student')
      .populate('subject', 'name code');

    res.status(200).json({
      success: true,
      data: {
        mentor,
        totalStudents,
        avgAttendance: parseFloat(avgAttendance),
        lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
        recentMarks,
        // New IoT Daily Stats
        todayPresent,
        todayAbsent,
        todayLate,
        insideCampus,
        pendingODs
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students assigned to mentor
 * @route   GET /api/mentor/students
 * @access  Private (Mentor)
 */
const getStudents = async (req, res, next) => {
  try {
    const { year, section, search } = req.query;
    const query = { mentor: req.user._id };
    if (year) query.year = parseInt(year);
    if (section) query.section = section.toUpperCase();

    let students = await Student.find(query)
      .populate('user', 'name email phone avatar')
      .populate('department', 'name code')
      .sort({ 'user.name': 1 });

    if (search) {
      const s = search.toLowerCase();
      students = students.filter(
        (st) =>
          st.user.name.toLowerCase().includes(s) ||
          st.registerNumber.toLowerCase().includes(s)
      );
    }

    res.status(200).json({ success: true, data: students, count: students.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add attendance
 * @route   POST /api/mentor/attendance
 * @access  Private (Mentor)
 */
const addAttendance = async (req, res, next) => {
  try {
    const { subjectId, date, hour, section, year, semester, records } = req.body;

    const mentor = await Mentor.findOne({ user: req.user._id });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    // Check if attendance already exists for this session
    const existing = await Attendance.findOne({
      subject: subjectId,
      date: new Date(date),
      hour: hour || 1,
      section,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already recorded for this session' });
    }

    const attendance = await Attendance.create({
      subject: subjectId,
      department: mentor.department,
      mentor: req.user._id,
      year: parseInt(year),
      semester: parseInt(semester),
      section,
      date: new Date(date),
      hour: hour || 1,
      records,
    });

    // Send notification to students with absent status
    const absentStudentIds = records
      .filter((r) => r.status === 'absent')
      .map((r) => r.student);

    if (absentStudentIds.length > 0) {
      const absentUsers = await Student.find({ _id: { $in: absentStudentIds } }).select('user');
      await Notification.create({
        title: 'Attendance Marked',
        message: 'You have been marked absent for a class. Please check your attendance.',
        type: 'attendance',
        sender: req.user._id,
        recipients: absentUsers.map((s) => s.user),
      });
    }

    res.status(201).json({ success: true, data: attendance, message: 'Attendance recorded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records
 * @route   GET /api/mentor/attendance
 * @access  Private (Mentor)
 */
const getAttendance = async (req, res, next) => {
  try {
    const { subjectId, section, year, startDate, endDate } = req.query;
    const query = { mentor: req.user._id };
    if (subjectId) query.subject = subjectId;
    if (section) query.section = section;
    if (year) query.year = parseInt(year);
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate('subject', 'name code')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update attendance
 * @route   PUT /api/mentor/attendance/:id
 * @access  Private (Mentor)
 */
const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance not found' });

    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete attendance
 * @route   DELETE /api/mentor/attendance/:id
 * @access  Private (Mentor)
 */
const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance not found' });
    await attendance.deleteOne();
    res.status(200).json({ success: true, message: 'Attendance deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload Excel and process internal marks
 * @route   POST /api/mentor/marks/upload
 * @access  Private (Mentor)
 */
const uploadMarks = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an Excel file' });

    const { subjectId, semester, academicYear } = req.body;
    if (!subjectId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'subjectId, semester, and academicYear are required' });
    }

    const mentor = await Mentor.findOne({ user: req.user._id });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    // Read Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = { success: [], errors: [] };

    for (const row of data) {
      try {
        const registerNumber = String(row['Register Number'] || row['RegisterNumber'] || row['Reg No'] || '').toUpperCase().trim();
        if (!registerNumber) { results.errors.push({ row, error: 'Missing register number' }); continue; }

        const student = await Student.findOne({ registerNumber });
        if (!student) { results.errors.push({ row, error: `Student not found: ${registerNumber}` }); continue; }

        const markData = {
          student: student._id,
          subject: subjectId,
          department: mentor.department,
          mentor: req.user._id,
          semester: parseInt(semester),
          academicYear,
          internal1: parseFloat(row['Internal 1'] || row['IA1'] || row['internal1'] || 0),
          internal2: parseFloat(row['Internal 2'] || row['IA2'] || row['internal2'] || 0),
          assignment: parseFloat(row['Assignment'] || row['assignment'] || 0),
        };

        // Upsert
        await InternalMarks.findOneAndUpdate(
          { student: student._id, subject: subjectId, semester: parseInt(semester) },
          markData,
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        results.success.push({ registerNumber, name: row['Student Name'] || '' });
      } catch (err) {
        results.errors.push({ row, error: err.message });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    // Notify students about marks update
    const successRegNos = results.success.map(r => r.registerNumber);
    const updatedStudents = await Student.find({ registerNumber: { $in: successRegNos } }).select('user');
    const userIds = updatedStudents.map(s => s.user);

    if (userIds.length > 0) {
      await Notification.create({
        title: 'Internal Marks Updated',
        message: `Your internal marks for semester ${semester} have been updated. Please check your portal.`,
        type: 'marks',
        sender: req.user._id,
        recipients: userIds,
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('marks:published', { userIds: userIds.map(id => id.toString()), semester });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${data.length} rows: ${results.success.length} successful, ${results.errors.length} errors`,
      data: results,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

/**
 * @desc    Get marks managed by mentor
 * @route   GET /api/mentor/marks
 * @access  Private (Mentor)
 */
const getMarks = async (req, res, next) => {
  try {
    const { subjectId, semester } = req.query;
    const query = { mentor: req.user._id };
    if (subjectId) query.subject = subjectId;
    if (semester) query.semester = parseInt(semester);

    const marks = await InternalMarks.find(query)
      .populate('student', 'registerNumber')
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('subject', 'name code')
      .sort({ 'subject.name': 1 });

    res.status(200).json({ success: true, data: marks, count: marks.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update marks manually
 * @route   PUT /api/mentor/marks/:id
 * @access  Private (Mentor)
 */
const updateMarks = async (req, res, next) => {
  try {
    const mark = await InternalMarks.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!mark) return res.status(404).json({ success: false, message: 'Marks record not found' });

    Object.assign(mark, req.body);
    await mark.save();

    res.status(200).json({ success: true, data: mark });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete marks record
 * @route   DELETE /api/mentor/marks/:id
 * @access  Private (Mentor)
 */
const deleteMarks = async (req, res, next) => {
  try {
    const mark = await InternalMarks.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!mark) return res.status(404).json({ success: false, message: 'Marks not found' });
    await mark.deleteOne();
    res.status(200).json({ success: true, message: 'Marks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Mentor Attendance & IoT Features ──────────────────────────────────────────

const searchStudents = async (req, res, next) => {
  try {
    const { search, year, section } = req.query;
    const query = { mentor: req.user._id };
    
    if (year) query.year = parseInt(year);
    if (section) query.section = section;
    
    const students = await Student.find(query)
      .populate('user', 'name email')
      .populate('department', 'name code');

    let filtered = students;
    if (search) {
      const s = search.toLowerCase();
      filtered = students.filter(
        st => st.registerNumber.toLowerCase().includes(s) || st.user.name.toLowerCase().includes(s)
      );
    }
    
    res.status(200).json({ success: true, data: filtered });
  } catch (error) { next(error); }
};

const updateDailyAttendance = async (req, res, next) => {
  try {
    const { studentId, date } = req.params;
    const { dailyStatus, lateMinutes } = req.body;
    
    let record = await DailyAttendance.findOne({ student: studentId, date });
    if (!record) {
      record = new DailyAttendance({ student: studentId, date, dailyStatus: dailyStatus || 'Pending' });
    } else {
      if (dailyStatus) record.dailyStatus = dailyStatus;
      if (lateMinutes !== undefined) record.lateMinutes = lateMinutes;
    }
    
    await record.save();
    res.status(200).json({ success: true, message: 'Attendance updated', data: record });
  } catch (error) { next(error); }
};

const getDailyAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const students = await Student.find({ mentor: req.user._id });
    const studentIds = students.map(s => s._id);

    const query = { student: { $in: studentIds } };
    if (date) query.date = date;

    const records = await DailyAttendance.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) { next(error); }
};

const getAttendanceTimeline = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const records = await DailyAttendance.find({ student: studentId }).sort({ date: -1 }).limit(30);
    res.status(200).json({ success: true, data: records });
  } catch (error) { next(error); }
};

const exportAttendance = async (req, res, next) => {
  try {
    // Basic CSV export for demonstration (In a real app, use pdfkit/exceljs)
    const students = await Student.find({ mentor: req.user._id }).populate('user', 'name');
    const records = await DailyAttendance.find({ student: { $in: students.map(s => s._id) } });

    let csv = 'RegisterNumber,Name,Date,Status,LateMinutes\n';
    students.forEach(st => {
      const stRecords = records.filter(r => r.student.toString() === st._id.toString());
      stRecords.forEach(r => {
        csv += `${st.registerNumber},${st.user.name},${r.date},${r.dailyStatus},${r.lateMinutes}\n`;
      });
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_export.csv');
    res.send(csv);
  } catch (error) { next(error); }
};

module.exports = {
  getDashboard, getStudents,
  addAttendance, getAttendance, updateAttendance, deleteAttendance,
  uploadMarks, getMarks, updateMarks, deleteMarks,
  searchStudents, updateDailyAttendance, getDailyAttendance, getAttendanceTimeline, exportAttendance,
};
