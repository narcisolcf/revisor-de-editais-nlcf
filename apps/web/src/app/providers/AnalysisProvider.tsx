import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalysisResult {
  id: string;
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalysisContextType {
  analyses: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;
  startAnalysis: (documentId: string) => Promise<void>;
  getAnalysis: (id: string) => AnalysisResult | undefined;
  loading: boolean;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const startAnalysis = async (documentId: string) => {
    setLoading(true);
    try {
      const newAnalysis: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        documentId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setAnalyses(prev => [...prev, newAnalysis]);
      setCurrentAnalysis(newAnalysis);
      
      // Aqui você implementaria a chamada real para a API
      // Por enquanto, vamos simular
      setTimeout(() => {
        const updatedAnalysis = {
          ...newAnalysis,
          status: 'completed' as const,
          results: { score: 85, issues: [], recommendations: [] },
          updatedAt: new Date(),
        };
        
        setAnalyses(prev => prev.map(a => a.id === newAnalysis.id ? updatedAnalysis : a));
        setCurrentAnalysis(updatedAnalysis);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setLoading(false);
    }
  };

  const getAnalysis = (id: string) => {
    return analyses.find(analysis => analysis.id === id);
  };

  const value = {
    analyses,
    currentAnalysis,
    startAnalysis,
    getAnalysis,
    loading,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};