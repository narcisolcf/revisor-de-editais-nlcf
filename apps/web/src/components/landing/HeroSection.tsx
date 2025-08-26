import React from 'react';

const heroBackgroundUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBmu-UFObR6nbZmGtCKK0jYv2hK84cva0qdPq3w6MUYAMvwcLjfv1eNf-uB-NepDp_avGSdv81DUagb5Hz3qSqjLuboZqBqpPCwHEMzuHydDgZxeyibgRwQvBnL59neQHRyRNX0H5l4pGcVR1-aP-fQyy4YBR4TrN9bqGeHq2JG2oEf6rGDm1LTfKVvGNaQTW5lDrg1xNgCnagPsUBdsQ0CPGxWWvI-IAxmF1ngcejZPnoViFLMj_7o6rqKSMcmyC6w8-iROQmbhw";

interface HeroSectionProps {
  onRequestFreeAnalysis?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onRequestFreeAnalysis }) => {
  return (
    <div className="@container">
      <div className="@[480px]:p-4">
        <div
          className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-lg items-center justify-center p-4"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("${heroBackgroundUrl}")`
          }}
        >
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
              Revisão Profissional de Documentos de Licitação
            </h1>
            <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal">
              Garanta conformidade legal e clareza em seus editais e termos de referência.
            </h2>
          </div>
          <button
            onClick={onRequestFreeAnalysis}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-cta text-cta-foreground text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em]"
          >
            <span className="truncate">Solicitar Análise Gratuita</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;