const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  deviceId: { type: String, required: true },
  confidence: { type: Number, required: true },
}, { _id: false });

const dailyAttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD for easy querying
  
  morningEntry: scanSchema,
  breakVerification: scanSchema,
  lunchVerification: scanSchema,
  afternoonVerification: scanSchema,
  exitVerification: scanSchema,
  classroomId: { type: String },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassroomSession' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendanceSource: { type: String, enum: ['FaceRecognition', 'ESP32-CAM', 'Manual', 'OD', 'OfflineSync'], default: 'FaceRecognition' },
  syncStatus: { type: String, enum: ['synced', 'queued', 'failed'], default: 'synced' },
  recognitionStatus: { type: String, enum: ['pending', 'recognized', 'spoof_suspected', 'duplicate', 'unknown'], default: 'pending' },
  confidenceScore: { type: Number, default: 0 },
  
  dailyStatus: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'OD', 'Leave', 'Pending'], 
    default: 'Pending' 
  },
  lateMinutes: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate attendance documents for the same student on the same day
dailyAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
