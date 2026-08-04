const mongoose = require('mongoose');

const offlineAttendanceQueueSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    classroomId: { type: String },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassroomSession' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentRegisterNumber: { type: String },
    payload: { type: Object, required: true },
    status: { type: String, enum: ['queued', 'synced', 'failed'], default: 'queued' },
    retryCount: { type: Number, default: 0 },
    duplicateKey: { type: String },
    syncedAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

offlineAttendanceQueueSchema.index({ deviceId: 1, duplicateKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('OfflineAttendanceQueue', offlineAttendanceQueueSchema);