/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */

import { Firestore } from 'firebase-admin/firestore';
import { DocumentRepository } from '../db/repositories/DocumentRepository';
import { OrganizationRepository } from '../db/repositories/OrganizationRepository';
import { AnalysisRepository } from '../db/repositories/AnalysisRepository';
import { CloudRunClient, AuthConfig } from './CloudRunClient';

import { NotificationService } from './NotificationService';
import { ParameterEngine } from './ParameterEngine';

// Tipos básicos
export interface Document {
  id: string;
  name: string;
  organizationId: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  type: string;
  status: string;
  content?: string;
}

export interface AnalysisResult {
  id: string;
  documentId: string;
  organizationId: string;
  conformityScore: number;
  confidence: number;
  problems: Problem[];
  recommendations: string[];
  metrics: Record<string, any>;
  categoryResults: Record<string, any>;
  processingTime: number;
  aiUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Problem {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}

export interface OrganizationConfig {
  id: string;
  organizationId: string;
  analysisSettings: {
    enableAI: boolean;
    strictMode: boolean;
    customRules: any[];
  };
  notificationSettings: {
    email: boolean;
    webhook?: string;
  };
}

export interface AnalysisOptions {
  includeAI: boolean;
  generateRecommendations: boolean;
  detailedMetrics: boolean;
  customRules?: any[];
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AnalysisRequest {
  documentId: string;
  organizationId: string;
  userId: string;
  options: AnalysisOptions;
  priority: 'low' | 'normal' | 'high';
  parameters?: any; // Parâmetros opcionais do ParameterEngine
}

export interface AnalysisProgress {
  analysisId: string;
  documentId: string;
  status: AnalysisStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining: number;
  estimatedCompletion?: Date;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  maxRetries?: number;
}

export class AnalysisOrchestrator {
  private db: Firestore;
  private documentRepo: DocumentRepository;
  private organizationRepo: OrganizationRepository;
  private analysisRepo: AnalysisRepository;
  private cloudRunClient: CloudRunClient;
  private notificationService: NotificationService;
  private parameterEngine: ParameterEngine;
  private activeAnalyses: Map<string, AnalysisProgress> = new Map();
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 2000; // 2 segundos inicial
  private readonly maxRetryDelayMs: number = 30000; // 30 segundos máximo
  private readonly exponentialBackoffMultiplier: number = 2;
  private readonly jitterMaxMs: number = 1000; // Jitter para evitar thundering herd

  constructor(
    firestore: Firestore,
    cloudRunServiceUrl: string,
    projectId: string,
    authConfig?: AuthConfig
  ) {
    this.db = firestore;
    this.documentRepo = new DocumentRepository(firestore);
    this.organizationRepo = new OrganizationRepository(firestore);
    this.analysisRepo = new AnalysisRepository(firestore);
    
    // Configurar autenticação para Cloud Run com configurações padrão seguras
    const defaultAuthConfig: AuthConfig = {
      projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      ...authConfig
    };
    
    this.cloudRunClient = new CloudRunClient(
      cloudRunServiceUrl,
      defaultAuthConfig,
      {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      }
    );
    
    this.notificationService = new NotificationService(projectId);
    this.parameterEngine = new ParameterEngine(firestore, {
      enableAdaptiveWeights: true,
      enableLearningMode: true,
      adaptationThreshold: 10,
      maxWeightAdjustment: 15.0,
      cacheTimeout: 30 * 60 * 1000 // 30 minutos
    });
  }

  /**
   * Inicia uma nova análise
   */
  async startAnalysis(request: AnalysisRequest): Promise<string> {
    // Validar parâmetros obrigatórios
    if (!request.documentId) {
      throw new Error('ID do documento é obrigatório');
    }
    if (!request.organizationId) {
      throw new Error('ID da organização é obrigatório');
    }
    if (!request.userId) {
      throw new Error('ID do usuário é obrigatório');
    }
    if (!request.options) {
      throw new Error('Opções de análise são obrigatórias');
    }
    
    // Validar se documento existe
    const document = await this.documentRepo.findById(request.documentId);
    if (!document) {
      throw new Error(`Documento ${request.documentId} não encontrado`);
    }
    
    // Validar se organização existe
    const organization = await this.organizationRepo.findById(request.organizationId);
    if (!organization) {
      throw new Error(`Organização ${request.organizationId} não encontrada`);
    }
    
    // Validar parâmetros específicos se fornecidos
    if (request.parameters) {
      if (typeof request.parameters !== 'object') {
        throw new Error('Parâmetros inválidos - deve ser um objeto');
      }
      // Validação adicional de parâmetros específicos
      if (request.parameters.invalidParam) {
        throw new Error('Parâmetros inválidos - parâmetro não suportado');
      }
    }
    
    const analysisId = this.generateAnalysisId();
    
    const analysisData = {
      id: analysisId,
      documentId: request.documentId,
      organizationId: request.organizationId,
      userId: request.userId,
      analysisType: 'FULL' as const,
      configurationId: 'default',
      createdBy: request.userId,
      request: {
        priority: (request.priority?.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') || 'NORMAL',
        options: {
          includeAI: request.options?.includeAI || false,
          generateRecommendations: request.options?.generateRecommendations || false,
          detailedMetrics: request.options?.detailedMetrics || false,
          customRules: request.options?.customRules || []
        },
        timeout: 300
      },
      processing: {
        status: 'PENDING' as const,
        progress: 0
      },
      engine: {
        name: 'licitareview-v2',
        version: '2.0.0',
        fallbackUsed: false,
        cacheHit: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Criar análise no AnalysisRepository com todos os campos obrigatórios
    await this.analysisRepo.createAnalysis(analysisData);
    
    // Criar progresso inicial
    const progress: AnalysisProgress = {
      analysisId,
      documentId: request.documentId,
      status: 'pending',
      progress: 0,
      currentStep: 'Iniciando análise',
      estimatedTimeRemaining: 300, // 5 minutos estimado
      startedAt: new Date()
    };

    this.activeAnalyses.set(analysisId, progress);
    await this.saveAnalysisProgress(progress);

    // Processar análise de forma assíncrona
    this.processAnalysis(analysisId, request).catch(error => {
      this.handleAnalysisError(analysisId, error);
    });

    return analysisId;
  }

  /**
   * Inicia análise completa com upload e processamento integrado
   */
  async startAnalysisWithUpload(
    file: Buffer,
    filename: string,
    organizationId: string,
    userId: string,
    analysisOptions: AnalysisOptions,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<{
    success: boolean;
    analysisId?: string;
    documentId?: string;
    error?: string;
  }> {
    try {
      // 1. Upload do documento para Cloud Run
      const uploadResult = await this.uploadDocumentToCloudRun(
        file,
        filename,
        organizationId,
        userId
      );

      if (!uploadResult.success || !uploadResult.documentId) {
        return {
          success: false,
          error: uploadResult.error || 'Falha no upload do documento'
        };
      }

      // 2. Iniciar análise do documento
      const analysisRequest: AnalysisRequest = {
        documentId: uploadResult.documentId,
        organizationId,
        userId,
        options: analysisOptions,
        priority
      };

      const analysisId = await this.startAnalysis(analysisRequest);

      return {
        success: true,
        analysisId,
        documentId: uploadResult.documentId
      };
    } catch (error) {
      console.error('Erro na análise com upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na análise com upload'
      };
    }
  }

  /**
   * Processa uma análise com integração robusta end-to-end
   */
  async processAnalysis(analysisId: string, request: AnalysisRequest): Promise<void> {
    const progress = await this.getAnalysisProgress(analysisId);
    const retryCount = progress?.retryCount || 0;
    const maxRetries = progress?.maxRetries || this.maxRetries;

    try {
      console.log(`[AnalysisOrchestrator] Iniciando análise ${analysisId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
      
      // Atualizar progresso inicial
      await this.updateProgress(analysisId, {
        status: 'processing',
        progress: 5,
        currentStep: 'Validando conectividade Cloud Run',
        retryCount,
        maxRetries
      });

      // 1. Verificar conectividade com Cloud Run
      await this.validateCloudRunConnectivity();

      await this.updateProgress(analysisId, {
        progress: 15,
        currentStep: 'Carregando documento'
      });

      // 2. Buscar documento com retry robusto
      const document = await this.retryOperationWithExponentialBackoff(
        () => this.loadDocument(request.documentId),
        'Carregando documento',
        analysisId,
        3
      );

      await this.updateProgress(analysisId, {
        progress: 25,
        currentStep: 'Carregando configurações da organização'
      });

      // 3. Configuração da organização com retry
      const orgConfig = await this.retryOperationWithExponentialBackoff(
        () => this.loadOrganizationConfig(request.organizationId),
        'Carregando configurações',
        analysisId,
        3
      );

      await this.updateProgress(analysisId, {
        progress: 35,
        currentStep: 'Gerando parâmetros otimizados'
      });

      // 4. Gerar parâmetros otimizados usando ParameterEngine
      const analysisParameters = await this.retryOperationWithExponentialBackoff(
        () => this.parameterEngine.generateParameters(request.organizationId),
        'Gerando parâmetros de análise',
        analysisId,
        2
      );
      
      await this.updateProgress(analysisId, {
        progress: 45,
        currentStep: 'Preparando requisição para Cloud Run'
      });

      // 5. Configurar callback URL para comunicação bidirecional
      const callbackUrl = this.buildCallbackUrl(analysisId);
      const callbackSecret = this.generateCallbackSecret(analysisId);
      
      // 6. Preparar request para Cloud Run com validação completa
      const cloudRunRequest = this.buildCloudRunRequest(
        document,
        request,
        orgConfig,
        analysisParameters,
        callbackUrl,
        callbackSecret
      );

      await this.updateProgress(analysisId, {
        progress: 55,
        currentStep: 'Enviando para análise no Cloud Run'
      });

      // 7. Executar análise com retry e circuit breaker
      const cloudRunResult = await this.executeCloudRunAnalysisWithRetry(
        cloudRunRequest,
        analysisId,
        maxRetries
      );

      await this.updateProgress(analysisId, {
        progress: 85,
        currentStep: 'Processando e validando resultados'
      });

      // 8. Converter e validar resultado
      const analysisResult = this.convertAndValidateCloudRunResult(cloudRunResult, request);
      
      await this.updateProgress(analysisId, {
        progress: 95,
        currentStep: 'Persistindo resultados'
      });

      // 9. Salvar resultado com retry e validação
      await this.retryOperationWithExponentialBackoff(
        () => this.saveAnalysisResultWithValidation(request.documentId, analysisResult),
        'Salvando resultados',
        analysisId,
        3
      );

      // 10. Finalizar análise com sucesso
      await this.finalizeSuccessfulAnalysis(analysisId, request, document, analysisResult);

      console.log(`[AnalysisOrchestrator] Análise ${analysisId} concluída com sucesso`);

    } catch (error) {
      console.error(`[AnalysisOrchestrator] Erro na análise ${analysisId}:`, error);
      await this.handleAnalysisErrorWithRetry(analysisId, request, error as Error, retryCount, maxRetries);
    }
  }

  /**
   * Obtém o progresso de uma análise
   */
  async getAnalysisProgress(analysisId: string): Promise<AnalysisProgress | null> {
    // Verificar cache primeiro
    const cached = this.activeAnalyses.get(analysisId);
    if (cached) {
      return cached;
    }

    // Carregar do banco
    return await this.loadAnalysisProgress(analysisId);
  }

  /**
   * Cancela uma análise
   */
  // eslint-disable-next-line no-unused-vars
  async cancelAnalysis(analysisId: string, _userId: string): Promise<boolean> {
    const progress = await this.getAnalysisProgress(analysisId);
    if (!progress) {
      return false;
    }

    if (progress.status === 'completed' || progress.status === 'failed') {
      return false;
    }

    await this.updateProgress(analysisId, {
      status: 'cancelled',
      currentStep: 'Análise cancelada',
      completedAt: new Date()
    });

    this.activeAnalyses.delete(analysisId);
    return true;
  }

  /**
   * Lista análises ativas
   */
  getActiveAnalyses(): AnalysisProgress[] {
    return Array.from(this.activeAnalyses.values());
  }

  /**
   * Verifica a saúde da conexão com Cloud Run
   */
  async checkCloudRunHealth(): Promise<{
    isHealthy: boolean;
    status: string;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const health = await this.cloudRunClient.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: health.status === 'healthy',
        status: health.status,
        responseTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém parâmetros de análise otimizados para uma organização
   */
  async getAnalysisParameters(organizationId: string, forceRefresh = false) {
    return await this.parameterEngine.generateParameters(organizationId, forceRefresh);
  }

  /**
   * Obtém parâmetros de análise combinando ParameterEngine local e presets do Cloud Run
   */
  async getEnhancedAnalysisParameters(
    organizationId: string,
    forceRefresh = false
  ): Promise<{
    success: boolean;
    parameters?: any;
    presets?: any[];
    validation?: any;
    error?: string;
  }> {
    try {
      // 1. Obter parâmetros otimizados localmente
      const localParameters = await this.parameterEngine.generateParameters(
        organizationId,
        forceRefresh
      );

      // 2. Obter presets disponíveis do Cloud Run
      const presetsResult = await this.getAvailableAnalysisPresets(organizationId);
      
      // 3. Validar configuração no Cloud Run
      const validationResult = await this.validateOrganizationConfig(
        organizationId,
        localParameters
      );

      return {
        success: true,
        parameters: localParameters,
        presets: presetsResult.presets,
        validation: validationResult.validation
      };
    } catch (error) {
      console.error('Erro ao obter parâmetros aprimorados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter parâmetros'
      };
    }
  }

  /**
   * Limpa o cache de parâmetros para uma organização
   */
  async clearParameterCache(organizationId?: string) {
    return await this.parameterEngine.clearCache(organizationId);
  }

  /**
   * Obtém estatísticas do ParameterEngine
   */
  getParameterEngineStats() {
    return this.parameterEngine.getEngineStats();
  }

  /**
   * Obtém métricas do serviço Cloud Run
   */
  async getCloudRunMetrics(): Promise<{
    success: boolean;
    metrics?: any;
    error?: string;
  }> {
    try {
      const metrics = await this.cloudRunClient.getMetrics();
      return {
        success: true,
        metrics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter métricas'
      };
    }
  }

  /**
   * Faz upload de documento para o serviço Cloud Run
   */
  async uploadDocumentToCloudRun(
    file: Buffer,
    filename: string,
    organizationId: string,
    userId: string,
    options?: {
      extractText?: boolean;
      detectType?: boolean;
      validateFormat?: boolean;
    }
  ): Promise<{
    success: boolean;
    documentId?: string;
    uploadResponse?: any;
    error?: string;
  }> {
    try {
      const uploadRequest = {
        file,
        filename,
        contentType: 'application/pdf', // Default content type
        organizationId,
        userId,
        options: {
          extractText: options?.extractText ?? true,
          detectType: options?.detectType ?? true,
          validateFormat: options?.validateFormat ?? true
        }
      };

      const uploadResponse = await this.cloudRunClient.uploadDocument(uploadRequest);
      
      return {
        success: true,
        documentId: uploadResponse.document_id,
        uploadResponse
      };
    } catch (error) {
      console.error('Erro no upload para Cloud Run:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no upload'
      };
    }
  }

  /**
   * Obtém presets de análise disponíveis do Cloud Run
   */
  async getAvailableAnalysisPresets(organizationId?: string): Promise<{
    success: boolean;
    presets?: any[];
    error?: string;
  }> {
    try {
      const presetsResponse = await this.cloudRunClient.getAnalysisPresets();
      
      return {
        success: true,
        presets: Object.values(presetsResponse.available_presets)
      };
    } catch (error) {
      console.error('Erro ao obter presets de análise:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter presets'
      };
    }
  }

  /**
   * Valida configuração organizacional no Cloud Run
   */
  async validateOrganizationConfig(
    organizationId: string,
    config: any
  ): Promise<{
    success: boolean;
    validation?: any;
    warnings?: string[];
    suggestions?: string[];
    error?: string;
  }> {
    try {
      const validationRequest = {
        organization_id: organizationId,
        weights: config.weights || { structural: 25, legal: 25, clarity: 25, abnt: 25 },
        custom_rules: config.customRules || [],
        templates: config.templates || []
      };
      
      const validationResponse = await this.cloudRunClient.validateConfig(validationRequest);
      
      return {
        success: true,
        validation: {
          isValid: validationResponse.is_valid,
          errors: validationResponse.errors,
          warnings: validationResponse.warnings,
          suggestions: validationResponse.suggestions
        },
        warnings: validationResponse.warnings,
        suggestions: validationResponse.suggestions
      };
    } catch (error) {
      console.error('Erro na validação de configuração:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na validação'
      };
    }
  }

  /**
   * Verifica se o serviço Cloud Run está disponível
   */
  async isCloudRunAvailable(): Promise<boolean> {
    try {
      return await this.cloudRunClient.isAvailable();
    } catch (error) {
      console.warn('Erro ao verificar disponibilidade do Cloud Run:', error);
      return false;
    }
  }

  /**
   * Obtém configuração atual do CloudRunClient
   */
  getCloudRunConfig(): {
    serviceUrl: string;
    authConfig: any;
    circuitBreakerConfig: any;
    retryConfig: any;
  } {
    return this.cloudRunClient.getConfig();
  }

  /**
   * Valida a autenticação com Cloud Run
   */
  async validateCloudRunAuth(): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      await this.cloudRunClient.validateAuth();
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Erro de autenticação'
      };
    }
  }

  // Métodos privados

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida conectividade com Cloud Run
   */
  private async validateCloudRunConnectivity(): Promise<void> {
    try {
      console.log('[AnalysisOrchestrator] Validando conectividade com Cloud Run...');
      const healthCheck = await this.cloudRunClient.healthCheck();
      
      if (healthCheck.status !== 'healthy') {
         throw new Error(`Cloud Run não está saudável: Status ${healthCheck.status}`);
       }
      
      console.log('[AnalysisOrchestrator] Conectividade com Cloud Run validada com sucesso');
    } catch (error) {
      console.error('[AnalysisOrchestrator] Falha na validação de conectividade:', error);
      throw new Error(`Falha na conectividade com Cloud Run: ${(error as Error).message}`);
    }
  }

  /**
   * Constrói requisição para Cloud Run com validação completa
   */
  private buildCloudRunRequest(
    document: any,
    request: AnalysisRequest,
    orgConfig: any,
    analysisParameters: any,
    callbackUrl: string,
    callbackSecret: string
  ): any {
    // Validar dados obrigatórios
    if (!document?.content) {
      throw new Error('Conteúdo do documento é obrigatório');
    }
    
    if (!analysisParameters) {
      throw new Error('Parâmetros de análise são obrigatórios');
    }

    return {
      document_content: document.content,
      document_type: document.type || 'EDITAL',
      classification: { type: document.type },
      organization_config: orgConfig || {},
      analysis_options: {
        include_ai: request.options.includeAI,
        generate_recommendations: request.options.generateRecommendations,
        detailed_metrics: request.options.detailedMetrics,
        custom_rules: analysisParameters.customRules,
        weights: analysisParameters.weights,
        preset: analysisParameters.preset,
        adaptive_adjustments: analysisParameters.adaptiveAdjustments
      },
      parameter_engine_config: {
        engine_version: analysisParameters.metadata?.engineVersion || '1.0',
        config_version: analysisParameters.metadata?.configVersion || '1.0',
        generated_at: analysisParameters.metadata?.generatedAt || new Date(),
        organization_id: analysisParameters.organizationId
      },
      metadata: {
        document_id: request.documentId,
        file_size: document.size || 0,
        upload_date: document.uploadedAt || new Date(),
        analysis_id: request.documentId // Para rastreamento
      },
      callback_config: {
        callback_url: callbackUrl,
        callback_events: ['progress', 'completed', 'failed', 'error'],
        callback_secret: callbackSecret
      }
    };
  }

  /**
   * Executa análise no Cloud Run com retry e circuit breaker
   */
  private async executeCloudRunAnalysisWithRetry(
    cloudRunRequest: any,
    analysisId: string,
    maxRetries: number
  ): Promise<any> {
    return this.retryOperationWithExponentialBackoff(
      async () => {
        console.log(`[AnalysisOrchestrator] Enviando requisição para Cloud Run (análise ${analysisId})`);
        const result = await this.cloudRunClient.analyzeDocument(cloudRunRequest);
        
        // Validar resposta básica
        if (!result) {
          throw new Error('Cloud Run retornou resposta vazia');
        }
        
        console.log(`[AnalysisOrchestrator] Resposta recebida do Cloud Run (análise ${analysisId})`);
        return result;
      },
      'Análise no Cloud Run',
      analysisId,
      maxRetries
    );
  }

  /**
   * Converte e valida resultado do Cloud Run para formato interno
   */
  private convertAndValidateCloudRunResult(
    cloudRunResult: any,
    request: AnalysisRequest
  ): AnalysisResult {
    // Validar estrutura da resposta
    if (!cloudRunResult) {
      throw new Error('Resultado do Cloud Run é nulo ou indefinido');
    }

    const result: AnalysisResult = {
      id: `analysis_${Date.now()}`,
      documentId: request.documentId,
      organizationId: request.organizationId,
      conformityScore: cloudRunResult.results?.conformity_score || 0,
      confidence: this.validateConfidence(cloudRunResult.results?.confidence),
      problems: Array.isArray(cloudRunResult.results?.problems) ? cloudRunResult.results.problems : [],
      recommendations: Array.isArray(cloudRunResult.results?.recommendations) ? cloudRunResult.results.recommendations : [],
      metrics: cloudRunResult.results?.metrics || {},
      categoryResults: cloudRunResult.results?.categories || {},
      processingTime: cloudRunResult.processing_time || 0,
      aiUsed: cloudRunResult.results?.ai_used || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validar campos críticos
    this.validateAnalysisResult(result);
    
    return result;
  }

  /**
   * Valida valor de confiança
   */
  private validateConfidence(confidence: any): number {
    const conf = typeof confidence === 'number' ? confidence : 0.85;
    return Math.max(0, Math.min(1, conf)); // Garantir entre 0 e 1
  }

  /**
   * Valida resultado de análise
   */
  private validateAnalysisResult(result: AnalysisResult): void {
    if (!result.documentId) {
      throw new Error('ID do documento é obrigatório no resultado');
    }
    
    if (!result.organizationId) {
      throw new Error('ID da organização é obrigatório no resultado');
    }
    
    if (result.confidence < 0 || result.confidence > 1) {
      throw new Error('Confiança deve estar entre 0 e 1');
    }
  }

  /**
   * Salva resultado com validação adicional
   */
  private async saveAnalysisResultWithValidation(
    documentId: string,
    analysisResult: AnalysisResult
  ): Promise<void> {
    // Validar antes de salvar
    this.validateAnalysisResult(analysisResult);
    
    // Salvar no Firestore
    await this.saveAnalysisResult(documentId, analysisResult);
    
    console.log(`[AnalysisOrchestrator] Resultado salvo com sucesso para documento ${documentId}`);
  }

  /**
   * Finaliza análise com sucesso
   */
  private async finalizeSuccessfulAnalysis(
    analysisId: string,
    request: AnalysisRequest,
    document: any,
    analysisResult: AnalysisResult
  ): Promise<void> {
    // Atualizar progresso final
    await this.updateProgress(analysisId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Análise concluída',
      completedAt: new Date()
    });

    // Atualizar análise no AnalysisRepository
    await this.analysisRepo.updateStatus(analysisId, 'COMPLETED');

    // Enviar notificação (sem retry crítico)
    try {
      await this.notificationService.notifyAnalysisComplete(
        request.userId,
        request.organizationId,
        analysisId,
        document.name || 'Documento',
        analysisResult
      );
    } catch (notificationError) {
      console.warn(`[AnalysisOrchestrator] Falha ao enviar notificação para análise ${analysisId}:`, notificationError);
    }

    // Limpar análise ativa
    this.activeAnalyses.delete(analysisId);
  }

  /**
   * Converte resultado do Cloud Run para formato interno (método legado)
   */
  private convertCloudRunResult(cloudRunResult: any, request: AnalysisRequest): AnalysisResult {
    return this.convertAndValidateCloudRunResult(cloudRunResult, request);
  }

  async updateProgress(analysisId: string, updates: Partial<AnalysisProgress>): Promise<void> {
    const current = this.activeAnalyses.get(analysisId);
    if (current) {
      const updated = { ...current, ...updates };
      this.activeAnalyses.set(analysisId, updated);
      await this.saveAnalysisProgress(updated);
    }
  }

  private async saveAnalysisProgress(progress: AnalysisProgress): Promise<void> {
    await this.db.collection('analysis_progress').doc(progress.analysisId).set({
      ...progress,
      updatedAt: new Date()
    });
  }

  private async loadAnalysisProgress(analysisId: string): Promise<AnalysisProgress | null> {
    const doc = await this.db.collection('analysis_progress').doc(analysisId).get();
    return doc.exists ? doc.data() as AnalysisProgress : null;
  }

  async saveAnalysisResult(documentId: string, result: AnalysisResult): Promise<void> {
    // Salvar resultado da análise
    await this.db.collection('analysis_results').doc(result.id).set(result);
    
    // Atualizar análise no AnalysisRepository
    await this.analysisRepo.updateResults(result.id, {
      result: result,
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date()
    });
    
    // Atualizar documento com referência ao resultado
    await this.db.collection('documents').doc(documentId).update({
      lastAnalysisId: result.id,
      lastAnalysisDate: new Date(),
      analysisStatus: 'completed'
    });
  }

  private async handleAnalysisError(analysisId: string, error: Error): Promise<void> {
    await this.updateProgress(analysisId, {
      status: 'failed',
      currentStep: 'Erro na análise',
      error: error.message,
      completedAt: new Date()
    });

    // Atualizar análise no AnalysisRepository
    await this.analysisRepo.updateStatus(analysisId, 'FAILED', undefined, undefined, error.message);

    // Log do erro
    console.error(`Análise ${analysisId} falhou:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    this.activeAnalyses.delete(analysisId);
  }

  /**
   * Trata erros com lógica de retry automático
   */
  private async handleAnalysisErrorWithRetry(
    analysisId: string, 
    request: AnalysisRequest, 
    error: Error, 
    currentRetryCount: number, 
    maxRetries: number
  ): Promise<void> {
    const isRetryableError = this.isRetryableError(error);
    const canRetry = isRetryableError && currentRetryCount < maxRetries;

    if (canRetry) {
      const nextRetryCount = currentRetryCount + 1;
      const delayMs = this.calculateRetryDelay(nextRetryCount);

      console.warn(`Análise ${analysisId} falhou (tentativa ${nextRetryCount}/${maxRetries}). Reagendando em ${delayMs}ms:`, {
        error: error.message,
        retryCount: nextRetryCount,
        maxRetries,
        delayMs
      });

      await this.updateProgress(analysisId, {
        status: 'processing',
        currentStep: `Erro temporário - reagendando (${nextRetryCount}/${maxRetries})`,
        error: error.message,
        retryCount: nextRetryCount,
        lastRetryAt: new Date()
      });

      // Agendar retry
      setTimeout(async () => {
        try {
          await this.processAnalysis(analysisId, request);
        } catch (retryError) {
          console.error(`Erro no retry da análise ${analysisId}:`, retryError);
        }
      }, delayMs);

    } else {
      // Falha definitiva
      await this.updateProgress(analysisId, {
        status: 'failed',
        currentStep: isRetryableError ? 'Máximo de tentativas excedido' : 'Erro não recuperável',
        error: error.message,
        completedAt: new Date(),
        retryCount: currentRetryCount
      });

      // Atualizar análise no AnalysisRepository
      await this.analysisRepo.updateStatus(analysisId, 'FAILED', undefined, undefined, error.message);

      console.error(`Análise ${analysisId} falhou definitivamente:`, {
        error: error.message,
        stack: error.stack,
        retryCount: currentRetryCount,
        maxRetries,
        isRetryableError,
        timestamp: new Date().toISOString()
      });

      this.activeAnalyses.delete(analysisId);
    }
  }

  /**
   * Operação com retry e exponential backoff aprimorado
   */
  private async retryOperationWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    analysisId: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw new Error(`${operationName} falhou após ${maxRetries + 1} tentativas: ${lastError.message}`);
        }
        
        // Exponential backoff com jitter
        const baseDelay = this.retryDelayMs * Math.pow(this.exponentialBackoffMultiplier, attempt);
        const jitter = Math.random() * this.jitterMaxMs;
        const delay = Math.min(baseDelay + jitter, this.maxRetryDelayMs);
        
        console.warn(`[AnalysisOrchestrator] ${operationName} falhou (tentativa ${attempt + 1}/${maxRetries + 1}), tentando novamente em ${Math.round(delay)}ms:`, error);
        
        await this.updateProgress(analysisId, {
          currentStep: `${operationName} - Tentativa ${attempt + 2}/${maxRetries + 1}`
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Executa uma operação com retry automático
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    analysisId: string,
    maxRetries: number = 3
  ): Promise<T> {
    return this.retryOperationWithExponentialBackoff(operation, operationName, analysisId, maxRetries);
  }

  /**
   * Verifica se um erro pode ser retentado
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Erros de rede e temporários
    const networkErrors = [
      'network', 'timeout', 'econnreset', 'enotfound', 'econnrefused',
      'socket hang up', 'request timeout', 'connection reset'
    ];

    // Erros HTTP retryáveis
    const retryableHttpErrors = [
      '429', '500', '502', '503', '504', 'rate limit', 'service unavailable',
      'internal server error', 'bad gateway', 'gateway timeout'
    ];

    // Erros do Firestore retryáveis
    const firestoreErrors = [
      'unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted'
    ];

    return networkErrors.some(err => message.includes(err) || name.includes(err)) ||
           retryableHttpErrors.some(err => message.includes(err)) ||
           firestoreErrors.some(err => message.includes(err));
  }

  /**
   * Calcula o delay para retry com backoff exponencial
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Adiciona jitter para evitar thundering herd
    
    return Math.min(exponentialDelay + jitter, this.maxRetryDelayMs);
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Carrega documento do banco de dados
   */
  private async loadDocument(documentId: string): Promise<any> {
    try {
      // Tentar carregar do repository primeiro
      if (this.documentRepo) {
        const document = await this.documentRepo.findById(documentId);
        if (document) {
          return document;
        }
      }

      // Fallback para busca direta no Firestore
      const doc = await this.db.collection('documents').doc(documentId).get();
      if (!doc.exists) {
        throw new Error(`Documento ${documentId} não encontrado`);
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Erro ao carregar documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Carrega configuração da organização
   */
  private async loadOrganizationConfig(organizationId: string): Promise<any> {
    try {
      // Tentar carregar organização do repository primeiro
      if (this.organizationRepo) {
        const organization = await this.organizationRepo.findById(organizationId);
        if (organization) {
          // Extrair configurações da organização
          return {
            analysisSettings: {
              enableAI: true,
              strictMode: false,
              customRules: []
            },
            notificationSettings: {
              email: true
            }
          };
        }
      }

      // Fallback para busca direta no Firestore
      const doc = await this.db.collection('organization_configs').doc(organizationId).get();
      if (!doc.exists) {
        // Retornar configuração padrão se não existir
        return {
          analysisSettings: {
            enableAI: true,
            strictMode: false,
            customRules: []
          },
          notificationSettings: {
            email: true
          }
        };
      }

      return doc.data();
    } catch (error) {
      console.error(`Erro ao carregar configuração da organização ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Constrói URL de callback para análise
   */
  private buildCallbackUrl(analysisId: string): string {
    const baseUrl = process.env.CLOUD_FUNCTION_BASE_URL || 'https://us-central1-revisor-editais.cloudfunctions.net';
    return `${baseUrl}/callbacksApi/callback/analysis?analysisId=${analysisId}`;
  }

  /**
   * Gera secret para validação de callback
   */
  private generateCallbackSecret(analysisId: string): string {
    const crypto = require('crypto');
    const secretKey = process.env.CALLBACK_SECRET_KEY || 'default-secret-key';
    return crypto.createHmac('sha256', secretKey)
      .update(`${analysisId}-${Date.now()}`)
      .digest('hex');
  }

  /**
   * Processa callback recebido do Cloud Run
   */
  async processCallback(analysisId: string, callbackData: any): Promise<void> {
    try {
      const { status, progress, error, result } = callbackData;

      switch (status) {
        case 'progress':
          await this.updateProgress(analysisId, {
            progress: progress || 0,
            currentStep: callbackData.currentStep || 'Processando no Cloud Run'
          });
          break;

        case 'completed':
          if (result) {
            // Converter resultado do Cloud Run para formato interno
            // Criar um AnalysisRequest mínimo para conversão
            const mockRequest: AnalysisRequest = {
              documentId: callbackData.documentId,
              organizationId: callbackData.organizationId || 'unknown',
              userId: callbackData.userId || 'system',
              priority: 'normal',
              options: {
                includeAI: true,
                generateRecommendations: true,
                detailedMetrics: false,
                customRules: []
              }
            };
            const analysisResult = this.convertCloudRunResult(result, mockRequest);
            
            // Salvar resultado
            await this.saveAnalysisResult(callbackData.documentId, analysisResult);
            
            // Finalizar análise
            await this.updateProgress(analysisId, {
              status: 'completed',
              progress: 100,
              currentStep: 'Análise concluída via callback',
              completedAt: new Date()
            });

            this.activeAnalyses.delete(analysisId);
          }
          break;

        case 'failed':
        case 'error':
          await this.updateProgress(analysisId, {
            status: 'failed',
            currentStep: 'Falha reportada pelo Cloud Run',
            error: error || 'Erro desconhecido no Cloud Run',
            completedAt: new Date()
          });

          this.activeAnalyses.delete(analysisId);
          break;

        default:
          console.warn(`Status de callback desconhecido: ${status}`);
      }
    } catch (error) {
      console.error(`Erro ao processar callback para análise ${analysisId}:`, error);
      throw error;
    }
  }
}