import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Loader2, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { DashboardCard, Badge, EmptyState, SkeletonCard, Avatar } from '../../components/common/index';
import { Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ROLES = ['student', 'mentor', 'hod', 'admin'];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUsers();
    api.get('/admin/departments')
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
  }, [roleFilter]);

  const selectedRole = watch('role');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ role: roleFilter, search }).toString();
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditUser(null); reset({}); setShowModal(true); };
  const openEdit = (user) => { setEditUser(user); reset({ name: user.name, email: user.email, role: user.role }); setShowModal(true); };

  const onSubmit = async (data) => {
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser._id}`, data);
        toast.success('User updated');
      } else {
        await api.post('/admin/users', data);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch { toast.error('Failed to deactivate'); }
  };

  const handleResetPassword = async (id, newPassword) => {
    try {
      await api.put(`/admin/users/${id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setResetModal(null);
    } catch { toast.error('Failed to reset password'); }
  };

  const roleColor = (role) => ({ student: 'success', mentor: 'info', hod: 'warning', admin: 'danger' }[role] || 'info');

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Manage Users</h2>
          <p className="section-subtitle">Create, edit, and manage all system users</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      {/* Filters */}
      <DashboardCard>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); fetchUsers(); }} className="input-field pl-9 text-sm" />
          </div>
          <select className="input-field w-auto text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </DashboardCard>

      {/* Table */}
      <DashboardCard title={`Users (${users.length})`}>
        {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div> :
          users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={user.name} size="sm" />
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                        </div>
                      </td>
                      <td className="text-sm text-slate-500">{user.email}</td>
                      <td><Badge variant={roleColor(user.role)}>{user.role}</Badge></td>
                      <td><Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="text-xs text-slate-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setResetModal(user)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(user._id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={Users} title="No users found" />
        }
      </DashboardCard>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">{editUser ? 'Edit User' : 'Create User'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Full Name *</label>
                  <input {...register('name', { required: 'Name is required' })} className="input-field text-sm" placeholder="Full Name" />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Email *</label>
                  <input {...register('email', { required: 'Email is required' })} type="email" className="input-field text-sm" placeholder="email@campus360.edu" />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                </div>
                {!editUser && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Password *</label>
                    <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" className="input-field text-sm" placeholder="••••••••" />
                    {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Role *</label>
                  <select {...register('role', { required: 'Role is required' })} className="input-field text-sm">
                    <option value="">Select Role</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  {errors.role && <p className="text-xs text-rose-500 mt-1">{errors.role.message}</p>}
                </div>

                {/* Student specific fields */}
                {!editUser && selectedRole === 'student' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Register Number *</label>
                      <input {...register('registerNumber', { required: 'Register Number is required' })} className="input-field text-sm" placeholder="e.g. 22CS001" />
                      {errors.registerNumber && <p className="text-xs text-rose-500 mt-1">{errors.registerNumber.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Department *</label>
                      <select {...register('department', { required: 'Department is required' })} className="input-field text-sm">
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Year *</label>
                      <select {...register('year', { required: 'Year is required', valueAsNumber: true })} className="input-field text-sm">
                        <option value="">Select Year</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                      {errors.year && <p className="text-xs text-rose-500 mt-1">{errors.year.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Semester *</label>
                      <select {...register('semester', { required: 'Semester is required', valueAsNumber: true })} className="input-field text-sm">
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                      {errors.semester && <p className="text-xs text-rose-500 mt-1">{errors.semester.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Section *</label>
                      <input {...register('section', { required: 'Section is required' })} className="input-field text-sm" placeholder="e.g. A" />
                      {errors.section && <p className="text-xs text-rose-500 mt-1">{errors.section.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Batch *</label>
                      <input {...register('batch', { required: 'Batch is required' })} className="input-field text-sm" placeholder="e.g. 2022-2026" />
                      {errors.batch && <p className="text-xs text-rose-500 mt-1">{errors.batch.message}</p>}
                    </div>
                  </>
                )}

                {/* Mentor and HOD specific fields */}
                {!editUser && (selectedRole === 'mentor' || selectedRole === 'hod') && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Employee ID *</label>
                      <input {...register('employeeId', { required: 'Employee ID is required' })} className="input-field text-sm" placeholder="e.g. EMP1001" />
                      {errors.employeeId && <p className="text-xs text-rose-500 mt-1">{errors.employeeId.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Department *</label>
                      <select {...register('department', { required: 'Department is required' })} className="input-field text-sm">
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department.message}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editUser ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetModal && (
          <ResetPasswordModal user={resetModal} onClose={() => setResetModal(null)} onReset={handleResetPassword} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ResetPasswordModal = ({ user, onClose, onReset }) => {
  const [newPassword, setNewPassword] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Reset Password</h3>
        <p className="text-sm text-slate-500 mb-4">Reset password for <strong>{user.name}</strong></p>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field text-sm mb-4" placeholder="New password (min 6 chars)" />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onReset(user._id, newPassword)} className="btn-danger flex-1">Reset</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminUsers;
