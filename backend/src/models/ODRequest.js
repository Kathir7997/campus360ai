const mongoose = require('mongoose');

const odRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  reason: { type: String, required: true },
  subject: { type: String },                            // Subject/event for OD
  description: { type: String, required: true },
  date: { type: Date, required: true },
  documentUrl: { type: String }, // Path to uploaded PDF/JPG/PNG
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  mentorRemark: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ODRequest', odRequestSchema);
