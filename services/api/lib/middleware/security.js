"use strict";
/**
 * Middleware de Segurança
 *
 * Implementa headers de segurança, rate limiting,
 * auditoria de acesso e proteções contra ataques.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attackProtection = exports.auditAccessMiddleware = exports.auditAccess = exports.rateLimit = exports.securityHeaders = exports.SecurityManager = void 0;
exports.initializeSecurity = initializeSecurity;
exports.getSecurityManager = getSecurityManager;
// Configuração padrão de segurança
const DEFAULT_SECURITY_CONFIG = {
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
class SecurityManager {
    constructor(db, logger, metrics, config = {}) {
        this.rateLimitStore = new Map();
        /**
         * Middleware para aplicar headers de segurança
         */
        this.securityHeaders = (req, res, next) => {
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
        this.rateLimit = (req, res, next) => {
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
        this.auditAccess = (req, res, next) => {
            if (!this.config.audit.enabled) {
                return next();
            }
            // Verificar se o path deve ser excluído da auditoria
            const shouldExclude = this.config.audit.excludePaths.some(path => req.path.startsWith(path));
            if (shouldExclude) {
                return next();
            }
            const startTime = Date.now();
            const requestSize = this.getRequestSize(req);
            const sensitive = this.containsSensitiveData(req);
            // Interceptar a resposta para capturar dados
            const originalSend = res.send;
            let responseSize = 0;
            res.send = function (data) {
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
                        userId: req.user?.uid,
                        organizationId: req.user?.organizationId,
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
                }
                catch (error) {
                    this.logger.error('Erro ao registrar auditoria', error instanceof Error ? error : new Error(String(error)), {
                        function: 'auditAccess',
                        requestId: req.requestId,
                        method: req.method,
                        path: req.path
                    });
                }
            });
            next();
        };
        /**
         * Middleware de proteção contra ataques
         */
        this.attackProtection = (req, res, next) => {
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
     * Obter ID do cliente para rate limiting
     */
    getClientId(req) {
        const user = req.user;
        if (user?.uid) {
            return `user:${user.uid}`;
        }
        return `ip:${this.getClientIp(req)}`;
    }
    /**
     * Obter IP do cliente
     */
    getClientIp(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    /**
     * Calcular tamanho da requisição
     */
    getRequestSize(req) {
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
    containsSensitiveData(req) {
        const { sensitiveFields } = this.config.audit;
        const content = JSON.stringify({
            body: req.body,
            query: req.query,
            headers: req.headers
        }).toLowerCase();
        return sensitiveFields.some(field => content.includes(field.toLowerCase()));
    }
    /**
     * Sanitizar headers para auditoria
     */
    sanitizeHeaders(headers) {
        const sanitized = {};
        const { sensitiveFields } = this.config.audit;
        for (const [key, value] of Object.entries(headers)) {
            const isSensitive = sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()));
            sanitized[key] = isSensitive ? '[REDACTED]' : String(value);
        }
        return sanitized;
    }
    /**
     * Detectar atividade suspeita
     */
    detectSuspiciousActivity(req) {
        const reasons = [];
        let severity = 'low';
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
        if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
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
    async logAuditEntry(entry) {
        try {
            await this.db.collection('audit_logs').add({
                ...entry,
                timestamp: entry.timestamp
            });
        }
        catch (error) {
            // Falha silenciosa para não impactar a aplicação
            console.error('Erro ao salvar log de auditoria:', error);
        }
    }
    /**
     * Obter razão do erro baseado no status code
     */
    getErrorReason(statusCode) {
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
    generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    /**
     * Limpar entradas expiradas do rate limit
     */
    cleanupExpiredRateLimits() {
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
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
exports.SecurityManager = SecurityManager;
// Instância global do gerenciador de segurança
let securityManager;
/**
 * Inicializar o gerenciador de segurança
 */
function initializeSecurity(db, logger, metrics, config) {
    securityManager = new SecurityManager(db, logger, metrics, config);
    return securityManager;
}
/**
 * Obter instância do gerenciador de segurança
 */
function getSecurityManager() {
    if (!securityManager) {
        throw new Error('SecurityManager não foi inicializado. Chame initializeSecurity() primeiro.');
    }
    return securityManager;
}
// Exportar middlewares individuais para uso direto
const securityHeaders = (req, res, next) => {
    getSecurityManager().securityHeaders(req, res, next);
};
exports.securityHeaders = securityHeaders;
const rateLimit = (req, res, next) => {
    getSecurityManager().rateLimit(req, res, next);
};
exports.rateLimit = rateLimit;
const auditAccess = (options) => {
    return (req, res, next) => {
        if (options?.sensitive) {
            // Marcar requisição como sensível
            req.isSensitive = true;
        }
        getSecurityManager().auditAccess(req, res, next);
    };
};
exports.auditAccess = auditAccess;
// Versão sem parâmetros para compatibilidade
const auditAccessMiddleware = (req, res, next) => {
    getSecurityManager().auditAccess(req, res, next);
};
exports.auditAccessMiddleware = auditAccessMiddleware;
const attackProtection = (req, res, next) => {
    getSecurityManager().attackProtection(req, res, next);
};
exports.attackProtection = attackProtection;
//# sourceMappingURL=security.js.map