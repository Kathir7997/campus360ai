import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Filter, X, Check, Clock, Users, ChevronDown, Download, ClipboardList } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard, Avatar } from '../../components/common/index';
import toast from 'react-hot-toast';

const ManageAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [iotAttendance, setIotAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({ subjectId: '', section: '', year: '' });

  const [form, setForm] = useState({
    subjectId: '', date: new Date().toISOString().split('T')[0],
    hour: 1, section: 'A', year: 2, semester: 3, records: [],
  });

  useEffect(() => {
    fetchData();
    fetchSubjects();
    fetchIotData();
  }, [filters]);

  const fetchIotData = async () => {
    try {
      const res = await api.get('/mentor/daily-attendance');
      setIotAttendance(res.data.data || []);
    } catch (err) { console.error('Failed to load IoT data', err); }
  };

  const fetchData = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const [attRes, stuRes] = await Promise.all([
        api.get(`/mentor/attendance?${params}`),
        api.get('/mentor/students'),
      ]);
      setAttendance(attRes.data.data);
      setStudents(stuRes.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.data || []);
    } catch {}
  };

  const initAttendanceForm = () => {
    const records = students.map((s) => ({ student: s._id, status: 'present' }));
    setForm((f) => ({ ...f, records }));
    setShowAddModal(true);
  };

  const toggleStatus = (studentId) => {
    setForm((f) => ({
      ...f,
      records: f.records.map((r) =>
        r.student === studentId
          ? { ...r, status: r.status === 'present' ? 'absent' : 'present' }
          : r
      ),
    }));
  };

  const submitAttendance = async () => {
    try {
      await api.post('/mentor/attendance', form);
      toast.success('Attendance recorded!');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    }
  };

  const deleteAttendance = async (id) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/mentor/attendance/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const presentCount = form.records.filter((r) => r.status === 'present').length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Manage Attendance</h2>
          <p className="section-subtitle">Add, edit, and track student attendance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/mentor/attendance/export?token=${localStorage.getItem('token')}`, '_blank')} className="btn-secondary">
            <Download className="w-4 h-4" /> Export IoT Daily
          </button>
          <button onClick={initAttendanceForm} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <DashboardCard>
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <select className="input-field w-auto text-sm" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
            <option value="">All Years</option>
            {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select className="input-field w-auto text-sm" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
            <option value="">All Sections</option>
            {['A','B','C','D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          {(filters.year || filters.section) && (
            <button onClick={() => setFilters({ subjectId: '', section: '', year: '' })} className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </DashboardCard>

      {/* IoT Campus Attendance */}
      <DashboardCard title="Today's IoT Campus Scans" subtitle="Real-time face scanner activity for your mentees" className="mb-6">
        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : iotAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th className="text-center">Status</th>
                  <th>Morning Entry</th>
                </tr>
              </thead>
              <tbody>
                {iotAttendance.map((r, i) => (
                  <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.student?.user?.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{r.student?.user?.name}</p>
                          <p className="text-xs text-slate-400">{r.student?.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">
                      {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="text-center">
                      <Badge variant={r.dailyStatus === 'Present' ? 'success' : r.dailyStatus === 'OD' ? 'info' : r.dailyStatus === 'Absent' ? 'danger' : 'warning'}>
                        {r.dailyStatus}
                      </Badge>
                    </td>
                    <td className="text-sm text-slate-500">
                      {r.morningEntry?.timestamp ? new Date(r.morningEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' }) : '--'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No IoT scans yet" description="No mentees have scanned their face today." />
        )}
      </DashboardCard>

      {/* Attendance Table */}
      <DashboardCard title={`Attendance Records (${attendance.length})`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Subject</th><th>Section</th><th>Year</th><th>Hour</th><th className="text-center">Present/Total</th><th>Actions</th></tr></thead>
                <tbody>
                  {attendance.map((att, i) => {
                    const total = att.records?.length || 0;
                    const present = att.records?.filter((r) => r.status === 'present').length || 0;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                    return (
                      <tr key={att._id}>
                        <td className="text-sm text-slate-700 dark:text-slate-300">
                          {new Date(att.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{att.subject?.name}</p>
                          <p className="text-xs text-slate-400">{att.subject?.code}</p>
                        </td>
                        <td><Badge variant="info">{att.section}</Badge></td>
                        <td className="text-sm text-slate-600 dark:text-slate-300">Year {att.year}</td>
                        <td className="text-sm text-slate-500">Hour {att.hour}</td>
                        <td className="text-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{present}</span>
                          <span className="text-slate-400">/{total}</span>
                          <span className="ml-1 text-xs text-slate-400">({pct}%)</span>
                        </td>
                        <td>
                          <button onClick={() => deleteAttendance(att._id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Clock} title="No attendance records" description="Click 'Add Attendance' to start recording." />
          )
        }
      </DashboardCard>

      {/* Add Attendance Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Record Attendance</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Subject</label>
                    <select className="input-field text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                      <option value="">Select Subject</option>
                      {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Date</label>
                    <input type="date" className="input-field text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Hour</label>
                    <select className="input-field text-sm" value={form.hour} onChange={(e) => setForm({ ...form, hour: parseInt(e.target.value) })}>
                      {[1,2,3,4,5,6,7,8].map((h) => <option key={h} value={h}>Hour {h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Section</label>
                    <select className="input-field text-sm" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                      {['A','B','C','D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
                  <span className="text-emerald-600 font-semibold">✓ Present: {presentCount}</span>
                  <span className="text-rose-500 font-semibold">✗ Absent: {form.records.length - presentCount}</span>
                  <span className="text-slate-500">Total: {form.records.length}</span>
                </div>

                {/* Student List */}
                <div className="space-y-2">
                  {students.map((student) => {
                    const record = form.records.find((r) => r.student === student._id);
                    const isPresent = record?.status === 'present';
                    return (
                      <div key={student._id} onClick={() => toggleStatus(student._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isPresent ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isPresent ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {isPresent ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <Avatar name={student.user?.name} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{student.user?.name}</p>
                          <p className="text-xs text-slate-400">{student.registerNumber}</p>
                        </div>
                        <Badge variant={isPresent ? 'success' : 'danger'}>{isPresent ? 'Present' : 'Absent'}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={submitAttendance} className="btn-primary flex-1">Save Attendance</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageAttendance;
