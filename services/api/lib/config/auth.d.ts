import { AuthConfig, JWTConfig } from '../services/AuthenticationService';
import { WebhookSecurityConfig } from '../services/WebhookSecurityService';
/**
 * Configurações de autenticação para diferentes ambientes
 */
export interface AuthEnvironmentConfig {
    googleCloud: AuthConfig;
    jwt: JWTConfig;
    webhook: WebhookSecurityConfig;
    security: {
        tokenCacheTimeout: number;
        maxTokenRefreshAttempts: number;
        allowedOrigins: string[];
        trustedServices: string[];
    };
}
/**
 * Obtém configuração baseada no ambiente
 */
export declare function getAuthConfig(): AuthEnvironmentConfig;
/**
 * Configurações específicas para diferentes tipos de serviço
 */
export declare const serviceConfigs: {
    /**
     * Configuração para comunicação com Cloud Run
     */
    cloudRun: {
        requiredScopes: string[];
        allowedServices: string[];
        timeout: number;
        retryAttempts: number;
    };
    /**
     * Configuração para webhooks
     */
    webhook: {
        allowedEvents: string[];
        maxPayloadSize: number;
        signatureHeader: string;
        timestampHeader: string;
    };
    /**
     * Configuração para APIs internas
     */
    internal: {
        requiredPermissions: string[];
        allowedServices: string[];
        rateLimit: {
            windowMs: number;
            max: number;
        };
    };
};
/**
 * Utilitários para configuração
 */
export declare const authUtils: {
    /**
     * Verifica se está em ambiente de produção
     */
    isProduction: () => boolean;
    /**
     * Verifica se está em ambiente de desenvolvimento
     */
    isDevelopment: () => boolean;
    /**
     * Verifica se está em ambiente de teste
     */
    isTest: () => boolean;
    /**
     * Obtém URL base do serviço
     */
    getServiceBaseUrl: () => string;
    /**
     * Gera ID único para requisições
     */
    generateRequestId: () => string;
    /**
     * Valida formato de token JWT
     */
    isValidJWTFormat: (token: string) => boolean;
};
