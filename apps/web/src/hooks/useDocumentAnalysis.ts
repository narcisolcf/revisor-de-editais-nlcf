import { useState, useCallback, useEffect } from 'react';
import { DocumentAnalysis, DocumentUpload } from '@/types/document';
import { DocumentService } from '@/services/documentService';

interface UseDocumentAnalysisOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AnalysisState {
  analyses: DocumentAnalysis[];
  currentAnalysis: DocumentAnalysis | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

interface UseDocumentAnalysisReturn extends AnalysisState {
  // Ações de análise
  startAnalysis: (documentId: string) => Promise<void>;
  cancelAnalysis: (documentId: string) => Promise<void>;
  retryAnalysis: (documentId: string) => Promise<void>;
  
  // Busca e carregamento
  loadAnalysis: (analysisId: string) => Promise<void>;
  loadAnalysesByDocument: (documentId: string) => Promise<void>;
  loadAnalysesByPrefeitura: (prefeituraId: string) => Promise<void>;
  
  // Gerenciamento de estado
  setCurrentAnalysis: (analysis: DocumentAnalysis | null) => void;
  clearError: () => void;
  refresh: () => Promise<void>;
  
  // Utilitários
  getAnalysisById: (id: string) => DocumentAnalysis | undefined;
  getLatestAnalysis: (documentId: string) => DocumentAnalysis | undefined;
  getAnalysisStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    averageScore: number;
  };
}

export const useDocumentAnalysis = (
  options: UseDocumentAnalysisOptions = {}
): UseDocumentAnalysisReturn => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [state, setState] = useState<AnalysisState>({
    analyses: [],
    currentAnalysis: null,
    isLoading: false,
    isAnalyzing: false,
    error: null
  });

  // DocumentService é uma classe com métodos estáticos

  // Atualizar estado
  const updateState = useCallback((updates: Partial<AnalysisState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Definir análise atual
  const setCurrentAnalysis = useCallback((analysis: DocumentAnalysis | null) => {
    updateState({ currentAnalysis: analysis });
  }, [updateState]);

  // Carregar análise por ID
  const loadAnalysis = useCallback(async (analysisId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const analysis = await DocumentService.getAnalysisById(analysisId);
      
      updateState({
        currentAnalysis: analysis,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Erro ao carregar análise',
        isLoading: false
      });
    }
  }, [updateState]);

  // Carregar análises por documento
  const loadAnalysesByDocument = useCallback(async (documentId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      // Simular busca de análises por documento
      // Em uma implementação real, isso seria uma chamada para o serviço
      const analyses: DocumentAnalysis[] = [];
      
      updateState({
        analyses,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar análises do documento:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Erro ao carregar análises',
        isLoading: false
      });
    }
  }, [updateState]);

  // Carregar análises por prefeitura
  const loadAnalysesByPrefeitura = useCallback(async (prefeituraId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      // Simular busca de análises por prefeitura
      const analyses: DocumentAnalysis[] = [];
      
      updateState({
        analyses,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar análises da prefeitura:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Erro ao carregar análises',
        isLoading: false
      });
    }
  }, [updateState]);

  // Iniciar análise
  const startAnalysis = useCallback(async (documentId: string) => {
    try {
      updateState({ isAnalyzing: true, error: null });
      
      // Simular início da análise
      // Em uma implementação real, isso seria uma chamada para o serviço de análise
      console.log('Iniciando análise do documento:', documentId);
      
      // A análise será processada em background
      // O progresso será acompanhado pelo componente AnalysisProgress
      
    } catch (error) {
      console.error('Erro ao iniciar análise:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Erro ao iniciar análise',
        isAnalyzing: false
      });
    }
  }, [updateState]);

  // Cancelar análise
  const cancelAnalysis = useCallback(async (documentId: string) => {
    try {
      // Simular cancelamento da análise
      console.log('Cancelando análise do documento:', documentId);
      
      updateState({ isAnalyzing: false });
    } catch (error) {
      console.error('Erro ao cancelar análise:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Erro ao cancelar análise'
      });
    }
  }, [updateState]);

  // Tentar novamente análise
  const retryAnalysis = useCallback(async (documentId: string) => {
    await startAnalysis(documentId);
  }, [startAnalysis]);

  // Atualizar dados
  const refresh = useCallback(async () => {
    if (state.currentAnalysis) {
      await loadAnalysis(state.currentAnalysis.id);
    }
  }, [state.currentAnalysis, loadAnalysis]);

  // Buscar análise por ID
  const getAnalysisById = useCallback((id: string) => {
    return state.analyses.find(analysis => analysis.id === id);
  }, [state.analyses]);

  // Buscar análise mais recente de um documento
  const getLatestAnalysis = useCallback((documentId: string) => {
    const documentAnalyses = state.analyses
      .filter(analysis => analysis.documentoId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return documentAnalyses[0];
  }, [state.analyses]);

  // Calcular estatísticas
  const getAnalysisStats = useCallback(() => {
    const total = state.analyses.length;
    const completed = state.analyses.length; // Todas as análises retornadas estão completas
    const inProgress = state.isAnalyzing ? 1 : 0;
    const failed = 0; // Análises com falha não são retornadas na lista
    
    const averageScore = total > 0 
      ? state.analyses.reduce((sum, analysis) => sum + analysis.scoreConformidade, 0) / total
      : 0;
    
    return {
      total,
      completed,
      inProgress,
      failed,
      averageScore
    };
  }, [state.analyses, state.isAnalyzing]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    // Estado
    analyses: state.analyses,
    currentAnalysis: state.currentAnalysis,
    isLoading: state.isLoading,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    
    // Ações
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    loadAnalysis,
    loadAnalysesByDocument,
    loadAnalysesByPrefeitura,
    setCurrentAnalysis,
    clearError,
    refresh,
    
    // Utilitários
    getAnalysisById,
    getLatestAnalysis,
    getAnalysisStats
  };
};

export default useDocumentAnalysis;