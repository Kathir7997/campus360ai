/**
 * Face Registration Controller
 * Handles student face registration via:
 *  1. Webcam captured frames (array of base64 images)
 *  2. Uploaded video (MP4/MOV/WEBM) — frames extracted server-side via ffmpeg (optional)
 */

const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');
const faceService = require('../services/faceRecognitionService');

// ─── POST /api/face/register-webcam ───────────────────────────────────────────
/**
 * Accept ~20 webcam frames as base64 array, process, store embedding.
 * Body: { images: string[] }  (each = base64 data URI or raw base64)
 */
exports.registerWebcam = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { images } = req.body;
    if (!Array.isArray(images) || images.length < 5) {
      return res.status(400).json({ success: false, message: 'At least 5 face images are required' });
    }

    if (images.length > 40) {
      return res.status(400).json({ success: false, message: 'Maximum 40 images allowed per registration' });
    }

    // Process images – filter blur/no-face, generate averaged embedding
    const result = await faceService.processImages(images);

    if (result.error) {
      return res.status(422).json({ success: false, message: result.error });
    }

    // Store embedding in Student record
    const now = new Date();
    student.faceEmbedding = result.embedding;
    student.faceRegistered = true;
    student.faceQualityScore = result.qualityScore;
    student.faceImagesCount = result.imagesUsed;
    if (!student.faceRegisteredAt) student.faceRegisteredAt = now;
    await student.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user._id}`).emit('face:registered', {
        studentId: student._id,
        qualityScore: result.qualityScore,
        imagesCount: result.imagesUsed,
        timestamp: now.toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: `Face registered successfully using ${result.imagesUsed} images`,
      data: {
        faceRegistered: true,
        qualityScore: result.qualityScore,
        imagesCount: result.imagesUsed,
        registeredAt: student.faceRegisteredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/face/register-video ────────────────────────────────────────────
/**
 * Accept uploaded video, extract frames client-side (via query param frames[]),
 * OR attempt server-side extraction if ffmpeg is available.
 * This endpoint accepts: { frames: string[] } in body OR multipart video file.
 */
exports.registerVideo = async (req, res, next) => {
  const videoPath = req.file?.path;
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // If client pre-extracted frames and sent them in body
    if (req.body.frames) {
      let frames;
      try {
        frames = typeof req.body.frames === 'string' ? JSON.parse(req.body.frames) : req.body.frames;
      } catch {
        frames = req.body.frames;
      }

      if (!Array.isArray(frames) || frames.length < 5) {
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        return res.status(400).json({ success: false, message: 'At least 5 frames are required' });
      }

      const result = await faceService.processImages(frames);
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath); // Always delete video

      if (result.error) {
        return res.status(422).json({ success: false, message: result.error });
      }

      const now = new Date();
      student.faceEmbedding = result.embedding;
      student.faceRegistered = true;
      student.faceQualityScore = result.qualityScore;
      student.faceImagesCount = result.imagesUsed;
      if (!student.faceRegisteredAt) student.faceRegisteredAt = now;
      await student.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user._id}`).emit('face:registered', {
          studentId: student._id,
          qualityScore: result.qualityScore,
          imagesCount: result.imagesUsed,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Face registered from video using ${result.imagesUsed} frames`,
        data: {
          faceRegistered: true,
          qualityScore: result.qualityScore,
          imagesCount: result.imagesUsed,
          registeredAt: student.faceRegisteredAt,
        },
      });
    }

    // No frames provided
    if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    res.status(400).json({ success: false, message: 'Please provide extracted frames in the request' });

  } catch (error) {
    if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    next(error);
  }
};

// ─── GET /api/face/status ─────────────────────────────────────────────────────
exports.getFaceStatus = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({
      success: true,
      data: {
        faceRegistered: student.faceRegistered || false,
        qualityScore: student.faceQualityScore || 0,
        imagesCount: student.faceImagesCount || 0,
        registeredAt: student.faceRegisteredAt || null,
        lastUpdated: student.updatedAt,
        modelsLoaded: faceService.isModelsLoaded(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/admin/face-registrations/:studentId ──────────────────────────
exports.resetFaceRegistration = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      {
        faceRegistered: false,
        faceEmbedding: [],
        faceQualityScore: 0,
        faceImagesCount: 0,
        faceRegisteredAt: null,
        faceDataset: [],
      },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, message: 'Face registration reset successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/face-registrations ────────────────────────────────────────
exports.getFaceRegistrations = async (req, res, next) => {
  try {
    const { department, year, page = 1, limit = 30 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (year) query.year = parseInt(year);

    const students = await Student.find(query)
      .populate('user', 'name email')
      .populate('department', 'name code')
      .select('registerNumber faceRegistered faceQualityScore faceImagesCount faceRegisteredAt year section department user')
      .sort({ faceRegistered: -1, 'user.name': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);
    const registered = await Student.countDocuments({ ...query, faceRegistered: true });

    res.status(200).json({
      success: true,
      data: students,
      total,
      registered,
      unregistered: total - registered,
    });
  } catch (error) {
    next(error);
  }
};
