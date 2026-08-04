import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Activity, Server, Users, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { VisionGlassPanel, FloatingCard, StatsOrb, VisionBadge } from '../../components/common/VisionComponents';

const chartData = [
  { name: 'Mon', attendance: 85, recognized: 82 },
  { name: 'Tue', attendance: 88, recognized: 85 },
  { name: 'Wed', attendance: 92, recognized: 90 },
  { name: 'Thu', attendance: 87, recognized: 84 },
  { name: 'Fri', attendance: 95, recognized: 93 },
  { name: 'Sat', attendance: 65, recognized: 60 },
  { name: 'Sun', attendance: 10, recognized: 8 },
];

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

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
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

  return (
    <div className="space-y-8 animate-fade-in relative z-10 pt-4">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="flex-1">
          <VisionBadge color="blue">System Administration</VisionBadge>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent mt-4 mb-2">
            Campus360 Engine
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
             </div>
             <p className="text-white/50 text-lg">AI Operations Center Online</p>
          </motion.div>
        </div>
        
        {/* Floating Stats */}
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-end">
          <StatsOrb title="Total Users" value={(data?.totalStudents || 0) + (data?.totalMentors || 0)} color="#3b82f6" delay={0.1} />
          <StatsOrb title="Departments" value={data?.totalDepartments || 0} color="#a855f7" delay={0.2} />
          <StatsOrb title="Edge Nodes" value={24} color="#06b6d4" delay={0.3} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Analytics Main Panel */}
        <div className="lg:col-span-8">
          <VisionGlassPanel className="h-[450px] flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-6">AI Recognition Metrics</h2>
            <div className="flex-1 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="attendance" name="Total Attendance" stroke="#3b82f6" strokeWidth={3} fill="url(#colorAtt)" />
                  <Area type="monotone" dataKey="recognized" name="Face Recognized" stroke="#06b6d4" strokeWidth={3} fill="url(#colorRec)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </VisionGlassPanel>
        </div>

        {/* Edge Devices Monitoring */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <FloatingCard delay={0.4} className="flex-1 flex flex-col h-[450px]">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Cpu className="w-5 h-5 text-white/50" /> Edge Fleet Status</h2>
            <div className="space-y-4 overflow-y-auto vision-scroll pr-2 flex-1">
              {[1, 2, 3, 4, 5].map((node) => (
                <div key={node} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">ESP32 Cam 0{node}</p>
                      <p className="text-[10px] text-white/50 font-mono mt-1">192.168.1.{100 + node}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
