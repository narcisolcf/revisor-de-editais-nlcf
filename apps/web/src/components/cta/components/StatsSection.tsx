import { AnimatedCounter } from './AnimatedCounter';
import type { StatItem } from '../types';

interface StatsSectionProps {
  stats: StatItem[];
  className?: string;
}

export const StatsSection = ({ stats, className = '' }: StatsSectionProps) => {
  return (
    <div className={`grid grid-cols-3 gap-6 pt-8 border-t border-white/20 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            <AnimatedCounter 
              value={stat.value} 
              suffix={stat.suffix} 
              duration={stat.duration}
            />
          </div>
          <div className="text-xs text-blue-200">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};