/**
 * Repositório para Sistema de Feedback e Validação de Negócio
 *
 * Gerencia a persistência de feedback dos usuários, métricas de satisfação
 * e tracking de uso de parâmetros personalizados no Firestore.
 */
import { BaseRepository } from './BaseRepository';
import { Feedback, ParameterUsage, SatisfactionMetrics, BusinessEvent, FeedbackStatus, GetFeedbackQuery } from '../../types/feedback.types';
export declare class FeedbackRepository extends BaseRepository<Feedback> {
    private readonly FEEDBACK_COLLECTION;
    private readonly PARAMETER_USAGE_COLLECTION;
    private readonly SATISFACTION_METRICS_COLLECTION;
    private readonly BUSINESS_EVENTS_COLLECTION;
    constructor(db: any, collectionPath: string, schema: any);
    /**
     * Cria um novo feedback
     */
    createFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    /**
     * Busca feedbacks com filtros
     */
    getFeedbacks(query: GetFeedbackQuery): Promise<Feedback[]>;
    /**
     * Atualiza status de um feedback
     */
    updateFeedbackStatus(feedbackId: string, status: FeedbackStatus, reviewedBy?: string, response?: string): Promise<void>;
    /**
     * Registra uso de parâmetro personalizado
     */
    trackParameterUsage(usage: Omit<ParameterUsage, 'id' | 'createdAt'>): Promise<void>;
    /**
     * Busca estatísticas de uso de parâmetros
     */
    getParameterUsageStats(organizationId: string, startDate?: Date | string, endDate?: Date | string): Promise<ParameterUsage[]>;
    /**
     * Calcula e salva métricas de satisfação para um período
     */
    calculateSatisfactionMetrics(organizationId: string, period: 'daily' | 'weekly' | 'monthly', date: Date): Promise<SatisfactionMetrics>;
    /**
     * Registra evento de negócio para análise
     */
    trackBusinessEvent(event: Omit<BusinessEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Define intervalo de datas baseado no período
     */
    private getPeriodRange;
    /**
     * Extrai palavras-chave mais frequentes de uma lista de textos
     */
    private extractTopKeywords;
}
