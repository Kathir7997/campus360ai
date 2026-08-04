const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, unique: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    designation: { type: String, default: 'Assistant Professor' },
    qualification: { type: String },
    specialization: { type: String },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    assignedSections: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mentor', mentorSchema);
