/**
 * Middleware de Segurança
 * 
 * Implementa headers de segurança, rate limiting,
 * auditoria de acesso e proteções contra ataques.
 */

import { Request, Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';
import { UserContext } from '../types';

// Interfaces
interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  audit: {
    enabled: boolean;
    sensitiveFields: string[];
    excludePaths: string[];
  };
  headers: {
    contentSecurityPolicy?: string;
    strictTransportSecurity?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    referrerPolicy?: string;
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode?: number;
  responseTime?: number;
  requestSize: number;
  responseSize?: number;
  sensitive: boolean;
  blocked: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

// Configuração padrão de segurança
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // 100 requests por janela
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  audit: {
    enabled: true,
    sensitiveFields: [
      'password', 'token', 'apiKey', 'secret', 'authorization',
      'cookie', 'session', 'credit_card', 'ssn', 'cpf'
    ],
    excludePaths: ['/health', '/metrics']
  },
  headers: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
};

/**
 * Classe para gerenciar segurança da aplicação
 */
export class SecurityManager {
  private db: FirebaseFirestore.Firestore;
  private logger: LoggingService;
  private metrics: MetricsService;
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    db: FirebaseFirestore.Firestore,
    logger: LoggingService,
    metrics: MetricsService,
    config: Partial<SecurityConfig> = {}
  ) {
    this.db = db;
    this.logger = logger;
    this.metrics = metrics;
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };

    // Limpar entradas expiradas do rate limit a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRateLimits();
    }, 5 * 60 * 1000);
  }

  /**
   * Middleware para aplicar headers de segurança
   */
  securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    const { headers } = this.config;

    // Content Security Policy
    if (headers.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', headers.contentSecurityPolicy);
    }

    // Strict Transport Security
    if (headers.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', headers.strictTransportSecurity);
    }

    // X-Frame-Options
    if (headers.xFrameOptions) {
      res.setHeader('X-Frame-Options', headers.xFrameOptions);
    }

    // X-Content-Type-Options
    if (headers.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', headers.xContentTypeOptions);
    }

    // Referrer Policy
    if (headers.referrerPolicy) {
      res.setHeader('Referrer-Policy', headers.referrerPolicy);
    }

    // Headers adicionais de segurança
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.removeHeader('X-Powered-By');

    next();
  };

  /**
   * Middleware de rate limiting
   */
  rateLimit = (req: Request, res: Response, next: NextFunction): void => {
    const clientId = this.getClientId(req);
    const now = Date.now();
    const { windowMs, maxRequests } = this.config.rateLimit;

    // Verificar se o cliente está no rate limit
    let entry = this.rateLimitStore.get(clientId);
    
    if (!entry || now > entry.resetTime) {
      // Nova janela de tempo
      entry = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false
      };
    }

    entry.count++;

    // Verificar se excedeu o limite
    if (entry.count > maxRequests) {
      entry.blocked = true;
      this.rateLimitStore.set(clientId, entry);

      // Log do bloqueio
      this.logger.warn('Rate limit excedido', {
        function: 'rateLimit',
        metadata: {
          clientId,
          count: entry.count,
          maxRequests,
          windowMs,
          ip: this.getClientIp(req),
          userAgent: req.get('User-Agent')
        }
      });

      // Métricas
      this.metrics.incrementCounter('security.rate_limit.blocked', 1, {
        clientId,
        ip: this.getClientIp(req)
      });

      res.status(429).json({
        success: false,
        error: 'Muitas requisições',
        message: 'Rate limit excedido. Tente novamente mais tarde.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    this.rateLimitStore.set(clientId, entry);

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

    next();
  };

  /**
   * Middleware de auditoria de acesso
   */
  auditAccess = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.config.audit.enabled) {
      return next();
    }

    // Verificar se o path deve ser excluído da auditoria
    const shouldExclude = this.config.audit.excludePaths.some(path => 
      req.path.startsWith(path)
    );

    if (shouldExclude) {
      return next();
    }

    const startTime = Date.now();
    const requestSize = this.getRequestSize(req);
    const sensitive = this.containsSensitiveData(req);

    // Interceptar a resposta para capturar dados
    const originalSend = res.send;
    let responseSize = 0;

    res.send = function(data: any) {
      responseSize = Buffer.byteLength(data || '', 'utf8');
      return originalSend.call(this, data);
    };

    // Continuar com a requisição
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      
      try {
        await this.logAuditEntry({
          id: req.requestId || this.generateId(),
          timestamp: new Date(),
          userId: (req as any).user?.uid,
          organizationId: (req as any).user?.organizationId,
          ip: this.getClientIp(req),
          userAgent: req.get('User-Agent') || '',
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestSize,
          responseSize,
          sensitive,
          blocked: res.statusCode === 429 || res.statusCode === 403,
          reason: res.statusCode >= 400 ? this.getErrorReason(res.statusCode) : undefined,
          metadata: {
            query: req.query,
            params: req.params,
            headers: this.sanitizeHeaders(req.headers)
          }
        });

        // Métricas de auditoria
        this.metrics.incrementCounter('security.audit.logged', 1, {
          method: req.method,
          statusCode: res.statusCode.toString(),
          sensitive: sensitive.toString()
        });

        this.metrics.recordHistogram('security.audit.response_time', responseTime, {
          method: req.method,
          path: req.route?.path || req.path
        });

      } catch (error) {
        this.logger.error(
          'Erro ao registrar auditoria',
          error instanceof Error ? error : new Error(String(error)),
          {
            function: 'auditAccess',
            requestId: req.requestId,
            method: req.method,
            path: req.path
          }
        );
      }
    });

    next();
  };

  /**
   * Middleware de proteção contra ataques
   */
  attackProtection = (req: Request, res: Response, next: NextFunction): void => {
    const suspicious = this.detectSuspiciousActivity(req);
    
    if (suspicious.detected) {
      this.logger.warn('Atividade suspeita detectada', {
        metadata: {
          function: 'attackProtection',
          ip: this.getClientIp(req),
          userAgent: req.get('User-Agent'),
          method: req.method,
          path: req.path,
          reasons: suspicious.reasons,
          severity: suspicious.severity
        }
      });

      this.metrics.incrementCounter('security.attack.detected', 1, {
        type: suspicious.type,
        severity: suspicious.severity,
        ip: this.getClientIp(req)
      });

      if (suspicious.severity === 'high') {
        res.status(403).json({
          success: false,
          error: 'Acesso negado',
          message: 'Atividade suspeita detectada'
        });
        return;
      }
    }

    next();
  };

  /**
   * Obter ID do cliente para rate limiting
   */
  private getClientId(req: Request): string {
    const user = (req as any).user as UserContext;
    if (user?.uid) {
      return `user:${user.uid}`;
    }
    return `ip:${this.getClientIp(req)}`;
  }

  /**
   * Obter IP do cliente
   */
  private getClientIp(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Calcular tamanho da requisição
   */
  private getRequestSize(req: Request): number {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    // Estimar baseado no body
    if (req.body) {
      return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    }
    
    return 0;
  }

  /**
   * Verificar se contém dados sensíveis
   */
  private containsSensitiveData(req: Request): boolean {
    const { sensitiveFields } = this.config.audit;
    const content = JSON.stringify({
      body: req.body,
      query: req.query,
      headers: req.headers
    }).toLowerCase();

    return sensitiveFields.some(field => 
      content.includes(field.toLowerCase())
    );
  }

  /**
   * Sanitizar headers para auditoria
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const { sensitiveFields } = this.config.audit;

    for (const [key, value] of Object.entries(headers)) {
      const isSensitive = sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      sanitized[key] = isSensitive ? '[REDACTED]' : String(value);
    }

    return sanitized;
  }

  /**
   * Detectar atividade suspeita
   */
  private detectSuspiciousActivity(req: Request): {
    detected: boolean;
    type: string;
    severity: 'low' | 'medium' | 'high';
    reasons: string[];
  } {
    const reasons: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let type = 'unknown';

    // Verificar SQL Injection
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
    ];
    
    const content = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (sqlPatterns.some(pattern => pattern.test(content))) {
      reasons.push('Possível SQL Injection');
      severity = 'high';
      type = 'sql_injection';
    }

    // Verificar XSS
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    if (xssPatterns.some(pattern => pattern.test(content))) {
      reasons.push('Possível XSS');
      severity = severity === 'high' ? 'high' : 'medium';
      type = type === 'sql_injection' ? 'mixed' : 'xss';
    }

    // Verificar Path Traversal
    if (content.includes('../') || content.includes('..\\')) {
      reasons.push('Possível Path Traversal');
      severity = 'medium';
      type = type === 'unknown' ? 'path_traversal' : 'mixed';
    }

    // Verificar User-Agent suspeito
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = [
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp'
    ];

    if (suspiciousAgents.some(agent => 
      userAgent.toLowerCase().includes(agent)
    )) {
      reasons.push('User-Agent suspeito');
      severity = 'medium';
      type = type === 'unknown' ? 'scanner' : 'mixed';
    }

    return {
      detected: reasons.length > 0,
      type,
      severity,
      reasons
    };
  }

  /**
   * Registrar entrada de auditoria
   */
  private async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      await this.db.collection('audit_logs').add({
        ...entry,
        timestamp: entry.timestamp
      });
    } catch (error) {
      // Falha silenciosa para não impactar a aplicação
      console.error('Erro ao salvar log de auditoria:', error);
    }
  }

  /**
   * Obter razão do erro baseado no status code
   */
  private getErrorReason(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 429: return 'Rate Limited';
      case 500: return 'Internal Server Error';
      default: return `HTTP ${statusCode}`;
    }
  }

  /**
   * Gerar ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Limpar entradas expiradas do rate limit
   */
  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Destruir recursos
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instância global do gerenciador de segurança
let securityManager: SecurityManager;

/**
 * Inicializar o gerenciador de segurança
 */
export function initializeSecurity(
  db: FirebaseFirestore.Firestore,
  logger: LoggingService,
  metrics: MetricsService,
  config?: Partial<SecurityConfig>
): SecurityManager {
  securityManager = new SecurityManager(db, logger, metrics, config);
  return securityManager;
}

/**
 * Obter instância do gerenciador de segurança
 */
export function getSecurityManager(): SecurityManager {
  if (!securityManager) {
    throw new Error('SecurityManager não foi inicializado. Chame initializeSecurity() primeiro.');
  }
  return securityManager;
}

// Exportar middlewares individuais para uso direto
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  getSecurityManager().securityHeaders(req, res, next);
};

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  getSecurityManager().rateLimit(req, res, next);
};

export const auditAccess = (options?: { sensitive?: boolean }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (options?.sensitive) {
      // Marcar requisição como sensível
      (req as any).isSensitive = true;
    }
    getSecurityManager().auditAccess(req, res, next);
  };
};

// Versão sem parâmetros para compatibilidade
export const auditAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
  getSecurityManager().auditAccess(req, res, next);
};

export const attackProtection = (req: Request, res: Response, next: NextFunction) => {
  getSecurityManager().attackProtection(req, res, next);
};