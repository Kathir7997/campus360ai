import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DashboardCard, EmptyState, SkeletonCard, Badge, Avatar } from '../../components/common/index';
import { UserCog, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const HODFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hod/faculty').then((r) => setFaculty(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h2 className="section-title">Faculty</h2>
      <p className="section-subtitle">All faculty members in your department ({faculty.length})</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : faculty.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {faculty.map((f, i) => (
            <motion.div key={f._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-3">
                <Avatar name={f.user?.name} size="lg" color="emerald" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{f.user?.name}</p>
                  <p className="text-xs text-white/50">{f.designation}</p>
                  <Badge variant="info" className="mt-1">{f.employeeId}</Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-lg font-bold text-white">{f.studentCount || 0}</p>
                  <p className="text-[10px] text-white/50">Students</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-lg font-bold text-white">{f.attendanceSessions || 0}</p>
                  <p className="text-[10px] text-white/50">Sessions</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-white/60">
                <Mail className="w-3 h-3" /> {f.user?.email}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={UserCog} title="No faculty found" />
      )}
    </div>
  );
};

export default HODFaculty;
