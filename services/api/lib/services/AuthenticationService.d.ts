import { Request } from 'express';
/**
 * Configuração de autenticação
 */
export interface AuthConfig {
    projectId: string;
    serviceAccountEmail?: string;
    serviceAccountKeyPath?: string;
    audience?: string;
    scopes?: string[];
}
/**
 * Configuração de JWT personalizado
 */
export interface JWTConfig {
    issuer: string;
    audience: string;
    secretKey: string;
    expirationTime: string;
}
/**
 * Payload do token JWT
 */
export interface TokenPayload {
    sub: string;
    aud: string;
    iss: string;
    iat: number;
    exp: number;
    scope?: string[];
    service?: string;
    email?: string;
    organizationId?: string;
    permissions?: string[];
}
/**
 * Resultado da validação de token
 */
export interface TokenValidationResult {
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
}
/**
 * Serviço de autenticação para comunicação entre Cloud Functions e Cloud Run
 */
export declare class AuthenticationService {
    private authConfig;
    private jwtConfig?;
    private googleAuth;
    private jwtClient?;
    private tokenCache;
    private readonly tokenCacheTimeout;
    constructor(authConfig: AuthConfig, jwtConfig?: JWTConfig | undefined);
    /**
     * Inicializa autenticação do Google Cloud
     */
    private initializeGoogleAuth;
    /**
     * Obtém token de acesso do Google Cloud com cache
     */
    getGoogleCloudToken(): Promise<string>;
    /**
     * Obtém token IAP para Identity-Aware Proxy
     */
    getIAPToken(): Promise<string>;
    /**
     * Gera token JWT personalizado para comunicação entre serviços
     */
    generateServiceToken(subject: string | {
        service: string;
        permissions: string[];
        organizationId: string;
    }, scopes?: string[]): string;
    /**
     * Valida token JWT
     */
    validateServiceToken(token: string): TokenValidationResult;
    /**
     * Valida autenticação de requisição HTTP
     */
    validateRequest(req: Request): Promise<TokenValidationResult>;
    /**
     * Gera assinatura HMAC para validação de webhook
     */
    generateWebhookSignature(payload: string, secret: string): string;
    /**
     * Valida assinatura de webhook
     */
    validateWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Valida token Firebase
     */
    validateFirebaseToken(token: string): Promise<TokenValidationResult>;
    /**
     * Revoga tokens de um usuário
     */
    revokeUserTokens(userId: string): Promise<void>;
    /**
     * Limpa cache de tokens
     */
    clearTokenCache(): void;
    /**
     * Obtém estatísticas do cache
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    private signJWT;
    private verifyJWT;
    private base64UrlEncode;
    private base64UrlDecode;
    private calculateExpiration;
}
