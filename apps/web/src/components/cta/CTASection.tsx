import { useMemo } from 'react';
import { useReducedMotion } from './hooks/useAnimations';
import { FeatureList } from './components/FeatureList';
import { StatsSection } from './components/StatsSection';
import { CTAButtons } from './components/CTAButtons';
import { GlassMockup } from './components/GlassMockup';
import { FEATURES, STATS, FONTS, GRADIENTS } from './constants';
import type { CTASectionProps, CTAButton } from './types';
import { safeNavigate } from '@/lib/browser-utils';

export function CTASection({ 
  onStartAnalysis, 
  onViewDemo, 
  onLearnMore, 
  className = '' 
}: CTASectionProps) {
  const reducedMotion = useReducedMotion();

  // Memoize buttons configuration to prevent unnecessary re-renders
  const buttons: CTAButton[] = useMemo(() => [
    {
      text: 'Começar agora',
      variant: 'primary' as const,
      onClick: () => {
        if (onStartAnalysis) {
          onStartAnalysis();
        } else {
          safeNavigate('/documentos');
        }
      }
    },
    {
      text: 'Ver demonstração',
      variant: 'secondary' as const,
      onClick: () => {
        if (onViewDemo) {
          onViewDemo();
        } else {
          console.log('View demonstration requested');
        }
      }
    }
  ], [onStartAnalysis, onViewDemo]);

  return (
    <section 
      className={`relative min-h-[600px] w-full overflow-hidden ${!reducedMotion ? 'animate-fadeIn' : ''} ${className}`}
      aria-labelledby="cta-heading"
      aria-describedby="cta-description"
    >
      {/* Background with GOV.BR gradient */}
      <div className={`absolute inset-0 ${GRADIENTS.GOVBR_BACKGROUND}`}>
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        
        {/* Animated background elements */}
        {!reducedMotion && (
          <>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div 
              className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl animate-pulse" 
              style={{ animationDelay: '1s' }}
            ></div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left column - Content */}
          <div className="space-y-8">
            {/* Headlines */}
            <div className="space-y-4">
              <h1 
                id="cta-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                style={{ fontFamily: FONTS.RAWLINE }}
              >
                Transforme suas 
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                  licitações
                </span>
                em processos seguros
              </h1>
              
              <p 
                id="cta-description"
                className="text-xl text-blue-100 max-w-lg leading-relaxed"
                style={{ fontFamily: FONTS.RAWLINE }}
              >
                Sistema completo de análise e revisão de editais que garante conformidade legal e reduz riscos em seus processos licitatórios.
              </p>
            </div>

            {/* Features */}
            <FeatureList features={FEATURES} />

            {/* Statistics */}
            <StatsSection stats={STATS} />

            {/* CTA Buttons */}
            <CTAButtons buttons={buttons} />
          </div>

          {/* Right column - Visual mockup */}
          <div className="relative lg:pl-8">
            <div className={`${!reducedMotion ? 'animate-bounce' : ''}`}>
              <GlassMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}