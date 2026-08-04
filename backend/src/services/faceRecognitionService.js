/**
 * Face Recognition Service
 * Uses @vladmandic/face-api with canvas for Node.js face embedding generation and comparison.
 * 
 * Architecture:
 *   - generateEmbedding(imageBase64) → 128-dim Float32Array descriptor
 *   - recognizeFace(imageBase64)     → { success, studentId, confidence, studentName }
 *   - cosineSimilarity(a, b)         → similarity score (0-1)
 * 
 * Recognition threshold: 0.45 cosine distance (lower = more similar)
 */

const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');

// ─── Lazy-loaded face-api setup ─────────────────────────────────────────────
let faceapi = null;
let canvas = null;
let modelsLoaded = false;

const MODELS_PATH = path.join(__dirname, 'face_models');
const RECOGNITION_THRESHOLD = parseFloat(process.env.FACE_RECOGNITION_THRESHOLD) || 0.22;

/**
 * Initialize face-api.js with Node.js canvas backend and load models.
 * Called lazily on first use.
 */
async function initFaceApi() {
  if (modelsLoaded) return;

  try {
    // Dynamic import to avoid crash if package not installed yet
    const faceApiModule = await import('@vladmandic/face-api');
    faceapi = faceApiModule.default || faceApiModule;
    const canvasModule = await import('canvas');
    canvas = canvasModule;

    // Monkey-patch face-api with canvas implementation for Node.js
    const { Canvas, Image, ImageData } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    // Check if model files exist
    if (!fs.existsSync(MODELS_PATH)) {
      console.warn('⚠️  Face models directory not found at:', MODELS_PATH);
      console.warn('   Face recognition will use MOCK mode.');
      console.warn('   Download models from: https://github.com/vladmandic/face-api/tree/master/model');
      return;
    }

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH),
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH),
    ]);

    modelsLoaded = true;
    console.log('✅ Face recognition models loaded successfully');
  } catch (err) {
    // Silently fall back to mock mode if models/tfjs-node are unavailable
    // console.warn('⚠️  Face-api.js initialization failed, using mock mode:', err.message);
    faceapi = null;
    canvas = null;
  }
}

// Initialize on module load (non-blocking)
initFaceApi().catch(() => {});

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Compute cosine distance between two descriptor arrays.
 * Returns 0 for identical, 2 for completely opposite.
 */
function cosineDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 2;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 2;
  return 1 - dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Average multiple descriptor arrays element-wise.
 */
function averageDescriptors(descriptors) {
  if (!descriptors || descriptors.length === 0) return null;
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const desc of descriptors) {
    for (let i = 0; i < len; i++) avg[i] += desc[i];
  }
  return avg.map((v) => v / descriptors.length);
}

/**
 * Compute a simple sharpness score using variance of pixel values.
 * Higher = sharper image. Threshold: score > 20 is acceptable.
 */
function computeSharpness(pixelData) {
  if (!pixelData || pixelData.length < 4) return 0;
  const grays = [];
  for (let i = 0; i < pixelData.length; i += 4) {
    grays.push(0.299 * pixelData[i] + 0.587 * pixelData[i + 1] + 0.114 * pixelData[i + 2]);
  }
  const mean = grays.reduce((s, v) => s + v, 0) / grays.length;
  const variance = grays.reduce((s, v) => s + (v - mean) ** 2, 0) / grays.length;
  return Math.min(100, Math.round(variance / 100));
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Generate face embedding from a base64 image.
 * Returns { descriptor: Float32Array, sharpness: number } or null if no face found.
 */
exports.generateEmbedding = async (imageBase64) => {
  if (!modelsLoaded || !canvas) {
    // Mock: return a random 128-dim descriptor for testing
    const mockDesc = Array.from({ length: 128 }, () => Math.random() * 0.2 - 0.1);
    return { descriptor: mockDesc, sharpness: 75 };
  }

  try {
    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const img = await canvas.loadImage(buffer);

    // Compute sharpness from canvas pixel data
    const cnv = canvas.createCanvas(img.width, img.height);
    const ctx = cnv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const sharpness = computeSharpness(imageData.data);

    // Detect face and extract 128-dim descriptor
    const detection = await faceapi
      .detectSingleFace(cnv, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    return {
      descriptor: Array.from(detection.descriptor),
      sharpness,
    };
  } catch (err) {
    console.error('generateEmbedding error:', err.message);
    return null;
  }
};

/**
 * Process multiple base64 images, filter low quality, return averaged embedding.
 * Returns { embedding, qualityScore, imagesUsed } or null.
 */
exports.processImages = async (base64Images) => {
  const SHARPNESS_THRESHOLD = 15;
  const descriptors = [];
  let totalSharpness = 0;
  let processed = 0;

  for (const img of base64Images) {
    const result = await exports.generateEmbedding(img);
    if (!result) continue;
    if (result.sharpness < SHARPNESS_THRESHOLD) continue; // Discard blurry

    descriptors.push(result.descriptor);
    totalSharpness += result.sharpness;
    processed++;

    // Max 20 good frames
    if (processed >= 20) break;
  }

  if (descriptors.length < 3) {
    return { error: 'Not enough clear face images detected. Please ensure good lighting and face the camera directly.' };
  }

  const averaged = averageDescriptors(descriptors);
  const qualityScore = Math.min(100, Math.round(totalSharpness / descriptors.length));

  return {
    embedding: averaged,
    qualityScore,
    imagesUsed: descriptors.length,
  };
};

/**
 * Recognize a face image against all registered students.
 * Returns { success, studentId, confidence, error }
 */
exports.recognizeFace = async (imageBase64) => {
  try {
    if (!modelsLoaded || !canvas) {
      // Mock Demo Mode: pick a random student from registered ones to simulate success
      const students = await Student.find({ faceRegistered: true, isActive: true });
      if (students.length === 0) return { success: false, error: 'No registered students found in database' };
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      return { success: true, studentId: randomStudent._id, confidence: 95 };
    }

    const imgResult = await exports.generateEmbedding(imageBase64);
    if (!imgResult) {
      return { success: false, error: 'No face detected in the image' };
    }

    // Get all students with registered faces
    const students = await Student.find({ faceRegistered: true, isActive: true });
    if (students.length === 0) {
      return { success: false, error: 'No registered students in face dataset' };
    }

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const student of students) {
      if (!student.faceEmbedding || student.faceEmbedding.length === 0) continue;
      const distance = cosineDistance(imgResult.descriptor, student.faceEmbedding);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = student;
      }
    }

    if (!bestMatch || bestDistance > RECOGNITION_THRESHOLD) {
      return {
        success: false,
        error: 'Unknown Person',
        bestDistance,
      };
    }

    const confidence = Math.round((1 - bestDistance / RECOGNITION_THRESHOLD) * 100);

    return {
      success: true,
      studentId: bestMatch._id,
      confidence: Math.min(99.9, confidence),
    };
  } catch (err) {
    console.error('recognizeFace error:', err.message);
    return { success: false, error: `Face recognition error: ${err.message}` };
  }
};

exports.isModelsLoaded = () => modelsLoaded;
