import { useCounterAnimation } from '../hooks/useCounterAnimation';
import { useIntersectionObserver } from '../hooks/useAnimations';
import type { AnimatedCounterProps } from '../types';

export const AnimatedCounter = ({ 
  value, 
  suffix, 
  duration = 2000,
  className = ''
}: AnimatedCounterProps) => {
  const { count, startAnimation } = useCounterAnimation(value, duration);
  const counterRef = useIntersectionObserver(startAnimation);

  return (
    <span ref={counterRef} className={className}>
      {count}{suffix}
    </span>
  );
};