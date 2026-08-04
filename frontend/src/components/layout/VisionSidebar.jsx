import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, BarChart3,
  Settings, LogOut, GraduationCap, Building2, Bell, Calendar,
  FileText, UserCog, Camera, Shield, Cpu, Radar,
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { useState } from 'react';

const ROLE_CONFIG = {
  student: {
    links: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/student/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/student/marks', icon: BookOpen, label: 'Marks' },
      { to: '/student/face-registration', icon: Camera, label: 'Face Reg' },
      { to: '/student/profile', icon: Users, label: 'Profile' },
    ],
  },
  mentor: {
    links: [
      { to: '/mentor/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/mentor/students', icon: Users, label: 'Students' },
      { to: '/mentor/attendance', icon: ClipboardList, label: 'Attendance' },
      { to: '/mentor/marks/upload', icon: FileText, label: 'Upload' },
    ],
  },
  hod: {
    links: [
      { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/hod/students', icon: Users, label: 'Students' },
      { to: '/hod/faculty', icon: UserCog, label: 'Faculty' },
      { to: '/hod/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  admin: {
    links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
        { to: '/admin/monitoring', icon: Radar, label: 'Live Monitoring' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/departments', icon: Building2, label: 'Depts' },
      { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
      { to: '/admin/face-dataset', icon: Camera, label: 'Faces' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifs' },
      { to: '/admin/events', icon: Calendar, label: 'Events' },
      { to: '/admin/iot-devices', icon: Cpu, label: 'IoT' },
    ],
  },
};

const VisionSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [hovered, setHovered] = useState(null);

  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="flex items-center gap-2 p-3 vision-glass rounded-[32px]"
      >
        <div className="flex items-center gap-2 pr-4 border-r border-white/10">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        </div>

        {config.links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="relative group">
            {({ isActive }) => (
              <motion.div
                onHoverStart={() => setHovered(to)}
                onHoverEnd={() => setHovered(null)}
                whileHover={{ scale: 1.15, y: -8 }}
                whileTap={{ scale: 0.9 }}
                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-colors ${
                  isActive ? 'bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                
                {/* Tooltip */}
                <AnimatePresence>
                  {hovered === to && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.8 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 vision-glass text-xs font-semibold text-white whitespace-nowrap pointer-events-none rounded-xl"
                    >
                      {label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}

        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <motion.button
            whileHover={{ scale: 1.15, y: -8 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
};

export default VisionSidebar;
