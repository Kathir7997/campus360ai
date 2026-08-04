import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { setSidebarOpen } from '../redux/slices/uiSlice';

const DashboardLayout = () => {
  const { sidebarOpen } = useSelector((s) => s.ui);
  const dispatch = useDispatch();

  // Force dark mode for the layout
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Close sidebar on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setSidebarOpen(false));
      } else {
        dispatch(setSidebarOpen(true));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Premium Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/3" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
