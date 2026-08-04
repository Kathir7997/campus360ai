import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const DashboardCard = ({ 
  title, 
  subtitle, 
  children, 
  action, 
  className = '', 
  delay = 0,
  glowColor = 'primary-500'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "glass-card flex flex-col relative overflow-hidden group",
        className
      )}
    >
      {/* Hover glow effect based on dynamic color */}
      <div 
        className={clsx(
          `absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`,
          `bg-${glowColor}`
        )} 
      />

      {(title || action) && (
        <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
          <div>
            {title && <h3 className="font-heading font-semibold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      
      <div className="p-5 flex-1 relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardCard;
