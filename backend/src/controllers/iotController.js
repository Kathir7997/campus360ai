const DailyAttendance = require('../models/DailyAttendance');
const AttendanceConfig = require('../models/AttendanceConfig');
const IoTDevice = require('../models/IoTDevice');
const faceService = require('../services/faceRecognitionService');
const moment = require('moment');
const {
  recordAttendance,
  upsertDeviceTelemetry,
  queueOfflineAttendance,
} = require('../services/classroomService');
const { createNotification } = require('../services/notificationService');

const toImageList = (body) => {
  if (Array.isArray(body.images) && body.images.length > 0) return body.images;
  if (body.image) return [body.image];
  return [];
};

const processScan = async (req, res) => {
  try {
    const { deviceId, timestamp, classroomId, sessionId, teacherPresent, teacherId, offlineQueue, deviceStatus } = req.body;
    const images = toImageList(req.body);

    if (!deviceId || (!timestamp && !teacherPresent)) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const device = await IoTDevice.findOne({ deviceId });
    if (!device) {
      return res.status(403).json({ success: false, message: 'Invalid device' });
    }

    const requestedStatus = deviceStatus || device.status || 'Online';
    await upsertDeviceTelemetry({
      deviceId,
      classroomId: classroomId || device.classroomId,
      payload: req.body,
      status: requestedStatus,
    });

    if (requestedStatus !== 'Online' && offlineQueue) {
      const queued = await queueOfflineAttendance({
        deviceId,
        classroomId: classroomId || device.classroomId,
        sessionId,
        payload: req.body,
        duplicateKey: `${deviceId}:${timestamp || Date.now()}`,
      });
      return res.status(202).json({ success: true, queued: true, data: queued });
    }

    if (teacherPresent !== undefined) {
      const session = await require('../services/classroomService').registerTeacherPresence({
        classroomId: classroomId || device.classroomId,
        classroomName: device.classroomName || classroomId || device.classroomId,
        deviceId,
        teacherId,
        present: teacherPresent === true || teacherPresent === 'true',
        timestamp,
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('teacher:presence', {
          classroomId: session.classroomId,
          classroomName: session.classroomName,
          teacherPresent: session.teacherPresent,
          status: session.status,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: session.durationMinutes,
        });
      }

      await createNotification(
        {
          title: teacherPresent ? 'Teacher Entered Classroom' : 'Teacher Left Classroom',
          message: `${session.classroomName} has been ${teacherPresent ? 'started' : 'ended'} automatically.`,
          type: 'teacher_presence',
          targetRole: 'mentor',
        },
        { eventName: 'teacher:presence', room: `classroom_${session.classroomId}` }
      ).catch(() => {});

      return res.status(200).json({ success: true, data: session, message: 'Teacher presence updated' });
    }

    // 2. Determine Current Attendance Window
    const activeWindows = await AttendanceConfig.find({ isActive: true });
    
    const scanTime = moment(timestamp);
    const timeFormat = 'HH:mm';
    const current = moment(scanTime.format(timeFormat), timeFormat);
    
    let matchedWindow = null;

    for (const win of activeWindows) {
      const start = moment(win.startTime, timeFormat);
      let end = moment(win.endTime, timeFormat);
      
      // Handle cases where end time is past midnight (e.g., 23:00 to 01:00)
      if (end.isBefore(start)) {
        end.add(1, 'day');
        if (current.isBefore(start)) {
          current.add(1, 'day');
        }
      }

      if (current.isBetween(start, end, undefined, '[]')) {
        // Map win.type (e.g., 'morning_entry') to schema field (e.g., 'morningEntry')
        const typeMap = {
          'morning_entry': 'morningEntry',
          'break_verification': 'breakVerification',
          'lunch_verification': 'lunchVerification',
          'afternoon_verification': 'afternoonVerification',
          'exit_verification': 'exitVerification'
        };
        matchedWindow = typeMap[win.type] || win.type;
        break;
      }
    }

    if (!matchedWindow) {
      return res.status(400).json({ success: false, message: 'Attendance Closed: No active time window' });
    }

    const results = [];
    for (const image of images.length > 0 ? images : []) {
      const embedding = await faceService.generateEmbedding(image);
      if (!embedding || embedding.sharpness < 12) {
        results.push({ success: false, error: 'Anti-spoofing failed', confidence: 0 });
        continue;
      }

      const recognitionResult = await faceService.recognizeFace(image);
      if (!recognitionResult.success) {
        results.push({ success: false, error: recognitionResult.error || 'Unknown Student', confidence: 0 });
        continue;
      }

      const recordResult = await recordAttendance({
        studentId: recognitionResult.studentId,
        deviceId,
        timestamp: scanTime.toDate(),
        confidence: recognitionResult.confidence,
        classroomId: classroomId || device.classroomId,
        sessionId,
        source: 'FaceRecognition',
        antiSpoofPassed: true,
        recognitionStatus: 'recognized',
        status: matchedWindow === 'exitVerification' ? 'Present' : undefined,
      });

      results.push({
        success: true,
        duplicate: recordResult.duplicate,
        studentId: recordResult.student._id,
        studentName: recordResult.student.user.name,
        confidence: recognitionResult.confidence,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:marked', { deviceId, classroomId: classroomId || device.classroomId, window: matchedWindow, results, timestamp: scanTime.toDate() });
    }

    res.status(200).json({
      success: true,
      window: matchedWindow,
      results,
    });

  } catch (error) {
    console.error('IoT Scan Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.scanFace = processScan;
exports.processAttendanceScan = processScan;
