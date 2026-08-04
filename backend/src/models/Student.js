const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registerNumber: { type: String, required: true, unique: true, uppercase: true },
    rollNumber: { type: String },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    year: { type: Number, required: true, min: 1, max: 4 },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, required: true, uppercase: true },
    batch: { type: String, required: true }, // e.g. "2022-2026"
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: { type: String },
    parentName: { type: String },
    parentPhone: { type: String },
    profileImage: { type: String },
    faceDataset: [{ type: String }],
    isActive: { type: Boolean, default: true },

    // ─── Face Registration Fields (Feature 3) ──────────────────────────────────
    faceRegistered: { type: Boolean, default: false },
    faceEmbedding: { type: [Number], default: [] },   // 128-dim descriptor vector
    faceQualityScore: { type: Number, default: 0 },   // 0-100 quality score
    faceImagesCount: { type: Number, default: 0 },    // Number of frames used
    faceRegisteredAt: { type: Date },                  // First registration timestamp
  },
  { timestamps: true }
);

studentSchema.index({ department: 1, year: 1, section: 1 });

module.exports = mongoose.model('Student', studentSchema);
