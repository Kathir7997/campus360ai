import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BookOpen, Camera, Download, FileSpreadsheet, FileText, Radio, ShieldAlert, Upload, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DashboardCard, Badge, EmptyState, SkeletonCard, ProgressBar } from '../../components/common/index';
import { VisionGlassPanel, FloatingCard, StatsOrb, VisionBadge } from '../../components/common/VisionComponents';

const downloadReport = async (type, format = 'xlsx') => {
  const response = await api.get(`/monitoring/reports/${type}/export?format=${format}`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const SmartClassroomMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [liveClassrooms, setLiveClassrooms] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [odTracking, setOdTracking] = useState([]);
  const [lectureAnalytics, setLectureAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [file, setFile] = useState(null);
  const [deviceId, setDeviceId] = useState('ESP32-CAM-001');

  const loadData = async () => {
    try {
      const [liveRes, absentRes, odRes, lectureRes, insightsRes] = await Promise.all([
        api.get('/monitoring/live-classrooms'),
        api.get('/monitoring/absent-students'),
        api.get('/monitoring/od-tracking'),
        api.get('/monitoring/analytics/lecture'),
        api.get('/monitoring/insights/academic'),
      ]);

      setLiveClassrooms(liveRes.data.data || []);
      setAbsentStudents(absentRes.data.data || []);
      setOdTracking(odRes.data.data || []);
      setLectureAnalytics(lectureRes.data.data || null);
      setInsights(insightsRes.data.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    liveCount: liveClassrooms.filter((item) => item.status === 'Active').length,
    totalSessions: liveClassrooms.length,
    absentCount: absentStudents.length,
    odCount: odTracking.filter((item) => item.status === 'Pending').length,
  }), [liveClassrooms, absentStudents, odTracking]);

  const handleFirmwareUpload = async (event) => {
    event.preventDefault();
    if (!file || !deviceId) {
      toast.error('Select a device and firmware file first');
      return;
    }

    const formData = new FormData();
    formData.append('firmware', file);
    formData.append('version', 'latest');

    try {
      await api.post(`/monitoring/devices/${deviceId}/firmware`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Firmware update queued');
      setFile(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Firmware upload failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative z-10 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex-1">
          <VisionBadge color="blue">Live Classroom Operations</VisionBadge>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-white to-white/50 bg-clip-text text-transparent mt-4 mb-2">
            Smart Classroom Monitoring
          </motion.h1>
          <p className="text-white/50 text-lg max-w-3xl">Track live lecture status, absent students, OD approvals, device health, IAT analytics, and firmware updates from one console.</p>
        </div>

        <div className="flex gap-4 flex-wrap justify-end">
          <StatsOrb title="Live Classes" value={stats.liveCount} color="#22c55e" delay={0.1} />
          <StatsOrb title="Absent Today" value={stats.absentCount} color="#ef4444" delay={0.2} />
          <StatsOrb title="Pending OD" value={stats.odCount} color="#f59e0b" delay={0.3} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <VisionGlassPanel>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Live Classroom Status</h2>
                <p className="text-white/40 text-sm">Teacher presence, student count, recognition and device health</p>
              </div>
              <Badge variant="info">{stats.totalSessions} sessions</Badge>
            </div>

            {liveClassrooms.length > 0 ? (
              <div className="space-y-4">
                {liveClassrooms.map((session) => (
                  <div key={session._id} className="p-4 rounded-3xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white font-semibold">{session.classroomName}</p>
                        <p className="text-white/40 text-xs mt-1">{session.department?.code} · {session.subject?.code || 'No subject'} · {session.status}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={session.teacherPresent ? 'success' : 'warning'}>{session.teacherPresent ? 'Teacher Present' : 'Teacher Pending'}</Badge>
                        <Badge variant={session.cameraStatus === 'Online' ? 'success' : 'danger'}>{session.cameraStatus}</Badge>
                        <Badge variant={session.recognitionStatus === 'Recognized' ? 'success' : 'warning'}>{session.recognitionStatus}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div className="p-3 rounded-2xl bg-white/5">
                        <p className="text-white/40 text-xs uppercase tracking-widest">Students</p>
                        <p className="text-white font-semibold mt-1">{session.studentCount || 0}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5">
                        <p className="text-white/40 text-xs uppercase tracking-widest">Recognized</p>
                        <p className="text-white font-semibold mt-1">{session.recognizedCount || 0}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5">
                        <p className="text-white/40 text-xs uppercase tracking-widest">Confidence</p>
                        <p className="text-white font-semibold mt-1">{session.confidenceScore || 0}%</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5">
                        <p className="text-white/40 text-xs uppercase tracking-widest">Duration</p>
                        <p className="text-white font-semibold mt-1">{session.durationMinutes || 0} min</p>
                      </div>
                    </div>

                    {session.telemetry && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {[
                          ['Wi-Fi', session.telemetry.wifiSignal],
                          ['Memory', session.telemetry.memoryUsage],
                          ['FPS', session.telemetry.fps],
                          ['Temp', session.telemetry.temperature],
                        ].map(([label, value]) => (
                          <div key={label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">{label}</p>
                            <p className="text-white font-semibold mt-1">{value || 0}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Activity} title="No live classrooms" description="Start a lecture or publish a classroom session to see live monitoring here." />
            )}
          </VisionGlassPanel>

          <DashboardCard title="Absent Students" subtitle="Today, class-wise and department-wise">
            {absentStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Reg No</th>
                      <th>Department</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentStudents.map((student) => (
                      <tr key={student._id}>
                        <td>{student.student?.user?.name}</td>
                        <td>{student.student?.registerNumber}</td>
                        <td>{student.student?.department?.code}</td>
                        <td>{new Date(student.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Users} title="No absent students" description="All tracked students have attendance marked for the selected date." />
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => downloadReport('absent', 'xlsx')} className="btn-secondary text-xs gap-1.5"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
              <button onClick={() => downloadReport('absent', 'pdf')} className="btn-secondary text-xs gap-1.5"><FileText className="w-4 h-4" /> PDF</button>
            </div>
          </DashboardCard>

          <DashboardCard title="OD Tracking" subtitle="Pending, approved and rejected OD requests">
            {odTracking.length > 0 ? (
              <div className="space-y-3">
                {odTracking.map((od) => (
                  <div key={od._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-medium">{od.student?.user?.name}</p>
                      <p className="text-white/40 text-xs mt-1">{od.reason} · {new Date(od.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={od.status === 'Approved' ? 'success' : od.status === 'Rejected' ? 'danger' : 'warning'}>{od.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ShieldAlert} title="No OD requests" />
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => downloadReport('od', 'xlsx')} className="btn-secondary text-xs gap-1.5"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
              <button onClick={() => downloadReport('od', 'pdf')} className="btn-secondary text-xs gap-1.5"><FileText className="w-4 h-4" /> PDF</button>
            </div>
          </DashboardCard>

          <DashboardCard title="Academic Insights" subtitle="Attendance trends, risk prediction and AI recommendations">
            {insights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Recommendations</p>
                  <ul className="space-y-2 text-white/80">
                    {insights.recommendations?.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">High Risk Students</p>
                  <div className="space-y-2">
                    {insights.studentRiskPrediction?.slice(0, 5).map((item) => (
                      <div key={`${item.registerNumber}-${item.student}`} className="flex items-center justify-between gap-3">
                        <span className="text-white/80">{item.student}</span>
                        <Badge variant="danger">{item.attendancePercent}% / {item.iatPercent}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={AlertTriangle} title="No insight data" />
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => downloadReport('eligibility', 'xlsx')} className="btn-secondary text-xs gap-1.5"><FileSpreadsheet className="w-4 h-4" /> Eligibility Excel</button>
              <button onClick={() => downloadReport('eligibility', 'pdf')} className="btn-secondary text-xs gap-1.5"><FileText className="w-4 h-4" /> Eligibility PDF</button>
              <button onClick={() => downloadReport('iat', 'xlsx')} className="btn-secondary text-xs gap-1.5"><FileSpreadsheet className="w-4 h-4" /> IAT Excel</button>
              <button onClick={() => downloadReport('attendance', 'pdf')} className="btn-secondary text-xs gap-1.5"><FileText className="w-4 h-4" /> Attendance PDF</button>
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <FloatingCard>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-white/50" /> Lecture Analytics</h2>
            {lectureAnalytics ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Working Hours</p>
                  <p className="text-white text-2xl font-bold mt-1">{lectureAnalytics.workingHours}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Completed Lectures</p>
                  <p className="text-white text-2xl font-bold mt-1">{lectureAnalytics.completedLectures}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Cancelled Lectures</p>
                  <p className="text-white text-2xl font-bold mt-1">{lectureAnalytics.cancelledLectures}</p>
                </div>
              </div>
            ) : null}
          </FloatingCard>

          <FloatingCard>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Radio className="w-5 h-5 text-white/50" /> Firmware Update</h2>
            <form onSubmit={handleFirmwareUpload} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white/50 mb-1 block">Device ID</label>
                <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1 block">Firmware File</label>
                <input type="file" accept=".bin,.uf2,.zip,application/octet-stream" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-white/70" />
              </div>
              <button type="submit" className="vision-button w-full inline-flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Queue OTA Update</button>
            </form>
          </FloatingCard>

          <FloatingCard>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-white/50" /> Quick Exports</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['attendance', 'Attendance'],
                ['iat', 'IAT'],
                ['eligibility', 'Eligibility'],
                ['faculty', 'Faculty'],
                ['department', 'Department'],
              ].map(([type, label]) => (
                <button key={type} onClick={() => downloadReport(type, 'xlsx')} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition-colors">
                  {label} XLSX
                </button>
              ))}
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default SmartClassroomMonitoring;