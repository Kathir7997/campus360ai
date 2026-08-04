const mongoose = require('mongoose');

const attendanceConfigSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
  },
  type: {
    type: String,
    enum: ['morning_entry', 'break_verification', 'lunch_verification', 'exit_verification'],
    default: 'morning_entry'
  },
  startTime: { type: String, required: true }, // Format "HH:mm" e.g., "08:45"
  endTime: { type: String, required: true },   // Format "HH:mm" e.g., "09:10"
  lateAfter: { type: String },                  // Format "HH:mm" - after this time, mark as Late
  isActive: { type: Boolean, default: true },
  department: { type: String },
  section: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AttendanceConfig', attendanceConfigSchema);
