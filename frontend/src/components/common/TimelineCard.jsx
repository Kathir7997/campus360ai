import React from 'react';
import { clsx } from 'clsx';
import DashboardCard from './DashboardCard';
import { motion } from 'framer-motion';

export const TimelineCard = ({
  title,
  subtitle,
  events = [],
  className = '',
  delay = 0,
}) => {
  return (
    <DashboardCard title={title} subtitle={subtitle} className={className} delay={delay}>
      <div className="relative pl-6 border-l border-white/10 space-y-6 my-2">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 * index, duration: 0.4 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div 
              className={clsx(
                "absolute -left-[31px] top-1.5 w-[11px] h-[11px] rounded-full ring-4 ring-bg-card shadow-[0_0_10px_rgba(255,255,255,0.2)]",
                event.color ? `bg-${event.color}` : "bg-primary-500"
              )} 
            />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-white">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
              {event.time && (
                <span className="text-xs text-white/40 whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full border border-white/5 self-start">
                  {event.time}
                </span>
              )}
            </div>
            
            {event.badge && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase bg-white/5 border border-white/10 text-white/70">
                {event.badge}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default TimelineCard;
