import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { BookOpen, Download, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, ProgressBar, SkeletonCard } from '../../components/common/index';
import toast from 'react-hot-toast';

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('');

  useEffect(() => {
    fetchMarks();
  }, [semester]);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const params = semester ? `?semester=${semester}` : '';
      const res = await api.get(`/student/marks${params}`);
      setMarks(res.data.data.marks);
      setStats({ average: res.data.data.average, total: res.data.data.total });
    } catch (err) {
      toast.error('Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  const radarData = marks.map((m) => ({
    subject: m.subject?.code,
    IA1: m.internal1,
    IA2: m.internal2,
    Assignment: m.assignment,
  }));

  const gradeColor = (grade) => {
    const map = { A: 'success', B: 'info', C: 'warning', D: 'warning', F: 'danger' };
    return map[grade] || 'info';
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Internal Marks</h2>
          <p className="section-subtitle">Subject-wise internal assessment marks</p>
        </div>
        <div className="flex gap-2">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <button className="btn-secondary text-xs" onClick={() => toast('PDF download coming soon!')}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && marks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Marks', value: stats.total, max: marks.length * 70 },
            { label: 'Average', value: `${stats.average}`, max: 70 },
            { label: 'Subjects', value: marks.length, max: 10 },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-[#1a2035] rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 text-center"
            >
              <p className="text-2xl font-bold text-gradient">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Marks Table */}
        <DashboardCard title="Marks Breakdown" subtitle="IA1 + IA2 + Assignment = Total" className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : marks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th className="text-center">IA 1<span className="block font-normal text-[10px]">/30</span></th>
                    <th className="text-center">IA 2<span className="block font-normal text-[10px]">/30</span></th>
                    <th className="text-center">Assignment<span className="block font-normal text-[10px]">/10</span></th>
                    <th className="text-center">Total<span className="block font-normal text-[10px]">/70</span></th>
                    <th className="text-center">Grade</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m, i) => (
                    <motion.tr
                      key={m._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{m.subject?.name}</p>
                          <p className="text-xs text-slate-400">{m.subject?.code}</p>
                        </div>
                      </td>
                      <td className="text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.internal1}</td>
                      <td className="text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.internal2}</td>
                      <td className="text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{m.assignment}</td>
                      <td className="text-center">
                        <span className="font-bold text-slate-900 dark:text-white text-base">{m.total}</span>
                      </td>
                      <td className="text-center">
                        <Badge variant={gradeColor(m.grade)}>{m.grade}</Badge>
                      </td>
                      <td className="min-w-[100px]">
                        <ProgressBar value={m.total} max={70} color={m.grade === 'F' ? 'rose' : m.grade === 'A' ? 'emerald' : 'blue'} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No marks found" description="Marks will appear once your mentor uploads the Excel file." />
          )}
        </DashboardCard>

        {/* Radar Chart */}
        <DashboardCard title="Performance Radar" subtitle="Marks comparison">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name="IA1" dataKey="IA1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="IA2" dataKey="IA2" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} title="No data for chart" />
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default StudentMarks;
