import { DocumentUpload, DocumentAnalysis, DocumentClassification, Problem } from '@/types/document';
import supabase from '@/lib/supabase';
import mammoth from 'mammoth';
import { getRulesForClassification } from '@/data/analysisRules';
import { apiClient } from '@/services/core/api';
import { globalCache } from '@/services/core/cache';
import { loggingService } from '@/services/core/logging';
import { ParametersService } from '@/services/parametersService';

// Interfaces para integração com Cloud Run
interface CloudRunAnalysisRequest {
  document_content: string;
  document_type: string;
  classification: DocumentClassification;
  parameters?: AnalysisParameters;
  options?: AnalysisOptions;
}

interface CloudRunAnalysisResponse {
  analysis_id: string;
  status: 'processing' | 'completed' | 'failed';
  results?: {
    conformity_score: number;
    problems: Problem[];
    recommendations: string[];
    metrics: AnalysisMetrics;
    categories: CategoryResults;
  };
  error?: string;
  processing_time?: number;
}

interface AnalysisParameters {
  weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  features: {
    deep_analysis: boolean;
    ai_suggestions: boolean;
    compliance_check: boolean;
    risk_assessment: boolean;
  };
}

interface AnalysisOptions {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  include_suggestions: boolean;
  detailed_metrics: boolean;
  cache_results: boolean;
  webhook_url?: string;
}

interface CategoryResults {
  structural: CategoryAnalysis;
  legal: CategoryAnalysis;
  clarity: CategoryAnalysis;
  abnt: CategoryAnalysis;
}

interface CategoryAnalysis {
  score: number;
  problems: Problem[];
  recommendations: string[];
  compliance_level: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AnalysisMetrics {
  totalClauses: number;
  validClauses: number;
  missingClauses: number;
  inconsistencies: number;
  processingTime: number;
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

interface AnalysisProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'validating' | 'completing';
  progress: number;
  message: string;
  estimated_time?: number;
}

interface TextExtractionResult {
  text: string;
  pages?: number;
  metadata?: {
    file_size: number;
    extraction_method: string;
    confidence: number;
  };
}

export class DocumentAnalysisService {
  private static readonly CLOUD_RUN_BASE_URL = import.meta.env.VITE_DOCUMENT_ANALYZER_URL || 'http://localhost:8080';
  private static readonly CACHE_TTL = 3600; // 1 hora
  private static readonly MAX_RETRIES = 3;
  private static parametersService = new ParametersService();

  // Método principal para análise com Cloud Run
  static async analyzeDocumentWithCloudRun(
    document: DocumentUpload, 
    extractedText: string,
    options: Partial<AnalysisOptions> = {}
  ): Promise<DocumentAnalysis> {
    const startTime = Date.now();
    const cacheKey = `analysis_${document.id}_${this.hashContent(extractedText)}`;

    try {
      // Verificar cache primeiro
      if (options.cache_results !== false) {
        const cachedResult = await globalCache.get<DocumentAnalysis>(cacheKey);
        if (cachedResult) {
          loggingService.info('Análise recuperada do cache', { documentId: document.id });
          return cachedResult;
        }
      }

      // Obter parâmetros de análise
      const parameters = await this.getAnalysisParameters(document.classification);
      
      // Preparar requisição para Cloud Run
      const request: CloudRunAnalysisRequest = {
        document_content: extractedText,
        document_type: document.classification.tipoDocumento,
        classification: document.classification,
        parameters,
        options: {
          priority: 'high',
          include_suggestions: true,
          detailed_metrics: true,
          cache_results: true,
          ...options
        }
      };

      // Enviar para Cloud Run
      const response = await this.sendToCloudRun(request);
      
      // Processar resposta
      const analysis = await this.processCloudRunResponse(response, document, extractedText);
      
      // Salvar no cache e banco
      if (options.cache_results !== false) {
        await globalCache.set(cacheKey, analysis, this.CACHE_TTL);
      }
      await this.saveAnalysis(analysis);

      const processingTime = (Date.now() - startTime) / 1000;
      loggingService.info('Análise concluída com sucesso', {
        documentId: document.id,
        processingTime,
        score: analysis.scoreConformidade
      });

      return analysis;
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      loggingService.error('Erro na análise do documento', error, {
        documentId: document.id,
        processingTime
      });
      
      // Fallback para análise local
      return this.analyzeDocumentLocally(document, extractedText);
    }
  }

  // Método para análise em tempo real (streaming)
  static async analyzeDocumentRealTime(
    document: DocumentUpload,
    extractedText: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<DocumentAnalysis> {
    const analysisId = `realtime_${Date.now()}`;
    
    try {
      // Simular progresso em tempo real
      const stages: AnalysisProgress[] = [
        { stage: 'uploading', progress: 10, message: 'Enviando documento para análise...' },
        { stage: 'extracting', progress: 30, message: 'Extraindo e processando conteúdo...' },
        { stage: 'analyzing', progress: 60, message: 'Analisando conformidade e regras...' },
        { stage: 'validating', progress: 85, message: 'Validando resultados...' },
        { stage: 'completing', progress: 100, message: 'Análise concluída!' }
      ];

      for (const stage of stages) {
        onProgress?.(stage);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular processamento
      }

      return this.analyzeDocumentWithCloudRun(document, extractedText, { priority: 'urgent' });
    } catch (error) {
      loggingService.error('Erro na análise em tempo real', error, { analysisId });
      throw error;
    }
  }

  // Método para obter status de análise
  static async getAnalysisStatus(analysisId: string): Promise<CloudRunAnalysisResponse | null> {
    try {
      const response = await apiClient.get(`${this.CLOUD_RUN_BASE_URL}/analysis/${analysisId}/status`);
      return response.data as CloudRunAnalysisResponse;
    } catch (error) {
      loggingService.error('Erro ao obter status da análise', error, { analysisId });
      return null;
    }
  }

  // Método para cancelar análise
  static async cancelAnalysis(analysisId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.CLOUD_RUN_BASE_URL}/analysis/${analysisId}`);
      loggingService.info('Análise cancelada', { analysisId });
      return true;
    } catch (error) {
      loggingService.error('Erro ao cancelar análise', error, { analysisId });
      return false;
    }
  }

  // Métodos auxiliares privados
  private static hashContent(content: string): string {
    // Simples hash para cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private static async getAnalysisParameters(classification: DocumentClassification): Promise<AnalysisParameters> {
    try {
      const params = await this.parametersService.getDefaultParameters();
      return {
        weights: params.weights,
        thresholds: {
          critical: params.thresholds.categories.structural,
          high: params.thresholds.categories.legal,
          medium: params.thresholds.categories.clarity,
          low: params.thresholds.categories.abnt
        },
        features: {
          deep_analysis: params.features.complexityAnalysis,
          ai_suggestions: params.features.autoSuggestions,
          compliance_check: params.features.inconsistencyDetection,
          risk_assessment: params.features.sentimentAnalysis
        }
      };
    } catch (error) {
      loggingService.error('Erro ao obter parâmetros de análise', error);
      // Retornar parâmetros padrão
      return {
        weights: { structural: 0.25, legal: 0.35, clarity: 0.25, abnt: 0.15 },
        thresholds: { critical: 90, high: 70, medium: 50, low: 30 },
        features: { deep_analysis: true, ai_suggestions: true, compliance_check: true, risk_assessment: true }
      };
    }
  }

  private static async sendToCloudRun(request: CloudRunAnalysisRequest): Promise<CloudRunAnalysisResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await apiClient.post(`${this.CLOUD_RUN_BASE_URL}/analyze`, request, {
           timeout: 30000, // 30 segundos
           headers: {
             'Content-Type': 'application/json',
             'X-Analysis-Priority': request.options?.priority || 'normal'
           }
         });
         
         return response.data as CloudRunAnalysisResponse;
      } catch (error) {
        lastError = error as Error;
        loggingService.warn(`Tentativa ${attempt} falhou`, { error: lastError.message, attempt });
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff exponencial
        }
      }
    }
    
    throw lastError || new Error('Falha na comunicação com Cloud Run após múltiplas tentativas');
  }

  private static async processCloudRunResponse(
    response: CloudRunAnalysisResponse,
    document: DocumentUpload,
    extractedText: string
  ): Promise<DocumentAnalysis> {
    if (response.status === 'failed') {
      throw new Error(response.error || 'Análise falhou no Cloud Run');
    }

    if (response.status === 'processing') {
      // Aguardar conclusão
      return this.waitForAnalysisCompletion(response.analysis_id, document, extractedText);
    }

    if (!response.results) {
      throw new Error('Resposta inválida do Cloud Run');
    }

    const analysis: DocumentAnalysis = {
      id: response.analysis_id,
      documentoId: document.id,
      classification: document.classification,
      textoExtraido: extractedText,
      scoreConformidade: response.results.conformity_score,
      problemasEncontrados: response.results.problems,
      recomendacoes: response.results.recommendations,
      metricas: response.results.metrics,
      specificAnalysis: {
        customMetrics: {
          categories_data: JSON.stringify(response.results.categories),
          processing_time: response.processing_time || 0,
          cloud_run_analysis: true
        }
      },
      createdAt: new Date()
    };

    return analysis;
  }

  private static async waitForAnalysisCompletion(
    analysisId: string,
    document: DocumentUpload,
    extractedText: string
  ): Promise<DocumentAnalysis> {
    const maxWaitTime = 60000; // 1 minuto
    const pollInterval = 2000; // 2 segundos
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getAnalysisStatus(analysisId);
      
      if (status?.status === 'completed') {
        return this.processCloudRunResponse(status, document, extractedText);
      }
      
      if (status?.status === 'failed') {
        throw new Error(status.error || 'Análise falhou');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout na análise do documento');
  }

  private static async analyzeDocumentLocally(
    document: DocumentUpload,
    extractedText: string
  ): Promise<DocumentAnalysis> {
    loggingService.info('Executando análise local como fallback', { documentId: document.id });
    return this.analyzeDocument(document, extractedText);
  }

  // Métodos adicionais para funcionalidades avançadas
  
  // Análise em lote de múltiplos documentos
  static async analyzeBatch(
    documents: Array<{ document: DocumentUpload; extractedText: string }>,
    options: Partial<AnalysisOptions> = {}
  ): Promise<DocumentAnalysis[]> {
    const results: DocumentAnalysis[] = [];
    const batchSize = 5; // Processar 5 documentos por vez
    
    loggingService.info('Iniciando análise em lote', { 
      totalDocuments: documents.length,
      batchSize 
    });

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ document, extractedText }) => {
        try {
          return await this.analyzeDocumentWithCloudRun(document, extractedText, {
            ...options,
            priority: 'normal' // Prioridade normal para lotes
          });
        } catch (error) {
          loggingService.error('Erro na análise de documento do lote', error, {
            documentId: document.id
          });
          // Retornar análise local como fallback
          return this.analyzeDocumentLocally(document, extractedText);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequena pausa entre lotes para não sobrecarregar o sistema
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    loggingService.info('Análise em lote concluída', {
      totalProcessed: results.length,
      successRate: (results.length / documents.length) * 100
    });

    return results;
  }

  // Obter estatísticas de análises
  static async getAnalysisStatistics(timeRange?: { start: Date; end: Date }): Promise<{
    totalAnalyses: number;
    averageScore: number;
    scoreDistribution: Record<string, number>;
    commonProblems: Array<{ type: string; count: number }>;
    processingTimes: { average: number; min: number; max: number };
  }> {
    try {
       const cacheKey = `analysis_stats_${timeRange ? `${timeRange.start.getTime()}_${timeRange.end.getTime()}` : 'all'}`;
       const cached = await globalCache.get<{
         totalAnalyses: number;
         averageScore: number;
         scoreDistribution: Record<string, number>;
         commonProblems: Array<{ type: string; count: number }>;
         processingTimes: { average: number; min: number; max: number };
       }>(cacheKey);
       
       if (cached) {
         return cached;
       }

      // Buscar dados do Supabase
      let query = supabase
        .from('document_analyses')
        .select('conformity_score, problems, metrics, created_at');

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      const analyses = data || [];
      const totalAnalyses = analyses.length;
      
      if (totalAnalyses === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          scoreDistribution: {},
          commonProblems: [],
          processingTimes: { average: 0, min: 0, max: 0 }
        };
      }

      // Calcular estatísticas
      const scores = analyses.map(a => a.conformity_score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Distribuição de scores
      const scoreDistribution = {
        'Excelente (90-100)': scores.filter(s => s >= 90).length,
        'Bom (70-89)': scores.filter(s => s >= 70 && s < 90).length,
        'Regular (50-69)': scores.filter(s => s >= 50 && s < 70).length,
        'Ruim (0-49)': scores.filter(s => s < 50).length
      };

      // Problemas mais comuns
      const problemCounts: Record<string, number> = {};
      analyses.forEach(analysis => {
        if (analysis.problems) {
          analysis.problems.forEach((problem: any) => {
            problemCounts[problem.tipo] = (problemCounts[problem.tipo] || 0) + 1;
          });
        }
      });

      const commonProblems = Object.entries(problemCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Tempos de processamento
      const processingTimes = analyses
        .map(a => a.metrics?.processingTime)
        .filter(time => time !== undefined && time !== null);
      
      const avgProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      const stats = {
        totalAnalyses,
        averageScore: Math.round(averageScore * 100) / 100,
        scoreDistribution,
        commonProblems,
        processingTimes: {
          average: Math.round(avgProcessingTime * 100) / 100,
          min: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
          max: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
        }
      };

      // Cache por 1 hora
      await globalCache.set(cacheKey, stats, 3600);
      
      return stats;
    } catch (error) {
      loggingService.error('Erro ao obter estatísticas de análise', error);
      throw error;
    }
  }

  // Reprocessar análise com novos parâmetros
  static async reanalyzeDocument(
    documentId: string,
    newParameters?: Partial<AnalysisParameters>
  ): Promise<DocumentAnalysis> {
    try {
      // Buscar documento original
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !documentData) {
        throw new Error('Documento não encontrado');
      }

      // Buscar análise anterior para obter texto extraído
      const previousAnalysis = await this.getAnalysisById(documentId);
      if (!previousAnalysis) {
        throw new Error('Análise anterior não encontrada');
      }

      const document: DocumentUpload = {
        id: documentData.id,
        prefeituraId: documentData.prefeitura_id,
        nome: documentData.nome,
        tipo: documentData.tipo,
        classification: documentData.classification,
        tamanho: documentData.tamanho,
        urlStorage: documentData.url_storage,
        status: documentData.status,
        specificFields: documentData.specific_fields,
        descricao: documentData.descricao,
        createdAt: new Date(documentData.created_at),
        updatedAt: new Date(documentData.updated_at)
      };

      // Aplicar novos parâmetros se fornecidos
      if (newParameters) {
        // Temporariamente substituir parâmetros do serviço
        const originalGetParams = this.getAnalysisParameters;
        this.getAnalysisParameters = async () => ({
          weights: newParameters.weights || { structural: 0.25, legal: 0.35, clarity: 0.25, abnt: 0.15 },
          thresholds: newParameters.thresholds || { critical: 90, high: 70, medium: 50, low: 30 },
          features: newParameters.features || { deep_analysis: true, ai_suggestions: true, compliance_check: true, risk_assessment: true }
        });

        try {
          const newAnalysis = await this.analyzeDocumentWithCloudRun(
            document,
            previousAnalysis.textoExtraido,
            { cache_results: false } // Não usar cache para reprocessamento
          );
          
          // Restaurar método original
          this.getAnalysisParameters = originalGetParams;
          
          return newAnalysis;
        } catch (error) {
          // Restaurar método original em caso de erro
          this.getAnalysisParameters = originalGetParams;
          throw error;
        }
      }

      // Reprocessar com parâmetros padrão
      return this.analyzeDocumentWithCloudRun(
        document,
        previousAnalysis.textoExtraido,
        { cache_results: false }
      );
    } catch (error) {
      loggingService.error('Erro ao reprocessar documento', error, { documentId });
      throw error;
    }
  }

  // Limpar cache de análises
  static async clearAnalysisCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Limpar cache específico
        await globalCache.delete(`analysis_${pattern}`);
      } else {
        // Limpar todo cache de análises (implementação dependente do cache)
        loggingService.info('Limpando cache completo de análises');
        // Nota: implementação específica dependeria do tipo de cache usado
      }
    } catch (error) {
      loggingService.error('Erro ao limpar cache de análises', error);
      throw error;
    }
  }

  static async extractTextFromFile(file: File): Promise<TextExtractionResult> {
    const fileType = file.type || '';
    const fileName = file.name ? String(file.name).toLowerCase() : '';
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractTextFromPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await this.extractTextFromWord(file);
    } else {
      throw new Error('Formato não suportado. Envie PDF ou DOCX (.docx).');
    }
  }

  private static async extractTextFromPDF(file: File): Promise<TextExtractionResult> {
    try {
      // For now, simulate PDF text extraction
      // In production, you would use a proper PDF parser
      const text = `Texto extraído do PDF: ${file.name}
      
      Este é um documento de exemplo para demonstrar a extração de texto.
      O documento contém informações sobre licitação e processos de compra.
      
      Cláusulas importantes:
      - Prazo para entrega: 30 dias
      - Modalidade: Pregão Eletrônico
      - Critério de julgamento: Menor preço
      - Valor estimado: R$ 100.000,00
      
      Condições de participação:
      - Empresas regularmente constituídas
      - Certificado de regularidade fiscal
      - Atestado de capacidade técnica`;
      
      return { text, pages: 5 };
    } catch (error) {
      console.error('Erro na extração de texto do PDF:', error);
      throw new Error('Falha ao extrair texto do PDF');
    }
  }

  private static async extractTextFromWord(file: File): Promise<TextExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { text: result.value };
    } catch (error: unknown) {
      console.error('Erro na extração de texto do Word:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('central directory') || message.includes('zip file')) {
        throw new Error('Arquivo .docx inválido ou corrompido. Certifique-se de enviar um .docx válido (não .doc).');
      }
      throw new Error('Falha ao extrair texto do documento Word');
    }
  }

  static async analyzeDocument(document: DocumentUpload, extractedText: string): Promise<DocumentAnalysis> {
    const classification = document.classification;
    
    // Analyze based on document classification
    const problems = await this.analyzeConformity(extractedText, classification);
    const score = this.calculateConformityScore(problems);
    const recommendations = this.generateRecommendations(problems, classification);

    const analysis: DocumentAnalysis = {
      id: `analysis_${Date.now()}`,
      documentoId: document.id,
      classification: document.classification,
      textoExtraido: extractedText,
      scoreConformidade: score,
      problemasEncontrados: problems,
      recomendacoes: recommendations,
      metricas: {
        totalClauses: this.countClauses(extractedText),
        validClauses: this.countValidClauses(extractedText, problems),
        missingClauses: problems.filter(p => p.tipo === 'clausula_faltante').length,
        inconsistencies: problems.filter(p => p.tipo === 'inconsistencia').length,
        processingTime: 2.5
      },
      specificAnalysis: {},
      createdAt: new Date()
    };

    // Save analysis to Supabase
    await this.saveAnalysis(analysis);
    
    return analysis;
  }

private static async analyzeConformity(text: string, classification: DocumentClassification): Promise<Problem[]> {
  const textLower = text.toLowerCase();

  // 1) Executa regras centralizadas
  let problems: Problem[] = await this.evaluateRules(textLower, classification);

  // 2) Regras específicas existentes (mantidas como hooks adicionais)
  if (classification.tipoDocumento === 'edital') {
    await this.validateEdital(textLower, problems, classification);
  } else if (classification.tipoDocumento === 'tr') {
    await this.validateTermoReferencia(textLower, problems, classification);
  }

  if (classification.modalidadePrincipal === 'processo_licitatorio') {
    await this.validateProcessoLicitatorio(textLower, problems, classification);
  }

  // 3) Deduplicação básica por (tipo|descrição)
  const seen = new Set<string>();
  problems = problems.filter((p) => {
    const key = `${p.tipo}|${p.descricao}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return problems;
}

  private static async validateEdital(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('objeto') && !text.includes('finalidade')) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: 'Objeto da licitação não está claramente definido',
        gravidade: 'critica',
        localizacao: 'Cláusula de objeto',
        sugestaoCorrecao: 'Definir claramente o objeto da licitação conforme art. 40, I da Lei 8.666/93',
        classification,
        categoria: 'juridico'
      });
    }

    if (!text.includes('critério') && !text.includes('julgamento')) {
      problems.push({
        tipo: 'criterio_irregular',
        descricao: 'Critério de julgamento não especificado',
        gravidade: 'alta',
        localizacao: 'Cláusula de julgamento',
        sugestaoCorrecao: 'Especificar o critério de julgamento (menor preço, melhor técnica, etc.)',
        classification,
        categoria: 'juridico'
      });
    }
  }

  private static async validateTermoReferencia(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('especificação') && !text.includes('detalhamento')) {
      problems.push({
        tipo: 'especificacao_incompleta',
        descricao: 'Especificações técnicas insuficientes ou ausentes',
        gravidade: 'alta',
        localizacao: 'Especificações técnicas',
        sugestaoCorrecao: 'Detalhar especificações técnicas conforme necessidades da Administração',
        classification,
        categoria: 'tecnico'
      });
    }
  }

  private static async validateProcessoLicitatorio(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('sistema') && !text.includes('eletrônico')) {
      problems.push({
        tipo: 'modalidade_incorreta',
        descricao: 'Documento não menciona utilização de sistema eletrônico',
        gravidade: 'media',
        localizacao: 'Disposições gerais',
        sugestaoCorrecao: 'Especificar o sistema eletrônico a ser utilizado para o pregão',
        classification,
        categoria: 'formal'
      });
    }
  }

  private static async evaluateRules(textLower: string, classification: DocumentClassification): Promise<Problem[]> {
    const rules = getRulesForClassification(classification);
    const problems: Problem[] = [];

    for (const rule of rules) {
      let failed = false;

      if (rule.type === 'keyword_presence') {
        const list = rule.keywordsAll ?? [];
        if (list.length > 0) {
          failed = list.some((kw) => !textLower.includes(kw.toLowerCase()));
        }
      } else if (rule.type === 'keyword_any') {
        const list = rule.keywordsAny ?? [];
        if (list.length > 0) {
          failed = !list.some((kw) => textLower.includes(kw.toLowerCase()));
        }
      } else if (rule.type === 'pattern') {
        if (rule.pattern) {
          try {
            const regex = new RegExp(rule.pattern, 'i');
            failed = !regex.test(textLower);
          } catch (e) {
            // Se regex inválida, ignora a regra
            failed = false;
          }
        }
      }

      if (failed) {
        problems.push({
          tipo: rule.problemType ?? 'inconsistencia',
          descricao: rule.description,
          gravidade: rule.severity,
          localizacao: 'Documento geral',
          sugestaoCorrecao: rule.suggestion,
          classification,
          categoria: rule.category,
        });
      }
    }

    return problems;
  }

  private static calculateConformityScore(problems: Problem[]): number {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          score -= 25;
          break;
        case 'alta':
          score -= 15;
          break;
        case 'media':
          score -= 10;
          break;
        case 'baixa':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  private static generateRecommendations(problems: Problem[], classification: DocumentClassification): string[] {
    const recommendations = new Set<string>();
    
    problems.forEach(problem => {
      if (problem.sugestaoCorrecao) {
        recommendations.add(problem.sugestaoCorrecao);
      }
    });

    // Add general recommendations based on classification
    if (classification.tipoDocumento === 'edital') {
      recommendations.add('Revisar conformidade com Lei 8.666/93 e Lei 10.520/02');
      recommendations.add('Verificar adequação às normas do TCU');
    }

    return Array.from(recommendations);
  }

  private static countClauses(text: string): number {
    // Simple clause counting based on patterns
    const clausePatterns = /cláusula|artigo|item|parágrafo/gi;
    const matches = text.match(clausePatterns);
    return matches ? matches.length : 0;
  }

  private static countValidClauses(text: string, problems: Problem[]): number {
    const totalClauses = this.countClauses(text);
    const invalidClauses = problems.filter(p => 
      p.tipo === 'clausula_faltante' || p.tipo === 'especificacao_incompleta'
    ).length;
    return Math.max(0, totalClauses - invalidClauses);
  }

  private static async saveAnalysis(analysis: DocumentAnalysis): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_analyses')
        .insert([{
          id: analysis.id,
          document_id: analysis.documentoId,
          classification: analysis.classification,
          extracted_text: analysis.textoExtraido,
          conformity_score: analysis.scoreConformidade,
          problems: analysis.problemasEncontrados,
          recommendations: analysis.recomendacoes,
          metrics: analysis.metricas,
          specific_analysis: analysis.specificAnalysis,
          created_at: analysis.createdAt.toISOString()
        }]);

      if (error) {
        console.error('Erro ao salvar análise:', error);
        // Don't throw error - analysis can still work without persistence
      }
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      // Don't throw error - analysis can still work without persistence
    }
  }

  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        documentoId: data.document_id,
        classification: data.classification,
        textoExtraido: data.extracted_text,
        scoreConformidade: data.conformity_score,
        problemasEncontrados: data.problems,
        recomendacoes: data.recommendations,
        metricas: data.metrics,
        specificAnalysis: data.specific_analysis,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      return null;
    }
  }
}