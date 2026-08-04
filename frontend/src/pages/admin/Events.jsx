import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard } from '../../components/common/index';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { fetchEvents(); }, []);
  const fetchEvents = () => api.get('/admin/events').then((r) => setEvents(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/events', data);
      toast.success('Event created!'); setShowModal(false); reset(); fetchEvents();
    } catch { toast.error('Failed to create event'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete event?')) return;
    await api.delete(`/admin/events/${id}`).then(() => { toast.success('Deleted'); fetchEvents(); }).catch(() => toast.error('Failed'));
  };

  const typeColor = { academic: 'info', cultural: 'success', sports: 'warning', exam: 'danger', holiday: 'success', other: 'info' };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Events</h2><p className="section-subtitle">Manage academic and campus events</p></div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Event</button>
      </div>

      {loading ? <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div> :
        events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => (
              <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#1a2035] rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-start">
                    <div className="text-center min-w-[44px]">
                      <p className="text-2xl font-bold text-primary-500">{new Date(event.startDate).getDate()}</p>
                      <p className="text-xs text-slate-400 uppercase">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{event.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{event.venue || 'Campus'}</p>
                      <Badge variant={typeColor[event.type] || 'info'} className="mt-1">{event.type}</Badge>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(event._id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {event.description && <p className="text-xs text-slate-500 mt-3 line-clamp-2">{event.description}</p>}
              </motion.div>
            ))}
          </div>
        ) : <EmptyState icon={Calendar} title="No events" action={<button onClick={() => setShowModal(true)} className="btn-primary">Add Event</button>} />
      }

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Add Event</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Title *</label><input {...register('title', { required: true })} className="input-field text-sm" placeholder="Event title" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Description</label><textarea {...register('description')} className="input-field text-sm" rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Type</label>
                    <select {...register('type')} className="input-field text-sm"><option value="academic">Academic</option><option value="cultural">Cultural</option><option value="sports">Sports</option><option value="exam">Exam</option><option value="holiday">Holiday</option></select></div>
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Venue</label><input {...register('venue')} className="input-field text-sm" placeholder="Main Hall" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Start Date *</label><input {...register('startDate', { required: true })} type="datetime-local" className="input-field text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">End Date</label><input {...register('endDate')} type="datetime-local" className="input-field text-sm" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEvents;
