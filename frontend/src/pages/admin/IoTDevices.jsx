import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Plus, Edit2, Trash2, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { DashboardCard, Badge, SkeletonCard, EmptyState } from '../../components/common/index';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusVariant = (status) => {
  if (status === 'Online') return 'success';
  if (status === 'Offline') return 'danger';
  return 'warning';
};

const AdminIoTDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', deviceId: '', location: '', type: 'ESP32-CAM', ipAddress: '' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/admin/devices');
      setDevices(res.data.data);
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/devices/${editId}`, form);
        toast.success('Device updated!');
      } else {
        await api.post('/admin/devices', form);
        toast.success('Device added!');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', deviceId: '', location: '', type: 'ESP32-CAM', ipAddress: '' });
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save device');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this device?')) return;
    try {
      await api.delete(`/admin/devices/${id}`);
      toast.success('Device deleted');
      fetchDevices();
    } catch {
      toast.error('Failed to delete device');
    }
  };

  const handleEdit = (device) => {
    setEditId(device._id);
    setForm({ name: device.name, deviceId: device.deviceId, location: device.location, type: device.type, ipAddress: device.ipAddress || '' });
    setShowForm(true);
  };

  if (loading) return <div className="page-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IoT Devices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage ESP32-CAM face recognition devices</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', deviceId: '', location: '', type: 'ESP32-CAM', ipAddress: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Add Device
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <DashboardCard title={editId ? 'Edit Device' : 'Register New IoT Device'} className="mb-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Device Name', key: 'name', placeholder: 'e.g. Main Gate Camera' },
                { label: 'Device ID', key: 'deviceId', placeholder: 'e.g. ESP32-001' },
                { label: 'Location', key: 'location', placeholder: 'e.g. Block A, Floor 1' },
                { label: 'IP Address', key: 'ipAddress', placeholder: 'e.g. 192.168.1.100' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                  <input
                    type="text" required value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Device Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option>ESP32-CAM</option>
                  <option>Raspberry Pi</option>
                  <option>Arduino</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex gap-3 items-end">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editId ? 'Update Device' : 'Register Device')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
              </div>
            </form>
          </DashboardCard>
        </motion.div>
      )}

      {/* Devices Grid */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, i) => (
            <motion.div key={device._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(device.status)}>{device.status || 'Unknown'}</Badge>
                  </div>
                </div>

                <h3 className="font-semibold text-white">{device.name}</h3>
                <p className="text-xs text-white/50 mt-0.5">{device.deviceId}</p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Wifi className="w-3 h-3" />
                    <span>{device.ipAddress || 'IP not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="font-medium">Location:</span> {device.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="font-medium">Type:</span> {device.type}
                  </div>
                  {device.lastPing && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="font-medium">Last Ping:</span> {new Date(device.lastPing).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(device)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-white/15 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(device._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Cpu} title="No IoT Devices" description="Register your first ESP32-CAM device to start smart attendance tracking." />
      )}
    </div>
  );
};

export default AdminIoTDevices;
