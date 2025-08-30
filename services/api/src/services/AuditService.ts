/**
 * Serviço de Auditoria
 * LicitaReview - Sistema de Análise de Editais
 */

import { LoggingService } from './LoggingService';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export class AuditService {
  private entries: AuditEntry[] = [];
  private logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Registrar entrada de auditoria
   */
  async logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry
    };

    // Armazenar em memória para testes
    this.entries.push(auditEntry);

    // Log estruturado
    this.logger.audit('Audit entry recorded', {
      auditId: auditEntry.id,
      userId: auditEntry.userId,
      action: auditEntry.action,
      resource: auditEntry.resource,
      success: auditEntry.success,
      ipAddress: auditEntry.ipAddress,
      userAgent: auditEntry.userAgent,
      details: auditEntry.details,
      metadata: auditEntry.metadata
    });

    // Em produção, aqui salvaria no Firestore
    // await this.saveToFirestore(auditEntry);
  }

  /**
   * Buscar entradas de auditoria
   */
  async getAuditEntries(filter: AuditFilter = {}, limit: number = 100): Promise<AuditEntry[]> {
    let filtered = this.entries;

    // Aplicar filtros
    if (filter.userId) {
      filtered = filtered.filter(entry => entry.userId === filter.userId);
    }

    if (filter.action) {
      filtered = filtered.filter(entry => entry.action === filter.action);
    }

    if (filter.resource) {
      filtered = filtered.filter(entry => entry.resource === filter.resource);
    }

    if (filter.success !== undefined) {
      filtered = filtered.filter(entry => entry.success === filter.success);
    }

    if (filter.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= filter.endDate!);
    }

    // Ordenar por timestamp (mais recente primeiro)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar limite
    return filtered.slice(0, limit);
  }

  /**
   * Obter estatísticas de auditoria
   */
  async getAuditStats(filter: AuditFilter = {}): Promise<{
    total: number;
    successful: number;
    failed: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
  }> {
    const entries = await this.getAuditEntries(filter, 10000);

    const successful = entries.filter(e => e.success).length;
    const failed = entries.length - successful;
    const uniqueUsers = new Set(entries.map(e => e.userId).filter(Boolean)).size;

    // Contar ações
    const actionCounts = entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Contar recursos
    const resourceCounts = entries.reduce((acc, entry) => {
      acc[entry.resource] = (acc[entry.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: entries.length,
      successful,
      failed,
      uniqueUsers,
      topActions,
      topResources
    };
  }

  /**
   * Limpar entradas de auditoria (apenas para testes)
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Obter todas as entradas (apenas para testes)
   */
  getAllEntries(): AuditEntry[] {
    return [...this.entries];
  }

  /**
   * Gerar ID único
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salvar no Firestore (implementação futura)
   */
  private async saveToFirestore(entry: AuditEntry): Promise<void> {
    // Implementar quando necessário
    // const db = getFirestore();
    // await db.collection('audit_logs').add(entry);
  }

  /**
   * Registrar acesso a endpoint
   */
  async logEndpointAccess({
    userId,
    method,
    path,
    statusCode,
    responseTime,
    ipAddress,
    userAgent,
    requestSize,
    responseSize,
    metadata
  }: {
    userId?: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    ipAddress?: string;
    userAgent?: string;
    requestSize?: number;
    responseSize?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logAudit({
      userId,
      action: 'endpoint_access',
      resource: `${method} ${path}`,
      success: statusCode < 400,
      details: {
        method,
        path,
        statusCode,
        responseTime,
        requestSize,
        responseSize
      },
      ipAddress,
      userAgent,
      metadata
    });
  }

  /**
   * Registrar tentativa de autenticação
   */
  async logAuthAttempt({
    userId,
    email,
    success,
    reason,
    ipAddress,
    userAgent,
    metadata
  }: {
    userId?: string;
    email?: string;
    success: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logAudit({
      userId,
      action: 'authentication',
      resource: 'auth_system',
      success,
      details: {
        email,
        reason
      },
      ipAddress,
      userAgent,
      metadata,
      errorMessage: success ? undefined : reason
    });
  }

  /**
   * Registrar violação de segurança
   */
  async logSecurityViolation({
    userId,
    violationType,
    details,
    ipAddress,
    userAgent,
    metadata
  }: {
    userId?: string;
    violationType: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logAudit({
      userId,
      action: 'security_violation',
      resource: violationType,
      success: false,
      details,
      ipAddress,
      userAgent,
      metadata,
      errorMessage: `Security violation: ${violationType}`
    });

    // Log crítico para violações de segurança
    this.logger.error(
      'Security violation detected',
      new Error(`Security violation: ${violationType}`),
      {
        userId,
        violationType,
        details,
        ipAddress,
        userAgent
      }
    );
  }

  /**
   * Registrar evento genérico
   */
  async logEvent({
    userId,
    action,
    resource,
    success = true,
    details = {},
    ipAddress,
    userAgent,
    metadata,
    errorMessage
  }: {
    userId?: string;
    action: string;
    resource: string;
    success?: boolean;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }): Promise<void> {
    await this.logAudit({
      userId,
      action,
      resource,
      success,
      details,
      ipAddress,
      userAgent,
      metadata,
      errorMessage
    });
  }
}