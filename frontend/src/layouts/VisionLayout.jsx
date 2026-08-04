import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import VisionSidebar from '../components/layout/VisionSidebar';
import VisionNavbar from '../components/layout/VisionNavbar';

const VisionLayout = () => {
  const { user } = useSelector((s) => s.auth);
  const role = user?.role?.toLowerCase() || 'student';

  const bgImages = {
    student: 'url("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop")',
    mentor: 'url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop")',
    hod: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop")',
    admin: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")'
  };

  // Force specific body class for VisionOS styling overrides
  useEffect(() => {
    document.body.classList.add('vision-os');
    return () => document.body.classList.remove('vision-os');
  }, []);

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-[var(--color-vision-bg)] relative bg-cover bg-center"
      style={{ backgroundImage: bgImages[role] }}
    >
      {/* Heavy Blur Overlay to make it feel spatial/cinematic */}
      <div className="absolute inset-0 backdrop-blur-[20px] bg-black/20 pointer-events-none" />

      {/* Deep Cinematic Backgrounds (Ambient Glows) */}
      <div className="ambient-glow-purple -top-[20%] -left-[10%] mix-blend-screen opacity-70" />
      <div className="ambient-glow-blue top-[20%] -right-[10%] mix-blend-screen opacity-70" />
      <div className="ambient-glow-pink bottom-[10%] left-[20%] mix-blend-screen opacity-70" />
      
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* Floating Navbar */}
      <VisionNavbar />

      {/* Main Spatial Content Canvas */}
      <main className="flex-1 overflow-y-auto vision-scroll relative z-10 pt-28 pb-32 px-4 md:px-10">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Dock */}
      <VisionSidebar />
    </div>
  );
};

export default VisionLayout;
