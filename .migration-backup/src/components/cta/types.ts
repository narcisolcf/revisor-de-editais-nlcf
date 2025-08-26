import { LucideIcon } from 'lucide-react';

export interface CTASectionProps {
  onStartAnalysis?: () => void;
  onViewDemo?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

export interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration?: number;
  className?: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  text: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
  duration?: number;
}

export interface CTAButton {
  text: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  className?: string;
}