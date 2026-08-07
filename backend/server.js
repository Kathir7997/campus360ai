require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { seed } = require('./src/utils/seeder');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const mentorRoutes = require('./src/routes/mentorRoutes');
const hodRoutes = require('./src/routes/hodRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const iotRoutes = require('./src/routes/iotRoutes');
const odRoutes = require('./src/routes/odRoutes');
const faceRoutes = require('./src/routes/faceRoutes');
const monitoringRoutes = require('./src/routes/monitoringRoutes');
const mqttService = require('./src/services/mqttService');
const { setSocketServer } = require('./src/services/notificationService');

const app = express();
const server = http.createServer(app);

// Trust reverse proxy (Render, Vercel, Nginx, Cloudflare)
app.set('trust proxy', 1);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('join_room', (room) => socket.join(room));
  socket.on('join_classroom', (room) => socket.join(`classroom_${room}`));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected:', socket.id));
});

// Make io accessible in routes
app.set('io', io);
setSocketServer(io);
mqttService.init({ io });

// ─── Middleware ───────────────────────────────────────────────────────────────

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Flexible CORS allowing Vercel, localhost, and custom frontend domains
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});
app.use('/api/auth/login', authLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logger
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/od', odRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/monitoring', monitoringRoutes);

const path = require('path');
const fs = require('fs');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Campus360 API is running 🚀', timestamp: new Date().toISOString() });
});

// Serve frontend static files if build exists (Full-stack single service mode)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // API-only mode root landing
  app.get('/', (req, res) => {
    res.json({
      success: true,
      service: 'Campus360 AI Backend API',
      status: 'online',
      healthCheck: '/api/health',
      message: 'Welcome to Campus360 AI API. All ERP API routes are available under /api/*',
      timestamp: new Date().toISOString(),
    });
  });
}

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const startServer = () => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 Campus360 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log(`❤️  Health:  http://localhost:${PORT}/api/health\n`);
  });
};

connectDB()
  .then(() => seed({ reset: process.env.SEED_RESET === 'true' }))
  .then(() => startServer())
  .catch((error) => {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
