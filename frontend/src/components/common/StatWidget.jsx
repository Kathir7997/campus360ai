import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatWidget = ({ 
  title, 
  value, 
  trend,
  trendLabel,
  icon: Icon,
  delay = 0,
  className = ''
}) => {
  const isPositive = trend >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "sapphire-card p-6 flex flex-col justify-between group",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        <button className="text-white/20 hover:text-white/60 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>

      <div>
        <h3 className="text-4xl font-bold text-white tracking-tight mb-2 font-heading group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
          {value}
        </h3>
        
        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <div className={clsx(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md",
              isPositive ? "text-success-400 bg-success-500/10" : "text-danger-400 bg-danger-500/10"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
            {trendLabel && <span className="text-[11px] text-white/40">{trendLabel}</span>}
          </div>
        )}
      </div>
      
      {/* Subtle corner glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
};

export default StatWidget;
