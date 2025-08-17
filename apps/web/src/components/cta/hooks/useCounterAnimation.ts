import { useState, useCallback } from 'react';

export const useCounterAnimation = (targetValue: number, duration = 2000) => {
  const [count, setCount] = useState(0);

  const startAnimation = useCallback(() => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation (easeOutCubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(targetValue * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return { count, startAnimation };
};