"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSecurityService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Serviço de segurança para webhooks
 */
class WebhookSecurityService {
    constructor(config, metricsService, logger) {
        this.config = config;
        this.replayCache = new Map();
        this.cleanupInterval = null;
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
        };
        if (this.config.enableReplayProtection) {
            this.startReplayCacheCleanup();
        }
    }
    /**
     * Valida webhook completo
     */
    async validateWebhook(req) {
        const startTime = Date.now();
        try {
            // 1. Validar tamanho do payload
            const payloadSizeResult = this.validatePayloadSize(req);
            if (!payloadSizeResult.valid) {
                this.recordValidationMetrics('payload_size_invalid', Date.now() - startTime);
                return payloadSizeResult;
            }
            // 2. Extrair headers necessários
            const signature = req.headers[this.config.signatureHeader];
            const timestamp = req.headers[this.config.timestampHeader];
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
        }
        catch (error) {
            this.recordValidationMetrics('validation_error', Date.now() - startTime);
            this.logger.error('Erro na validação do webhook', {
                function: 'validateWebhook',
                error: error
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
    validateSignature(payload, signature, timestamp) {
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
            const isValid = crypto.timingSafeEqual(Buffer.from(cleanSignature, 'hex'), Buffer.from(expectedSignature, 'hex'));
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
        }
        catch (error) {
            this.logger.error('Erro ao validar assinatura do webhook', {
                function: 'validateSignature',
                error: error
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
    validateTimestamp(timestamp) {
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
    validatePayloadSize(req) {
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
    validateEventType(eventType) {
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
    checkReplayAttack(signature, timestamp) {
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
    generateSignature(payload, timestamp) {
        const signatureData = timestamp ? `${payload}.${timestamp}` : payload;
        return crypto
            .createHmac('sha256', this.config.secretKey)
            .update(signatureData)
            .digest('hex');
    }
    /**
     * Obtém estatísticas de segurança
     */
    getSecurityStats() {
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
    clearReplayCache() {
        this.replayCache.clear();
        this.logger.info('Cache de replay limpo', {
            function: 'clearReplayCache'
        });
    }
    /**
     * Para o serviço e limpa recursos
     */
    shutdown() {
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
    getPayloadString(req) {
        if (typeof req.body === 'string') {
            return req.body;
        }
        return JSON.stringify(req.body);
    }
    startReplayCacheCleanup() {
        // Limpar cache a cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanupReplayCache();
        }, 5 * 60 * 1000);
    }
    cleanupReplayCache() {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiredKeys = [];
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
    recordValidationMetrics(result, duration) {
        try {
            this.metricsService.recordHistogram('webhook_validation', duration, {
                result
            });
        }
        catch (error) {
            this.logger.error('Erro ao registrar métricas de validação', {
                function: 'recordValidationMetrics',
                error: error
            });
        }
    }
}
exports.WebhookSecurityService = WebhookSecurityService;
//# sourceMappingURL=WebhookSecurityService.js.map