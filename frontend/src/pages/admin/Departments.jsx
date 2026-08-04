import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard } from '../../components/common/index';
import { Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchDepts(); }, []);

  const fetchDepts = () => api.get('/admin/departments').then((r) => setDepartments(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));

  const openCreate = () => { setEditDept(null); reset({}); setShowModal(true); };
  const openEdit = (d) => { setEditDept(d); reset({ name: d.name, code: d.code, description: d.description, totalSemesters: d.totalSemesters }); setShowModal(true); };

  const onSubmit = async (data) => {
    try {
      if (editDept) await api.put(`/admin/departments/${editDept._id}`, data);
      else await api.post('/admin/departments', data);
      toast.success(editDept ? 'Updated' : 'Created');
      setShowModal(false); fetchDepts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete department?')) return;
    await api.delete(`/admin/departments/${id}`).then(() => { toast.success('Deleted'); fetchDepts(); }).catch(() => toast.error('Failed'));
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Departments</h2><p className="section-subtitle">Manage academic departments</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Department</button>
      </div>

      {loading ? <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div> :
        departments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, i) => (
              <motion.div key={dept._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">{dept.code?.slice(0, 2)}</div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-400 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(dept._id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-rose-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-white mt-3">{dept.name}</h3>
                <p className="text-xs text-white/50 mt-0.5">{dept.description || 'No description'}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="info">{dept.code}</Badge>
                  <Badge variant="success">{dept.totalSemesters} Sems</Badge>
                  {dept.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : <EmptyState icon={Building2} title="No departments" action={<button onClick={openCreate} className="btn-primary">Add Department</button>} />
      }

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-bold text-white">{editDept ? 'Edit' : 'Add'} Department</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1 block">Department Name *</label>
                  <input {...register('name', { required: true })} className="input-field text-sm" placeholder="Computer Science Engineering" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1 block">Code *</label>
                  <input {...register('code', { required: true })} className="input-field text-sm" placeholder="CSE" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1 block">Description</label>
                  <textarea {...register('description')} className="input-field text-sm" rows={2} placeholder="Department description..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1 block">Total Semesters</label>
                  <input {...register('totalSemesters')} type="number" className="input-field text-sm" defaultValue={8} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editDept ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDepartments;
