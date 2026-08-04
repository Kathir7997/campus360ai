const mongoose = require('mongoose');

const deviceTelemetrySchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    classroomId: { type: String },
    cameraStatus: { type: String, enum: ['Online', 'Offline', 'Maintenance'], default: 'Online' },
    wifiSignal: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    fps: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    recognitionAccuracy: { type: Number, default: 0 },
    lastHeartbeat: { type: Date, default: Date.now },
    storageUsage: { type: Number, default: 0 },
    syncStatus: { type: String, enum: ['synced', 'queued', 'failed'], default: 'synced' },
    offlineQueueSize: { type: Number, default: 0 },
    firmwareVersion: { type: String },
    errorMessage: { type: String },
    payload: { type: Object },
  },
  { timestamps: true }
);

deviceTelemetrySchema.index({ deviceId: 1, lastHeartbeat: -1 });

module.exports = mongoose.model('DeviceTelemetry', deviceTelemetrySchema);