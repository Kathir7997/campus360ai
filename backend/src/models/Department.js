const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalSemesters: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
