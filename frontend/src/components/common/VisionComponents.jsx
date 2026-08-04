import { motion } from 'framer-motion';

export const VisionGlassPanel = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      className={`vision-glass-panel p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FloatingCard = ({ children, className = '', delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`vision-glass p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StatsOrb = ({ title, value, subtext, color = 'rgba(255,255,255,1)', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, type: 'spring' }}
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full vision-glass"
    >
      <div 
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: color }}
      />
      <h3 className="text-sm font-medium text-white/60 mb-1 z-10 text-center">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold text-white z-10" style={{ textShadow: `0 0 10px ${color}` }}>{value}</p>
      {subtext && <span className="text-[10px] text-white/40 mt-1 z-10 text-center">{subtext}</span>}
    </motion.div>
  );
};

export const VisionButton = ({ children, className = '', ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`vision-button ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const VisionBadge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};
