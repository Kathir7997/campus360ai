import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, ScanFace, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, Badge } from '../../components/common/index';
import api from '../../services/api';
import toast from 'react-hot-toast';

const IoTScannerSimulator = () => {
  const webcamRef = useRef(null);
  const [deviceId, setDeviceId] = useState('WEBCAM-TEST-1');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const captureAndScan = useCallback(async () => {
    if (!deviceId) {
      toast.error('Please enter a valid Device ID');
      return;
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error('Could not access webcam');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const response = await api.post('/iot/attendance/scan', {
        image: imageSrc.split(',')[1], // Send base64 without prefix
        deviceId,
        timestamp: new Date().toISOString()
      });

      setResult({
        success: true,
        studentName: response.data.studentName,
        window: response.data.window,
        message: response.data.message
      });
      toast.success(response.data.message);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Scan failed'
      });
      toast.error(error.response?.data?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, [webcamRef, deviceId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6">
      <div className="page-container max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-indigo-500" /> IoT Scanner Simulator
        </h1>
        <p className="text-sm text-slate-500 mt-1">Simulate an ESP32-CAM device scanning a face for attendance.</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Active Device ID
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. ESP32-CAM-001" 
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Must match an Active device in the IoT Devices list.</p>
          </div>

          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
            />
            
            {/* Scanner Overlay UI */}
            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-1/4 border-2 border-dashed border-indigo-400/50 rounded-full pointer-events-none"></div>
            
            {scanning && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-3" />
                <p className="font-medium animate-pulse">Processing Face & Embeddings...</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button 
              onClick={captureAndScan} 
              disabled={scanning || !deviceId}
              className="btn-primary w-full sm:w-auto px-8 py-3 text-lg rounded-full shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              {scanning ? 'Scanning...' : 'Simulate Scan'}
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded-xl border ${result.success ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${result.success ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                    {result.success ? 'Attendance Verified' : 'Verification Failed'}
                  </h3>
                  <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                    {result.message}
                  </p>
                  {result.success && (
                    <div className="mt-3 flex gap-2">
                      <Badge variant="success">{result.studentName}</Badge>
                      <Badge variant="info">{result.window}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default IoTScannerSimulator;
