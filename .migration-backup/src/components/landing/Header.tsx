import React from 'react';

const userAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBmiJ_fCM6a-iYJAHAs1kSs2huqY4Zulx4YMBGnDBNQ-llRWRA6cfpMD03T_LEdMougBwyTOdI_G5JTKKOWgtjIwlGzQxoJt3T7uQ3S3bsub17A9T72VSGEIthKXQxSu8L1MLzj-u0XpYEwthXhh0gKnnLAY3y2QSEdhjuXwoH4z4gtQPsMW8Kha3Pbye29cy9CwWp_2X24r8o-WbFmVDljiwUso71ProZT3jS68M-P7ax_mXVJhfjQAd2T2v8Ytfi6xofk5W0PrQ";

interface HeaderProps {
  onRequestAnalysis?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRequestAnalysis }) => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-mutedSurface px-10 py-3">
      <div className="flex items-center gap-4 text-ink">
        <div className="size-4">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-ink text-lg font-bold leading-tight tracking-[-0.015em]">
          GovDocs
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <a className="text-ink text-sm font-medium leading-normal" href="#">
            Serviços
          </a>
          <a className="text-ink text-sm font-medium leading-normal" href="#">
            Sobre nós
          </a>
          <a className="text-ink text-sm font-medium leading-normal" href="#">
            Contato
          </a>
        </div>
        <button
          onClick={onRequestAnalysis}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-cta text-cta-foreground text-sm font-bold leading-normal tracking-[0.015em]"
        >
          <span className="truncate">Solicitar Análise</span>
        </button>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
          style={{
            backgroundImage: `url("${userAvatarUrl}")`
          }}
        />
      </div>
    </header>
  );
};

export default Header;