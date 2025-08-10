import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import Stats from '@/components/landing/Stats';
import Services from '@/components/landing/Services';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

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
      className="relative flex size-full min-h-screen flex-col bg-[#f8f9fc] group/design-root overflow-x-hidden" 
      style={{ fontFamily: '"Public Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <Header onRequestAnalysis={handleRequestAnalysis} />
        
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <HeroSection onRequestFreeAnalysis={handleRequestAnalysis} />
            <Stats />
            <Services />
            <CallToAction onRequestAnalysis={handleRequestAnalysis} />
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;