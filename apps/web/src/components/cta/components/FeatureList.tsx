import { Check } from 'lucide-react';
import type { FeatureItem } from '../types';

interface FeatureListProps {
  features: FeatureItem[];
  className?: string;
}

export const FeatureList = ({ features, className = '' }: FeatureListProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <span className="sr-only">Principais benefícios do sistema:</span>
      {features.map((feature, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 text-blue-50"
        >
          <div className="flex-shrink-0 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
            <Check size={14} className="text-green-900" />
          </div>
          <span className="text-sm font-medium">{feature.text}</span>
        </div>
      ))}
    </div>
  );
};