const mongoose = require('mongoose');

const classroomSessionSchema = new mongoose.Schema(
  {
    classroomId: { type: String, required: true },
    classroomName: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entryDeviceId: { type: String },
    exitDeviceId: { type: String },
    date: { type: String, required: true },
    status: { type: String, enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'], default: 'Scheduled' },
    teacherPresent: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 },
    recognizedCount: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    recognitionStatus: { type: String, enum: ['Pending', 'Recognizing', 'Recognized', 'Failed'], default: 'Pending' },
    cameraStatus: { type: String, enum: ['Online', 'Offline', 'Maintenance'], default: 'Online' },
    deviceHealth: {
      wifiSignal: { type: Number, default: 0 },
      memoryUsage: { type: Number, default: 0 },
      fps: { type: Number, default: 0 },
      temperature: { type: Number, default: 0 },
      recognitionAccuracy: { type: Number, default: 0 },
      lastHeartbeat: { type: Date },
      storageUsage: { type: Number, default: 0 },
      syncStatus: { type: String, default: 'synced' },
    },
    notes: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

classroomSessionSchema.index({ classroomId: 1, date: 1, status: 1 });

module.exports = mongoose.model('ClassroomSession', classroomSessionSchema);