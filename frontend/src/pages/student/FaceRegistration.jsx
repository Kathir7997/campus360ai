import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, AlertCircle, Video, Play, StopCircle, RefreshCw } from 'lucide-react';
import { DashboardCard, Badge } from '../../components/common/index';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FaceRegistration = () => {
  const [activeTab, setActiveTab] = useState('webcam');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Webcam state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [instructionStep, setInstructionStep] = useState(0);

  // Video upload state
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const instructions = [
    "Look Straight", "Turn Left Slightly", "Turn Right Slightly",
    "Look Up Slightly", "Look Down Slightly", "Smile", "Blink"
  ];

  const fetchStatus = async () => {
    try {
      const res = await api.get('/face/status');
      setStatus(res.data.data);
    } catch (err) {
      toast.error('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // ─── Webcam Logic ─────────────────────────────────────────────────────────────
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'webcam') startCamera();
    else stopCamera();
    return stopCamera;
  }, [activeTab]);

  const captureSequence = async () => {
    setCapturing(true);
    setCapturedFrames([]);
    setInstructionStep(0);
    
    let frames = [];
    
    // Simple sequence: capture 3 frames per instruction step
    for (let i = 0; i < instructions.length; i++) {
      setInstructionStep(i);
      await new Promise(r => setTimeout(r, 1500)); // wait for user to pose
      
      for(let j=0; j<3; j++) {
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          frames.push(canvasRef.current.toDataURL('image/jpeg', 0.8));
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    setCapturedFrames(frames);
    setInstructionStep(instructions.length); // Complete
    
    // Submit frames
    submitWebcamFrames(frames);
  };

  const submitWebcamFrames = async (frames) => {
    const toastId = toast.loading('Processing face data...');
    try {
      const res = await api.post('/face/register-webcam', { images: frames });
      toast.success(res.data.message, { id: toastId });
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: toastId });
    } finally {
      setCapturing(false);
      setInstructionStep(0);
      setCapturedFrames([]);
    }
  };

  // ─── Video Upload Logic ───────────────────────────────────────────────────────

  const handleVideoUpload = async () => {
    if (!videoFile) return toast.error('Please select a video file');
    
    const formData = new FormData();
    formData.append('video', videoFile);

    setUploading(true);
    const toastId = toast.loading('Uploading and processing video...');
    try {
      const res = await api.post('/face/register-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message, { id: toastId });
      fetchStatus();
      setVideoFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Video processing failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Face Registration</h1>
        <p className="text-sm text-slate-500">Register your face for IoT smart attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <DashboardCard title="Registration Status" className="lg:col-span-1 h-fit">
          <div className="flex flex-col items-center p-4">
            {status?.faceRegistered ? (
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
            )}
            
            <h3 className="text-lg font-bold mb-1">{status?.faceRegistered ? 'Registered' : 'Not Registered'}</h3>
            <Badge variant={status?.faceRegistered ? 'success' : 'danger'}>
              {status?.faceRegistered ? 'Active' : 'Action Required'}
            </Badge>

            {status?.faceRegistered && (
              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Quality Score</span>
                  <span className="font-semibold text-emerald-600">{status.qualityScore}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Images Used</span>
                  <span className="font-semibold">{status.imagesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Registered On</span>
                  <span className="font-semibold">{new Date(status.registeredAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Registration Actions */}
        <DashboardCard className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button onClick={() => setActiveTab('webcam')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webcam' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}>
              <Camera className="w-4 h-4 inline mr-2" /> Webcam Capture
            </button>
            <button onClick={() => setActiveTab('video')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'video' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}>
              <Video className="w-4 h-4 inline mr-2" /> Video Upload
            </button>
          </div>

          {activeTab === 'webcam' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden mb-6 border border-slate-700">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Instructions overlay */}
                {capturing && instructionStep < instructions.length && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                    <p className="text-white text-2xl font-bold animate-pulse">{instructions[instructionStep]}</p>
                    <p className="text-white/80 mt-2">Hold still...</p>
                  </div>
                )}
                {capturing && instructionStep === instructions.length && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/80 backdrop-blur-sm">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {!stream ? (
                <button onClick={startCamera} className="btn-primary"><Camera className="w-4 h-4 mr-2" /> Enable Camera</button>
              ) : (
                <button onClick={captureSequence} disabled={capturing} className="btn-primary w-full max-w-xs">
                  {capturing ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Capturing...</> : <><Play className="w-4 h-4 mr-2" /> Start Registration Sequence</>}
                </button>
              )}
            </div>
          )}

          {activeTab === 'video' && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm mb-6 max-w-lg">
                <p className="font-semibold mb-2">Video Guidelines:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Format: MP4, MOV, WEBM (Max 50MB)</li>
                  <li>Duration: 10–20 seconds</li>
                  <li>Action: Slowly turn your head left, right, up, down, and smile.</li>
                  <li>Ensure good lighting and no other faces in the background.</li>
                </ul>
              </div>

              <input type="file" ref={fileInputRef} accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
              
              {!videoFile ? (
                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary w-full max-w-xs">
                  <Upload className="w-4 h-4 mr-2" /> Select Video File
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-full max-w-xs p-3 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                    <span className="text-sm truncate mr-4">{videoFile.name}</span>
                    <button onClick={() => setVideoFile(null)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><StopCircle className="w-4 h-4" /></button>
                  </div>
                  <button onClick={handleVideoUpload} disabled={uploading} className="btn-primary w-full max-w-xs">
                    {uploading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Process Video</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default FaceRegistration;
