const mongoose = require('mongoose');

const internalMarksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true }, // e.g. "2024-25"
    iat1: { type: Number, default: 0, min: 0, max: 30 },
    iat2: { type: Number, default: 0, min: 0, max: 30 },
    internal1: { type: Number, default: 0, min: 0, max: 30 },
    internal2: { type: Number, default: 0, min: 0, max: 30 },
    assignment: { type: Number, default: 0, min: 0, max: 10 },
    total: { type: Number, default: 0 },
    grade: { type: String },
    subjectAverage: { type: Number, default: 0 },
    classAverage: { type: Number, default: 0 },
    departmentAverage: { type: Number, default: 0 },
    overallPercentage: { type: Number, default: 0 },
    eligibility: { type: Boolean, default: false },
    eligibilityReason: { type: String, default: '' },
    examType: { type: String, enum: ['IAT-1', 'IAT-2', 'Combined', 'Internal', 'Unknown'], default: 'Unknown' },
  },
  { timestamps: true }
);

// Auto-calculate total and grade before saving
internalMarksSchema.pre('save', function (next) {
  if (this.iat1 && !this.internal1) this.internal1 = this.iat1;
  if (this.iat2 && !this.internal2) this.internal2 = this.iat2;
  this.total = (this.internal1 || 0) + (this.internal2 || 0) + (this.assignment || 0);
  this.overallPercentage = Math.min(100, Math.round((this.total / 70) * 100));
  if (this.total >= 60) this.grade = 'A';
  else if (this.total >= 50) this.grade = 'B';
  else if (this.total >= 40) this.grade = 'C';
  else if (this.total >= 30) this.grade = 'D';
  else this.grade = 'F';
  next();
});

internalMarksSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('InternalMarks', internalMarksSchema);
