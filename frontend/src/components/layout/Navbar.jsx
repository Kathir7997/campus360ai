import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Menu, Sun, Moon, Bell, Search, Clock, CalendarDays } from 'lucide-react';
import { toggleDarkMode, toggleSidebar } from '../../redux/slices/uiSlice';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { darkMode } = useSelector((s) => s.ui);
  const { unreadCount } = useSelector((s) => s.notifications);
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1).replace(/-/g, ' ');
    }
    return 'Dashboard';
  };

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="h-[72px] mt-4 mr-4 glass-panel border-white/5 flex items-center gap-4 px-6 sticky top-4 z-20 rounded-[22px]">
      {/* Hamburger */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="hidden md:block">
        <p className="text-xs text-white/50">{getTimeGreeting()}, {user?.name?.split(' ')[0]} 👋</p>
        <h1 className="text-lg font-heading font-semibold text-white tracking-wide">{getPageTitle()}</h1>
      </div>

      <div className="flex-1" />



      {/* Search Bar */}
      <motion.div
        animate={{ width: searchFocused ? 280 : 200 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative hidden sm:block"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-black/20 border border-white/5 focus:border-primary-500/50 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        />
      </motion.div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Dark Mode Toggle (Kept for compatibility, but UI is strictly dark now) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#0B0B12]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 ml-2 border-l border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 p-[1px]">
             <div className="w-full h-full bg-bg-card rounded-[11px] flex items-center justify-center text-white text-sm font-bold">
               {user?.name?.charAt(0)?.toUpperCase() || 'U'}
             </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name?.split(' ')[0]}</p>
            <p className="text-xs text-white/40 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
