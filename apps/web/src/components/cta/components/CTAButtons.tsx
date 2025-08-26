import { Button } from '@/components/ui/button';
import type { CTAButton } from '../types';

interface CTAButtonsProps {
  buttons: CTAButton[];
  className?: string;
}

export const CTAButtons = ({ buttons, className = '' }: CTAButtonsProps) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 pt-6 ${className}`}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          onClick={button.onClick}
          size="lg"
          variant={button.variant === 'secondary' ? 'outline' : 'default'}
          className={`
            px-8 py-4 text-base transition-all duration-300
            ${button.variant === 'primary' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold transform hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-yellow-400/50' 
              : 'border-white/30 text-white hover:bg-white/10 backdrop-blur-sm hover:border-white/50'
            }
            ${button.className || ''}
          `}
        >
          {button.text}
        </Button>
      ))}
    </div>
  );
};