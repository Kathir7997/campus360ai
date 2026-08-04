import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ClipboardList, BookOpen, Bell, Award, Calendar, AlertTriangle, CheckCircle, Search, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getStudentIotAttendance, getStudentODs } from '../../redux/slices/iotSlice';
import { VisionGlassPanel, FloatingCard, StatsOrb, VisionBadge } from '../../components/common/VisionComponents';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="vision-glass p-3 text-xs shadow-2xl border border-white/20 backdrop-blur-3xl z-50 rounded-2xl">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const StudentDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const { studentIotAttendance } = useSelector((s) => s.iot);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
    dispatch(getStudentIotAttendance());
    dispatch(getStudentODs());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  const overallAttendance = data?.overallAttendance || 0;
  const attendanceChartData = (data?.attendanceSummary || []).map((a) => ({
    name: a.subject?.code || 'N/A',
    percentage: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
  }));

  let timelineEvents = [];
  if (studentIotAttendance?.length > 0) {
    const today = studentIotAttendance[0];
    if (today.date === new Date().toISOString().split('T')[0]) {
       if (today.morningEntry?.timestamp) timelineEvents.push({ title: 'Morning Entry', time: new Date(today.morningEntry.timestamp).toLocaleTimeString() });
       if (today.breakVerification?.timestamp) timelineEvents.push({ title: 'Break Scan', time: new Date(today.breakVerification.timestamp).toLocaleTimeString() });
       if (today.lunchVerification?.timestamp) timelineEvents.push({ title: 'Lunch Scan', time: new Date(today.lunchVerification.timestamp).toLocaleTimeString() });
       if (today.exitVerification?.timestamp) timelineEvents.push({ title: 'Campus Exit', time: new Date(today.exitVerification.timestamp).toLocaleTimeString() });
    }
  }
  if (timelineEvents.length === 0) {
     timelineEvents.push({ title: 'No scans recorded today' });
  }

  return (
    <div className="space-y-8 animate-fade-in relative z-10 pt-4">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="flex-1">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent mb-2">
            Hello, {user?.name?.split(' ')[0]}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/50 text-lg">
            Your spatial campus overview is ready.
          </motion.p>
        </div>
        
        {/* Floating Stats Row */}
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-end">
          <StatsOrb title="Attendance" value={`${overallAttendance}%`} subtext="Overall" color={overallAttendance >= 75 ? '#10b981' : '#f43f5e'} delay={0.1} />
          <StatsOrb title="Avg Marks" value={(data?.marks?.reduce((s, m) => s + m.total, 0) / (data?.marks?.length || 1)).toFixed(1) || 0} subtext="Internal" color="#3b82f6" delay={0.2} />
          <StatsOrb title="Subjects" value={data?.attendanceSummary?.length || 0} subtext="Enrolled" color="#a855f7" delay={0.3} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <VisionGlassPanel className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Attendance Analytics</h2>
                <p className="text-white/50 text-sm">Subject-wise performance</p>
              </div>
              <div className="p-2 rounded-full bg-white/5"><TrendingUp className="w-5 h-5 text-white/50" /></div>
            </div>
            
            <div className="flex-1 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="percentage" stroke="#a855f7" strokeWidth={3} fill="url(#colorAtt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </VisionGlassPanel>
        </div>

        {/* Timeline / Notifications */}
        <div className="flex flex-col gap-8">
          <FloatingCard delay={0.4} className="flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-white/50" /> Today's Scans</h2>
            <div className="space-y-4 flex-1">
              {timelineEvents.map((evt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{evt.title}</p>
                    {evt.time && <p className="text-xs text-white/40">{evt.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </FloatingCard>

          <FloatingCard delay={0.5} className="flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-white/50" /> Notifications</h2>
            <div className="space-y-3 overflow-y-auto max-h-[150px] vision-scroll pr-2">
              {data?.notifications?.map((n) => (
                <div key={n._id} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                  <p className="text-sm font-medium text-white truncate">{n.title}</p>
                  <p className="text-xs text-white/50 truncate mt-1">{n.message}</p>
                </div>
              ))}
              {!data?.notifications?.length && <p className="text-white/40 text-sm">No new notifications</p>}
            </div>
          </FloatingCard>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
