import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const SapphireCard = ({ 
  title, 
  subtitle, 
  children, 
  action, 
  className = '', 
  delay = 0,
  noPadding = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "sapphire-card flex flex-col relative overflow-hidden group",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 pt-6 pb-4 relative z-10">
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-[13px] text-white/50 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      
      <div className={clsx("flex-1 relative z-10", !noPadding && "px-6 pb-6 pt-2")}>
        {children}
      </div>
    </motion.div>
  );
};

export default SapphireCard;
