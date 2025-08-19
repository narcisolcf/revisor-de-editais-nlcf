/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */

import { Firestore } from 'firebase-admin/firestore';
import { DocumentRepository } from '../db/repositories/DocumentRepository';
import { OrganizationRepository } from '../db/repositories/OrganizationRepository';
import { CloudRunClient } from './CloudRunClient';
import { TaskQueueService } from './TaskQueueService';
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
}

export class AnalysisOrchestrator {
  private db: Firestore;
  private documentRepo: DocumentRepository;
  private organizationRepo: OrganizationRepository;
  private cloudRunClient: CloudRunClient;
  private taskQueue: TaskQueueService;
  private notificationService: NotificationService;
  private activeAnalyses: Map<string, AnalysisProgress> = new Map();

  constructor(
    firestore: Firestore,
    cloudRunServiceUrl: string,
    projectId: string
  ) {
    this.db = firestore;
    this.documentRepo = new DocumentRepository(firestore);
    this.organizationRepo = new OrganizationRepository(firestore);
    this.cloudRunClient = new CloudRunClient(cloudRunServiceUrl);
    this.taskQueue = new TaskQueueService(projectId);
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
    try {
      // Atualizar progresso
      await this.updateProgress(analysisId, {
        status: 'processing',
        progress: 10,
        currentStep: 'Carregando documento'
      });

      // Buscar documento (simulado para teste)
      const document: any = {
        id: request.documentId,
        name: `Documento ${request.documentId}`,
        content: 'Conteúdo simulado do documento para teste',
        type: 'EDITAL',
        size: 1024,
        uploadedAt: new Date()
      };

      await this.updateProgress(analysisId, {
        progress: 30,
        currentStep: 'Carregando configurações'
      });

      // Configuração da organização (simulada para teste)
      const orgConfig: any = {
        analysisSettings: {
          enableAI: true,
          strictMode: false,
          customRules: []
        }
      };
      
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

      const cloudRunResult = await this.cloudRunClient.analyzeDocument(cloudRunRequest);

      await this.updateProgress(analysisId, {
        progress: 90,
        currentStep: 'Processando resultados'
      });

      // Converter resultado para formato interno
      const analysisResult = this.convertCloudRunResult(cloudRunResult, request);
      
      // Salvar resultado
      await this.saveAnalysisResult(request.documentId, analysisResult);

      // Finalizar análise
      await this.updateProgress(analysisId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Análise concluída',
        completedAt: new Date()
      });

      // Enviar notificação
      await this.notificationService.notifyAnalysisComplete(
        request.userId,
        request.organizationId,
        analysisId,
        document.name || 'Documento',
        analysisResult
      );

      this.activeAnalyses.delete(analysisId);

    } catch (error) {
      await this.handleAnalysisError(analysisId, error as Error);
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
}