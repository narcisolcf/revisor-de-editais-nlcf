/**
 * Serviço de Alertas
 * 
 * Gerencia regras de alertas, monitora métricas críticas,
 * dispara notificações e controla escalação de alertas.
 */

import { Firestore } from 'firebase-admin/firestore';
import { 
  Alert, 
  AlertRule, 
  AlertSeverity, 
  AlertStatus,
  CreateAlertRuleRequest,
  GetAlertsQuery,
  NotificationChannel,
  AlertNotification 
} from '../types/monitoring.types';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';

export class AlertService {
  private db: Firestore;
  private logger: LoggingService;
  private metricsService: MetricsService;
  private activeRules: Map<string, AlertRule> = new Map();
  private alertCooldowns: Map<string, number> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();

  constructor(
    db: Firestore, 
    logger: LoggingService, 
    metricsService: MetricsService
  ) {
    this.db = db;
    this.logger = logger;
    this.metricsService = metricsService;
    this.loadAlertRules();
    this.loadNotificationChannels();
  }

  // ============================================================================
  // GERENCIAMENTO DE REGRAS DE ALERTA
  // ============================================================================

  /**
   * Cria uma nova regra de alerta
   */
  async createAlertRule(request: CreateAlertRuleRequest): Promise<AlertRule> {
    try {
      const alertRule: AlertRule = {
        id: this.generateId(),
        name: request.name,
        description: request.description,
        metric: request.metric,
        condition: request.condition,
        threshold: request.threshold,
        severity: request.severity,
        enabled: true,
        cooldownMinutes: request.cooldownMinutes || 5,
        notificationChannels: request.notificationChannels || [],
        tags: request.tags
      };

      // Salvar no Firestore
      await this.db.collection('alert_rules').doc(alertRule.id).set({
        ...alertRule,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Adicionar ao cache
      this.activeRules.set(alertRule.id, alertRule);

      this.logger.info(`Regra de alerta criada: ${alertRule.name}`, {
        function: 'createAlertRule',
        metadata: { ruleId: alertRule.id }
      });

      return alertRule;
    } catch (error) {
      this.logger.error(
        'Erro ao criar regra de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'createAlertRule',
          metadata: { ruleName: request.name }
        }
      );
      throw error;
    }
  }

  /**
   * Atualiza uma regra de alerta
   */
  async updateAlertRule(
    ruleId: string, 
    updates: Partial<CreateAlertRuleRequest>
  ): Promise<AlertRule> {
    try {
      const existingRule = this.activeRules.get(ruleId);
      if (!existingRule) {
        throw new Error('Regra de alerta não encontrada');
      }

      const updatedRule: AlertRule = {
        ...existingRule,
        ...updates,
        id: ruleId // Garantir que o ID não seja alterado
      };

      // Atualizar no Firestore
      await this.db.collection('alert_rules').doc(ruleId).update({
        ...updatedRule,
        updatedAt: new Date()
      });

      // Atualizar cache
      this.activeRules.set(ruleId, updatedRule);

      this.logger.info(`Regra de alerta atualizada: ${updatedRule.name}`, {
        function: 'updateAlertRule',
        metadata: { ruleId }
      });

      return updatedRule;
    } catch (error) {
      this.logger.error(
        'Erro ao atualizar regra de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'updateAlertRule',
          metadata: { ruleId }
        }
      );
      throw error;
    }
  }

  /**
   * Remove uma regra de alerta
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    try {
      // Remover do Firestore
      await this.db.collection('alert_rules').doc(ruleId).delete();

      // Remover do cache
      this.activeRules.delete(ruleId);
      this.alertCooldowns.delete(ruleId);

      this.logger.info(`Regra de alerta removida: ${ruleId}`, {
        function: 'deleteAlertRule',
        metadata: { ruleId }
      });
    } catch (error) {
      this.logger.error(
        'Erro ao remover regra de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'deleteAlertRule',
          metadata: { ruleId }
        }
      );
      throw error;
    }
  }

  /**
   * Lista todas as regras de alerta
   */
  async getAlertRules(enabled?: boolean): Promise<AlertRule[]> {
    try {
      let query = this.db.collection('alert_rules');
      
      if (enabled !== undefined) {
        query = query.where('enabled', '==', enabled) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlertRule[];
    } catch (error) {
      this.logger.error(
        'Erro ao buscar regras de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'getAlertRules'
        }
      );
      throw error;
    }
  }

  // ============================================================================
  // MONITORAMENTO E AVALIAÇÃO DE ALERTAS
  // ============================================================================

  /**
   * Avalia todas as regras de alerta ativas
   */
  async evaluateAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    try {
      for (const [ruleId, rule] of Array.from(this.activeRules.entries())) {
        if (!rule.enabled) continue;
        if (this.isInCooldown(ruleId)) continue;

        const alert = await this.evaluateRule(rule);
        if (alert) {
          triggeredAlerts.push(alert);
          this.setCooldown(ruleId, rule.cooldownMinutes);
        }
      }

      if (triggeredAlerts.length > 0) {
        this.logger.info(`${triggeredAlerts.length} alertas disparados`, {
        function: 'processAlerts',
        metadata: { triggeredCount: triggeredAlerts.length }
      });
      }

      return triggeredAlerts;
    } catch (error) {
      this.logger.error(
        'Erro ao avaliar alertas',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'evaluateAlerts'
        }
      );
      return [];
    }
  }

  /**
   * Avalia uma regra específica
   */
  private async evaluateRule(rule: AlertRule): Promise<Alert | null> {
    try {
      // Buscar valor atual da métrica
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 300000); // 5 minutos atrás
      
      const metricSummary = await this.metricsService.getMetricsSummary();

      if (metricSummary.count === 0) {
        return null; // Sem dados para avaliar
      }

      const currentValue = metricSummary.current;
      const threshold = rule.threshold;
      let conditionMet = false;

      // Avaliar condição
      switch (rule.condition) {
        case '>':
          conditionMet = currentValue > threshold;
          break;
        case '<':
          conditionMet = currentValue < threshold;
          break;
        case '>=':
          conditionMet = currentValue >= threshold;
          break;
        case '<=':
          conditionMet = currentValue <= threshold;
          break;
        case '==':
          conditionMet = currentValue === threshold;
          break;
        case '!=':
          conditionMet = currentValue !== threshold;
          break;
      }

      if (!conditionMet) {
        return null;
      }

      // Criar alerta
      const alert: Alert = {
        id: this.generateId(),
        ruleId: rule.id,
        status: AlertStatus.ACTIVE,
        severity: rule.severity,
        title: `${rule.name} - Limite ultrapassado`,
        description: `Métrica ${rule.metric} (${currentValue}) ${rule.condition} ${threshold}`,
        metric: rule.metric,
        currentValue,
        threshold,
        triggeredAt: new Date(),
        metadata: {
          ruleName: rule.name,
          metricSummary
        }
      };

      // Salvar alerta
      await this.saveAlert(alert);

      // Enviar notificações
      await this.sendNotifications(alert, rule);

      return alert;
    } catch (error) {
      this.logger.error(
        'Erro ao avaliar regra de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'evaluateRule',
          metadata: { ruleId: rule.id, ruleName: rule.name }
        }
      );
      return null;
    }
  }

  // ============================================================================
  // GERENCIAMENTO DE ALERTAS
  // ============================================================================

  /**
   * Salva um alerta no banco de dados
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      await this.db.collection('alerts').doc(alert.id).set({
        ...alert,
        createdAt: new Date()
      });

      this.logger.warn(`Alerta disparado: ${alert.title}`, {
        function: 'saveAlert',
        metadata: { alert }
      });
    } catch (error) {
      this.logger.error(
        'Erro ao salvar alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'saveAlert',
          metadata: { alertId: alert.id }
        }
      );
    }
  }

  /**
   * Reconhece um alerta
   */
  async acknowledgeAlert(
    alertId: string, 
    acknowledgedBy: string
  ): Promise<void> {
    try {
      await this.db.collection('alerts').doc(alertId).update({
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy,
        updatedAt: new Date()
      });

      this.logger.info(`Alerta reconhecido: ${alertId}`, {
        function: 'acknowledgeAlert',
        metadata: { alertId, acknowledgedBy }
      });
    } catch (error) {
      this.logger.error(
        'Erro ao reconhecer alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'acknowledgeAlert',
          metadata: { alertId, acknowledgedBy }
        }
      );
      throw error;
    }
  }

  /**
   * Resolve um alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.db.collection('alerts').doc(alertId).update({
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.info(`Alerta resolvido: ${alertId}`, {
        function: 'resolveAlert',
        metadata: { alertId }
      });
    } catch (error) {
      this.logger.error(
        'Erro ao resolver alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'resolveAlert',
          metadata: { alertId }
        }
      );
      throw error;
    }
  }

  /**
   * Busca alertas com filtros
   */
  async getAlerts(query: GetAlertsQuery): Promise<{
    alerts: Alert[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let firestoreQuery = this.db.collection('alerts')
        .orderBy('triggeredAt', 'desc');

      // Aplicar filtros
      if (query.status) {
        firestoreQuery = firestoreQuery.where('status', '==', query.status);
      }
      if (query.severity) {
        firestoreQuery = firestoreQuery.where('severity', '==', query.severity);
      }
      if (query.ruleId) {
        firestoreQuery = firestoreQuery.where('ruleId', '==', query.ruleId);
      }
      if (query.startDate) {
        firestoreQuery = firestoreQuery.where('triggeredAt', '>=', query.startDate);
      }
      if (query.endDate) {
        firestoreQuery = firestoreQuery.where('triggeredAt', '<=', query.endDate);
      }

      // Paginação
      const limit = query.limit ?? 50;
      const offset = query.offset ?? 0;
      
      if (offset > 0) {
        const offsetSnapshot = await firestoreQuery.limit(offset).get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          firestoreQuery = firestoreQuery.startAfter(lastDoc);
        }
      }

      const snapshot = await firestoreQuery.limit(limit + 1).get();
      const hasMore = snapshot.docs.length > limit;
      const alerts = snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];

      return {
        alerts,
        total: alerts.length,
        hasMore
      };
    } catch (error) {
      this.logger.error(
        'Erro ao buscar alertas',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'getAlerts',
          metadata: { query }
        }
      );
      throw error;
    }
  }

  // ============================================================================
  // SISTEMA DE NOTIFICAÇÕES
  // ============================================================================

  /**
   * Envia notificações para um alerta
   */
  private async sendNotifications(
    alert: Alert, 
    rule: AlertRule
  ): Promise<void> {
    try {
      const notifications: Promise<void>[] = [];

      for (const channelId of rule.notificationChannels) {
        const channel = this.notificationChannels.get(channelId);
        if (channel && channel.enabled) {
          notifications.push(this.sendNotification(alert, channel));
        }
      }

      await Promise.allSettled(notifications);
    } catch (error) {
      this.logger.error(
        'Erro ao enviar notificações',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'sendNotifications',
          metadata: { alertId: alert.id, ruleId: rule.id }
        }
      );
    }
  }

  /**
   * Envia notificação para um canal específico
   */
  private async sendNotification(
    alert: Alert, 
    channel: NotificationChannel
  ): Promise<void> {
    try {
      const notification: AlertNotification = {
        alert,
        channel,
        sentAt: new Date(),
        success: false
      };

      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        case 'sms':
          await this.sendSmsNotification(alert, channel);
          break;
        default:
          throw new Error(`Tipo de canal não suportado: ${channel.type}`);
      }

      notification.success = true;

      // Salvar registro da notificação
      await this.db.collection('alert_notifications').add({
        ...notification,
        createdAt: new Date()
      });

      this.logger.info(`Notificação enviada: ${channel.name}`, {
        function: 'sendNotification',
        metadata: { alertId: alert.id, channelId: channel.id }
      });
    } catch (error) {
      this.logger.error(
        'Erro ao enviar notificação',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'sendNotification',
          metadata: { alertId: alert.id, channelId: channel.id }
        }
      );

      // Salvar registro de falha
      await this.db.collection('alert_notifications').add({
        alert,
        channel,
        sentAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date()
      });
    }
  }

  /**
   * Envia notificação por email (implementação simulada)
   */
  private async sendEmailNotification(
    alert: Alert, 
    channel: NotificationChannel
  ): Promise<void> {
    // Em produção, integrar com serviço de email (SendGrid, SES, etc.)
    this.logger.info(`[EMAIL] ${alert.title}`, {
      function: 'sendEmailNotification',
      metadata: { 
        to: channel.config.email,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        body: alert.description
      }
    });
  }

  /**
   * Envia notificação para Slack (implementação simulada)
   */
  private async sendSlackNotification(
    alert: Alert, 
    channel: NotificationChannel
  ): Promise<void> {
    // Em produção, integrar com Slack API
    this.logger.info(`[SLACK] ${alert.title}`, {
      function: 'sendSlackNotification',
      metadata: { 
        webhook: channel.config.webhookUrl,
        message: `🚨 *${alert.title}*\n${alert.description}\nSeveridade: ${alert.severity}`
      }
    });
  }

  /**
   * Envia notificação via webhook (implementação simulada)
   */
  private async sendWebhookNotification(
    alert: Alert, 
    channel: NotificationChannel
  ): Promise<void> {
    // Em produção, fazer requisição HTTP para o webhook
    this.logger.info(`[WEBHOOK] ${alert.title}`, {
      function: 'sendWebhookNotification',
      metadata: { 
        url: channel.config.url,
        payload: {
          alert,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Envia notificação por SMS (implementação simulada)
   */
  private async sendSmsNotification(
    alert: Alert, 
    channel: NotificationChannel
  ): Promise<void> {
    // Em produção, integrar com serviço de SMS (Twilio, AWS SNS, etc.)
    this.logger.info(`[SMS] ${alert.title}`, {
      function: 'sendSmsNotification',
      metadata: { 
        to: channel.config.phoneNumber,
        message: `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}`
      }
    });
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Carrega regras de alerta do banco de dados
   */
  private async loadAlertRules(): Promise<void> {
    try {
      const snapshot = await this.db.collection('alert_rules')
        .where('enabled', '==', true)
        .get();

      this.activeRules.clear();
      snapshot.docs.forEach(doc => {
        const rule = { id: doc.id, ...doc.data() } as AlertRule;
        this.activeRules.set(rule.id, rule);
      });

      this.logger.info(`${this.activeRules.size} regras de alerta carregadas`, {
        function: 'loadAlertRules'
      });
    } catch (error) {
      this.logger.error(
        'Erro ao carregar regras de alerta',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'loadAlertRules'
        }
      );
    }
  }

  /**
   * Carrega canais de notificação do banco de dados
   */
  private async loadNotificationChannels(): Promise<void> {
    try {
      const snapshot = await this.db.collection('notification_channels')
        .where('enabled', '==', true)
        .get();

      this.notificationChannels.clear();
      snapshot.docs.forEach(doc => {
        const channel = { id: doc.id, ...doc.data() } as NotificationChannel;
        this.notificationChannels.set(channel.id, channel);
      });

      this.logger.info(`${this.notificationChannels.size} canais de notificação carregados`, {
        function: 'loadNotificationChannels'
      });
    } catch (error) {
      this.logger.error(
        'Erro ao carregar canais de notificação',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'loadNotificationChannels'
        }
      );
    }
  }

  /**
   * Verifica se uma regra está em cooldown
   */
  private isInCooldown(ruleId: string): boolean {
    const cooldownEnd = this.alertCooldowns.get(ruleId);
    if (!cooldownEnd) return false;
    return Date.now() < cooldownEnd;
  }

  /**
   * Define cooldown para uma regra
   */
  private setCooldown(ruleId: string, cooldownMinutes: number): void {
    const cooldownEnd = Date.now() + (cooldownMinutes * 60 * 1000);
    this.alertCooldowns.set(ruleId, cooldownEnd);
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS DE CONFIGURAÇÃO
  // ============================================================================

  /**
   * Recarrega regras e canais do banco de dados
   */
  async reload(): Promise<void> {
    await Promise.all([
      this.loadAlertRules(),
      this.loadNotificationChannels()
    ]);
  }

  /**
   * Obtém estatísticas de alertas
   */
  async getAlertStats(hours: number = 24): Promise<{
    total: number;
    active: number;
    resolved: number;
    acknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hours * 3600000));

      const snapshot = await this.db.collection('alerts')
        .where('triggeredAt', '>=', startDate)
        .where('triggeredAt', '<=', endDate)
        .get();

      const stats = {
        total: 0,
        active: 0,
        resolved: 0,
        acknowledged: 0,
        bySeverity: {
          [AlertSeverity.LOW]: 0,
          [AlertSeverity.MEDIUM]: 0,
          [AlertSeverity.HIGH]: 0,
          [AlertSeverity.CRITICAL]: 0
        }
      };

      snapshot.docs.forEach(doc => {
        const alert = doc.data() as Alert;
        stats.total++;
        
        switch (alert.status) {
          case AlertStatus.ACTIVE:
            stats.active++;
            break;
          case AlertStatus.RESOLVED:
            stats.resolved++;
            break;
          case AlertStatus.ACKNOWLEDGED:
            stats.acknowledged++;
            break;
        }
        
        stats.bySeverity[alert.severity]++;
      });

      return stats;
    } catch (error) {
      this.logger.error(
        'Erro ao obter estatísticas de alertas',
        error instanceof Error ? error : new Error(String(error)),
        {
          function: 'getAlertStats'
        }
      );
      throw error;
    }
  }
}