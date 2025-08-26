/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */

import { Firestore } from 'firebase-admin/firestore';
import { DocumentRepository } from '../db/repositories/DocumentRepository';
import { OrganizationRepository } from '../db/repositories/OrganizationRepository';
import { CloudRunClient } from './CloudRunClient';

import { NotificationService } from './NotificationService';

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
}

export interface AnalysisProgress {
  analysisId: string;
  documentId: string;
  status: AnalysisStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  maxRetries?: number;
}

export class AnalysisOrchestrator {
  private db: Firestore;
  private documentRepo: DocumentRepository;
  private organizationRepo: OrganizationRepository;
  private cloudRunClient: CloudRunClient;
  private notificationService: NotificationService;
  private activeAnalyses: Map<string, AnalysisProgress> = new Map();
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 5000; // 5 segundos
  private readonly maxRetryDelayMs: number = 60000; // 1 minuto

  constructor(
    firestore: Firestore,
    cloudRunServiceUrl: string,
    projectId: string
  ) {
    this.db = firestore;
    this.documentRepo = new DocumentRepository(firestore);
    this.organizationRepo = new OrganizationRepository(firestore);
    this.cloudRunClient = new CloudRunClient(cloudRunServiceUrl);
    this.notificationService = new NotificationService(projectId);
  }

  /**
   * Inicia uma nova análise
   */
  async startAnalysis(request: AnalysisRequest): Promise<string> {
    const analysisId = this.generateAnalysisId();
    
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
   * Processa uma análise
   */
  async processAnalysis(analysisId: string, request: AnalysisRequest): Promise<void> {
    const progress = await this.getAnalysisProgress(analysisId);
    const retryCount = progress?.retryCount || 0;
    const maxRetries = progress?.maxRetries || this.maxRetries;

    try {
      // Atualizar progresso
      await this.updateProgress(analysisId, {
        status: 'processing',
        progress: 10,
        currentStep: 'Carregando documento',
        retryCount,
        maxRetries
      });

      // Buscar documento com retry
      const document = await this.retryOperation(
        () => this.loadDocument(request.documentId),
        'Carregando documento',
        analysisId
      );

      await this.updateProgress(analysisId, {
        progress: 30,
        currentStep: 'Carregando configurações'
      });

      // Configuração da organização com retry
      const orgConfig = await this.retryOperation(
        () => this.loadOrganizationConfig(request.organizationId),
        'Carregando configurações',
        analysisId
      );
      
      await this.updateProgress(analysisId, {
        progress: 50,
        currentStep: 'Enviando para análise'
      });

      // Preparar request para Cloud Run
      const cloudRunRequest = {
        document_content: document.content || '',
        document_type: document.type || 'EDITAL',
        classification: { type: document.type },
        organization_config: orgConfig || {},
        analysis_options: {
          include_ai: request.options.includeAI,
          generate_recommendations: request.options.generateRecommendations,
          detailed_metrics: request.options.detailedMetrics,
          custom_rules: orgConfig?.analysisSettings?.customRules || []
        },
        metadata: {
          document_id: request.documentId,
          file_size: document.size || 0,
          upload_date: document.uploadedAt || new Date()
        }
      };

      // Análise com retry automático (CloudRunClient já tem retry interno)
      const cloudRunResult = await this.cloudRunClient.analyzeDocument(cloudRunRequest);

      await this.updateProgress(analysisId, {
        progress: 90,
        currentStep: 'Processando resultados'
      });

      // Converter resultado para formato interno
      const analysisResult = this.convertCloudRunResult(cloudRunResult, request);
      
      // Salvar resultado com retry
      await this.retryOperation(
        () => this.saveAnalysisResult(request.documentId, analysisResult),
        'Salvando resultados',
        analysisId
      );

      // Finalizar análise
      await this.updateProgress(analysisId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Análise concluída',
        completedAt: new Date()
      });

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
        console.warn(`Falha ao enviar notificação para análise ${analysisId}:`, notificationError);
      }

      this.activeAnalyses.delete(analysisId);

    } catch (error) {
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
  async cancelAnalysis(analysisId: string, userId: string): Promise<boolean> {
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

  // Métodos privados

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private convertCloudRunResult(cloudRunResult: any, request: AnalysisRequest): AnalysisResult {
    return {
      id: this.generateAnalysisId(),
      documentId: request.documentId,
      organizationId: request.organizationId,
      conformityScore: cloudRunResult.results.conformity_score || 0,
      confidence: cloudRunResult.results.confidence || 0,
      problems: cloudRunResult.results.problems || [],
      recommendations: cloudRunResult.results.recommendations || [],
      metrics: cloudRunResult.results.metrics || {},
      categoryResults: cloudRunResult.results.categories || {},
      processingTime: cloudRunResult.processing_time || 0,
      aiUsed: cloudRunResult.results.ai_used || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async updateProgress(analysisId: string, updates: Partial<AnalysisProgress>): Promise<void> {
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

  private async saveAnalysisResult(documentId: string, result: AnalysisResult): Promise<void> {
    await this.db.collection('analysis_results').doc(result.id).set(result);
    
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
   * Executa uma operação com retry automático
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    analysisId: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries || !this.isRetryableError(lastError)) {
          throw lastError;
        }

        const delayMs = this.calculateRetryDelay(attempt);
        console.warn(`${operationName} falhou (tentativa ${attempt}/${maxRetries}). Tentando novamente em ${delayMs}ms:`, {
          error: lastError.message,
          analysisId,
          attempt,
          maxRetries
        });

        await this.sleep(delayMs);
      }
    }

    throw lastError!;
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
}