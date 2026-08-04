const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');

const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const DailyAttendance = require('../models/DailyAttendance');
const InternalMarks = require('../models/InternalMarks');
const ODRequest = require('../models/ODRequest');
const IoTDevice = require('../models/IoTDevice');
const DeviceTelemetry = require('../models/DeviceTelemetry');
const ClassroomSession = require('../models/ClassroomSession');
const OfflineAttendanceQueue = require('../models/OfflineAttendanceQueue');
const FirmwareUpdate = require('../models/FirmwareUpdate');
const Notification = require('../models/Notification');
const { registerTeacherPresence, upsertDeviceTelemetry, queueOfflineAttendance } = require('../services/classroomService');
const { createNotification } = require('../services/notificationService');

const buildStudentFilter = (query) => {
  const studentFilter = {};
  if (query.department) studentFilter.department = query.department;
  if (query.year) studentFilter.year = parseInt(query.year, 10);
  if (query.section) studentFilter.section = query.section.toUpperCase();
  if (query.studentId) studentFilter._id = query.studentId;
  return studentFilter;
};

const getLiveClassrooms = async (req, res, next) => {
  try {
    const sessions = await ClassroomSession.find({ status: { $in: ['Scheduled', 'Active'] } })
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('mentor', 'name email')
      .populate('teacher', 'name email')
      .sort({ updatedAt: -1 });

    const live = await Promise.all(sessions.map(async (session) => {
      const telemetry = await DeviceTelemetry.findOne({ deviceId: session.entryDeviceId || session.exitDeviceId }).sort({ lastHeartbeat: -1 });
      const device = await IoTDevice.findOne({ deviceId: session.entryDeviceId || session.exitDeviceId });
      return {
        ...session.toObject(),
        device,
        telemetry,
      };
    }));

    res.json({ success: true, data: live });
  } catch (error) {
    next(error);
  }
};

const startLecture = async (req, res, next) => {
  try {
    const session = await registerTeacherPresence({ ...req.body, present: true });
    await createNotification(
      {
        title: 'Lecture Started',
        message: `${session.classroomName} started at ${new Date(session.startTime).toLocaleTimeString()}`,
        type: 'teacher_presence',
        targetRole: 'mentor',
      },
      { eventName: 'lecture:started', room: `classroom_${session.classroomId}` }
    ).catch(() => {});
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const endLecture = async (req, res, next) => {
  try {
    const session = await registerTeacherPresence({ ...req.body, present: false });
    await createNotification(
      {
        title: 'Lecture Ended',
        message: `${session.classroomName} completed with duration ${session.durationMinutes} minutes`,
        type: 'teacher_presence',
        targetRole: 'mentor',
      },
      { eventName: 'lecture:ended', room: `classroom_${session.classroomId}` }
    ).catch(() => {});
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const updateHeartbeat = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const telemetry = await upsertDeviceTelemetry({
      deviceId,
      classroomId: req.body.classroomId,
      payload: req.body,
      status: req.body.status || 'Online',
    });

    const io = req.app.get('io');
    io?.emit('device:heartbeat', { deviceId, telemetry });

    if ((req.body.status || '').toLowerCase() === 'offline') {
      await createNotification(
        {
          title: 'Device Offline',
          message: `${deviceId} stopped sending heartbeats`,
          type: 'device',
          targetRole: 'admin',
          priority: 'high',
        },
        { eventName: 'device:offline', broadcast: true }
      ).catch(() => {});
    }

    res.json({ success: true, data: telemetry });
  } catch (error) {
    next(error);
  }
};

const getDeviceDiagnostics = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const [device, telemetry, firmwareUpdates, queuedItems] = await Promise.all([
      IoTDevice.findOne({ deviceId }),
      DeviceTelemetry.findOne({ deviceId }).sort({ lastHeartbeat: -1 }),
      FirmwareUpdate.find({ deviceId }).sort({ createdAt: -1 }).limit(10),
      OfflineAttendanceQueue.countDocuments({ deviceId, status: 'queued' }),
    ]);

    res.json({
      success: true,
      data: {
        device,
        telemetry,
        firmwareUpdates,
        queuedItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const uploadFirmware = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Firmware file is required' });
    }

    const firmwareUpdate = await FirmwareUpdate.create({
      deviceId,
      version: req.body.version || 'latest',
      fileName: req.file.originalname,
      filePath: req.file.path,
      status: 'queued',
      progress: 0,
      initiatedBy: req.user?._id,
    });

    await IoTDevice.findOneAndUpdate(
      { deviceId },
      {
        updateStatus: 'queued',
        updateProgress: 0,
        rollbackVersion: req.body.rollbackVersion,
        firmwareVersion: req.body.version || 'latest',
      },
      { new: true }
    );

    const io = req.app.get('io');
    io?.emit('firmware:update', { deviceId, firmwareUpdate });

    res.status(201).json({ success: true, data: firmwareUpdate });
  } catch (error) {
    next(error);
  }
};

const rollbackFirmware = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { rollbackVersion } = req.body;

    const firmwareUpdate = await FirmwareUpdate.create({
      deviceId,
      version: rollbackVersion || 'rollback',
      fileName: 'rollback',
      filePath: 'rollback',
      status: 'rolled-back',
      progress: 100,
      rollbackVersion,
      initiatedBy: req.user?._id,
      completedAt: new Date(),
    });

    await IoTDevice.findOneAndUpdate(
      { deviceId },
      {
        firmwareVersion: rollbackVersion,
        updateStatus: 'rolled-back',
        updateProgress: 100,
        rollbackVersion,
      },
      { new: true }
    );

    res.json({ success: true, data: firmwareUpdate });
  } catch (error) {
    next(error);
  }
};

const syncOfflineAttendance = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const synced = [];

    for (const item of items) {
      const queued = await queueOfflineAttendance({
        deviceId,
        classroomId: item.classroomId,
        sessionId: item.sessionId,
        studentId: item.studentId,
        studentRegisterNumber: item.studentRegisterNumber,
        payload: item,
        duplicateKey: item.duplicateKey || `${deviceId}:${item.studentRegisterNumber || item.studentId || Date.now()}`,
      });
      queued.status = 'synced';
      queued.syncedAt = new Date();
      await queued.save();
      synced.push(queued);
    }

    const io = req.app.get('io');
    io?.emit('attendance:synced', { deviceId, count: synced.length });

    res.json({ success: true, syncedCount: synced.length, data: synced });
  } catch (error) {
    next(error);
  }
};

const getAbsentStudents = async (req, res, next) => {
  try {
    const { department, year, section, date = new Date().toISOString().split('T')[0] } = req.query;
    const studentFilter = buildStudentFilter({ department, year, section });
    const students = await Student.find(studentFilter).populate('user', 'name email').populate('department', 'name code');
    const absents = await DailyAttendance.find({ date, dailyStatus: 'Absent', student: { $in: students.map((student) => student._id) } }).populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }] });

    res.json({ success: true, data: absents, total: absents.length, date });
  } catch (error) {
    next(error);
  }
};

const getOdTracking = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const query = {};
    if (status) query.status = status;

    const ods = await ODRequest.find(query)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }] })
      .sort({ createdAt: -1 })
      .limit(100);

    const filtered = department
      ? ods.filter((od) => od.student?.department?._id?.toString() === department.toString())
      : ods;

    res.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    next(error);
  }
};

const uploadIatMarks = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Excel file is required' });

    const { subjectId, semester, academicYear, examType = 'Combined' } = req.body;
    const mentor = await Mentor.findOne({ user: req.user._id });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const results = { success: [], errors: [] };

    for (const row of rows) {
      const registerNumber = String(row['Register Number'] || row['RegisterNumber'] || row['Reg No'] || row['Register'] || '').toUpperCase().trim();
      if (!registerNumber) {
        results.errors.push({ row, error: 'Missing register number' });
        continue;
      }

      const student = await Student.findOne({ registerNumber });
      if (!student) {
        results.errors.push({ row, error: `Student not found: ${registerNumber}` });
        continue;
      }

      const markData = {
        student: student._id,
        subject: subjectId,
        department: mentor.department,
        mentor: req.user._id,
        semester: parseInt(semester, 10),
        academicYear,
        examType,
        iat1: parseFloat(row['IAT-1'] || row['IAT1'] || row['IA1'] || row['Internal 1'] || 0),
        iat2: parseFloat(row['IAT-2'] || row['IAT2'] || row['IA2'] || row['Internal 2'] || 0),
        assignment: parseFloat(row['Assignment'] || row['Assignment Marks'] || 0),
      };

      await InternalMarks.findOneAndUpdate(
        { student: student._id, subject: subjectId, semester: parseInt(semester, 10) },
        markData,
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );

      results.success.push({ registerNumber, name: student.user?.name || row['Student Name'] || '' });
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const io = req.app.get('io');
    io?.emit('iat:uploaded', { subjectId, semester, academicYear, count: results.success.length });

    await createNotification(
      {
        title: 'IAT Marks Uploaded',
        message: `IAT marks uploaded for semester ${semester}`,
        type: 'iat',
        targetRole: 'student',
        targetDepartment: mentor.department,
      },
      { eventName: 'iat:uploaded', broadcast: true }
    ).catch(() => {});

    res.json({ success: true, data: results });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

const buildIatRows = async (filters) => {
  const query = {};
  if (filters.department) query.department = filters.department;
  if (filters.semester) query.semester = parseInt(filters.semester, 10);
  if (filters.subject) query.subject = filters.subject;

  const rows = await InternalMarks.find(query).populate('student', 'registerNumber year section').populate('subject', 'name code').populate('department', 'name code');
  return rows.map((item) => ({
    registerNumber: item.student?.registerNumber,
    subject: item.subject?.code,
    iat1: item.iat1 || item.internal1 || 0,
    iat2: item.iat2 || item.internal2 || 0,
    assignment: item.assignment || 0,
    total: item.total || 0,
    overallPercentage: item.overallPercentage || 0,
    eligibility: item.eligibility ? 'Eligible' : 'Not Eligible',
    reason: item.eligibilityReason || '',
    department: item.department?.code,
  }));
};

const buildAttendanceRows = async (filters) => {
  const query = {};
  if (filters.department || filters.year || filters.section) {
    const students = await Student.find(buildStudentFilter(filters)).select('_id');
    query['records.student'] = { $in: students.map((student) => student._id) };
  }
  const rows = await Attendance.find(query).populate('subject', 'name code').sort({ date: -1 });
  return rows.map((item) => ({
    date: item.date,
    subject: item.subject?.code,
    hour: item.hour,
    records: item.records.length,
  }));
};

const buildEligibilityRows = async (filters) => {
  const studentFilter = buildStudentFilter(filters);
  const students = await Student.find(studentFilter).populate('user', 'name email').populate('department', 'name code');
  const report = [];

  for (const student of students) {
    const attendanceRecords = await Attendance.find({ 'records.student': student._id, semester: student.semester });
    let total = 0;
    let present = 0;
    attendanceRecords.forEach((record) => {
      const myRecord = record.records.find((r) => r.student.toString() === student._id.toString());
      if (!myRecord) return;
      total += 1;
      if (myRecord.status === 'present') present += 1;
    });

    const iatMarks = await InternalMarks.find({ student: student._id, semester: student.semester });
    const attendancePercent = total > 0 ? (present / total) * 100 : 0;
    const iatPercent = iatMarks.length > 0 ? iatMarks.reduce((sum, mark) => sum + (mark.overallPercentage || 0), 0) / iatMarks.length : 0;
    const eligible = attendancePercent >= 75 && iatPercent >= 40;

    report.push({
      student: student.user?.name,
      registerNumber: student.registerNumber,
      attendancePercent: Math.round(attendancePercent),
      iatPercent: Math.round(iatPercent),
      eligibility: eligible ? 'Eligible' : 'Not Eligible',
      reason: eligible ? 'Meets attendance and assessment thresholds' : 'Attendance below 75% or IAT below threshold',
      department: student.department?.code,
      year: student.year,
      section: student.section,
    });
  }

  return report;
};

const buildFacultyRows = async (filters) => {
  const query = {};
  if (filters.department) query.department = filters.department;
  const mentors = await Mentor.find(query).populate('user', 'name email').populate('department', 'name code');
  const sessions = await ClassroomSession.find(query.department ? { department: query.department } : {});

  return mentors.map((mentor) => {
    const mentorSessions = sessions.filter((session) => session.mentor?.toString?.() === mentor.user?._id?.toString?.());
    const completed = mentorSessions.filter((session) => session.status === 'Completed').length;
    const cancelled = mentorSessions.filter((session) => session.status === 'Cancelled').length;
    const workingHours = mentorSessions.reduce((sum, session) => sum + ((session.durationMinutes || 0) / 60), 0);
    return {
      mentor: mentor.user?.name,
      email: mentor.user?.email,
      department: mentor.department?.code,
      completedLectures: completed,
      cancelledLectures: cancelled,
      workingHours: Math.round(workingHours * 10) / 10,
    };
  });
};

const buildDepartmentRows = async (filters) => {
  const departments = await Department.find(filters.department ? { _id: filters.department } : {}).populate('hod', 'name email');
  const rows = [];

  for (const department of departments) {
    const students = await Student.countDocuments({ department: department._id });
    const mentors = await Mentor.countDocuments({ department: department._id });
    const sessions = await ClassroomSession.find({ department: department._id });
    const activeSessions = sessions.filter((session) => session.status === 'Active').length;
    const completedLectures = sessions.filter((session) => session.status === 'Completed').length;
    rows.push({
      department: department.name,
      code: department.code,
      students,
      mentors,
      activeSessions,
      completedLectures,
    });
  }

  return rows;
};

const buildAbsentRows = async (filters) => {
  const studentFilter = buildStudentFilter(filters);
  const students = await Student.find(studentFilter).populate('user', 'name email').populate('department', 'name code');
  const date = filters.date || new Date().toISOString().split('T')[0];
  const absents = await DailyAttendance.find({ date, dailyStatus: 'Absent', student: { $in: students.map((student) => student._id) } }).populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }] });

  return absents.map((item) => ({
    student: item.student?.user?.name,
    registerNumber: item.student?.registerNumber,
    department: item.student?.department?.code,
    date: item.date,
  }));
};

const buildAcademicInsights = async (filters) => {
  const absentRows = await buildAbsentRows(filters);
  const eligibilityRows = await buildEligibilityRows(filters);
  const sessionCount = await ClassroomSession.countDocuments(filters.department ? { department: filters.department } : {});
  const deviceCount = await IoTDevice.countDocuments();

  const riskStudents = eligibilityRows.filter((row) => row.eligibility === 'Not Eligible').slice(0, 10);

  return {
    attendanceTrends: absentRows.length,
    studentRiskPrediction: riskStudents,
    lowAttendanceAlerts: absentRows.slice(0, 10),
    facultyAnalytics: await buildFacultyRows(filters),
    departmentAnalytics: await buildDepartmentRows(filters),
    classroomUtilization: sessionCount,
    deviceHealth: deviceCount,
    recommendations: [
      'Send low-attendance alerts to mentors automatically',
      'Prioritize lecture coverage for departments with the highest cancellations',
      'Review devices with repeated offline heartbeats',
    ],
  };
};

const getReports = async (req, res, next) => {
  try {
    const { type } = req.params;
    const filters = req.query;

    let data = [];
    if (type === 'attendance') data = await buildAttendanceRows(filters);
    else if (type === 'iat') data = await buildIatRows(filters);
    else if (type === 'eligibility') data = await buildEligibilityRows(filters);
    else if (type === 'faculty') data = await buildFacultyRows(filters);
    else if (type === 'department') data = await buildDepartmentRows(filters);
    else if (type === 'absent') data = await buildAbsentRows(filters);
    else if (type === 'od') data = await getOdTrackingRows(filters);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getOdTrackingRows = async (filters) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  const ods = await ODRequest.find(query).populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }] });
  return ods.map((item) => ({
    student: item.student?.user?.name,
    registerNumber: item.student?.registerNumber,
    status: item.status,
    date: item.date,
    reason: item.reason,
  }));
};

const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const format = (req.query.format || 'xlsx').toLowerCase();
    const filters = req.query;

    let rows = [];
    if (type === 'attendance') rows = await buildAttendanceRows(filters);
    else if (type === 'iat') rows = await buildIatRows(filters);
    else if (type === 'eligibility') rows = await buildEligibilityRows(filters);
    else if (type === 'faculty') rows = await buildFacultyRows(filters);
    else if (type === 'department') rows = await buildDepartmentRows(filters);
    else if (type === 'absent') rows = await buildAbsentRows(filters);
    else if (type === 'od') rows = await getOdTrackingRows(filters);
    else rows = await buildAcademicInsights(filters);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const filename = `${type}-report-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);
      doc.fontSize(18).text(`${type.toUpperCase()} Report`, { underline: true });
      doc.moveDown();
      rows.slice(0, 100).forEach((row) => {
        doc.fontSize(10).text(JSON.stringify(row));
      });
      doc.end();
      return;
    }

    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(Array.isArray(rows) ? rows : [rows]);
    xlsx.utils.book_append_sheet(workbook, sheet, 'Report');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `${type}-report-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getAcademicInsights = async (req, res, next) => {
  try {
    const data = await buildAcademicInsights(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getLectureAnalytics = async (req, res, next) => {
  try {
    const { department } = req.query;
    const query = department ? { department } : {};
    const sessions = await ClassroomSession.find(query).populate('department', 'name code').populate('subject', 'name code').populate('mentor', 'name email');
    const workingHours = sessions.reduce((sum, session) => sum + ((session.durationMinutes || 0) / 60), 0);
    const completedLectures = sessions.filter((session) => session.status === 'Completed').length;
    const cancelledLectures = sessions.filter((session) => session.status === 'Cancelled').length;

    res.json({
      success: true,
      data: {
        workingHours: Math.round(workingHours * 10) / 10,
        completedLectures,
        cancelledLectures,
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveClassrooms,
  startLecture,
  endLecture,
  updateHeartbeat,
  getDeviceDiagnostics,
  uploadFirmware,
  rollbackFirmware,
  syncOfflineAttendance,
  getAbsentStudents,
  getOdTracking,
  uploadIatMarks,
  getReports,
  exportReport,
  getAcademicInsights,
  getLectureAnalytics,
};