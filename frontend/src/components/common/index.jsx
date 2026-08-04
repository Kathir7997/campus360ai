import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export { DashboardCard } from './DashboardCard';
export { AnalyticsCard } from './AnalyticsCard';
export { TimelineCard } from './TimelineCard';
export { TableCard } from './TableCard';
export { SapphireCard } from './SapphireCard';
export { HeroBanner } from './HeroBanner';
export { StatWidget } from './StatWidget';

// Animated Stat Card with premium glass aesthetic
export const StatCard = ({ title, value, subtitle, icon: Icon, gradient = 'primary', delay = 0, trend }) => {
  const gradients = {
    primary: 'from-primary-500 to-indigo-500 text-primary-400',
    indigo: 'from-indigo-500 to-primary-600 text-indigo-400',
    emerald: 'from-success-500 to-emerald-600 text-success-500',
    rose: 'from-danger-500 to-pink-600 text-danger-500',
    amber: 'from-warning-500 to-orange-500 text-warning-500',
    blue: 'from-info-500 to-blue-600 text-info-500',
  };

  const iconBg = gradients[gradient] || gradients.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-6 relative overflow-hidden group cursor-default"
    >
      {/* Background radial glow on hover */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${iconBg} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full pointer-events-none`} />

      <div className="relative flex items-start justify-between z-10">
        <div>
          <p className="text-white/50 text-sm font-medium mb-1 font-heading">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-xs font-medium border ${trend >= 0 ? 'bg-success-500/10 text-success-500 border-success-500/20' : 'bg-danger-500/10 text-danger-500 border-danger-500/20'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Icon className={`w-5 h-5 bg-gradient-to-br ${iconBg} bg-clip-text text-transparent`} style={{ color: 'currentColor' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Premium Glass Panel Wrapper
export const GlassCard = ({ children, className = '', ...props }) => (
  <div className={`glass-panel p-6 ${className}`} {...props}>
    {children}
  </div>
);

// Standard Card with Glass Panel styling
export const Card = ({ title, subtitle, children, action, className = '' }) => (
  <div className={`glass-panel flex flex-col ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          {title && <h3 className="font-heading font-semibold text-white tracking-wide">{title}</h3>}
          {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5 flex-1">{children}</div>
  </div>
);

// Loading Skeleton Premium
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
  <div className="glass-panel p-6 space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

// Badge
export const Badge = ({ children, variant = 'info' }) => {
  const variants = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    purple: 'badge-purple',
  };
  return <span className={`badge ${variants[variant] || 'badge-info'}`}>{children}</span>;
};

// Attendance Badge
export const AttendanceBadge = ({ percentage }) => {
  const p = parseFloat(percentage);
  if (p >= 75) return <Badge variant="success">{percentage}%</Badge>;
  if (p >= 60) return <Badge variant="warning">{percentage}%</Badge>;
  return <Badge variant="danger">{percentage}%</Badge>;
};

// Empty State inside Glass
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center mb-5 relative">
        <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
        <Icon className="w-7 h-7 text-white/50 relative z-10" />
      </div>
    )}
    <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-white/40 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// Progress Bar Premium
export const ProgressBar = ({ value, max = 100, color = 'primary' }) => {
  const pct = Math.min((value / max) * 100, 100);
  const colors = {
    primary: 'bg-gradient-to-r from-primary-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
    emerald: 'bg-gradient-to-r from-success-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    rose: 'bg-gradient-to-r from-danger-500 to-pink-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    amber: 'bg-gradient-to-r from-warning-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  };
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`h-full rounded-full ${colors[color] || colors.primary}`}
      />
    </div>
  );
};

// Premium Avatar
export const Avatar = ({ name, size = 'md', color = 'primary' }) => {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const colors = {
    primary: 'from-primary-500 to-indigo-600',
    emerald: 'from-success-500 to-emerald-600',
    rose: 'from-danger-500 to-pink-600',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color] || colors.primary} p-[1px]`}>
      <div className={`bg-bg-card rounded-[11px] flex items-center justify-center text-white font-medium ${sizes[size]}`}>
        {initials}
      </div>
    </div>
  );
};

// Loading Spinner Premium
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-white/10 border-t-primary-500 rounded-full animate-spin`} />
  );
};

// Full Page Loader Premium
export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B12]">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-primary-500 blur-[40px] opacity-30 animate-pulse-glow" />
      <div className="w-16 h-16 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-xl">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z" />
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <p className="text-sm font-medium text-white/70 tracking-wide">Initializing workspace...</p>
    </div>
  </div>
);
