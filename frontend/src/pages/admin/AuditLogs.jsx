import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard } from '../../components/common/index';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then((r) => setLogs(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h2 className="section-title">Audit Logs</h2>
      <p className="section-subtitle">System activity and security audit trail</p>

      <DashboardCard title={`Activity Log (${logs.length} entries)`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th><th>IP</th></tr></thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-xs text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{log.user?.name || 'System'}</p>
                          <p className="text-xs text-slate-400 capitalize">{log.user?.role}</p>
                        </div>
                      </td>
                      <td><Badge variant="info">{log.action}</Badge></td>
                      <td className="text-sm text-slate-500">{log.resource}</td>
                      <td><Badge variant={log.status === 'success' ? 'success' : 'danger'}>{log.status}</Badge></td>
                      <td className="text-xs font-mono text-slate-400">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={Shield} title="No audit logs yet" />
        }
      </DashboardCard>
    </div>
  );
};

export default AdminAuditLogs;
