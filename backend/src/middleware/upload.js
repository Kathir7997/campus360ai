const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../src/uploads');
const videoUploadDir = path.join(uploadDir, 'temp_videos');

[uploadDir, videoUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Storage configurations ────────────────────────────────────────────────────

const defaultStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videoUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `face_video-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ─── File filters ─────────────────────────────────────────────────────────────

const defaultFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/octet-stream',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel, PDF, and Image files are allowed'), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  const allowedVideoTypes = [
    'video/mp4',
    'video/quicktime',   // .mov
    'video/webm',
    'video/x-msvideo',  // .avi
  ];
  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, MOV, WEBM video files are allowed for face registration'), false);
  }
};

// ─── Multer instances ─────────────────────────────────────────────────────────

const upload = multer({
  storage: defaultStorage,
  fileFilter: defaultFileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10MB for docs
});

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for face registration videos
});

// Attach videoUpload for use in face routes
upload.video = videoUpload;

module.exports = upload;
