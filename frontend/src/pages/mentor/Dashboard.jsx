import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Users, ClipboardList, BookOpen, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getMentorPendingODs, processOD } from '../../redux/slices/iotSlice';
import { VisionGlassPanel, FloatingCard, StatsOrb, VisionBadge } from '../../components/common/VisionComponents';

const MentorDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const { mentorPendingODs } = useSelector((s) => s.iot);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentor/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
    dispatch(getMentorPendingODs());
  }, [dispatch]);

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
          <VisionBadge color="purple">Class Advisor</VisionBadge>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent mt-4 mb-2">
            Welcome, {user?.name?.split(' ')[0]}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/50 text-lg">
            Monitor mentees and manage approvals spatially.
          </motion.p>
        </div>
        
        {/* Floating Stats */}
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-end">
          <StatsOrb title="Mentees" value={data?.totalStudents || 0} color="#3b82f6" delay={0.1} />
          <StatsOrb title="Avg Att." value={`${data?.avgAttendance || 0}%`} color="#10b981" delay={0.2} />
          <StatsOrb title="Low Att." value={data?.lowAttendanceStudents?.length || 0} color="#f43f5e" delay={0.3} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Mentee Overview */}
        <div className="lg:col-span-8">
          <VisionGlassPanel className="h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-6">Mentee Status</h2>
            <div className="flex-1 overflow-y-auto vision-scroll pr-4 space-y-4">
              {data?.lowAttendanceStudents?.length > 0 ? data.lowAttendanceStudents.map((student, i) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {student.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{student.name}</p>
                      <p className="text-xs text-white/50 font-mono mt-1">{student.registerNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <VisionBadge color={student.attendance >= 75 ? 'success' : 'rose'}>{student.attendance}%</VisionBadge>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{student.attendance >= 75 ? 'Safe' : 'Action Req'}</span>
                  </div>
                </motion.div>
              )) : (
                <p className="text-white/40 text-center py-10">No students found</p>
              )}
            </div>
          </VisionGlassPanel>
        </div>

        {/* Right: OD Approvals */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <FloatingCard delay={0.4} className="flex-1 flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-white/50" /> Pending ODs</h2>
            <div className="space-y-4 overflow-y-auto vision-scroll pr-2 flex-1">
              {mentorPendingODs && mentorPendingODs.length > 0 ? mentorPendingODs.map((od) => (
                <div key={od._id} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                  <p className="font-semibold text-white text-sm">{od.student?.user?.name}</p>
                  <p className="text-xs text-white/50 mb-3">{new Date(od.date).toLocaleDateString()} - {od.reason}</p>
                  <div className="flex gap-2">
                    <button onClick={() => {
                       const remark = prompt("Remark (optional):");
                       if(remark !== null) dispatch(processOD({ id: od._id, status: 'Approved', mentorRemark: remark })).then(()=>toast.success('Approved'));
                    }} className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1"><CheckCircle className="w-3 h-3"/> Approve</button>
                    <button onClick={() => {
                       const remark = prompt("Reason for rejection:");
                       if(remark !== null) dispatch(processOD({ id: od._id, status: 'Rejected', mentorRemark: remark })).then(()=>toast.success('Rejected'));
                    }} className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1"><XCircle className="w-3 h-3"/> Reject</button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <CheckCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>All caught up!</p>
                </div>
              )}
            </div>
          </FloatingCard>
        </div>

      </div>
    </div>
  );
};

export default MentorDashboard;
