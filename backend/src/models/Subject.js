const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, default: 3 },
    type: { type: String, enum: ['theory', 'lab', 'elective'], default: 'theory' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
