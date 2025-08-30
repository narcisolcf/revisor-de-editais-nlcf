/**
 * Repositório para Sistema de Feedback e Validação de Negócio
 * 
 * Gerencia a persistência de feedback dos usuários, métricas de satisfação
 * e tracking de uso de parâmetros personalizados no Firestore.
 */

import { BaseRepository } from './BaseRepository';
import {
  Feedback,
  ParameterUsage,
  SatisfactionMetrics,
  BusinessEvent,
  FeedbackType,
  FeedbackStatus,
  SatisfactionRating,
  GetFeedbackQuery,
  ParameterValueAnalysis,
  BusinessValidationReport
} from '../../types/feedback.types';
import { Timestamp, Query, DocumentData } from 'firebase-admin/firestore';

export class FeedbackRepository extends BaseRepository<Feedback> {
  private readonly FEEDBACK_COLLECTION = 'feedbacks';
  private readonly PARAMETER_USAGE_COLLECTION = 'parameter_usage';
  private readonly SATISFACTION_METRICS_COLLECTION = 'satisfaction_metrics';
  private readonly BUSINESS_EVENTS_COLLECTION = 'business_events';

  constructor(db: any, collectionPath: string, schema: any) {
    super(db, collectionPath, schema);
  }

  // ============================================================================
  // MÉTODOS PARA FEEDBACK
  // ============================================================================

  /**
   * Cria um novo feedback
   */
  async createFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const feedbackData = {
        ...feedback,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await this.db.collection(this.FEEDBACK_COLLECTION).add(feedbackData);
      
      // Log do evento de criação de feedback
      await this.trackBusinessEvent({
        userId: feedback.userId,
        organizationId: feedback.organizationId,
        eventType: 'feedback_created',
        eventData: {
          feedbackId: docRef.id,
          type: feedback.type,
          rating: feedback.rating
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      throw new Error('Falha ao salvar feedback');
    }
  }

  /**
   * Busca feedbacks com filtros
   */
  async getFeedbacks(query: GetFeedbackQuery): Promise<Feedback[]> {
    try {
      let firestoreQuery: Query<DocumentData> = this.db.collection(this.FEEDBACK_COLLECTION);

      // Aplicar filtros
      if (query.organizationId) {
        firestoreQuery = firestoreQuery.where('organizationId', '==', query.organizationId);
      }
      if (query.userId) {
        firestoreQuery = firestoreQuery.where('userId', '==', query.userId);
      }
      if (query.type) {
        firestoreQuery = firestoreQuery.where('type', '==', query.type);
      }
      if (query.status) {
        firestoreQuery = firestoreQuery.where('status', '==', query.status);
      }
      if (query.startDate) {
        const startDate = typeof query.startDate === 'string' ? new Date(query.startDate) : query.startDate;
        firestoreQuery = firestoreQuery.where('createdAt', '>=', Timestamp.fromDate(startDate));
      }
      if (query.endDate) {
        const endDate = typeof query.endDate === 'string' ? new Date(query.endDate) : query.endDate;
        firestoreQuery = firestoreQuery.where('createdAt', '<=', Timestamp.fromDate(endDate));
      }

      // Ordenação e paginação
      firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
      
      if (query.limit) {
        firestoreQuery = firestoreQuery.limit(query.limit);
      }
      if (query.offset) {
        firestoreQuery = firestoreQuery.offset(query.offset);
      }

      const snapshot = await firestoreQuery.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      })) as Feedback[];
    } catch (error) {
      console.error('Erro ao buscar feedbacks:', error);
      throw new Error('Falha ao buscar feedbacks');
    }
  }

  /**
   * Atualiza status de um feedback
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    reviewedBy?: string,
    response?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (reviewedBy) {
        updateData.reviewedBy = reviewedBy;
        updateData.reviewedAt = Timestamp.fromDate(new Date());
      }

      if (response) {
        updateData.response = response;
      }

      await this.db.collection(this.FEEDBACK_COLLECTION).doc(feedbackId).update(updateData);
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error);
      throw new Error('Falha ao atualizar feedback');
    }
  }

  // ============================================================================
  // MÉTODOS PARA TRACKING DE PARÂMETROS
  // ============================================================================

  /**
   * Registra uso de parâmetro personalizado
   */
  async trackParameterUsage(usage: Omit<ParameterUsage, 'id' | 'createdAt'>): Promise<void> {
    try {
      // Verificar se já existe registro para este parâmetro/usuário
      const existingQuery = await this.db
        .collection(this.PARAMETER_USAGE_COLLECTION)
        .where('userId', '==', usage.userId)
        .where('parameterId', '==', usage.parameterId)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        // Atualizar registro existente
        const doc = existingQuery.docs[0];
        await doc.ref.update({
          usageCount: (doc.data().usageCount || 0) + 1,
          lastUsed: Timestamp.fromDate(new Date())
        });
      } else {
        // Criar novo registro
        await this.db.collection(this.PARAMETER_USAGE_COLLECTION).add({
          ...usage,
          createdAt: Timestamp.fromDate(new Date())
        });
      }

      // Log do evento de uso de parâmetro
      await this.trackBusinessEvent({
        userId: usage.userId,
        organizationId: usage.organizationId,
        eventType: 'parameter_used',
        eventData: {
          parameterId: usage.parameterId,
          parameterName: usage.parameterName,
          parameterType: usage.parameterType,
          analysisId: usage.analysisId
        }
      });
    } catch (error) {
      console.error('Erro ao registrar uso de parâmetro:', error);
      throw new Error('Falha ao registrar uso de parâmetro');
    }
  }

  /**
   * Busca estatísticas de uso de parâmetros
   */
  async getParameterUsageStats(organizationId: string, startDate?: Date | string, endDate?: Date | string): Promise<ParameterUsage[]> {
    try {
      let query: Query<DocumentData> = this.db
        .collection(this.PARAMETER_USAGE_COLLECTION)
        .where('organizationId', '==', organizationId);

      if (startDate) {
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        query = query.where('lastUsed', '>=', Timestamp.fromDate(start));
      }
      if (endDate) {
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        query = query.where('lastUsed', '<=', Timestamp.fromDate(end));
      }

      const snapshot = await query.orderBy('usageCount', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUsed: doc.data().lastUsed?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as ParameterUsage[];
    } catch (error) {
      console.error('Erro ao buscar estatísticas de parâmetros:', error);
      throw new Error('Falha ao buscar estatísticas de parâmetros');
    }
  }

  // ============================================================================
  // MÉTODOS PARA MÉTRICAS DE SATISFAÇÃO
  // ============================================================================

  /**
   * Calcula e salva métricas de satisfação para um período
   */
  async calculateSatisfactionMetrics(
    organizationId: string,
    period: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Promise<SatisfactionMetrics> {
    try {
      // Definir intervalo baseado no período
      const { startDate, endDate } = this.getPeriodRange(date, period);

      // Buscar feedbacks do período
      const feedbacks = await this.getFeedbacks({
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Calcular métricas
      const totalFeedbacks = feedbacks.length;
      const ratings = feedbacks.map(f => f.rating);
      const averageRating = totalFeedbacks > 0 ? ratings.reduce((a, b) => a + b, 0) / totalFeedbacks : 0;

      // Calcular NPS (Net Promoter Score)
      const promoters = ratings.filter(r => r >= 4).length;
      const detractors = ratings.filter(r => r <= 2).length;
      const npsScore = totalFeedbacks > 0 ? ((promoters - detractors) / totalFeedbacks) * 100 : 0;

      // Distribuição de satisfação
      const satisfactionDistribution = {
        veryDissatisfied: ratings.filter(r => r === 1).length,
        dissatisfied: ratings.filter(r => r === 2).length,
        neutral: ratings.filter(r => r === 3).length,
        satisfied: ratings.filter(r => r === 4).length,
        verySatisfied: ratings.filter(r => r === 5).length
      };

      // Top issues e feature requests
      const bugReports = feedbacks.filter(f => f.type === FeedbackType.BUG_REPORT);
      const featureRequests = feedbacks.filter(f => f.type === FeedbackType.FEATURE_REQUEST);
      
      const topIssues = this.extractTopKeywords(bugReports.map(f => f.description));
      const topFeatureRequests = this.extractTopKeywords(featureRequests.map(f => f.description));

      const metrics: SatisfactionMetrics = {
        organizationId,
        period,
        date,
        totalFeedbacks,
        averageRating,
        npsScore,
        satisfactionDistribution,
        topIssues,
        topFeatureRequests,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Salvar métricas
      const docRef = await this.db.collection(this.SATISFACTION_METRICS_COLLECTION).add({
        ...metrics,
        date: Timestamp.fromDate(date),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });

      return { ...metrics, id: docRef.id };
    } catch (error) {
      console.error('Erro ao calcular métricas de satisfação:', error);
      throw new Error('Falha ao calcular métricas de satisfação');
    }
  }

  // ============================================================================
  // MÉTODOS PARA EVENTOS DE NEGÓCIO
  // ============================================================================

  /**
   * Registra evento de negócio para análise
   */
  async trackBusinessEvent(event: Omit<BusinessEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.db.collection(this.BUSINESS_EVENTS_COLLECTION).add({
        ...event,
        timestamp: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Erro ao registrar evento de negócio:', error);
      // Não lançar erro para não interromper fluxo principal
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Define intervalo de datas baseado no período
   */
  private getPeriodRange(date: Date, period: 'daily' | 'weekly' | 'monthly'): { startDate: Date; endDate: Date } {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Extrai palavras-chave mais frequentes de uma lista de textos
   */
  private extractTopKeywords(texts: string[], limit: number = 5): string[] {
    const wordCount = new Map<string, number>();
    const stopWords = new Set(['o', 'a', 'de', 'da', 'do', 'que', 'e', 'é', 'em', 'um', 'uma', 'para', 'com', 'não', 'se', 'na', 'no']);

    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }
}