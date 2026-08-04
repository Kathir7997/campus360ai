const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['announcement', 'attendance', 'marks', 'event', 'mentor_message', 'system', 'od', 'iat', 'eligibility', 'firmware', 'device', 'alert', 'teacher_presence'],
      default: 'announcement',
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    targetRole: { type: String, enum: ['student', 'mentor', 'hod', 'admin', 'all'] },
    targetDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isRead: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
