// Main component
export { CTASection } from './CTASection';

// Types
export type { 
  CTASectionProps, 
  AnimatedCounterProps,
  FeatureItem,
  StatItem,
  CTAButton 
} from './types';

// Components
export { AnimatedCounter } from './components/AnimatedCounter';
export { GlassMockup } from './components/GlassMockup';
export { FeatureList } from './components/FeatureList';
export { StatsSection } from './components/StatsSection';
export { CTAButtons } from './components/CTAButtons';

// Hooks
export { useReducedMotion, useIntersectionObserver } from './hooks/useAnimations';
export { useCounterAnimation } from './hooks/useCounterAnimation';

// Constants
export { FEATURES, STATS, FONTS, GRADIENTS } from './constants';