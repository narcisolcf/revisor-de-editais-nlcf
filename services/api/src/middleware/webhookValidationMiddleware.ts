import { Request, Response, NextFunction } from 'express';
import { WebhookSecurityService, WebhookSecurityConfig, WebhookValidationResult } from '../services/WebhookSecurityService';
import { logger } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';

/**
 * Request estendido com informações do webhook validado
 */
export interface WebhookRequest extends Request {
  webhook?: {
    validated: boolean;
    signature: string;
    timestamp: number;
    eventType: string;
    validationResult: WebhookValidationResult;
  };
}

/**
 * Opções para o middleware de validação de webhook
 */
export interface WebhookValidationOptions {
  config: WebhookSecurityConfig;
  metricsService?: MetricsService;
  skipValidation?: boolean;
  customErrorHandler?: (error: WebhookValidationResult, req: Request, res: Response) => void;
}

/**
 * Classe para middleware de validação de webhooks
 */
export class WebhookValidationMiddleware {
  private securityService: WebhookSecurityService;
  private options: WebhookValidationOptions;

  constructor(options: WebhookValidationOptions) {
    this.options = options;
    this.securityService = new WebhookSecurityService(
      options.config,
      options.metricsService
    );
  }

  /**
   * Middleware principal de validação
   */
  validate() {
    return async (req: WebhookRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // Pular validação se configurado
        if (this.options.skipValidation) {
          logger.debug('Validação de webhook pulada por configuração');
          return next();
        }

        // Validar webhook
        const validationResult = await this.securityService.validateWebhook(req);
        
        // Adicionar informações do webhook à requisição
        req.webhook = {
          validated: validationResult.valid,
          signature: req.headers[this.options.config.signatureHeader] as string || '',
          timestamp: parseInt(req.headers[this.options.config.timestampHeader] as string || '0'),
          eventType: req.body?.event_type || req.body?.type || 'unknown',
          validationResult
        };

        // Se validação falhou
        if (!validationResult.valid) {
          logger.warn('Validação de webhook falhou', {
            error: validationResult.error,
            code: validationResult.code,
            details: validationResult.details,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            duration: Date.now() - startTime
          });

          // Usar handler customizado se fornecido
          if (this.options.customErrorHandler) {
            return this.options.customErrorHandler(validationResult, req, res);
          }

          // Handler padrão de erro
          return this.handleValidationError(validationResult, res);
        }

        // Validação bem-sucedida
        logger.info('Webhook validado com sucesso', {
          eventType: req.webhook.eventType,
          timestamp: req.webhook.timestamp,
          duration: Date.now() - startTime,
          ip: req.ip
        });

        next();
      } catch (error) {
        logger.error('Erro no middleware de validação de webhook:', error as Error);
        
        // Adicionar informações de erro à requisição
        req.webhook = {
          validated: false,
          signature: '',
          timestamp: 0,
          eventType: 'unknown',
          validationResult: {
            valid: false,
            error: 'Erro interno na validação',
            code: 'MIDDLEWARE_ERROR'
          }
        };

        res.status(500).json({
          error: 'Erro interno na validação do webhook',
          code: 'MIDDLEWARE_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Middleware para validação apenas de assinatura
   */
  validateSignatureOnly() {
    return (req: WebhookRequest, res: Response, next: NextFunction) => {
      try {
        const signature = req.headers[this.options.config.signatureHeader] as string;
        const timestamp = req.headers[this.options.config.timestampHeader] as string;
        
        if (!signature) {
          return res.status(401).json({
            error: 'Assinatura do webhook não encontrada',
            code: 'SIGNATURE_MISSING'
          });
        }

        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const validationResult = this.securityService.validateSignature(payload, signature, timestamp);

        if (!validationResult.valid) {
          logger.warn('Validação de assinatura falhou', {
            error: validationResult.error,
            code: validationResult.code
          });
          
          return res.status(401).json({
            error: validationResult.error,
            code: validationResult.code
          });
        }

        // Adicionar informações básicas à requisição
        req.webhook = {
          validated: true,
          signature,
          timestamp: parseInt(timestamp || '0'),
          eventType: req.body?.event_type || req.body?.type || 'unknown',
          validationResult
        };

        next();
      } catch (error) {
        logger.error('Erro na validação de assinatura:', error as Error);
        res.status(500).json({
          error: 'Erro interno na validação de assinatura',
          code: 'SIGNATURE_VALIDATION_ERROR'
        });
      }
    };
  }

  /**
   * Middleware para rate limiting baseado em webhook
   */
  rateLimit(maxRequests: number, windowMs: number) {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();
    
    return (req: WebhookRequest, res: Response, next: NextFunction) => {
      const clientId = this.getClientIdentifier(req);
      const now = Date.now();
      
      // Limpar contadores expirados
      for (const [key, data] of Array.from(requestCounts.entries())) {
        if (now > data.resetTime) {
          requestCounts.delete(key);
        }
      }
      
      // Verificar limite para cliente atual
      const clientData = requestCounts.get(clientId);
      
      if (!clientData) {
        // Primeiro request do cliente
        requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
      } else if (clientData.count >= maxRequests) {
        // Limite excedido
        logger.warn('Rate limit excedido para webhook', {
          clientId,
          count: clientData.count,
          maxRequests,
          resetTime: new Date(clientData.resetTime).toISOString()
        });
        
        return res.status(429).json({
          error: 'Rate limit excedido',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      } else {
        // Incrementar contador
        clientData.count++;
      }
      
      next();
    };
  }

  /**
   * Middleware para logging de webhooks
   */
  logWebhook() {
    return (req: WebhookRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Log da requisição
      logger.info('Webhook recebido', {
        method: req.method,
        url: req.url,
        eventType: req.body?.event_type || req.body?.type,
        contentLength: req.headers['content-length'],
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      // Interceptar resposta para log
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        
        logger.info('Webhook processado', {
          statusCode: res.statusCode,
          duration,
          responseSize: data ? data.length : 0,
          validated: req.webhook?.validated || false
        });
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Obtém estatísticas do middleware
   */
  getStats() {
    return this.securityService.getSecurityStats();
  }

  /**
   * Finaliza o middleware e limpa recursos
   */
  shutdown() {
    this.securityService.shutdown();
  }

  /**
   * Alias para shutdown() - limpa recursos
   */
  cleanup() {
    this.shutdown();
  }

  // Métodos privados

  private handleValidationError(validationResult: WebhookValidationResult, res: Response) {
    const statusCode = this.getStatusCodeForError(validationResult.code);
    
    res.status(statusCode).json({
      error: validationResult.error,
      code: validationResult.code,
      details: validationResult.details,
      timestamp: new Date().toISOString()
    });
  }

  private getStatusCodeForError(code?: string): number {
    switch (code) {
      case 'SIGNATURE_MISSING':
      case 'SIGNATURE_INVALID':
      case 'TIMESTAMP_MISSING':
        return 401; // Unauthorized
      case 'TIMESTAMP_EXPIRED':
      case 'TIMESTAMP_INVALID_FORMAT':
        return 400; // Bad Request
      case 'PAYLOAD_TOO_LARGE':
        return 413; // Payload Too Large
      case 'EVENT_TYPE_MISSING':
      case 'EVENT_TYPE_NOT_ALLOWED':
        return 400; // Bad Request
      case 'REPLAY_ATTACK_DETECTED':
        return 409; // Conflict
      default:
        return 500; // Internal Server Error
    }
  }

  private getClientIdentifier(req: Request): string {
    // Usar IP + User-Agent como identificador do cliente
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}_${userAgent}`;
  }
}

/**
 * Factory function para criar middleware de validação
 */
export function createWebhookValidation(options: WebhookValidationOptions) {
  return new WebhookValidationMiddleware(options);
}

/**
 * Middleware simples para validação de webhook
 */
export function validateWebhook(config: WebhookSecurityConfig) {
  const middleware = new WebhookValidationMiddleware({ config });
  return middleware.validate();
}

/**
 * Middleware simples para validação apenas de assinatura
 */
export function validateSignature(config: WebhookSecurityConfig) {
  const middleware = new WebhookValidationMiddleware({ config });
  return middleware.validateSignatureOnly();
}