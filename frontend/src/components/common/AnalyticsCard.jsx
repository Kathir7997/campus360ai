import React from 'react';
import { clsx } from 'clsx';
import { ResponsiveContainer } from 'recharts';
import DashboardCard from './DashboardCard';

export const AnalyticsCard = ({
  title,
  subtitle,
  children,
  action,
  className = '',
  delay = 0,
  height = 300,
  glowColor = 'indigo-500'
}) => {
  return (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      action={action}
      delay={delay}
      glowColor={glowColor}
      className={clsx("flex flex-col", className)}
    >
      <div style={{ height: `${height}px`, width: '100%' }} className="relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

export default AnalyticsCard;
