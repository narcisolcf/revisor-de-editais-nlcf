import { useReducedMotion } from '../hooks/useAnimations';

export const GlassMockup = () => {
  const reducedMotion = useReducedMotion();

  return (
    <div 
      className="relative w-full max-w-md mx-auto" 
      role="img" 
      aria-label="Interface do sistema de análise de documentos"
    >
      {/* Main mockup container */}
      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>
        
        {/* Content area */}
        <div className="space-y-3">
          <div className={`h-4 bg-white/20 rounded ${!reducedMotion ? 'animate-pulse' : ''}`}></div>
          <div 
            className={`h-4 bg-white/15 rounded w-3/4 ${!reducedMotion ? 'animate-pulse' : ''}`}
            style={{ animationDelay: reducedMotion ? '0s' : '0.2s' }}
          ></div>
          <div 
            className={`h-4 bg-white/10 rounded w-1/2 ${!reducedMotion ? 'animate-pulse' : ''}`}
            style={{ animationDelay: reducedMotion ? '0s' : '0.4s' }}
          ></div>
        </div>
        
        {/* Progress indicators */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Análise em andamento...</span>
            <span>87%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full ${!reducedMotion ? 'animate-pulse' : ''}`}
              style={{ width: '87%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      {!reducedMotion && (
        <>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
        </>
      )}
    </div>
  );
};