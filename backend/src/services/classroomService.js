const moment = require('moment');
const Student = require('../models/Student');
const IoTDevice = require('../models/IoTDevice');
const DailyAttendance = require('../models/DailyAttendance');
const LectureAttendance = require('../models/LectureAttendance');
const ClassroomSession = require('../models/ClassroomSession');
const OfflineAttendanceQueue = require('../models/OfflineAttendanceQueue');
const DeviceTelemetry = require('../models/DeviceTelemetry');
const { createNotification, emitToRoom } = require('./notificationService');

const toDateKey = (value) => moment(value || new Date()).format('YYYY-MM-DD');

const resolveSession = async ({ sessionId, classroomId, deviceId, timestamp }) => {
  if (sessionId) {
    return ClassroomSession.findById(sessionId);
  }

  const date = toDateKey(timestamp);
  const query = { date, status: { $in: ['Scheduled', 'Active'] } };

  if (classroomId) {
    query.classroomId = classroomId;
  } else if (deviceId) {
    query.$or = [{ entryDeviceId: deviceId }, { exitDeviceId: deviceId }];
  }

  return ClassroomSession.findOne(query).sort({ createdAt: -1 });
};

const updateSessionStats = async (sessionId) => {
  if (!sessionId) return null;

  const session = await ClassroomSession.findById(sessionId);
  if (!session) return null;

  const lectureAttendances = await LectureAttendance.find({ session: sessionId }).select('confidence');
  const count = lectureAttendances.length;
  const averageConfidence = count > 0
    ? lectureAttendances.reduce((sum, item) => sum + (item.confidence || 0), 0) / count
    : 0;

  session.recognizedCount = count;
  session.studentCount = Math.max(session.studentCount || 0, count);
  session.confidenceScore = Math.round(averageConfidence);
  if (!session.startTime) session.startTime = new Date();
  if (session.status === 'Scheduled') session.status = 'Active';
  await session.save();

  return session;
};

const recordAttendance = async ({
  studentId,
  deviceId,
  timestamp,
  confidence,
  sessionId,
  classroomId,
  source = 'FaceRecognition',
  antiSpoofPassed = true,
  recognitionStatus = 'recognized',
  status,
  notes,
}) => {
  const student = await Student.findById(studentId).populate('user', 'name email').populate('department', 'name code');
  if (!student) {
    return { success: false, message: 'Student not found' };
  }

  const scanTime = moment(timestamp || new Date());
  const session = await resolveSession({ sessionId, classroomId, deviceId, timestamp: scanTime.toDate() });
  const lectureStatus = status || (session?.startTime && scanTime.isAfter(moment(session.startTime).add(10, 'minutes')) ? 'Late' : 'Present');
  const dateKey = toDateKey(scanTime.toDate());

  let duplicate = false;
  if (session) {
    try {
      await LectureAttendance.create({
        session: session._id,
        student: student._id,
        deviceId,
        status: lectureStatus,
        confidence: confidence || 0,
        antiSpoofPassed,
        source,
        notes,
      });
    } catch (error) {
      if (error.code === 11000) {
        duplicate = true;
      } else {
        throw error;
      }
    }
  }

  let dailyRecord = await DailyAttendance.findOne({ student: student._id, date: dateKey });
  if (!dailyRecord) {
    dailyRecord = new DailyAttendance({
      student: student._id,
      date: dateKey,
      classroomId: classroomId || session?.classroomId,
      sessionId: session?._id,
      teacherId: session?.teacher,
      attendanceSource: source,
      syncStatus: 'synced',
      recognitionStatus: recognitionStatus || (antiSpoofPassed ? 'recognized' : 'spoof_suspected'),
      confidenceScore: confidence || 0,
    });
  }

  dailyRecord.classroomId = classroomId || session?.classroomId || dailyRecord.classroomId;
  dailyRecord.sessionId = session?._id || dailyRecord.sessionId;
  dailyRecord.teacherId = session?.teacher || dailyRecord.teacherId;
  dailyRecord.attendanceSource = source;
  dailyRecord.recognitionStatus = recognitionStatus || (antiSpoofPassed ? 'recognized' : 'spoof_suspected');
  dailyRecord.confidenceScore = confidence || dailyRecord.confidenceScore || 0;
  dailyRecord.dailyStatus = lectureStatus;
  await dailyRecord.save();

  const updatedSession = session ? await updateSessionStats(session._id) : null;

  const payload = {
    studentId: student._id,
    name: student.user?.name,
    department: student.department?.name,
    registerNumber: student.registerNumber,
    status: duplicate ? 'Duplicate Ignored' : 'Attendance Marked',
    confidence: confidence || 0,
    antiSpoofPassed,
    recognitionStatus,
    timestamp: scanTime.toDate(),
    sessionId: session?._id,
    classroomId: classroomId || session?.classroomId,
    duplicate,
  };

  if (session) {
    emitToRoom(`classroom_${session.classroomId}`, 'classroom:attendance', payload);
    if (!duplicate) {
      await createNotification(
        {
          title: 'Attendance Marked',
          message: `${student.user?.name} marked present in ${session.classroomName || session.classroomId}`,
          type: 'attendance',
          targetRole: 'student',
          targetUser: student.user?._id,
        },
        { eventName: 'attendance:marked', targetUser: student.user?._id }
      ).catch(() => {});
    }
  }

  return {
    success: true,
    duplicate,
    session: updatedSession,
    dailyRecord,
    student,
    payload,
  };
};

const registerTeacherPresence = async ({
  classroomId,
  classroomName,
  deviceId,
  teacherId,
  present,
  timestamp,
  departmentId,
  subjectId,
}) => {
  const date = toDateKey(timestamp);
  let session = await resolveSession({ classroomId, deviceId, timestamp });

  if (!session) {
    session = await ClassroomSession.create({
      classroomId,
      classroomName: classroomName || classroomId,
      department: departmentId,
      subject: subjectId,
      teacher: teacherId,
      entryDeviceId: deviceId,
      date,
      status: present ? 'Active' : 'Scheduled',
      teacherPresent: !!present,
      startTime: present ? new Date(timestamp || Date.now()) : null,
    });
  } else {
    session.teacherPresent = !!present;
    session.teacher = teacherId || session.teacher;
    session.classroomName = classroomName || session.classroomName;
    if (present && !session.startTime) {
      session.startTime = new Date(timestamp || Date.now());
      session.status = 'Active';
    }

    if (!present) {
      session.endTime = new Date(timestamp || Date.now());
      session.status = 'Completed';
      if (session.startTime) {
        session.durationMinutes = Math.max(0, Math.round((session.endTime - session.startTime) / 60000));
      }
    }

    await session.save();
  }

  return session;
};

const upsertDeviceTelemetry = async ({ deviceId, classroomId, payload = {}, status = 'Online' }) => {
  const lastHeartbeat = payload.lastHeartbeat ? new Date(payload.lastHeartbeat) : new Date();

  const telemetry = await DeviceTelemetry.findOneAndUpdate(
    { deviceId },
    {
      deviceId,
      classroomId,
      cameraStatus: payload.cameraStatus || status,
      wifiSignal: payload.wifiSignal || 0,
      memoryUsage: payload.memoryUsage || 0,
      fps: payload.fps || 0,
      uptime: payload.uptime || 0,
      temperature: payload.temperature || 0,
      recognitionAccuracy: payload.recognitionAccuracy || 0,
      lastHeartbeat,
      storageUsage: payload.storageUsage || 0,
      syncStatus: payload.syncStatus || 'synced',
      offlineQueueSize: payload.offlineQueueSize || 0,
      firmwareVersion: payload.firmwareVersion,
      errorMessage: payload.errorMessage,
      payload,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await IoTDevice.findOneAndUpdate(
    { deviceId },
    {
      status,
      classroomId,
      lastPing: lastHeartbeat,
      lastHeartbeat,
      wifiSignal: payload.wifiSignal || 0,
      memoryUsage: payload.memoryUsage || 0,
      fps: payload.fps || 0,
      temperature: payload.temperature || 0,
      recognitionAccuracy: payload.recognitionAccuracy || 0,
      storageUsage: payload.storageUsage || 0,
      offlineQueueSize: payload.offlineQueueSize || 0,
      syncStatus: payload.syncStatus || 'synced',
      firmwareVersion: payload.firmwareVersion,
      healthStatus: status === 'Online' ? 'healthy' : 'degraded',
      lastError: payload.errorMessage,
    },
    { new: true }
  );

  return telemetry;
};

const queueOfflineAttendance = async ({ deviceId, classroomId, sessionId, studentId, studentRegisterNumber, payload, duplicateKey }) => {
  return OfflineAttendanceQueue.create({
    deviceId,
    classroomId,
    session: sessionId,
    student: studentId,
    studentRegisterNumber,
    payload,
    duplicateKey,
    status: 'queued',
  });
};

module.exports = {
  resolveSession,
  recordAttendance,
  registerTeacherPresence,
  upsertDeviceTelemetry,
  queueOfflineAttendance,
  updateSessionStats,
};