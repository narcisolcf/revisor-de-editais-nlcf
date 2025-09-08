import { Request, Response, NextFunction } from 'express';
import { AuthenticationService, TokenPayload } from '../services/AuthenticationService';
import { UserContext } from '../types';
/**
 * Interface para requisição autenticada
 */
export interface AuthenticatedRequest extends Request {
    user?: UserContext;
    tokenPayload?: TokenPayload;
}
/**
 * Opções para middleware de autenticação
 */
export interface AuthMiddlewareOptions {
    required?: boolean;
    allowedServices?: string[];
    requiredScopes?: string[];
    skipPaths?: string[];
}
/**
 * Middleware de autenticação para Cloud Functions
 */
export declare class AuthMiddleware {
    private authService;
    private options;
    private logger;
    constructor(authService: AuthenticationService, options?: AuthMiddlewareOptions);
    /**
     * Middleware principal de autenticação
     */
    authenticate(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware específico para webhooks com validação de assinatura
     */
    authenticateWebhook(secretKey: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Middleware para validar permissões específicas
     */
    requirePermissions(permissions: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    /**
     * Middleware para validar origem do serviço
     */
    requireService(allowedServices: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    /**
     * Middleware opcional - permite requisições sem token, mas valida se presente
     */
    optionalAuth(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    private shouldSkipPath;
    private handleAuthError;
}
/**
 * Factory function para criar middleware de autenticação
 */
export declare function createAuthMiddleware(authService: AuthenticationService, options?: AuthMiddlewareOptions): AuthMiddleware;
/**
 * Middleware simples para autenticação obrigatória
 */
export declare function requireAuth(authService: AuthenticationService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware simples para autenticação opcional
 */
export declare function optionalAuth(authService: AuthenticationService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
