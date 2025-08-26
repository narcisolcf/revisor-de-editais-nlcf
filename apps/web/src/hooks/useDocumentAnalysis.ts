import { useState, useCallback, useEffect } from 'react';
import { DocumentAnalysis, DocumentUpload } from '@/types/document';
import { DocumentService } from '@/services/documentService';
import { DocumentAnalysisService } from '@/services/documentAnalysisService';
import { ParametersService } from '@/services/parametersService';

interface UseDocumentAnalysisOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  useCloudRun?: boolean;
  enableRealTimeProgress?: boolean;
}

interface AnalysisProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'validating' | 'completing';
  progress: number;
  message: string;
  estimated_time?: number;
}

interface AnalysisStatistics {
  totalAnalyses: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  commonProblems: Array<{ type: string; count: number }>;
  processingTimes: { average: number; min: number; max: number };
}

interface AnalysisState {
  analyses: DocumentAnalysis[];
  currentAnalysis: DocumentAnalysis | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  progress: AnalysisProgress | null;
  statistics: AnalysisStatistics | null;
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
  
  // Funcionalidades de alta prioridade
  analyzeDocumentWithFile: (file: File, options?: Record<string, unknown>) => Promise<DocumentAnalysis | null>;
  analyzeBatch: (files: File[], options?: Record<string, unknown>) => Promise<DocumentAnalysis[]>;
  reanalyzeDocument: (documentId: string) => Promise<DocumentAnalysis | null>;
  getAnalysisStatus: (analysisId: string) => Promise<{ status: string; progress?: number; message?: string }>;
  loadStatistics: () => Promise<void>;
  clearCache: () => Promise<void>;
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
    error: null,
    progress: null,
    statistics: null
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

  // Funcionalidades de alta prioridade
  const parametersService = new ParametersService();

  const createDocumentFromFile = useCallback((file: File): DocumentUpload => {
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prefeituraId: 'mock_prefeitura',
      nome: file.name,
      tipo: file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX',
      classification: {
        tipoObjeto: 'aquisicao',
        modalidadePrincipal: 'processo_licitatorio',
        subtipo: 'processo_licitatorio',
        tipoDocumento: 'edital'
      },
      tamanho: file.size,
      urlStorage: '',
      status: 'processando',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, []);

  const analyzeDocumentWithFile = useCallback(async (
    file: File, 
    options?: Record<string, unknown>
  ): Promise<DocumentAnalysis | null> => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null, progress: { stage: 'uploading', progress: 0, message: 'Preparando análise...' } }));

      const extractionResult = await DocumentAnalysisService.extractTextFromFile(file);
      const document = createDocumentFromFile(file);

      const analysis = await DocumentAnalysisService.analyzeDocumentRealTime(
        document,
        extractionResult.text,
        (progress) => setState(prev => ({ ...prev, progress }))
      );

      setState(prev => ({
        ...prev,
        currentAnalysis: analysis,
        analyses: [analysis, ...prev.analyses],
        isAnalyzing: false,
        progress: null
      }));
      
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise';
      setState(prev => ({ ...prev, error: errorMessage, isAnalyzing: false, progress: null }));
      return null;
    }
  }, [createDocumentFromFile]);

  const analyzeBatch = useCallback(async (
    files: File[], 
    options?: Record<string, unknown>
  ): Promise<DocumentAnalysis[]> => {
    if (files.length === 0) return [];

    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null, progress: { stage: 'uploading', progress: 0, message: 'Preparando análise em lote...' } }));

      const documentsToAnalyze = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setState(prev => ({ ...prev, progress: {
          stage: 'extracting',
          progress: Math.round((i / files.length) * 50),
          message: `Extraindo texto: ${file.name}...`
        }}));

        const extractionResult = await DocumentAnalysisService.extractTextFromFile(file);
        const document = createDocumentFromFile(file);

        documentsToAnalyze.push({ document, extractedText: extractionResult.text });
      }

      setState(prev => ({ ...prev, progress: { stage: 'analyzing', progress: 50, message: 'Executando análise em lote...' } }));

      const batchResults = await DocumentAnalysisService.analyzeBatch(documentsToAnalyze);
      
      setState(prev => ({
        ...prev,
        analyses: [...batchResults, ...prev.analyses],
        isAnalyzing: false,
        progress: null
      }));
      
      return batchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise em lote';
      setState(prev => ({ ...prev, error: errorMessage, isAnalyzing: false, progress: null }));
      return [];
    }
  }, [createDocumentFromFile]);

  const reanalyzeDocument = useCallback(async (
    documentId: string
  ): Promise<DocumentAnalysis | null> => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
      
      const newAnalysis = await DocumentAnalysisService.reanalyzeDocument(documentId);
      
      setState(prev => ({
        ...prev,
        analyses: prev.analyses.map(analysis => 
          analysis.documentoId === documentId ? newAnalysis : analysis
        ),
        currentAnalysis: prev.currentAnalysis?.documentoId === documentId ? newAnalysis : prev.currentAnalysis,
        isAnalyzing: false
      }));
      
      return newAnalysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reprocessar';
      setState(prev => ({ ...prev, error: errorMessage, isAnalyzing: false }));
      return null;
    }
  }, []);

  const getAnalysisStatus = useCallback(async (analysisId: string) => {
    try {
      return await DocumentAnalysisService.getAnalysisStatus(analysisId);
    } catch (err) {
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Erro ao obter status' }));
      throw err;
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await DocumentAnalysisService.getAnalysisStatistics();
      setState(prev => ({ ...prev, statistics: stats }));
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await DocumentAnalysisService.clearAnalysisCache();
      await loadStatistics();
    } catch (err) {
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Erro ao limpar cache' }));
    }
  }, [loadStatistics]);

  return {
    ...state,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    loadAnalysis,
    loadAnalysesByDocument,
    loadAnalysesByPrefeitura,
    setCurrentAnalysis,
    clearError,
    refresh,
    getAnalysisById,
    getLatestAnalysis,
    getAnalysisStats,
    analyzeDocumentWithFile,
    analyzeBatch,
    reanalyzeDocument,
    getAnalysisStatus,
    loadStatistics,
    clearCache
  };
};

export default useDocumentAnalysis;