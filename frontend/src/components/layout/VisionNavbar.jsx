import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Clock, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const getSearchOptions = (role) => {
  const r = role?.toLowerCase() || 'student';
  const common = [{ title: 'Dashboard', path: `/${r}/dashboard` }];
  if (r === 'student') return [...common, { title: 'My Profile', path: '/student/profile' }, { title: 'My Attendance', path: '/student/attendance' }, { title: 'My Marks', path: '/student/marks' }, { title: 'Face Registration', path: '/student/face-registration' }];
  if (r === 'mentor') return [...common, { title: 'My Students', path: '/mentor/students' }, { title: 'Mark Attendance', path: '/mentor/attendance' }, { title: 'Upload Marks', path: '/mentor/marks/upload' }];
  if (r === 'hod') return [...common, { title: 'Students Overview', path: '/hod/students' }, { title: 'Department Analytics', path: '/hod/analytics' }, { title: 'Faculty List', path: '/hod/faculty' }];
  if (r === 'admin') return [...common, { title: 'Live Monitoring', path: '/admin/monitoring' }, { title: 'Manage Users', path: '/admin/users' }, { title: 'Departments', path: '/admin/departments' }, { title: 'Subjects', path: '/admin/subjects' }, { title: 'Events', path: '/admin/events' }, { title: 'Notifications', path: '/admin/notifications' }, { title: 'IoT Devices', path: '/admin/iot-devices' }, { title: 'IoT Edge Config', path: '/admin/iot-config' }, { title: 'Face Dataset', path: '/admin/face-dataset' }, { title: 'System Logs', path: '/admin/audit-logs' }];
  return common;
};

const VisionNavbar = () => {
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const searchOptions = getSearchOptions(user?.role);
  const filteredOptions = searchOptions.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
        className="vision-glass px-6 py-3 flex items-center justify-between rounded-full pointer-events-auto relative"
      >
        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
          />

          {/* Global Search Results Dropdown */}
          <AnimatePresence>
            {isSearchOpen && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-4 left-0 w-full vision-glass p-2 max-h-64 overflow-y-auto vision-scroll flex flex-col gap-1 shadow-2xl"
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(opt.path);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center justify-between w-full p-3 text-left rounded-2xl hover:bg-white/10 transition-colors text-white group"
                    >
                      <span className="text-sm font-medium">{opt.title}</span>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-white/50 text-sm">No results found for "{searchQuery}"</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formattedTime}</span>
            <span className="mx-1">•</span>
            <span>{formattedDate}</span>
          </div>

          <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-white/80" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            )}
          </button>
        </div>
      </motion.header>
    </div>
  );
};

export default VisionNavbar;
