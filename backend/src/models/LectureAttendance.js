const mongoose = require('mongoose');

const lectureAttendanceSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassroomSession', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    deviceId: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Late', 'Absent', 'OD', 'Manual'], default: 'Present' },
    confidence: { type: Number, default: 0 },
    antiSpoofPassed: { type: Boolean, default: true },
    source: { type: String, enum: ['FaceRecognition', 'ESP32-CAM', 'Manual', 'OD', 'OfflineSync'], default: 'FaceRecognition' },
    duplicatePrevented: { type: Boolean, default: false },
    recognizedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

lectureAttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('LectureAttendance', lectureAttendanceSchema);