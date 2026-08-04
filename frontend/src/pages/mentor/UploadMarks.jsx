import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle,
  Download, AlertCircle, Loader2, Info, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge } from '../../components/common/index';
import toast from 'react-hot-toast';

const UploadMarks = () => {
  const fileInputRef = useRef();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ subjectId: '', semester: '', academicYear: '2024-25' });
  const [subjects, setSubjects] = useState([]);

  useState(() => {
    api.get('/admin/subjects').then((r) => setSubjects(r.data.data || [])).catch(() => {});
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setResult(null);
    } else {
      toast.error('Only .xlsx and .xls files are allowed');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setResult(null); }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    if (!form.subjectId) return toast.error('Please select a subject');
    if (!form.semester) return toast.error('Please select a semester');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', form.subjectId);
    formData.append('semester', form.semester);
    formData.append('academicYear', form.academicYear);

    try {
      setUploading(true);
      const res = await api.post('/mentor/marks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    toast('Template download: Create an Excel with columns: Register Number, Student Name, Internal 1, Internal 2, Assignment');
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Upload Internal Marks</h2>
          <p className="section-subtitle">Upload Excel file to automatically process and update student marks</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* How it works */}
      <DashboardCard title="How it works" className="border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', label: 'Prepare Excel', desc: 'Add Register Number, IA1, IA2, Assignment columns' },
            { step: '2', label: 'Select Subject', desc: 'Choose the subject and semester' },
            { step: '3', label: 'Upload File', desc: 'Drop or select your .xlsx file' },
            { step: '4', label: 'Auto Process', desc: 'System matches students and updates records' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <DashboardCard title="Upload Configuration">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Subject *</label>
              <select className="input-field" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Semester *</label>
              <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Academic Year</label>
              <select className="input-field" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}>
                {['2022-23','2023-24','2024-25','2025-26'].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Required Columns Info */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="flex gap-2 items-start">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold mb-1">Required Excel Columns:</p>
                  <ul className="space-y-0.5 font-mono">
                    <li>• Register Number</li>
                    <li>• Student Name (optional)</li>
                    <li>• Internal 1 (or IA1)</li>
                    <li>• Internal 2 (or IA2)</li>
                    <li>• Assignment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* File Drop Zone */}
        <DashboardCard title="Select Excel File">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' :
              file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' :
              'border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                <Badge variant="success">Ready to upload</Badge>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Drop Excel file here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse · .xlsx or .xls</p>
                </div>
              </div>
            )}
          </div>

          <motion.button
            onClick={handleUpload}
            disabled={!file || uploading}
            whileHover={{ scale: (!file || uploading) ? 1 : 1.01 }}
            whileTap={{ scale: (!file || uploading) ? 1 : 0.99 }}
            className="btn-primary w-full mt-4"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Upload & Process</>}
          </motion.button>
        </DashboardCard>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DashboardCard title="Upload Results">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{result.data?.success?.length} Successful</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">{result.data?.errors?.length} Errors</span>
                </div>
              </div>

              {result.data?.errors?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Errors:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.data.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <p className="text-rose-700 dark:text-rose-300 text-xs">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadMarks;
