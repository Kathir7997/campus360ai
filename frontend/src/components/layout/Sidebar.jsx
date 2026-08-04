import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, BarChart3,
  Settings, LogOut, GraduationCap, Building2, Bell, Calendar,
  FileText, UserCog, ChevronLeft, ChevronRight, Shield, Cpu, Camera, ScanFace
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { toggleSidebarCollapse, setSidebarOpen } from '../../redux/slices/uiSlice';

const ROLE_CONFIG = {
  student: {
    label: 'Student Portal',
    color: 'from-blue-500 to-indigo-600',
    links: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/student/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/student/marks', icon: BookOpen, label: 'Internal Marks' },
      { to: '/student/face-registration', icon: Camera, label: 'Face Registration' },
      { to: '/student/profile', icon: Users, label: 'My Profile' },
    ],
  },
  mentor: {
    label: 'Mentor Portal',
    color: 'from-indigo-500 to-purple-600',
    links: [
      { to: '/mentor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/mentor/students', icon: Users, label: 'My Students' },
      { to: '/mentor/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/mentor/marks/upload', icon: FileText, label: 'Upload Marks' },
    ],
  },
  hod: {
    label: 'HOD Portal',
    color: 'from-emerald-500 to-teal-600',
    links: [
      { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/hod/students', icon: Users, label: 'Students' },
      { to: '/hod/faculty', icon: UserCog, label: 'Faculty' },
      { to: '/hod/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  admin: {
    label: 'Admin Portal',
    color: 'from-rose-500 to-pink-600',
    links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/users', icon: Users, label: 'Manage Users' },
      { to: '/admin/departments', icon: Building2, label: 'Departments' },
      { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/events', icon: Calendar, label: 'Events' },
      { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
      { to: '/admin/face-dataset', icon: Camera, label: 'Face Dataset' },
      { to: '/admin/iot-devices', icon: Cpu, label: 'IoT Devices' },
      { to: '/admin/iot-config', icon: Settings, label: 'IoT Config' },
    ],
  },
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { sidebarOpen, sidebarCollapsed } = useSelector((s) => s.ui);

  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial="closed"
          animate="open"
          exit="closed"
          variants={sidebarVariants}
          className={`
            fixed lg:relative z-30 flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[22px]
            ${sidebarCollapsed ? 'w-20' : 'w-64'}
            glass-panel
            transition-all duration-300 overflow-hidden
          `}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5 relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)] relative z-10`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
                <p className="text-sm font-bold text-white leading-tight font-heading tracking-wide">Campus360 AI</p>
                <p className="text-xs text-white/50">{config.label}</p>
              </motion.div>
            )}
            <button
              onClick={() => dispatch(toggleSidebarCollapse())}
              className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors hidden lg:flex relative z-10"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] px-3 py-3 font-heading">
                Navigation
              </p>
            )}
            {config.links.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}>
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={isActive ? 'sidebar-item-active' : 'sidebar-item'}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    {!sidebarCollapsed && <span>{label}</span>}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-white/5">
            <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} p-[1px] flex-shrink-0`}>
                 <div className="w-full h-full bg-bg-card rounded-[11px] flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(user?.name)}
                 </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-white/40 capitalize">{user?.role}</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-danger-500/10 text-white/40 hover:text-danger-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
            {sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full mt-2 p-2 rounded-xl hover:bg-danger-500/10 text-white/40 hover:text-danger-500 transition-colors flex items-center justify-center"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
