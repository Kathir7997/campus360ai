const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['academic', 'cultural', 'sports', 'exam', 'holiday', 'other'],
      default: 'academic',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    venue: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
