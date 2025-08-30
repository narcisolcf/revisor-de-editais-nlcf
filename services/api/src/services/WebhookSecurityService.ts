import * as crypto from 'crypto';
import { Request } from 'express';
import { LoggingService } from './LoggingService';

// Interface simplificada para logging
interface ILogger {
  debug(message: string, context?: any): Promise<void>;
  info(message: string, context?: any): Promise<void>;
  warn(message: string, context?: any): Promise<void>;
  error(message: string, context?: any): Promise<void>;
  fatal(message: string, context?: any): Promise<void>;
}
import { MetricsService } from './MetricsService';

/**
 * Configuração de segurança para webhooks
 */
export interface WebhookSecurityConfig {
  secretKey: string;
  timestampTolerance: number; // em segundos
  signatureHeader: string;
  timestampHeader: string;
  maxPayloadSize: number; // em bytes
  allowedEvents: string[];
  enableReplayProtection: boolean;
  replayWindowSize: number; // em segundos
}

/**
 * Resultado da validação de webhook
 */
export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  details?: {
    signatureValid?: boolean;
    timestampValid?: boolean;
    payloadSizeValid?: boolean;
    eventTypeValid?: boolean;
    replayCheckPassed?: boolean;
  };
}

/**
 * Informações do webhook validado
 */
export interface ValidatedWebhook {
  payload: any;
  signature: string;
  timestamp: number;
  eventType: string;
  requestId: string;
}

/**
 * Serviço de segurança para webhooks
 */
export class WebhookSecurityService {
  private replayCache = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private metricsService: MetricsService;
  private logger: ILogger;

  constructor(
    private config: WebhookSecurityConfig,
    metricsService?: MetricsService,
    logger?: ILogger
  ) {
    this.logger = logger || {
      debug: () => Promise.resolve(),
      info: () => Promise.resolve(),
      warn: () => Promise.resolve(),
      error: () => Promise.resolve(),
      fatal: () => Promise.resolve()
    };
    this.metricsService = metricsService || {
      recordMetric: () => Promise.resolve(),
      recordTimer: () => Promise.resolve(),
      getMetrics: () => 'Métricas não disponíveis - serviço não configurado'
    } as any;
    
    if (this.config.enableReplayProtection) {
      this.startReplayCacheCleanup();
    }
  }

  /**
   * Valida webhook completo
   */
  async validateWebhook(req: Request): Promise<WebhookValidationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validar tamanho do payload
      const payloadSizeResult = this.validatePayloadSize(req);
      if (!payloadSizeResult.valid) {
        this.recordValidationMetrics('payload_size_invalid', Date.now() - startTime);
        return payloadSizeResult;
      }

      // 2. Extrair headers necessários
      const signature = req.headers[this.config.signatureHeader] as string;
      const timestamp = req.headers[this.config.timestampHeader] as string;
      
      if (!signature) {
        this.recordValidationMetrics('signature_missing', Date.now() - startTime);
        return {
          valid: false,
          error: 'Assinatura do webhook não encontrada',
          code: 'SIGNATURE_MISSING',
          details: { signatureValid: false }
        };
      }

      // 3. Validar timestamp
      const timestampResult = this.validateTimestamp(timestamp);
      if (!timestampResult.valid) {
        this.recordValidationMetrics('timestamp_invalid', Date.now() - startTime);
        return timestampResult;
      }

      // 4. Validar assinatura
      const payload = this.getPayloadString(req);
      const signatureResult = this.validateSignature(payload, signature, timestamp);
      if (!signatureResult.valid) {
        this.recordValidationMetrics('signature_invalid', Date.now() - startTime);
        return signatureResult;
      }

      // 5. Validar tipo de evento
      const eventType = req.body?.event_type || req.body?.type;
      const eventResult = this.validateEventType(eventType);
      if (!eventResult.valid) {
        this.recordValidationMetrics('event_type_invalid', Date.now() - startTime);
        return eventResult;
      }

      // 6. Verificar replay attack
      if (this.config.enableReplayProtection) {
        const replayResult = this.checkReplayAttack(signature, parseInt(timestamp));
        if (!replayResult.valid) {
          this.recordValidationMetrics('replay_attack_detected', Date.now() - startTime);
          return replayResult;
        }
      }

      // Registrar sucesso
      this.recordValidationMetrics('validation_success', Date.now() - startTime);
      
      this.logger.info('Webhook validado com sucesso', {
        function: 'validateWebhook',
        metadata: {
          eventType,
          timestamp: parseInt(timestamp),
          payloadSize: payload.length,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return {
        valid: true,
        details: {
          signatureValid: true,
          timestampValid: true,
          payloadSizeValid: true,
          eventTypeValid: true,
          replayCheckPassed: true
        }
      };
    } catch (error) {
      this.recordValidationMetrics('validation_error', Date.now() - startTime);
      this.logger.error('Erro na validação do webhook', {
        function: 'validateWebhook',
        error: error as Error
      });
      
      return {
        valid: false,
        error: 'Erro interno na validação do webhook',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Valida apenas a assinatura do webhook
   */
  validateSignature(payload: string, signature: string, timestamp?: string): WebhookValidationResult {
    try {
      // Remover prefixo da assinatura se presente (ex: "sha256=")
      const cleanSignature = signature.replace(/^sha256=/, '');
      
      // Criar string para assinatura (payload + timestamp se fornecido)
      const signatureData = timestamp ? `${payload}.${timestamp}` : payload;
      
      // Calcular assinatura esperada
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(signatureData)
        .digest('hex');

      // Comparação segura contra timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        this.logger.warn('Assinatura de webhook inválida', {
          function: 'validateSignature',
          metadata: {
            expectedLength: expectedSignature.length,
            receivedLength: cleanSignature.length,
            payloadSize: payload.length
          }
        });
      }

      return {
        valid: isValid,
        error: isValid ? undefined : 'Assinatura do webhook inválida',
        code: isValid ? undefined : 'SIGNATURE_INVALID',
        details: { signatureValid: isValid }
      };
    } catch (error) {
      this.logger.error('Erro ao validar assinatura do webhook', {
        function: 'validateSignature',
        error: error as Error
      });
      return {
        valid: false,
        error: 'Erro na validação da assinatura',
        code: 'SIGNATURE_VALIDATION_ERROR',
        details: { signatureValid: false }
      };
    }
  }

  /**
   * Valida timestamp do webhook
   */
  validateTimestamp(timestamp: string): WebhookValidationResult {
    if (!timestamp) {
      return {
        valid: false,
        error: 'Timestamp do webhook não encontrado',
        code: 'TIMESTAMP_MISSING',
        details: { timestampValid: false }
      };
    }

    const requestTime = parseInt(timestamp);
    if (isNaN(requestTime)) {
      return {
        valid: false,
        error: 'Formato de timestamp inválido',
        code: 'TIMESTAMP_INVALID_FORMAT',
        details: { timestampValid: false }
      };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > this.config.timestampTolerance) {
      this.logger.warn('Timestamp do webhook expirado', {
        function: 'validateTimestamp',
        metadata: {
          requestTime,
          currentTime,
          timeDiff,
          tolerance: this.config.timestampTolerance
        }
      });
      
      return {
        valid: false,
        error: `Timestamp do webhook expirado. Diferença: ${timeDiff}s, Tolerância: ${this.config.timestampTolerance}s`,
        code: 'TIMESTAMP_EXPIRED',
        details: { timestampValid: false }
      };
    }

    return {
      valid: true,
      details: { timestampValid: true }
    };
  }

  /**
   * Valida tamanho do payload
   */
  validatePayloadSize(req: Request): WebhookValidationResult {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > this.config.maxPayloadSize) {
      this.logger.warn('Payload do webhook muito grande', {
        function: 'validatePayloadSize',
        metadata: {
          size: contentLength,
          maxSize: this.config.maxPayloadSize
        }
      });
      
      return {
        valid: false,
        error: `Payload muito grande. Tamanho: ${contentLength}, Máximo: ${this.config.maxPayloadSize}`,
        code: 'PAYLOAD_TOO_LARGE',
        details: { payloadSizeValid: false }
      };
    }

    return {
      valid: true,
      details: { payloadSizeValid: true }
    };
  }

  /**
   * Valida tipo de evento
   */
  validateEventType(eventType: string): WebhookValidationResult {
    if (!eventType) {
      return {
        valid: false,
        error: 'Tipo de evento não especificado',
        code: 'EVENT_TYPE_MISSING',
        details: { eventTypeValid: false }
      };
    }

    if (!this.config.allowedEvents.includes(eventType)) {
      this.logger.warn('Tipo de evento não permitido', {
        function: 'validateEventType',
        metadata: {
          eventType,
          allowedEvents: this.config.allowedEvents
        }
      });
      
      return {
        valid: false,
        error: `Tipo de evento não permitido: ${eventType}`,
        code: 'EVENT_TYPE_NOT_ALLOWED',
        details: { eventTypeValid: false }
      };
    }

    return {
      valid: true,
      details: { eventTypeValid: true }
    };
  }

  /**
   * Verifica replay attack
   */
  checkReplayAttack(signature: string, timestamp: number): WebhookValidationResult {
    const requestKey = `${signature}_${timestamp}`;
    
    if (this.replayCache.has(requestKey)) {
      this.logger.warn('Possível replay attack detectado', {
        function: 'checkReplayAttack',
        metadata: {
          signature: signature.substring(0, 10) + '...',
          timestamp
        }
      });
      
      return {
        valid: false,
        error: 'Requisição duplicada detectada',
        code: 'REPLAY_ATTACK_DETECTED',
        details: { replayCheckPassed: false }
      };
    }

    // Adicionar ao cache
    this.replayCache.set(requestKey, timestamp);
    
    return {
      valid: true,
      details: { replayCheckPassed: true }
    };
  }

  /**
   * Gera assinatura para webhook
   */
  generateSignature(payload: string, timestamp?: string): string {
    const signatureData = timestamp ? `${payload}.${timestamp}` : payload;
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signatureData)
      .digest('hex');
  }

  /**
   * Obtém estatísticas de segurança
   */
  getSecurityStats(): {
    replayCacheSize: number;
    validationMetrics: string;
    config: Partial<WebhookSecurityConfig>;
  } {
    return {
      replayCacheSize: this.replayCache.size,
      validationMetrics: 'Métricas de validação disponíveis via MetricsService',
      config: {
        timestampTolerance: this.config.timestampTolerance,
        maxPayloadSize: this.config.maxPayloadSize,
        allowedEvents: this.config.allowedEvents,
        enableReplayProtection: this.config.enableReplayProtection,
        replayWindowSize: this.config.replayWindowSize
      }
    };
  }

  /**
   * Limpa cache de replay
   */
  clearReplayCache(): void {
    this.replayCache.clear();
    this.logger.info('Cache de replay limpo', {
      function: 'clearReplayCache'
    });
  }

  /**
   * Para o serviço e limpa recursos
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearReplayCache();
    this.logger.info('WebhookSecurityService finalizado', {
      function: 'shutdown'
    });
  }

  // Métodos privados

  private getPayloadString(req: Request): string {
    if (typeof req.body === 'string') {
      return req.body;
    }
    return JSON.stringify(req.body);
  }

  private startReplayCacheCleanup(): void {
    // Limpar cache a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupReplayCache();
    }, 5 * 60 * 1000);
  }

  private cleanupReplayCache(): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiredKeys: string[] = [];
    
    for (const [key, timestamp] of Array.from(this.replayCache.entries())) {
      if (currentTime - timestamp > this.config.replayWindowSize) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.replayCache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.debug(`Removidas ${expiredKeys.length} entradas expiradas do cache de replay`, {
        function: 'cleanupReplayCache',
        metadata: {
          expiredKeysCount: expiredKeys.length
        }
      });
    }
  }

  private recordValidationMetrics(result: string, duration: number): void {
    try {
      this.metricsService.recordHistogram('webhook_validation', duration, {
        result
      });
    } catch (error) {
      this.logger.error('Erro ao registrar métricas de validação', {
        function: 'recordValidationMetrics',
        error: error as Error
      });
    }
  }
}