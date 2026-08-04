import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClipboardList, Calendar, Download, Filter } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, AttendanceBadge, EmptyState, ProgressBar, SkeletonCard } from '../../components/common/index';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [iotRecords, setIotRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: '', year: '', subjectId: '' });

  useEffect(() => {
    fetchAttendance();
    fetchIotAttendance();
  }, [filters]);

  const fetchIotAttendance = async () => {
    try {
      const res = await api.get('/student/iot-attendance');
      setIotRecords(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/student/attendance?${params}`);
      setRecords(res.data.data);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Group by subject for summary
  const subjectSummary = records.reduce((acc, r) => {
    const key = r.subject?._id;
    if (!key) return acc;
    if (!acc[key]) acc[key] = { subject: r.subject, total: 0, present: 0 };
    acc[key].total++;
    if (r.status === 'present') acc[key].present++;
    return acc;
  }, {});

  const summaryList = Object.values(subjectSummary);
  const chartData = summaryList.map((s) => ({
    name: s.subject?.code,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  const statusColor = (status) => {
    const map = { present: 'success', absent: 'danger', late: 'warning', excused: 'info' };
    return map[status] || 'info';
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Attendance</h2>
          <p className="section-subtitle">Track your attendance across all subjects</p>
        </div>
        <button className="btn-secondary text-xs gap-1.5" onClick={() => toast('Excel download coming soon!')}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />) :
          summaryList.slice(0, 4).map((s, i) => {
            const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
            return (
              <motion.div
                key={s.subject?._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#1a2035] rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.subject?.name}</p>
                <p className="text-xs font-mono text-slate-400">{s.subject?.code}</p>
                <div className="my-3">
                  <ProgressBar value={pct} color={pct >= 75 ? 'emerald' : 'rose'} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{s.present}/{s.total} classes</p>
                  <AttendanceBadge percentage={pct} />
                </div>
              </motion.div>
            );
          })
        }
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <DashboardCard title="Attendance by Subject" subtitle="Percentage breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.percentage >= 75 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      )}

      {/* IoT Attendance */}
      <DashboardCard title="Campus Entry/Exit (IoT)" subtitle="Your smart face scanner attendance" className="mb-6">
        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : iotRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-center">Status</th>
                  <th>Morning Entry</th>
                  <th>Exit Verification</th>
                </tr>
              </thead>
              <tbody>
                {iotRecords.map((r, i) => (
                  <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                    <td className="text-sm text-slate-500">
                      {r.exitVerification?.timestamp ? new Date(r.exitVerification.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' }) : '--'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No IoT scans yet" description="Your smart attendance will appear here." />
        )}
      </DashboardCard>

      {/* Class Attendance Filters */}
      <DashboardCard title="Attendance History" action={
        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1.5 rounded-lg border-none focus:outline-none"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="">All Months</option>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1.5 rounded-lg border-none focus:outline-none"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      }>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Hour</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{r.subject?.name}</p>
                        <p className="text-xs text-slate-400">{r.subject?.code}</p>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">Hour {r.hour || 1}</td>
                    <td className="text-center">
                      <Badge variant={statusColor(r.status)}>
                        <span className={`attendance-dot attendance-${r.status} mr-1`} />
                        {r.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No records found" description="No attendance records match your filters." />
        )}
      </DashboardCard>
    </div>
  );
};

export default StudentAttendance;
