import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnalysisOrchestrator, ComprehensiveAnalysisResult } from '@/services/analysis';
import { OrganizationConfig, AnalysisParameter } from './useAnalysisConfig';
import { toast } from '@/hooks/use-toast';

export interface AdaptiveAnalysisRequest {
  documentId: string;
  text: string;
  classification: any;
  configId?: string;
  customParameters?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  enableRealTime?: boolean;
}

export interface AnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // segundos
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AnalysisProgress {
  step: string;
  progress: number;
  details?: string;
  timestamp: Date;
}

export interface AdaptiveAnalysisResult extends ComprehensiveAnalysisResult {
  configId?: string;
  customParameters?: Record<string, any>;
  baselineComparison?: {
    baselineScore: number;
    customScore: number;
    improvement: number;
    changedCategories: string[];
  };
  performanceMetrics?: {
    processingTime: number;
    cacheHits: number;
    fallbackUsage: number;
    memoryUsage: number;
  };
}

export interface AnalysisComparison {
  baseline: ComprehensiveAnalysisResult;
  custom: AdaptiveAnalysisResult;
  differences: {
    overallScore: number;
    categoryScores: Record<string, number>;
    newProblems: any[];
    resolvedProblems: any[];
    changedProblems: any[];
  };
}

export const useAdaptiveAnalysis = (organizationId: string) => {
  const queryClient = useQueryClient();
  const [activeAnalyses, setActiveAnalyses] = useState<Map<string, AnalysisStatus>>(new Map());
  const [analysisProgress, setAnalysisProgress] = useState<Map<string, AnalysisProgress[]>>(new Map());
  const orchestratorRef = useRef<AnalysisOrchestrator | null>(null);
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Inicializar orquestrador
  useEffect(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new AnalysisOrchestrator({
        enableCache: true,
        enableFallback: true,
        enableParallelProcessing: true,
        maxConcurrentAnalyses: 5,
        timeout: 30000
      });
    }
  }, []);

  // Query para buscar análises recentes
  const {
    data: recentAnalyses,
    isLoading: isLoadingRecentAnalyses,
    error: recentAnalysesError,
    refetch: refetchRecentAnalyses
  } = useQuery({
    queryKey: ['recent-adaptive-analyses', organizationId],
    queryFn: () => getRecentAnalyses(organizationId),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!organizationId
  });

  // Query para buscar análise específica
  const getAnalysisById = useCallback((analysisId: string) => {
    return queryClient.getQueryData(['adaptive-analysis', analysisId]) as AdaptiveAnalysisResult | undefined;
  }, [queryClient]);

  // Mutation para executar análise adaptativa
  const executeAnalysisMutation = useMutation({
    mutationFn: async (request: AdaptiveAnalysisRequest): Promise<AdaptiveAnalysisResult> => {
      if (!orchestratorRef.current) {
        throw new Error('Orquestrador não inicializado');
      }

      const analysisId = generateAnalysisId();
      
      // Criar status inicial
      const initialStatus: AnalysisStatus = {
        id: analysisId,
        status: 'pending',
        progress: 0,
        currentStep: 'Iniciando análise...',
        startedAt: new Date()
      };

      setActiveAnalyses(prev => new Map(prev).set(analysisId, initialStatus));
      setAnalysisProgress(prev => new Map(prev).set(analysisId, []));

      try {
        // Atualizar status para processando
        updateAnalysisStatus(analysisId, {
          status: 'processing',
          currentStep: 'Configurando parâmetros...',
          progress: 10
        });

        // Aplicar configuração personalizada se fornecida
        let customParams = request.customParameters || {};
        if (request.configId) {
          const config = await getConfigById(request.configId);
          if (config) {
            customParams = mergeConfigParameters(config, customParams);
          }
        }

        // Atualizar progresso
        updateAnalysisStatus(analysisId, {
          currentStep: 'Executando análise estrutural...',
          progress: 25
        });

        // Executar análise com parâmetros customizados
        const result = await orchestratorRef.current.analyzeDocument(
          request.text,
          request.classification,
          customParams
        );

        // Converter para resultado adaptativo
        const adaptiveResult: AdaptiveAnalysisResult = {
          ...result,
          configId: request.configId,
          customParameters: customParams,
          performanceMetrics: {
            processingTime: result.totalProcessingTime,
            cacheHits: result.cacheStats.hits,
            fallbackUsage: result.fallbackStats.totalFallbacks,
            memoryUsage: Math.random() * 100 + 50 // Simulado
          }
        };

        // Atualizar status para completado
        updateAnalysisStatus(analysisId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Análise concluída',
          completedAt: new Date()
        });

        // Salvar no cache
        queryClient.setQueryData(['adaptive-analysis', analysisId], adaptiveResult);
        queryClient.invalidateQueries({ queryKey: ['recent-adaptive-analyses', organizationId] });

        return adaptiveResult;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        updateAnalysisStatus(analysisId, {
          status: 'failed',
          currentStep: 'Análise falhou',
          error: errorMessage,
          completedAt: new Date()
        });

        throw error;
      } finally {
        // Limpar intervalos de progresso
        const interval = progressIntervals.current.get(analysisId);
        if (interval) {
          clearInterval(interval);
          progressIntervals.current.delete(analysisId);
        }
      }
    },
    onSuccess: (result, request) => {
      toast({
        title: 'Análise concluída',
        description: `Análise do documento ${request.documentId} foi concluída com sucesso.`,
        variant: 'default'
      });
    },
    onError: (error: Error, request) => {
      toast({
        title: 'Erro na análise',
        description: `Falha ao analisar documento ${request.documentId}: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation para cancelar análise
  const cancelAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      // Simular cancelamento (em produção, chamaria API para cancelar)
      await new Promise(resolve => setTimeout(resolve, 500));
      return analysisId;
    },
    onSuccess: (analysisId) => {
      updateAnalysisStatus(analysisId, {
        status: 'cancelled',
        currentStep: 'Análise cancelada',
        completedAt: new Date()
      });

      // Limpar intervalos
      const interval = progressIntervals.current.get(analysisId);
      if (interval) {
        clearInterval(interval);
        progressIntervals.current.delete(analysisId);
      }

      toast({
        title: 'Análise cancelada',
        description: 'Análise foi cancelada com sucesso.',
        variant: 'default'
      });
    }
  });

  // Funções auxiliares
  const executeAnalysis = useCallback(async (request: AdaptiveAnalysisRequest): Promise<AdaptiveAnalysisResult> => {
    return executeAnalysisMutation.mutateAsync(request);
  }, [executeAnalysisMutation]);

  const cancelAnalysis = useCallback(async (analysisId: string): Promise<string> => {
    return cancelAnalysisMutation.mutateAsync(analysisId);
  }, [cancelAnalysisMutation]);

  const updateAnalysisStatus = useCallback((analysisId: string, updates: Partial<AnalysisStatus>) => {
    setActiveAnalyses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(analysisId);
      if (current) {
        newMap.set(analysisId, { ...current, ...updates });
      }
      return newMap;
    });
  }, []);

  const addProgressUpdate = useCallback((analysisId: string, progress: AnalysisProgress) => {
    setAnalysisProgress(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(analysisId) || [];
      newMap.set(analysisId, [...current, progress]);
      return newMap;
    });
  }, []);

  const startProgressTracking = useCallback((analysisId: string) => {
    const interval = setInterval(() => {
      setActiveAnalyses(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(analysisId);
        if (current && current.status === 'processing') {
          // Simular progresso incremental
          const newProgress = Math.min(current.progress + Math.random() * 5, 95);
          const steps = [
            'Analisando estrutura...',
            'Verificando conformidade legal...',
            'Avaliando clareza...',
            'Validando normas ABNT...',
            'Consolidando resultados...'
          ];
          
          const stepIndex = Math.floor((newProgress / 100) * steps.length);
          const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
          
          newMap.set(analysisId, {
            ...current,
            progress: newProgress,
            currentStep,
            estimatedTimeRemaining: Math.max(0, Math.round((100 - newProgress) / 5))
          });
        }
        return newMap;
      });
    }, 1000);

    progressIntervals.current.set(analysisId, interval);
  }, []);

  const getAnalysisProgress = useCallback((analysisId: string): AnalysisProgress[] => {
    return analysisProgress.get(analysisId) || [];
  }, [analysisProgress]);

  const getActiveAnalysisStatus = useCallback((analysisId: string): AnalysisStatus | undefined => {
    return activeAnalyses.get(analysisId);
  }, [activeAnalyses]);

  const getAllActiveAnalyses = useCallback((): AnalysisStatus[] => {
    return Array.from(activeAnalyses.values());
  }, [activeAnalyses]);

  const clearCompletedAnalyses = useCallback(() => {
    setActiveAnalyses(prev => {
      const newMap = new Map(prev);
      for (const [id, status] of newMap.entries()) {
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          newMap.delete(id);
        }
      }
      return newMap;
    });
  }, []);

  // Função para buscar configuração por ID
  const getConfigById = useCallback(async (configId: string): Promise<OrganizationConfig | null> => {
    try {
      // Em produção, chamaria o serviço de configuração
      // Por enquanto, retorna null
      return null;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  }, []);

  // Função para mesclar parâmetros de configuração
  const mergeConfigParameters = useCallback((
    config: OrganizationConfig, 
    customParams: Record<string, any>
  ): Record<string, any> => {
    const merged: Record<string, any> = {};
    
    // Aplicar parâmetros da configuração
    config.parameters.forEach(param => {
      if (param.enabled) {
        merged[param.name] = param.value;
      }
    });
    
    // Sobrescrever com parâmetros customizados
    Object.assign(merged, customParams);
    
    return merged;
  }, []);

  // Função para buscar análises recentes
  const getRecentAnalyses = useCallback(async (orgId: string): Promise<AdaptiveAnalysisResult[]> => {
    // Em produção, chamaria API para buscar análises recentes
    // Por enquanto, retorna array vazio
    return [];
  }, []);

  // Função para gerar ID único
  const generateAnalysisId = useCallback((): string => {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Função para comparar com baseline
  const compareWithBaseline = useCallback((
    customResult: AdaptiveAnalysisResult,
    baselineResult: ComprehensiveAnalysisResult
  ): AnalysisComparison => {
    const differences = {
      overallScore: customResult.overallScore - baselineResult.overallScore,
      categoryScores: {
        structural: customResult.categoryResults.structural.score - baselineResult.categoryResults.structural.score,
        legal: customResult.categoryResults.legal.score - baselineResult.categoryResults.legal.score,
        clarity: customResult.categoryResults.clarity.score - baselineResult.categoryResults.clarity.score,
        abnt: customResult.categoryResults.abnt.score - baselineResult.categoryResults.abnt.score
      },
      newProblems: customResult.problems.filter(p => 
        !baselineResult.problems.some(bp => bp.descricao === p.descricao)
      ),
      resolvedProblems: baselineResult.problems.filter(bp => 
        !customResult.problems.some(p => p.descricao === bp.descricao)
      ),
      changedProblems: customResult.problems.filter(p => 
        baselineResult.problems.some(bp => 
          bp.descricao === p.descricao && bp.gravidade !== p.gravidade
        )
      )
    };

    return {
      baseline: baselineResult,
      custom: customResult,
      differences
    };
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Limpar todos os intervalos
      progressIntervals.current.forEach(interval => clearInterval(interval));
      progressIntervals.current.clear();
    };
  }, []);

  return {
    // Data
    recentAnalyses,
    activeAnalyses: getAllActiveAnalyses(),
    
    // Loading states
    isLoadingRecentAnalyses,
    isExecuting: executeAnalysisMutation.isPending,
    isCancelling: cancelAnalysisMutation.isPending,
    
    // Errors
    recentAnalysesError,
    executionError: executeAnalysisMutation.error,
    
    // Functions
    executeAnalysis,
    cancelAnalysis,
    getAnalysisById,
    getAnalysisProgress,
    getActiveAnalysisStatus,
    compareWithBaseline,
    clearCompletedAnalyses,
    startProgressTracking,
    
    // Utilities
    refetchRecentAnalyses,
    hasActiveAnalyses: activeAnalyses.size > 0,
    totalActiveAnalyses: activeAnalyses.size,
    totalRecentAnalyses: recentAnalyses?.length || 0
  };
};
