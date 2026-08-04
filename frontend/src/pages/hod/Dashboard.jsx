import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCog, BarChart2, GraduationCap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
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

const HODDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hod/dashboard')
       .then((r) => setData(r.data.data))
       .catch(() => toast.error('Failed to load dashboard'))
       .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  const monthlyData = (data?.monthlyAttendance || []).map((m) => ({
    month: `${m._id.year}-${String(m._id.month).padStart(2,'0')}`,
    percentage: m.totalRecords > 0 ? Math.round((m.presentRecords / m.totalRecords) * 100) : 0,
  }));

  const yearWiseData = (data?.yearWise || []).map((y) => ({ year: `Year ${y._id}`, students: y.count }));

  return (
    <div className="space-y-8 animate-fade-in relative z-10 pt-4">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="flex-1">
          <VisionBadge color="emerald">Department Head</VisionBadge>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent mt-4 mb-2">
            {data?.department?.name || 'Department'}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/50 text-lg">
            Executive Command Center
          </motion.p>
        </div>
        
        {/* Floating Stats */}
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-end">
          <StatsOrb title="Students" value={data?.totalStudents || 0} color="#8b5cf6" delay={0.1} />
          <StatsOrb title="Faculty" value={data?.totalFaculty || 0} color="#ec4899" delay={0.2} />
          <StatsOrb title="Avg Att." value={`${data?.avgAttendance || 0}%`} color="#10b981" delay={0.3} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Attendance Area Chart */}
        <VisionGlassPanel className="h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6">Attendance Trend</h2>
          <div className="flex-1 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} dy={10} />
                <YAxis domain={[0,100]} stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={3} fill="url(#emeraldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </VisionGlassPanel>

        {/* Enrollment Bar Chart */}
        <VisionGlassPanel className="h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6">Students by Year</h2>
          <div className="flex-1 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearWiseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="students" fill="url(#blueGrad)" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VisionGlassPanel>

      </div>
    </div>
  );
};

export default HODDashboard;
