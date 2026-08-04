const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  registerWebcam,
  registerVideo,
  getFaceStatus,
} = require('../controllers/faceRegistrationController');

// All face routes require authentication
router.use(protect);

// Student: get registration status
router.get('/status', authorize('student'), getFaceStatus);

// Student: register via webcam frames (JSON body: { images: string[] })
router.post('/register-webcam', authorize('student'), express.json({ limit: '50mb' }), registerWebcam);

// Student: register via uploaded video + pre-extracted frames
router.post(
  '/register-video',
  authorize('student'),
  upload.single('video'),
  registerVideo
);

module.exports = router;
