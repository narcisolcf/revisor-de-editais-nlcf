import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onRequestAnalysis?: () => void;
}

export function Header({ onRequestAnalysis }: HeaderProps) {
  const navigate = useNavigate();

  const handleRequestAnalysis = () => {
    if (onRequestAnalysis) {
      onRequestAnalysis();
    } else {
      navigate('/documentos');
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-mutedSurface px-10 py-3">
      <div className="flex items-center gap-4 text-ink">
        <Link to="/" className="flex items-center gap-4 text-ink hover:opacity-80 transition-opacity">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-ink text-lg font-bold leading-tight tracking-[-0.015em]">GovDocs</h2>
        </Link>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-9">
          <Link 
            to="/servicos" 
            className="text-ink text-sm font-medium leading-normal hover:text-cta transition-colors"
          >
            Serviços
          </Link>
          <Link 
            to="/sobre" 
            className="text-ink text-sm font-medium leading-normal hover:text-cta transition-colors"
          >
            Sobre nós
          </Link>
          <Link 
            to="/contato" 
            className="text-ink text-sm font-medium leading-normal hover:text-cta transition-colors"
          >
            Contato
          </Link>
        </nav>
        <Button
          onClick={handleRequestAnalysis}
          className="min-w-[84px] max-w-[480px] h-10 px-4 bg-cta text-cta-foreground text-sm font-bold leading-normal tracking-[0.015em] hover:bg-cta/90"
        >
          <span className="truncate">Solicitar Análise</span>
        </Button>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmiJ_fCM6a-iYJAHAs1kSs2huqY4Zulx4YMBGnDBNQ-llRWRA6cfpMD03T_LEdMougBwyTOdI_G5JTKKOWgtjIwlGzQxoJt3T7uQ3S3bsub17A9T72VSGEIthKXQxSu8L1MLzj-u0XpYEwthXhh0gKnnLAY3y2QSEdhjuXwoH4z4gtQPsMW8Kha3Pbye29cy9CwWp_2X24r8o-WbFmVDljiwUso71ProZT3jS68M-P7ax_mXVJhfjQAd2T2v8Ytfi6xofk5W0PrQ")'
          }}
          title="Menu do usuário"
        />
      </div>
    </header>
  );
}

