"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
exports.createAuthMiddleware = createAuthMiddleware;
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const LoggingService_1 = require("../services/LoggingService");
/**
 * Middleware de autenticação para Cloud Functions
 */
class AuthMiddleware {
    constructor(authService, options = {}) {
        this.authService = authService;
        this.options = options;
        this.logger = new LoggingService_1.LoggingService('auth-middleware');
    }
    /**
     * Middleware principal de autenticação
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                // Verificar se o path deve ser ignorado
                if (this.shouldSkipPath(req.path)) {
                    return next();
                }
                // Validar token
                const validationResult = await this.authService.validateRequest(req);
                if (!validationResult.valid) {
                    return this.handleAuthError(res, validationResult.error || 'Token inválido');
                }
                // Verificar se o serviço é permitido
                if (this.options.allowedServices && validationResult.payload?.service) {
                    if (!this.options.allowedServices.includes(validationResult.payload.service)) {
                        return this.handleAuthError(res, 'Serviço não autorizado');
                    }
                }
                // Verificar scopes obrigatórios
                if (this.options.requiredScopes && validationResult.payload?.scope) {
                    const hasRequiredScopes = this.options.requiredScopes.every(scope => validationResult.payload.scope.includes(scope));
                    if (!hasRequiredScopes) {
                        return this.handleAuthError(res, 'Scopes insuficientes');
                    }
                }
                // Adicionar informações do usuário à requisição
                if (validationResult.payload) {
                    req.user = {
                        uid: validationResult.payload.sub,
                        email: validationResult.payload.email,
                        organizationId: validationResult.payload.organizationId || '',
                        roles: validationResult.payload.scope || [],
                        permissions: validationResult.payload.permissions || []
                    };
                    req.tokenPayload = validationResult.payload;
                }
                // Log da autenticação bem-sucedida
                this.logger.info('Autenticação bem-sucedida', {
                    organizationId: req.user?.organizationId,
                    subject: req.user?.uid,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                next();
            }
            catch (error) {
                this.logger.error('Erro no middleware de autenticação:', error instanceof Error ? error : new Error(String(error)));
                return this.handleAuthError(res, 'Erro interno de autenticação');
            }
        };
    }
    /**
     * Middleware específico para webhooks com validação de assinatura
     */
    authenticateWebhook(secretKey) {
        return (req, res, next) => {
            try {
                const signature = req.headers['x-signature'];
                const timestamp = req.headers['x-timestamp'];
                if (!signature) {
                    return res.status(401).json({
                        error: 'Assinatura do webhook não encontrada',
                        code: 'WEBHOOK_SIGNATURE_MISSING'
                    });
                }
                // Verificar timestamp para evitar replay attacks
                if (timestamp) {
                    const requestTime = parseInt(timestamp);
                    const currentTime = Math.floor(Date.now() / 1000);
                    const timeDiff = Math.abs(currentTime - requestTime);
                    // Rejeitar requisições com mais de 5 minutos de diferença
                    if (timeDiff > 300) {
                        return res.status(401).json({
                            error: 'Timestamp do webhook expirado',
                            code: 'WEBHOOK_TIMESTAMP_EXPIRED'
                        });
                    }
                }
                // Validar assinatura
                const payload = JSON.stringify(req.body);
                const expectedSignature = signature.replace('sha256=', '');
                const isValid = this.authService.validateWebhookSignature(payload, expectedSignature, secretKey);
                if (!isValid) {
                    this.logger.warn('Assinatura de webhook inválida', {
                        path: req.path,
                        signature: signature.substring(0, 10) + '...',
                        ip: req.ip
                    });
                    return res.status(401).json({
                        error: 'Assinatura do webhook inválida',
                        code: 'WEBHOOK_SIGNATURE_INVALID'
                    });
                }
                this.logger.info('Webhook autenticado com sucesso', {
                    path: req.path,
                    ip: req.ip
                });
                next();
            }
            catch (error) {
                this.logger.error('Erro na autenticação do webhook:', error instanceof Error ? error : new Error(String(error)));
                return res.status(500).json({
                    error: 'Erro interno na autenticação do webhook',
                    code: 'WEBHOOK_AUTH_ERROR'
                });
            }
        };
    }
    /**
     * Middleware para validar permissões específicas
     */
    requirePermissions(permissions) {
        return (req, res, next) => {
            if (!req.user) {
                return this.handleAuthError(res, 'Usuário não autenticado');
            }
            const userPermissions = req.user.permissions || [];
            const hasPermissions = permissions.every(permission => userPermissions.includes(permission));
            if (!hasPermissions) {
                this.logger.warn('Permissões insuficientes', {
                    user: req.user.uid,
                    organizationId: req.user.organizationId,
                    required: permissions,
                    available: userPermissions,
                    path: req.path
                });
                return res.status(403).json({
                    error: 'Permissões insuficientes',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: permissions
                });
            }
            next();
        };
    }
    /**
     * Middleware para validar origem do serviço
     */
    requireService(allowedServices) {
        return (req, res, next) => {
            if (!req.user) {
                return this.handleAuthError(res, 'Usuário não autenticado');
            }
            // Verificar se o tokenPayload tem informação de serviço
            const service = req.tokenPayload?.service;
            if (!service || !allowedServices.includes(service)) {
                this.logger.warn('Serviço não autorizado', {
                    service: service || 'unknown',
                    allowed: allowedServices,
                    path: req.path,
                    ip: req.ip
                });
                return res.status(403).json({
                    error: 'Serviço não autorizado',
                    code: 'SERVICE_NOT_ALLOWED',
                    service: service || 'unknown'
                });
            }
            next();
        };
    }
    /**
     * Middleware opcional - permite requisições sem token, mas valida se presente
     */
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    // Sem token, mas permitido
                    return next();
                }
                // Token presente, validar
                const validationResult = await this.authService.validateRequest(req);
                if (validationResult.valid && validationResult.payload) {
                    req.user = {
                        uid: validationResult.payload.sub,
                        email: validationResult.payload.email,
                        organizationId: validationResult.payload.organizationId || '',
                        roles: validationResult.payload.scope || [],
                        permissions: validationResult.payload.permissions || []
                    };
                    req.tokenPayload = validationResult.payload;
                }
                next();
            }
            catch (error) {
                this.logger.error('Erro na autenticação opcional:', error instanceof Error ? error : new Error(String(error)));
                // Em caso de erro, continuar sem autenticação
                next();
            }
        };
    }
    // Métodos privados
    shouldSkipPath(path) {
        if (!this.options.skipPaths) {
            return false;
        }
        return this.options.skipPaths.some(skipPath => {
            // Suporte a wildcards simples
            if (skipPath.endsWith('*')) {
                return path.startsWith(skipPath.slice(0, -1));
            }
            return path === skipPath;
        });
    }
    handleAuthError(res, message) {
        this.logger.warn('Falha na autenticação', { message });
        res.status(401).json({
            error: message,
            code: 'AUTHENTICATION_FAILED'
        });
    }
}
exports.AuthMiddleware = AuthMiddleware;
/**
 * Factory function para criar middleware de autenticação
 */
function createAuthMiddleware(authService, options) {
    return new AuthMiddleware(authService, options);
}
/**
 * Middleware simples para autenticação obrigatória
 */
function requireAuth(authService) {
    const middleware = new AuthMiddleware(authService, { required: true });
    return middleware.authenticate();
}
/**
 * Middleware simples para autenticação opcional
 */
function optionalAuth(authService) {
    const middleware = new AuthMiddleware(authService, { required: false });
    return middleware.optionalAuth();
}
//# sourceMappingURL=authMiddleware.js.map