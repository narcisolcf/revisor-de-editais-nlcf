import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { CTASection } from '@/components/cta';

interface LandingPageProps {
  onRequestAnalysis?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRequestAnalysis }) => {
  const navigate = useNavigate();

  const handleRequestAnalysis = () => {
    // Navigate to document upload/analysis page or custom action
    if (onRequestAnalysis) {
      onRequestAnalysis();
    } else {
      navigate('/documentos');
    }
  };

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-surface group/design-root overflow-x-hidden" 
      style={{ fontFamily: '"Public Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <Header onRequestAnalysis={handleRequestAnalysis} />

        {/* Main Content */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Hero Section */}
            <div className="@container">
              <div className="@[480px]:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-lg items-center justify-center p-4"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmu-UFObR6nbZmGtCKK0jYv2hK84cva0qdPq3w6MUYAMvwcLjfv1eNf-uB-NepDp_avGSdv81DUagb5Hz3qSqjLuboZqBqpPCwHEMzuHydDgZxeyibgRwQvBnL59neQHRyRNX0H5l4pGcVR1-aP-fQyy4YBR4TrN9bqGeHq2JG2oEf6rGDm1LTfKVvGNaQTW5lDrg1xNgCnagPsUBdsQ0CPGxWWvI-IAxmF1ngcejZPnoViFLMj_7o6rqKSMcmyC6w8-iROQmbhw")'
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
                    onClick={handleRequestAnalysis}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-cta text-cta-foreground hover:bg-cta/90 text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em]"
                  >
                    <span className="truncate">Solicitar Análise Gratuita</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex flex-wrap gap-4 p-4">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 bg-mutedSurface">
                <p className="text-ink text-base font-medium leading-normal">Documentos Revisados</p>
                <p className="text-ink tracking-light text-2xl font-bold leading-tight">1,500+</p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 bg-mutedSurface">
                <p className="text-ink text-base font-medium leading-normal">Órgãos Atendidos</p>
                <p className="text-ink tracking-light text-2xl font-bold leading-tight">50+</p>
              </div>
            </div>

            {/* Services Section */}
            <h2 className="text-ink text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Nossos Principais Serviços</h2>
            
            <div className="p-4">
              <div className="flex items-stretch justify-between gap-4 rounded-lg">
                <div className="flex flex-col gap-1 flex-[2_2_0px]">
                  <p className="text-mutedInk text-sm font-normal leading-normal">Revisão de Editais</p>
                  <p className="text-ink text-base font-bold leading-tight">Análise Detalhada</p>
                  <p className="text-mutedInk text-sm font-normal leading-normal">
                    Garantimos que seus editais estejam em total conformidade com a legislação vigente, evitando impugnações e atrasos.
                  </p>
                </div>
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBT2UcJwtqppsflGcgbX-MPnIwmfCyD3UgEjbJtGUSblwCSNAUv9YwmP3mOe947-OIKJKW4QHH1Fol6Ah5Pp_yTt7MUSJHrHElshnCkPUKjXAGm7ZhOqqW3UiXBNZqjlihf5LnzJusSZODD7TV0wRXIz1tqSorzOFfE1oitEqmCprdHy7Ql6JKdaaYN-q1kbTVW0ZIPMgvBod0puufukNeFNEwdQ-dDlp1HYd_mKmnGmmaCfVB63J1mi_vxXuzJPn80EaLnHn4Y8A")'
                  }}
                ></div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-stretch justify-between gap-4 rounded-lg">
                <div className="flex flex-col gap-1 flex-[2_2_0px]">
                  <p className="text-mutedInk text-sm font-normal leading-normal">Revisão de Termos de Referência</p>
                  <p className="text-ink text-base font-bold leading-tight">Especificações Claras</p>
                  <p className="text-mutedInk text-sm font-normal leading-normal">
                    Asseguramos que seus termos de referência sejam claros, precisos e objetivos, facilitando a participação de fornecedores qualificados.
                  </p>
                </div>
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB5V7yRKy_OF8bIBi145vY1CfLA0Ks4P1NZ7gd_yu6YNajy9hPtcnGTmiG24uGpHREJEm4yI0NMROZ8PtqPT94v4JMoWZITsD7cGhS_VnlWxQdD2ENlBEUIiDTt_rzFbytH3js3x6tp2SOlDSOaytfPT9XcmVwmOrO6XoCODg--qC1a5jUpsWka8GO-mCTEzO1rAzsoy95x8VkcJctSlHDaTZO-YCQVkl3v5t_M6cPdpUjHBK2nUKNgsGBJTPGDKk8iQZVOX9C70g")'
                  }}
                ></div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-stretch justify-between gap-4 rounded-lg">
                <div className="flex flex-col gap-1 flex-[2_2_0px]">
                  <p className="text-mutedInk text-sm font-normal leading-normal">Consultoria Especializada</p>
                  <p className="text-ink text-base font-bold leading-tight">Suporte Contínuo</p>
                  <p className="text-mutedInk text-sm font-normal leading-normal">
                    Oferecemos consultoria especializada para auxiliar em todas as etapas do processo licitatório, desde a elaboração até a publicação.
                  </p>
                </div>
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAcb2KthPNR0a0DniejLXYxr2JFuZ3dHyP6cLjycWJNlDJ_6BfxWZNevGBfHxZs_dwt3vkJyPLZmeHoMsOFK-c7i6-hslueN_UhbgIFvQW_E-4NgBhRzOteEKrbIQ8NOltQy7t9dbuiB8Vt5LLpng1nzPBZ8DCpOxgBYNm0zuZA7H5gBZyNYh-zR0C3yFB02BK0qW7pTEgZhVGHDqzILgYkpD06pPH6Lvz6oTIGeSqBseqg1Cxk1-n2UOmUqgjZjpYyLoZBTOg0hQ")'
                  }}
                ></div>
              </div>
            </div>

            {/* Modern CTA Section following GOV.BR standards */}
            <CTASection 
              onStartAnalysis={handleRequestAnalysis}
              onViewDemo={() => console.log('Demo requested')}
              onLearnMore={() => navigate('/sobre')}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a className="text-mutedInk text-base font-normal leading-normal min-w-40" href="#">Política de Privacidade</a>
                <a className="text-mutedInk text-base font-normal leading-normal min-w-40" href="#">Termos de Serviço</a>
                <a className="text-mutedInk text-base font-normal leading-normal min-w-40" href="#">Contato</a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#">
                  <div className="text-mutedInk">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div className="text-mutedInk">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div className="text-mutedInk">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-mutedInk text-base font-normal leading-normal">© 2024 GovDocs. Todos os direitos reservados.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;