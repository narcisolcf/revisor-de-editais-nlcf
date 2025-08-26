import { useState, useCallback } from 'react';
import { ClassificationResult } from '../types/document/classification';
import { DocumentType } from '../types/document/base';

/**
 * Resultado da classificação inteligente
 */
export interface SmartClassificationResult {
  /** Tipo de documento classificado */
  documentType: DocumentType;
  /** Nível de confiança da classificação (0-1) */
  confidence: number;
  /** Tipos alternativos sugeridos */
  alternatives: Array<{
    type: DocumentType;
    confidence: number;
  }>;
  /** Features detectadas no documento */
  featuresDetected: Record<string, any>;
  /** Tempo de processamento em ms */
  processingTime: number;
  /** Metadados adicionais */
  metadata: Record<string, any>;
}

/**
 * Estado do hook de classificação inteligente
 */
export interface SmartClassificationState {
  /** Resultado da classificação */
  result: SmartClassificationResult | null;
  /** Indica se está processando */
  isClassifying: boolean;
  /** Erro durante a classificação */
  error: string | null;
  /** Indica se a classificação foi aplicada automaticamente */
  autoApplied: boolean;
}

/**
 * Configurações da classificação inteligente
 */
export interface SmartClassificationConfig {
  /** Limite de confiança para aplicação automática */
  autoApplyThreshold: number;
  /** URL da API de classificação */
  apiUrl: string;
  /** Timeout da requisição em ms */
  timeout: number;
  /** Habilitar aplicação automática */
  enableAutoApply: boolean;
}

/**
 * Configuração padrão
 */
const DEFAULT_CONFIG: SmartClassificationConfig = {
  autoApplyThreshold: 0.8,
  apiUrl: import.meta.env.VITE_DOCUMENT_ANALYZER_URL || 'http://localhost:8080',
  timeout: 10000,
  enableAutoApply: true,
};

/**
 * Hook para classificação inteligente de documentos
 * 
 * Fornece funcionalidades para:
 * - Classificação automática baseada em ML
 * - Auto-sugestão de tipos de documento
 * - Indicador de confiança
 * - Aplicação automática para alta confiança
 * - Override manual pelo usuário
 */
export function useSmartClassification(config: Partial<SmartClassificationConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<SmartClassificationState>({
    result: null,
    isClassifying: false,
    error: null,
    autoApplied: false,
  });

  /**
   * Classifica um documento usando ML
   */
  const classifyDocument = useCallback(async (
    content: string,
    options: {
      /** Aplicar automaticamente se confiança for alta */
      autoApply?: boolean;
      /** Callback chamado quando classificação é aplicada */
      onApplied?: (result: SmartClassificationResult) => void;
      /** Callback para override manual */
      onSuggestion?: (result: SmartClassificationResult) => void;
    } = {}
  ): Promise<SmartClassificationResult | null> => {
    const { autoApply = finalConfig.enableAutoApply, onApplied, onSuggestion } = options;
    
    setState(prev => ({
      ...prev,
      isClassifying: true,
      error: null,
      autoApplied: false,
    }));

    try {
      // Fazer requisição para API de classificação
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      const response = await fetch(`${finalConfig.apiUrl}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          confidence_threshold: finalConfig.autoApplyThreshold,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro na classificação: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mapear resposta da API para formato do hook
      const result: SmartClassificationResult = {
        documentType: data.document_type as DocumentType,
        confidence: data.confidence,
        alternatives: data.alternative_types?.map((alt: any) => ({
          type: alt[0] as DocumentType,
          confidence: alt[1],
        })) || [],
        featuresDetected: data.features_detected || {},
        processingTime: data.processing_time * 1000, // Converter para ms
        metadata: data.metadata || {},
      };

      // Verificar se deve aplicar automaticamente
      const shouldAutoApply = autoApply && 
                             result.confidence >= finalConfig.autoApplyThreshold;

      setState(prev => ({
        ...prev,
        result,
        isClassifying: false,
        autoApplied: shouldAutoApply,
      }));

      // Chamar callbacks apropriados
      if (shouldAutoApply && onApplied) {
        onApplied(result);
      } else if (!shouldAutoApply && onSuggestion) {
        onSuggestion(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na classificação';
      
      setState(prev => ({
        ...prev,
        isClassifying: false,
        error: errorMessage,
      }));

      console.error('Erro na classificação inteligente:', error);
      return null;
    }
  }, [finalConfig]);

  /**
   * Classifica arquivo baseado no conteúdo extraído
   */
  const classifyFile = useCallback(async (
    file: File,
    extractedContent?: string,
    options?: Parameters<typeof classifyDocument>[1]
  ): Promise<SmartClassificationResult | null> => {
    // Se não tiver conteúdo extraído, tentar extrair do nome do arquivo
    let content = extractedContent;
    
    if (!content) {
      // Usar nome do arquivo e extensão como fallback
      content = `${file.name} ${file.type}`;
    }

    return classifyDocument(content, options);
  }, [classifyDocument]);

  /**
   * Aplica manualmente uma classificação
   */
  const applyClassification = useCallback((result: SmartClassificationResult) => {
    setState(prev => ({
      ...prev,
      result,
      autoApplied: false, // Manual application
    }));
  }, []);

  /**
   * Rejeita uma sugestão de classificação
   */
  const rejectSuggestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      autoApplied: false,
    }));
  }, []);

  /**
   * Limpa o estado da classificação
   */
  const clearClassification = useCallback(() => {
    setState({
      result: null,
      isClassifying: false,
      error: null,
      autoApplied: false,
    });
  }, []);

  /**
   * Verifica se a confiança é alta o suficiente para aplicação automática
   */
  const isHighConfidence = useCallback((confidence: number) => {
    return confidence >= finalConfig.autoApplyThreshold;
  }, [finalConfig.autoApplyThreshold]);

  /**
   * Obtém cor do indicador de confiança
   */
  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    if (confidence >= 0.4) return 'orange';
    return 'red';
  }, []);

  /**
   * Obtém texto descritivo da confiança
   */
  const getConfidenceText = useCallback((confidence: number) => {
    if (confidence >= 0.9) return 'Muito Alta';
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    if (confidence >= 0.4) return 'Baixa';
    return 'Muito Baixa';
  }, []);

  return {
    // Estado
    ...state,
    
    // Ações
    classifyDocument,
    classifyFile,
    applyClassification,
    rejectSuggestion,
    clearClassification,
    
    // Utilitários
    isHighConfidence,
    getConfidenceColor,
    getConfidenceText,
    
    // Configuração
    config: finalConfig,
  };
}

export default useSmartClassification;