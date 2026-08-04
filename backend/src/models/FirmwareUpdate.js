const mongoose = require('mongoose');

const firmwareUpdateSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    version: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    status: { type: String, enum: ['queued', 'in-progress', 'completed', 'failed', 'rolled-back'], default: 'queued' },
    progress: { type: Number, default: 0 },
    rollbackVersion: { type: String },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    errorMessage: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FirmwareUpdate', firmwareUpdateSchema);