import { useState, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, Shield, Users } from 'lucide-react';
import { DashboardCard, Badge, EmptyState } from '../../components/common/index';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FaceDataset = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, registered: 0, unregistered: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDataset = async () => {
    try {
      const res = await api.get('/admin/face-registrations');
      setStudents(res.data.data);
      setStats({
        total: res.data.total,
        registered: res.data.registered,
        unregistered: res.data.unregistered
      });
    } catch (err) {
      toast.error('Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDataset(); }, []);

  const handleReset = async (id) => {
    if (!window.confirm('Are you sure you want to reset this student\'s face registration? They will need to register again.')) return;
    try {
      await api.delete(`/admin/face-registrations/${id}`);
      toast.success('Registration reset successfully');
      fetchDataset();
    } catch (err) {
      toast.error('Reset failed');
    }
  };

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Face Dataset Management</h1>
          <p className="text-sm text-slate-500">Monitor and manage student face registrations</p>
        </div>
        <button onClick={fetchDataset} className="btn-secondary"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DashboardCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Camera className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500">Registered</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.registered}</p>
            </div>
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><Shield className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500">Pending Registration</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.unregistered}</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Student Face Dataset" className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading dataset...</div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Reg No</th>
                  <th>Dept/Year</th>
                  <th>Status</th>
                  <th>Quality</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id}>
                    <td>
                      <p className="font-medium text-slate-900 dark:text-white">{st.user?.name}</p>
                      <p className="text-xs text-slate-500">{st.user?.email}</p>
                    </td>
                    <td><span className="font-mono text-sm">{st.registerNumber}</span></td>
                    <td>
                      <p className="text-sm">{st.department?.code}</p>
                      <p className="text-xs text-slate-500">Year {st.year}</p>
                    </td>
                    <td>
                      <Badge variant={st.faceRegistered ? 'success' : 'danger'}>
                        {st.faceRegistered ? 'Registered' : 'Pending'}
                      </Badge>
                    </td>
                    <td>
                      {st.faceRegistered ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${st.faceQualityScore > 80 ? 'bg-emerald-500' : st.faceQualityScore > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${st.faceQualityScore}%` }} />
                          </div>
                          <span className="text-xs font-medium">{st.faceQualityScore.toFixed(0)}</span>
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td>{st.faceImagesCount || 0}</td>
                    <td>
                      <button 
                        onClick={() => handleReset(st._id)}
                        disabled={!st.faceRegistered}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-50 disabled:hover:bg-transparent"
                        title="Reset Registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Users} title="No students found" />
        )}
      </DashboardCard>
    </div>
  );
};

export default FaceDataset;
