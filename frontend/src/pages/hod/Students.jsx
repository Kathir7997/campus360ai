import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard, Avatar, AttendanceBadge } from '../../components/common/index';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

const HODStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ year: '', section: '' });

  useEffect(() => {
    const params = new URLSearchParams(filters).toString();
    api.get(`/hod/students?${params}`).then((r) => setStudents(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [filters]);

  const filtered = students.filter((s) => !search || s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.registerNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div>
        <h2 className="section-title">Department Students</h2>
        <p className="section-subtitle">All students in your department ({students.length} total)</p>
      </div>

      <DashboardCard>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
          </div>
          <select className="input-field w-auto text-sm" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
            <option value="">All Years</option>
            {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select className="input-field w-auto text-sm" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
            <option value="">All Sections</option>
            {['A','B','C','D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      </DashboardCard>

      <DashboardCard title={`Students (${filtered.length})`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Register No</th><th>Year</th><th>Section</th><th>Semester</th><th>Mentor</th></tr></thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={s.user?.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{s.user?.name}</p>
                            <p className="text-xs text-slate-400">{s.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-600 dark:text-slate-300">{s.registerNumber}</td>
                      <td><Badge variant="info">Year {s.year}</Badge></td>
                      <td><Badge variant="info">Section {s.section}</Badge></td>
                      <td className="text-sm text-slate-500">Sem {s.semester}</td>
                      <td className="text-sm text-slate-500">{s.mentor?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={Users} title="No students found" />
        }
      </DashboardCard>
    </div>
  );
};

export default HODStudents;
