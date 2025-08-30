import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  stagger?: number;
  isVisible?: boolean;
}

const animations: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
};

export function AnimatedContainer({
  children,
  className,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.3,
  stagger = 0.1,
  isVisible = true,
}: AnimatedContainerProps) {
  if (animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  const variants = animations[animation];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={cn(className)}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            duration,
            delay,
            ease: "easeOut"
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Staggered container for animating multiple children
export function StaggeredContainer({
  children,
  className,
  animation = 'slideUp',
  delay = 0,
  duration = 0.3,
  stagger = 0.1,
}: AnimatedContainerProps) {
  if (animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = animations[animation];

  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{
            duration,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Loading animation component
export function LoadingAnimation({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
}

// Pulse animation for refresh indicators
export function PulseAnimation({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedContainer;