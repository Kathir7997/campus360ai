const ODRequest = require('../models/ODRequest');
const DailyAttendance = require('../models/DailyAttendance');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// 1. Student applies for OD
exports.applyOD = async (req, res) => {
  try {
    const { reason, subject, description, date } = req.body;
    
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students can apply for OD' });
    }

    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const odRequest = await ODRequest.create({
      student: student._id,
      reason,
      subject: subject || '',
      description,
      date,
      documentUrl
    });

    res.status(201).json({ success: true, message: 'OD Request submitted successfully', data: odRequest });
  } catch (error) {
    console.error('Apply OD Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit OD request' });
  }
};

// 2. Student views their OD requests
exports.getStudentODs = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const requests = await ODRequest.find({ student: student._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching requests' });
  }
};

// 3. Mentor views pending OD requests for their assigned students
exports.getMentorPendingODs = async (req, res) => {
  try {
    const pendingRequests = await ODRequest.find({ status: 'Pending' })
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }] })
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending requests' });
  }
};

// 4. Mentor approves/rejects OD — updates DailyAttendance + notifies student
exports.processOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mentorRemark } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const odRequest = await ODRequest.findById(id).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email _id' }
    });
    if (!odRequest) return res.status(404).json({ success: false, message: 'OD Request not found' });

    odRequest.status = status;
    odRequest.mentorRemark = mentorRemark || '';
    odRequest.approvedBy = req.user._id;
    odRequest.approvedAt = new Date();
    await odRequest.save();

    const io = req.app.get('io');

    if (status === 'Approved') {
      // Update DailyAttendance: change Absent → OD for that date
      const dateStr = new Date(odRequest.date).toISOString().split('T')[0];
      
      let dailyRecord = await DailyAttendance.findOne({ student: odRequest.student._id, date: dateStr });
      if (!dailyRecord) {
        dailyRecord = new DailyAttendance({
          student: odRequest.student._id,
          date: dateStr,
          dailyStatus: 'OD'
        });
      } else {
        dailyRecord.dailyStatus = 'OD';
      }
      await dailyRecord.save();

      // Create notification for student
      try {
        await Notification.create({
          title: 'OD Request Approved ✅',
          message: `Your OD request for ${dateStr} has been approved. ${mentorRemark ? `Remark: ${mentorRemark}` : ''}`,
          type: 'success',
          targetRole: 'student',
          targetUser: odRequest.student.user._id,
        });
      } catch (_) {}

      // Emit Socket.IO
      if (io) {
        io.to(`user_${odRequest.student.user._id}`).emit('od:approved', {
          odId: odRequest._id,
          date: dateStr,
          message: 'Your OD has been approved. Attendance updated.',
          mentorRemark,
        });
      }
    } else {
      // Rejected notification
      try {
        const dateStr = new Date(odRequest.date).toISOString().split('T')[0];
        await Notification.create({
          title: 'OD Request Rejected ❌',
          message: `Your OD request for ${dateStr} has been rejected. ${mentorRemark ? `Reason: ${mentorRemark}` : ''}`,
          type: 'error',
          targetRole: 'student',
          targetUser: odRequest.student.user._id,
        });
      } catch (_) {}

      if (io) {
        io.to(`user_${odRequest.student.user._id}`).emit('od:rejected', {
          odId: odRequest._id,
          message: 'Your OD request has been rejected.',
          remark: mentorRemark,
        });
      }
    }

    res.status(200).json({ success: true, message: `OD Request ${status}`, data: odRequest });
  } catch (error) {
    console.error('processOD error:', error);
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
};

// 5. Get all ODs for admin/HOD
exports.getAllODs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    
    const ods = await ODRequest.find(query)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'name code' }] })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ODRequest.countDocuments(query);
    res.status(200).json({ success: true, data: ods, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching ODs' });
  }
};
