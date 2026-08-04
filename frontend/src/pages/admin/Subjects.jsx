import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard } from '../../components/common/index';
import { BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [semFilter, setSemFilter] = useState('');
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    Promise.all([fetchSubjects(), api.get('/admin/departments').then((r) => setDepartments(r.data.data))]);
  }, [semFilter]);

  const fetchSubjects = () => api.get(`/admin/subjects${semFilter ? `?semester=${semFilter}` : ''}`).then((r) => setSubjects(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));

  const openCreate = () => { setEditSubject(null); reset({}); setShowModal(true); };
  const openEdit = (s) => { setEditSubject(s); reset({ name: s.name, code: s.code, department: s.department?._id, semester: s.semester, credits: s.credits, type: s.type }); setShowModal(true); };

  const onSubmit = async (data) => {
    try {
      if (editSubject) await api.put(`/admin/subjects/${editSubject._id}`, data);
      else await api.post('/admin/subjects', data);
      toast.success(editSubject ? 'Updated' : 'Created');
      setShowModal(false); fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete subject?')) return;
    await api.delete(`/admin/subjects/${id}`).then(() => { toast.success('Deleted'); fetchSubjects(); }).catch(() => toast.error('Failed'));
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Subjects</h2><p className="section-subtitle">Manage academic subjects ({subjects.length})</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
      </div>

      <DashboardCard>
        <div className="flex gap-3">
          <select className="input-field w-auto text-sm" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </DashboardCard>

      <DashboardCard title={`Subjects (${subjects.length})`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          subjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Subject</th><th>Code</th><th>Department</th><th>Semester</th><th>Credits</th><th>Type</th><th>Actions</th></tr></thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s._id}>
                      <td className="font-medium text-sm text-slate-900 dark:text-white">{s.name}</td>
                      <td><Badge variant="info">{s.code}</Badge></td>
                      <td className="text-sm text-slate-500">{s.department?.code || '—'}</td>
                      <td><Badge variant="success">Sem {s.semester}</Badge></td>
                      <td className="text-sm text-slate-500">{s.credits}</td>
                      <td><Badge variant={s.type === 'theory' ? 'info' : s.type === 'lab' ? 'warning' : 'success'}>{s.type}</Badge></td>
                      <td><div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={BookOpen} title="No subjects found" />
        }
      </DashboardCard>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">{editSubject ? 'Edit' : 'Add'} Subject</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Subject Name *</label><input {...register('name', { required: true })} className="input-field text-sm" placeholder="Data Structures" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Code *</label><input {...register('code', { required: true })} className="input-field text-sm" placeholder="CS301" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Department *</label>
                  <select {...register('department', { required: true })} className="input-field text-sm">
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Semester *</label><select {...register('semester', { required: true })} className="input-field text-sm">{[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Credits</label><input {...register('credits')} type="number" className="input-field text-sm" defaultValue={3} /></div>
                </div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Type</label>
                  <select {...register('type')} className="input-field text-sm"><option value="theory">Theory</option><option value="lab">Lab</option><option value="elective">Elective</option></select></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editSubject ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSubjects;
