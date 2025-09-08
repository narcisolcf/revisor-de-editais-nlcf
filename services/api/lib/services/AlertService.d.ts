/**
 * Serviço de Alertas
 *
 * Gerencia regras de alertas, monitora métricas críticas,
 * dispara notificações e controla escalação de alertas.
 */
import { Firestore } from 'firebase-admin/firestore';
import { Alert, AlertRule, AlertSeverity, CreateAlertRuleRequest, GetAlertsQuery } from '../types/monitoring.types';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';
export declare class AlertService {
    private db;
    private logger;
    private metricsService;
    private activeRules;
    private alertCooldowns;
    private notificationChannels;
    constructor(db: Firestore, logger: LoggingService, metricsService: MetricsService);
    /**
     * Cria uma nova regra de alerta
     */
    createAlertRule(request: CreateAlertRuleRequest): Promise<AlertRule>;
    /**
     * Atualiza uma regra de alerta
     */
    updateAlertRule(ruleId: string, updates: Partial<CreateAlertRuleRequest>): Promise<AlertRule>;
    /**
     * Remove uma regra de alerta
     */
    deleteAlertRule(ruleId: string): Promise<void>;
    /**
     * Lista todas as regras de alerta
     */
    getAlertRules(enabled?: boolean): Promise<AlertRule[]>;
    /**
     * Avalia todas as regras de alerta ativas
     */
    evaluateAlerts(): Promise<Alert[]>;
    /**
     * Avalia uma regra específica
     */
    private evaluateRule;
    /**
     * Salva um alerta no banco de dados
     */
    private saveAlert;
    /**
     * Reconhece um alerta
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void>;
    /**
     * Resolve um alerta
     */
    resolveAlert(alertId: string): Promise<void>;
    /**
     * Busca alertas com filtros
     */
    getAlerts(query: GetAlertsQuery): Promise<{
        alerts: Alert[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Envia notificações para um alerta
     */
    private sendNotifications;
    /**
     * Envia notificação para um canal específico
     */
    private sendNotification;
    /**
     * Envia notificação por email (implementação simulada)
     */
    private sendEmailNotification;
    /**
     * Envia notificação para Slack (implementação simulada)
     */
    private sendSlackNotification;
    /**
     * Envia notificação via webhook (implementação simulada)
     */
    private sendWebhookNotification;
    /**
     * Envia notificação por SMS (implementação simulada)
     */
    private sendSmsNotification;
    /**
     * Carrega regras de alerta do banco de dados
     */
    private loadAlertRules;
    /**
     * Carrega canais de notificação do banco de dados
     */
    private loadNotificationChannels;
    /**
     * Verifica se uma regra está em cooldown
     */
    private isInCooldown;
    /**
     * Define cooldown para uma regra
     */
    private setCooldown;
    /**
     * Gera ID único
     */
    private generateId;
    /**
     * Recarrega regras e canais do banco de dados
     */
    reload(): Promise<void>;
    /**
     * Obtém estatísticas de alertas
     */
    getAlertStats(hours?: number): Promise<{
        total: number;
        active: number;
        resolved: number;
        acknowledged: number;
        bySeverity: Record<AlertSeverity, number>;
    }>;
}
