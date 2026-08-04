import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, Save } from 'lucide-react';
import { DashboardCard, SkeletonCard, EmptyState, Badge } from '../../components/common/index';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Single config card as its own component (avoids hooks-in-loop violation)
const ConfigCard = ({ config, onSaved }) => {
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [saving, setSaving] = useState(false);

  const typeLabels = {
    morning_entry: '🌅 Morning Entry',
    break_verification: '☕ Break Verification',
    lunch_verification: '🍽️ Lunch Verification',
    exit_verification: '🌇 Exit Verification',
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/configs/${config._id}`, {
        startTime: localConfig.startTime,
        endTime: localConfig.endTime,
        lateAfter: localConfig.lateAfter,
      });
      toast.success('Config updated!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      await api.put(`/admin/configs/${config._id}`, { isActive: !config.isActive });
      toast.success(`Config ${config.isActive ? 'disabled' : 'enabled'}!`);
      onSaved();
    } catch {
      toast.error('Failed to toggle config');
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{config.name}</h3>
            <p className="text-xs text-white/50">{typeLabels[config.type] || config.type}</p>
          </div>
        </div>
        <Badge variant={config.isActive ? 'success' : 'danger'}>{config.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-0.5">Start</p>
          <input type="time" value={localConfig.startTime || ''} onChange={(e) => setLocalConfig(c => ({ ...c, startTime: e.target.value }))}
            className="w-full text-sm font-mono font-semibold text-white bg-transparent border-none p-0 outline-none" />
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-0.5">End</p>
          <input type="time" value={localConfig.endTime || ''} onChange={(e) => setLocalConfig(c => ({ ...c, endTime: e.target.value }))}
            className="w-full text-sm font-mono font-semibold text-white bg-transparent border-none p-0 outline-none" />
        </div>
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 uppercase tracking-wide font-semibold mb-0.5">Late After</p>
          <input type="time" value={localConfig.lateAfter || ''} onChange={(e) => setLocalConfig(c => ({ ...c, lateAfter: e.target.value }))}
            className="w-full text-sm font-mono font-semibold text-amber-300 bg-transparent border-none p-0 outline-none" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50">
          <Save className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={handleToggle}
          className="px-3 py-1.5 border border-white/15 rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition">
          {config.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
};

const AdminIoTConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    type: 'morning_entry',
    startTime: '08:00',
    endTime: '09:30',
    lateAfter: '08:30',
    department: '',
    section: ''
  });
  const [creating, setCreating] = useState(false);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/admin/configs');
      setConfigs(res.data.data);
    } catch {
      toast.error('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/configs', newConfig);
      toast.success('Config created!');
      setShowCreate(false);
      setNewConfig({ name: '', type: 'morning_entry', startTime: '08:00', endTime: '09:30', lateAfter: '08:30', department: '', section: '' });
      fetchConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create config');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="page-container grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Time Windows</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure IoT scan time windows for smart attendance</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/20"
        >
          <Settings className="w-4 h-4" /> New Config
        </button>
      </div>

      {/* Create New Config Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <DashboardCard title="Create Attendance Time Window" className="mb-6">
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Config Name</label>
                <input type="text" required value={newConfig.name} onChange={(e) => setNewConfig(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. Morning Entry CSE 2024" className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Window Type</label>
                <select value={newConfig.type} onChange={(e) => setNewConfig(c => ({ ...c, type: e.target.value }))}
                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="morning_entry">Morning Entry</option>
                  <option value="break_verification">Break Verification</option>
                  <option value="lunch_verification">Lunch Verification</option>
                  <option value="exit_verification">Exit Verification</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                <input type="time" value={newConfig.startTime} onChange={(e) => setNewConfig(c => ({ ...c, startTime: e.target.value }))}
                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                <input type="time" value={newConfig.endTime} onChange={(e) => setNewConfig(c => ({ ...c, endTime: e.target.value }))}
                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Late After (if applicable)</label>
                <input type="time" value={newConfig.lateAfter} onChange={(e) => setNewConfig(c => ({ ...c, lateAfter: e.target.value }))}
                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-3 items-end">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Window'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
              </div>
            </form>
          </DashboardCard>
        </motion.div>
      )}

      {/* Config Cards */}
      {configs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.map((config, i) => (
            <motion.div key={config._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ConfigCard config={config} onSaved={fetchConfigs} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Settings}
          title="No Attendance Configs"
          description="Create your first time window config to control when the IoT scanner accepts attendance."
        />
      )}
    </div>
  );
};

export default AdminIoTConfig;
