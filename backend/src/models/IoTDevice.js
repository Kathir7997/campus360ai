const mongoose = require('mongoose');

const ioTDeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  deviceId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ESP32-CAM', 'Raspberry Pi', 'Arduino', 'Other'],
    default: 'ESP32-CAM'
  },
  status: { 
    type: String, 
    enum: ['Online', 'Offline', 'Maintenance'], 
    default: 'Offline' 
  },
  ipAddress: { type: String },
  lastPing: { type: Date },
  totalScans: { type: Number, default: 0 },
  classroomId: { type: String },
  classroomName: { type: String },
  entryCamera: { type: Boolean, default: true },
  exitCamera: { type: Boolean, default: false },
  firmwareVersion: { type: String, default: '1.0.0' },
  lastHeartbeat: { type: Date },
  wifiSignal: { type: Number, default: 0 },
  memoryUsage: { type: Number, default: 0 },
  fps: { type: Number, default: 0 },
  temperature: { type: Number, default: 0 },
  recognitionAccuracy: { type: Number, default: 0 },
  storageUsage: { type: Number, default: 0 },
  offlineQueueSize: { type: Number, default: 0 },
  syncStatus: { type: String, default: 'synced' },
  updateStatus: { type: String, default: 'idle' },
  updateProgress: { type: Number, default: 0 },
  rollbackVersion: { type: String },
  healthStatus: { type: String, default: 'healthy' },
  lastError: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('IoTDevice', ioTDeviceSchema);
