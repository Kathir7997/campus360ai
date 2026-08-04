import React from 'react';
import { clsx } from 'clsx';
import DashboardCard from './DashboardCard';
import { Search } from 'lucide-react';

export const TableCard = ({
  title,
  subtitle,
  headers = [],
  children,
  onSearch,
  searchPlaceholder = "Search...",
  action,
  className = '',
  delay = 0,
}) => {
  const cardAction = onSearch ? (
    <div className="relative group/search">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-white/30 group-focus-within/search:text-primary-400 transition-colors" />
      </div>
      <input
        type="text"
        onChange={(e) => onSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className="block w-full sm:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white/10 transition-all"
      />
    </div>
  ) : action;

  return (
    <DashboardCard 
      title={title} 
      subtitle={subtitle} 
      action={cardAction} 
      className={clsx("p-0 overflow-hidden", className)} // override padding on child
      delay={delay}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
};

export default TableCard;
