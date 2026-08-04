import { useState, useEffect } from 'react';
import { Plus, Bell, X } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard } from '../../components/common/index';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { fetchNotifs(); }, []);
  const fetchNotifs = () => api.get('/admin/notifications').then((r) => setNotifications(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/notifications', data);
      toast.success('Notification sent!'); setShowModal(false); reset(); fetchNotifs();
    } catch { toast.error('Failed to send'); }
  };

  const typeColor = { announcement: 'info', attendance: 'warning', marks: 'success', event: 'info', system: 'danger' };
  const priorityColor = { high: 'danger', medium: 'warning', low: 'info' };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Notifications</h2><p className="section-subtitle">Send and manage system notifications</p></div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Send Notification</button>
      </div>

      <DashboardCard title={`All Notifications (${notifications.length})`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n._id} className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{n.title}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge variant={typeColor[n.type] || 'info'}>{n.type}</Badge>
                        <Badge variant={priorityColor[n.priority] || 'info'}>{n.priority}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleString()} · Target: {n.targetRole || 'all'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Bell} title="No notifications sent yet" />
        }
      </DashboardCard>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Send Notification</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Title *</label><input {...register('title', { required: true })} className="input-field text-sm" placeholder="Notification title" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Message *</label><textarea {...register('message', { required: true })} className="input-field text-sm" rows={3} placeholder="Notification message..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Type</label>
                    <select {...register('type')} className="input-field text-sm"><option value="announcement">Announcement</option><option value="attendance">Attendance</option><option value="marks">Marks</option><option value="event">Event</option><option value="system">System</option></select></div>
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Priority</label>
                    <select {...register('priority')} className="input-field text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                </div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Target Role</label>
                  <select {...register('targetRole')} className="input-field text-sm"><option value="all">All Users</option><option value="student">Students</option><option value="mentor">Mentors</option><option value="hod">HODs</option></select></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Send</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotifications;
