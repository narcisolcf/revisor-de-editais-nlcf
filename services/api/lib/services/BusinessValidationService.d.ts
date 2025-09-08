/**
 * Serviço de Validação de Negócio
 *
 * Orquestra a coleta de feedback dos usuários, análise de métricas de satisfação
 * e validação de hipóteses de negócio para o sistema LicitaReview.
 */
import { Feedback, FeedbackStatus, CreateFeedbackRequest, FeedbackResponse, GetFeedbackQuery, ParameterValueAnalysis, BusinessValidationReport, BusinessMetricsResponse } from '../types/feedback.types';
export declare class BusinessValidationService {
    private feedbackRepository;
    private notificationService;
    constructor(projectId?: string);
    /**
     * Cria um novo feedback do usuário
     */
    createFeedback(userId: string, organizationId: string, feedbackData: CreateFeedbackRequest): Promise<FeedbackResponse>;
    /**
     * Busca feedbacks com filtros
     */
    getFeedbacks(query: GetFeedbackQuery): Promise<Feedback[]>;
    /**
     * Atualiza status de um feedback (para equipe de suporte)
     */
    updateFeedbackStatus(feedbackId: string, status: FeedbackStatus, reviewedBy: string, response?: string): Promise<void>;
    /**
     * Registra uso de parâmetro personalizado
     */
    trackParameterUsage(userId: string, organizationId: string, analysisId: string, parameterId: string, parameterName: string, parameterType: 'custom' | 'default' | 'template'): Promise<void>;
    /**
     * Analisa valor e efetividade dos parâmetros personalizados
     */
    analyzeParameterValue(organizationId: string, days?: number): Promise<ParameterValueAnalysis[]>;
    /**
     * Gera relatório de validação de hipóteses de negócio
     */
    generateBusinessValidationReport(organizationId: string, startDate: Date, endDate: Date): Promise<BusinessValidationReport>;
    /**
     * Obtém métricas consolidadas de negócio
     */
    getBusinessMetrics(organizationId: string, days?: number): Promise<BusinessMetricsResponse>;
    private validateFeedbackData;
    private notifyLowSatisfactionFeedback;
    private notifyFeedbackResponse;
    private calculateWeeklyTrend;
    private calculateMonthlyTrend;
    private calculateRetentionRate;
    private calculateEffectivenessScore;
    private validateCustomParametersHypothesis;
    private analyzeSatisfactionTrend;
    private calculateFeatureAdoption;
    private generateRecommendations;
    private generateNextActions;
    private calculateTrends;
}
