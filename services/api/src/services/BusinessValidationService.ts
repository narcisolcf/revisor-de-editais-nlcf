/**
 * Serviço de Validação de Negócio
 * 
 * Orquestra a coleta de feedback dos usuários, análise de métricas de satisfação
 * e validação de hipóteses de negócio para o sistema LicitaReview.
 */

import { FeedbackRepository } from '../db/repositories/FeedbackRepository';
import {
  Feedback,
  ParameterUsage,
  SatisfactionMetrics,
  BusinessEvent,
  FeedbackType,
  FeedbackStatus,
  SatisfactionRating,
  CreateFeedbackRequest,
  FeedbackResponse,
  GetFeedbackQuery,
  ParameterValueAnalysis,
  BusinessValidationReport,
  FeedbackConfig,
  BusinessMetricsResponse
} from '../types/feedback.types';
import { NotificationService } from './NotificationService';
import { getFirestore } from 'firebase-admin/firestore';
import { FeedbackSchema } from '../types/feedback.types';

export class BusinessValidationService {
  private feedbackRepository: FeedbackRepository;
  private notificationService: NotificationService;

  constructor(projectId: string = 'default-project') {
    const db = getFirestore();
    this.feedbackRepository = new FeedbackRepository(db, 'feedbacks', FeedbackSchema);
    this.notificationService = new NotificationService(projectId);
  }

  // ============================================================================
  // MÉTODOS PARA COLETA DE FEEDBACK
  // ============================================================================

  /**
   * Cria um novo feedback do usuário
   */
  async createFeedback(
    userId: string,
    organizationId: string,
    feedbackData: CreateFeedbackRequest
  ): Promise<FeedbackResponse> {
    try {
      // Validar dados de entrada
      this.validateFeedbackData(feedbackData);

      // Criar feedback
      const feedbackId = await this.feedbackRepository.createFeedback({
        userId,
        organizationId,
        ...feedbackData,
        tags: feedbackData.tags || [], // Garantir que tags seja sempre um array
        status: FeedbackStatus.PENDING
      });

      // Notificar equipe se for feedback crítico
      if (feedbackData.rating <= SatisfactionRating.DISSATISFIED) {
        await this.notifyLowSatisfactionFeedback(feedbackId, feedbackData);
      }

      // Registrar evento de negócio
      await this.feedbackRepository.trackBusinessEvent({
        userId,
        organizationId,
        eventType: 'feedback_submitted',
        eventData: {
          feedbackId,
          type: feedbackData.type,
          rating: feedbackData.rating,
          hasAnalysisId: !!feedbackData.analysisId
        }
      });

      return {
        id: feedbackId,
        status: FeedbackStatus.PENDING,
        createdAt: new Date(),
        message: 'Feedback registrado com sucesso. Obrigado pela sua contribuição!'
      };
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      throw new Error('Falha ao registrar feedback');
    }
  }

  /**
   * Busca feedbacks com filtros
   */
  async getFeedbacks(query: GetFeedbackQuery): Promise<Feedback[]> {
    return this.feedbackRepository.getFeedbacks(query);
  }

  /**
   * Atualiza status de um feedback (para equipe de suporte)
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    reviewedBy: string,
    response?: string
  ): Promise<void> {
    await this.feedbackRepository.updateFeedbackStatus(feedbackId, status, reviewedBy, response);

    // Notificar usuário se houver resposta
    if (response && status === FeedbackStatus.RESOLVED) {
      await this.notifyFeedbackResponse(feedbackId, response);
    }
  }

  // ============================================================================
  // MÉTODOS PARA TRACKING DE PARÂMETROS
  // ============================================================================

  /**
   * Registra uso de parâmetro personalizado
   */
  async trackParameterUsage(
    userId: string,
    organizationId: string,
    analysisId: string,
    parameterId: string,
    parameterName: string,
    parameterType: 'custom' | 'default' | 'template'
  ): Promise<void> {
    await this.feedbackRepository.trackParameterUsage({
      userId,
      organizationId,
      analysisId,
      parameterId,
      parameterName,
      parameterType,
      usageCount: 1,
      lastUsed: new Date()
    });
  }

  /**
   * Analisa valor e efetividade dos parâmetros personalizados
   */
  async analyzeParameterValue(organizationId: string, days: number = 30): Promise<ParameterValueAnalysis[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      // Buscar dados de uso de parâmetros
      const usageStats = await this.feedbackRepository.getParameterUsageStats(organizationId, startDate, endDate);

      // Buscar feedbacks relacionados a parâmetros
      const parameterFeedbacks = await this.feedbackRepository.getFeedbacks({
        organizationId,
        type: FeedbackType.PARAMETER_USEFULNESS,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Calcular análise de valor para cada parâmetro
      const parameterAnalysis: ParameterValueAnalysis[] = [];
      const parameterMap = new Map<string, ParameterUsage[]>();

      // Agrupar por parâmetro
      usageStats.forEach(usage => {
        const key = usage.parameterId;
        if (!parameterMap.has(key)) {
          parameterMap.set(key, []);
        }
        parameterMap.get(key)!.push(usage);
      });

      // Analisar cada parâmetro
      for (const [parameterId, usages] of parameterMap) {
        const totalUsage = usages.reduce((sum, u) => sum + u.usageCount, 0);
        const uniqueUsers = new Set(usages.map(u => u.userId)).size;
        
        // Calcular satisfação média para este parâmetro
        const relatedFeedbacks = parameterFeedbacks.filter(f => 
          f.metadata?.parameterId === parameterId
        );
        const averageSatisfaction = relatedFeedbacks.length > 0
          ? relatedFeedbacks.reduce((sum, f) => sum + f.rating, 0) / relatedFeedbacks.length
          : 0;

        // Calcular tendências (simplificado)
        const weeklyTrend = this.calculateWeeklyTrend(usages, days);
        const monthlyTrend = this.calculateMonthlyTrend(usages, days);

        parameterAnalysis.push({
          parameterId,
          parameterName: usages[0].parameterName,
          usageFrequency: totalUsage,
          averageSatisfaction,
          adoptionRate: uniqueUsers / Math.max(1, usageStats.length), // Simplificado
          retentionRate: this.calculateRetentionRate(usages),
          effectivenessScore: this.calculateEffectivenessScore(totalUsage, averageSatisfaction, uniqueUsers),
          trends: {
            weekly: weeklyTrend,
            monthly: monthlyTrend
          }
        });
      }

      return parameterAnalysis.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    } catch (error) {
      console.error('Erro ao analisar valor dos parâmetros:', error);
      throw new Error('Falha ao analisar valor dos parâmetros');
    }
  }

  // ============================================================================
  // MÉTODOS PARA MÉTRICAS E RELATÓRIOS
  // ============================================================================

  /**
   * Gera relatório de validação de hipóteses de negócio
   */
  async generateBusinessValidationReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessValidationReport> {
    try {
      // Analisar valor dos parâmetros personalizados
      const parameterAnalysis = await this.analyzeParameterValue(organizationId, 
        Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      );

      // Calcular métricas de satisfação
      const satisfactionMetrics = await this.feedbackRepository.calculateSatisfactionMetrics(
        organizationId, 'monthly', endDate
      );

      // Buscar feedbacks do período
      const feedbacks = await this.feedbackRepository.getFeedbacks({
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Validar hipótese de valor dos parâmetros personalizados
      const customParametersValidation = this.validateCustomParametersHypothesis(parameterAnalysis);

      // Analisar tendência de satisfação
      const satisfactionTrend = await this.analyzeSatisfactionTrend(organizationId, startDate, endDate);

      // Calcular adoção de funcionalidades
      const featureAdoption = await this.calculateFeatureAdoption(organizationId, startDate, endDate);

      const report: BusinessValidationReport = {
        organizationId,
        period: { start: startDate, end: endDate },
        hypotheses: {
          customParametersValue: {
            validated: customParametersValidation.validated,
            confidence: customParametersValidation.confidence,
            evidence: customParametersValidation.evidence,
            metrics: parameterAnalysis
          },
          userSatisfaction: {
            target: 70, // Meta de NPS
            actual: satisfactionMetrics.npsScore,
            trend: satisfactionTrend
          },
          featureAdoption: featureAdoption
        },
        recommendations: this.generateRecommendations(parameterAnalysis, satisfactionMetrics, featureAdoption),
        nextActions: this.generateNextActions(parameterAnalysis, satisfactionMetrics)
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de validação:', error);
      throw new Error('Falha ao gerar relatório de validação');
    }
  }

  /**
   * Obtém métricas consolidadas de negócio
   */
  async getBusinessMetrics(organizationId: string, days: number = 30): Promise<BusinessMetricsResponse> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      // Calcular métricas de satisfação
      const satisfaction = await this.feedbackRepository.calculateSatisfactionMetrics(
        organizationId, 'monthly', endDate
      );

      // Buscar uso de parâmetros
      const parameterUsage = await this.feedbackRepository.getParameterUsageStats(
        organizationId, startDate, endDate
      );

      // Gerar relatório de validação
      const validationReport = await this.generateBusinessValidationReport(
        organizationId, startDate, endDate
      );

      // Calcular tendências
      const trends = await this.calculateTrends(organizationId, days);

      return {
        satisfaction,
        parameterUsage,
        validationReport,
        trends
      };
    } catch (error) {
      console.error('Erro ao obter métricas de negócio:', error);
      throw new Error('Falha ao obter métricas de negócio');
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  private validateFeedbackData(data: CreateFeedbackRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Título do feedback é obrigatório');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Descrição do feedback é obrigatória');
    }
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Avaliação deve estar entre 1 e 5');
    }
  }

  private async notifyLowSatisfactionFeedback(feedbackId: string, feedback: CreateFeedbackRequest): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        userId: 'system', // Sistema como remetente
        organizationId: 'admin', // Organização administrativa
        type: 'low_satisfaction_alert',
        title: 'Feedback de Baixa Satisfação',
        message: `Novo feedback com avaliação ${feedback.rating}/5: ${feedback.title}`,
        data: { feedbackId, rating: feedback.rating }
      });
    } catch (error) {
      console.error('Erro ao notificar feedback de baixa satisfação:', error);
    }
  }

  private async notifyFeedbackResponse(feedbackId: string, response: string): Promise<void> {
    // Implementar notificação ao usuário sobre resposta do feedback
    console.log(`Notificar usuário sobre resposta do feedback ${feedbackId}: ${response}`);
  }

  private calculateWeeklyTrend(usages: ParameterUsage[], days: number): number[] {
    // Implementação simplificada - calcular uso por semana
    const weeks = Math.ceil(days / 7);
    const weeklyData = new Array(weeks).fill(0);
    
    usages.forEach(usage => {
      const weekIndex = Math.floor(
        (new Date().getTime() - usage.lastUsed.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weekIndex >= 0 && weekIndex < weeks) {
        weeklyData[weeks - 1 - weekIndex] += usage.usageCount;
      }
    });
    
    return weeklyData;
  }

  private calculateMonthlyTrend(usages: ParameterUsage[], days: number): number[] {
    // Implementação simplificada - calcular uso por mês
    const months = Math.ceil(days / 30);
    const monthlyData = new Array(months).fill(0);
    
    usages.forEach(usage => {
      const monthIndex = Math.floor(
        (new Date().getTime() - usage.lastUsed.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      if (monthIndex >= 0 && monthIndex < months) {
        monthlyData[months - 1 - monthIndex] += usage.usageCount;
      }
    });
    
    return monthlyData;
  }

  private calculateRetentionRate(usages: ParameterUsage[]): number {
    // Calcular taxa de retenção baseada em uso recente
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentUsages = usages.filter(u => u.lastUsed >= thirtyDaysAgo);
    return usages.length > 0 ? recentUsages.length / usages.length : 0;
  }

  private calculateEffectivenessScore(usage: number, satisfaction: number, users: number): number {
    // Fórmula ponderada para calcular efetividade
    const usageScore = Math.min(usage / 100, 1); // Normalizar uso
    const satisfactionScore = satisfaction / 5; // Normalizar satisfação
    const adoptionScore = Math.min(users / 10, 1); // Normalizar adoção
    
    return (usageScore * 0.4 + satisfactionScore * 0.4 + adoptionScore * 0.2);
  }

  private validateCustomParametersHypothesis(analysis: ParameterValueAnalysis[]): {
    validated: boolean;
    confidence: number;
    evidence: string[];
  } {
    const evidence: string[] = [];
    let validationScore = 0;

    // Critérios de validação
    const highEffectivenessParams = analysis.filter(p => p.effectivenessScore > 0.7);
    const highSatisfactionParams = analysis.filter(p => p.averageSatisfaction > 3.5);
    const frequentlyUsedParams = analysis.filter(p => p.usageFrequency > 10);

    if (highEffectivenessParams.length > 0) {
      evidence.push(`${highEffectivenessParams.length} parâmetros com alta efetividade (>70%)`);
      validationScore += 0.4;
    }

    if (highSatisfactionParams.length > 0) {
      evidence.push(`${highSatisfactionParams.length} parâmetros com alta satisfação (>3.5/5)`);
      validationScore += 0.3;
    }

    if (frequentlyUsedParams.length > 0) {
      evidence.push(`${frequentlyUsedParams.length} parâmetros com uso frequente (>10 usos)`);
      validationScore += 0.3;
    }

    return {
      validated: validationScore > 0.6,
      confidence: validationScore,
      evidence
    };
  }

  private async analyzeSatisfactionTrend(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<'improving' | 'stable' | 'declining'> {
    // Implementação simplificada - comparar com período anterior
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const previousStartDate = new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    const currentFeedbacks = await this.feedbackRepository.getFeedbacks({
      organizationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const previousFeedbacks = await this.feedbackRepository.getFeedbacks({
      organizationId,
      startDate: previousStartDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const currentAvg = currentFeedbacks.length > 0
      ? currentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / currentFeedbacks.length
      : 0;
    
    const previousAvg = previousFeedbacks.length > 0
      ? previousFeedbacks.reduce((sum, f) => sum + f.rating, 0) / previousFeedbacks.length
      : 0;

    const difference = currentAvg - previousAvg;
    
    if (difference > 0.2) return 'improving';
    if (difference < -0.2) return 'declining';
    return 'stable';
  }

  private async calculateFeatureAdoption(organizationId: string, startDate: Date, endDate: Date): Promise<{
    customParameters: number;
    advancedFeatures: number;
    overallEngagement: number;
  }> {
    // Implementação simplificada
    const parameterUsage = await this.feedbackRepository.getParameterUsageStats(organizationId, startDate, endDate);
    const customParams = parameterUsage.filter(p => p.parameterType === 'custom');
    
    return {
      customParameters: customParams.length > 0 ? 0.75 : 0.25, // Simplificado
      advancedFeatures: 0.60, // Placeholder
      overallEngagement: 0.80 // Placeholder
    };
  }

  private generateRecommendations(
    parameterAnalysis: ParameterValueAnalysis[],
    satisfactionMetrics: SatisfactionMetrics,
    featureAdoption: any
  ): string[] {
    const recommendations: string[] = [];

    if (satisfactionMetrics.npsScore < 50) {
      recommendations.push('Focar em melhorar a experiência do usuário - NPS abaixo da meta');
    }

    const lowEffectivenessParams = parameterAnalysis.filter(p => p.effectivenessScore < 0.3);
    if (lowEffectivenessParams.length > 0) {
      recommendations.push(`Revisar ${lowEffectivenessParams.length} parâmetros com baixa efetividade`);
    }

    if (featureAdoption.customParameters < 0.5) {
      recommendations.push('Implementar onboarding para parâmetros personalizados');
    }

    return recommendations;
  }

  private generateNextActions(
    parameterAnalysis: ParameterValueAnalysis[],
    satisfactionMetrics: SatisfactionMetrics
  ): string[] {
    const actions: string[] = [];

    if (satisfactionMetrics.totalFeedbacks < 10) {
      actions.push('Implementar campanha de coleta de feedback');
    }

    const topParams = parameterAnalysis.slice(0, 3);
    if (topParams.length > 0) {
      actions.push(`Promover parâmetros mais efetivos: ${topParams.map(p => p.parameterName).join(', ')}`);
    }

    actions.push('Agendar revisão mensal das métricas de validação');

    return actions;
  }

  private async calculateTrends(organizationId: string, days: number): Promise<{
    userGrowth: number[];
    engagementRate: number[];
    satisfactionTrend: number[];
  }> {
    // Implementação simplificada - retornar dados mock
    const weeks = Math.ceil(days / 7);
    
    return {
      userGrowth: new Array(weeks).fill(0).map(() => Math.random() * 10),
      engagementRate: new Array(weeks).fill(0).map(() => 0.6 + Math.random() * 0.3),
      satisfactionTrend: new Array(weeks).fill(0).map(() => 3.5 + Math.random() * 1.5)
    };
  }
}