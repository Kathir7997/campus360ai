import { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard, Avatar, AttendanceBadge } from '../../components/common/index';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MentorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ year: '', section: '' });

  useEffect(() => { fetchStudents(); }, [filters]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/mentor/students?${params}`);
      setStudents(res.data.data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const filtered = students.filter((s) =>
    !search || s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.registerNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div>
        <h2 className="section-title">My Students</h2>
        <p className="section-subtitle">All students assigned to you ({students.length} total)</p>
      </div>

      {/* Search + Filter */}
      <DashboardCard>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or register number..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
          </div>
          <select
            className="input-field w-auto text-sm"
            style={{ background: '#1a1a2e', color: '#fff' }}
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="" style={{ background: '#1a1a2e', color: '#fff' }}>All Years</option>
            {[1,2,3,4].map((y) => <option key={y} value={y} style={{ background: '#1a1a2e', color: '#fff' }}>Year {y}</option>)}
          </select>
          <select
            className="input-field w-auto text-sm"
            style={{ background: '#1a1a2e', color: '#fff' }}
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
          >
            <option value="" style={{ background: '#1a1a2e', color: '#fff' }}>All Sections</option>
            {['A','B','C','D'].map((s) => <option key={s} value={s} style={{ background: '#1a1a2e', color: '#fff' }}>Section {s}</option>)}
          </select>
        </div>
      </DashboardCard>

      {/* Student Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, i) => (
            <motion.div key={student._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <Avatar name={student.user?.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{student.user?.name}</p>
                  <p className="text-xs text-white/40 font-mono">{student.registerNumber}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <Badge variant="info">Year {student.year}</Badge>
                    <Badge variant="info">Sec {student.section}</Badge>
                    <Badge variant="info">Sem {student.semester}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {student.user?.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3 h-3" /> {student.user.email}
                  </div>
                )}
                {student.parentPhone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3" /> {student.parentPhone}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No students found" description="No students match your current search or filter." />
      )}
    </div>
  );
};

export default MentorStudents;
