const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
});

const attendanceSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true },
    hour: { type: Number, min: 1, max: 8 },
    records: [attendanceRecordSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ subject: 1, date: 1, section: 1 });
attendanceSchema.index({ 'records.student': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
