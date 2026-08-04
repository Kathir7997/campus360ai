import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DashboardCard, EmptyState, SkeletonCard, Badge } from '../../components/common/index';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const HODAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hod/analytics/marks').then((r) => setData(r.data.data)).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  const chartData = data.map((d) => ({ name: d.subject?.code, IA1: +d.avgInternal1?.toFixed(1), IA2: +d.avgInternal2?.toFixed(1), Assign: +d.avgAssignment?.toFixed(1), Total: +d.avgTotal?.toFixed(1) }));

  return (
    <div className="page-container">
      <h2 className="section-title">Department Analytics</h2>
      <p className="section-subtitle">Subject-wise performance analysis across the department</p>

      <DashboardCard title="Subject-wise Average Marks" subtitle="IA1 + IA2 + Assignment comparison">
        {loading ? <SkeletonCard /> : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="IA1" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="IA2" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="Assign" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState icon={TrendingUp} title="No analytics data" />}
      </DashboardCard>

      <DashboardCard title="Detailed Subject Performance">
        {loading ? <SkeletonCard /> : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Subject</th><th className="text-center">Avg IA1</th><th className="text-center">Avg IA2</th><th className="text-center">Avg Assign</th><th className="text-center">Avg Total</th><th className="text-center">Students</th></tr></thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{d.subject?.name}</p>
                      <p className="text-xs text-slate-400">{d.subject?.code}</p>
                    </td>
                    <td className="text-center font-mono text-sm">{d.avgInternal1?.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{d.avgInternal2?.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{d.avgAssignment?.toFixed(1)}</td>
                    <td className="text-center font-bold">{d.avgTotal?.toFixed(1)}</td>
                    <td className="text-center"><Badge variant="info">{d.count}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={BookOpen} title="No data available" />}
      </DashboardCard>
    </div>
  );
};

export default HODAnalytics;
