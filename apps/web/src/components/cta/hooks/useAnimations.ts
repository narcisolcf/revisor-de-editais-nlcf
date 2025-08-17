import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
};

export const useIntersectionObserver = (
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!ref || hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTriggered(true);
          callback();
        }
      },
      { threshold: 0.3, ...options }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, callback, hasTriggered, options]);

  return setRef;
};