import React from 'react';

interface CallToActionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onRequestAnalysis?: () => void;
}

const CallToAction: React.FC<CallToActionProps> = ({
  title = "Solicite uma Análise Gratuita",
  description = "Descubra como podemos ajudar a garantir o sucesso de suas licitações. Solicite uma análise gratuita de seus documentos.",
  buttonText = "Solicitar Análise Gratuita",
  onRequestAnalysis
}) => {
  return (
    <div className="@container">
      <div className="flex flex-col justify-end gap-6 px-4 py-10 @[480px]:gap-8 @[480px]:px-10 @[480px]:py-20">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-ink tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px]">
            {title}
          </h2>
          <p className="text-ink text-base font-normal leading-normal max-w-[720px]">
            {description}
          </p>
        </div>
        <div className="flex flex-1 justify-center">
          <div className="flex justify-center">
            <button
              onClick={onRequestAnalysis}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-cta text-cta-foreground text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em] grow"
            >
              <span className="truncate">{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;