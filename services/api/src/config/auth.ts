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
    tokenCacheTimeout: number; // em milissegundos
    maxTokenRefreshAttempts: number;
    allowedOrigins: string[];
    trustedServices: string[];
  };
}

/**
 * Configuração padrão para desenvolvimento
 */
const developmentConfig: AuthEnvironmentConfig = {
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'revisor-editais-dev',
    audience: process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-dev.run.app',
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/run.invoker'
    ]
  },
  jwt: {
    issuer: 'cloud-functions-dev',
    audience: 'cloud-run-dev',
    secretKey: process.env.JWT_SECRET_KEY || 'dev-secret-key-change-in-production',
    expirationTime: '2h' // Mais tempo em desenvolvimento
  },
  webhook: {
    secretKey: process.env.WEBHOOK_SECRET_KEY || 'dev-webhook-secret',
    timestampTolerance: 600, // 10 minutos em desenvolvimento
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp',
    maxPayloadSize: 1024 * 1024, // 1MB
    allowedEvents: ['analysis.started', 'analysis.progress', 'analysis.completed', 'analysis.failed', 'document.processed'],
    enableReplayProtection: true,
    replayWindowSize: 3600 // 1 hora
  },
  security: {
    tokenCacheTimeout: 50 * 60 * 1000, // 50 minutos
    maxTokenRefreshAttempts: 3,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    trustedServices: ['cloud-run', 'google-cloud', 'firebase-functions']
  }
};

/**
 * Configuração para produção
 */
const productionConfig: AuthEnvironmentConfig = {
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    audience: process.env.CLOUD_RUN_SERVICE_URL || '',
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/run.invoker'
    ],
    serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL,
    serviceAccountKeyPath: process.env.SERVICE_ACCOUNT_KEY_PATH
  },
  jwt: {
    issuer: 'cloud-functions-prod',
    audience: 'cloud-run-prod',
    secretKey: process.env.JWT_SECRET_KEY || '',
    expirationTime: '1h'
  },
  webhook: {
    secretKey: process.env.WEBHOOK_SECRET_KEY || '',
    timestampTolerance: 300, // 5 minutos em produção
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp',
    maxPayloadSize: 2 * 1024 * 1024, // 2MB
    allowedEvents: ['analysis.started', 'analysis.progress', 'analysis.completed', 'analysis.failed', 'document.processed'],
    enableReplayProtection: true,
    replayWindowSize: 3600 // 1 hora
  },
  security: {
    tokenCacheTimeout: 45 * 60 * 1000, // 45 minutos
    maxTokenRefreshAttempts: 5,
    allowedOrigins: [
      process.env.FRONTEND_URL || '',
      process.env.ADMIN_PANEL_URL || ''
    ].filter(Boolean),
    trustedServices: ['cloud-run', 'google-cloud']
  }
};

/**
 * Configuração para testes
 */
const testConfig: AuthEnvironmentConfig = {
  googleCloud: {
    projectId: 'test-project',
    audience: 'https://test-service.run.app',
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  },
  jwt: {
    issuer: 'test-issuer',
    audience: 'test-audience',
    secretKey: 'test-secret-key',
    expirationTime: '30m'
  },
  webhook: {
    secretKey: 'test-webhook-secret',
    timestampTolerance: 3600, // 1 hora para testes
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp',
    maxPayloadSize: 512 * 1024, // 512KB
    allowedEvents: ['analysis.started', 'analysis.progress', 'analysis.completed', 'analysis.failed', 'document.processed', 'test.event'],
    enableReplayProtection: false, // Desabilitado para testes
    replayWindowSize: 1800 // 30 minutos
  },
  security: {
    tokenCacheTimeout: 5 * 60 * 1000, // 5 minutos
    maxTokenRefreshAttempts: 2,
    allowedOrigins: ['http://localhost:3000'],
    trustedServices: ['test-service']
  }
};

/**
 * Obtém configuração baseada no ambiente
 */
export function getAuthConfig(): AuthEnvironmentConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return validateConfig(productionConfig);
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Valida se a configuração está completa
 */
function validateConfig(config: AuthEnvironmentConfig): AuthEnvironmentConfig {
  const errors: string[] = [];
  
  // Validar configuração do Google Cloud
  if (!config.googleCloud.projectId) {
    errors.push('GOOGLE_CLOUD_PROJECT não configurado');
  }
  
  if (!config.googleCloud.audience) {
    errors.push('CLOUD_RUN_SERVICE_URL não configurado');
  }
  
  // Validar configuração JWT
  if (!config.jwt.secretKey || config.jwt.secretKey.includes('dev-') || config.jwt.secretKey.includes('default')) {
    errors.push('JWT_SECRET_KEY deve ser configurado com um valor seguro');
  }
  
  // Validar configuração de webhook
  if (!config.webhook.secretKey || config.webhook.secretKey.includes('dev-') || config.webhook.secretKey.includes('default')) {
    errors.push('WEBHOOK_SECRET_KEY deve ser configurado com um valor seguro');
  }
  
  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Configuração de autenticação inválida:\n${errors.join('\n')}`);
  }
  
  if (errors.length > 0) {
    console.warn('Avisos de configuração de autenticação:', errors);
  }
  
  return config;
}

/**
 * Configurações específicas para diferentes tipos de serviço
 */
export const serviceConfigs = {
  /**
   * Configuração para comunicação com Cloud Run
   */
  cloudRun: {
    requiredScopes: ['https://www.googleapis.com/auth/run.invoker'],
    allowedServices: ['cloud-functions', 'firebase-functions'],
    timeout: 30000, // 30 segundos
    retryAttempts: 3
  },
  
  /**
   * Configuração para webhooks
   */
  webhook: {
    allowedEvents: ['analysis.started', 'analysis.progress', 'analysis.completed', 'analysis.failed'],
    maxPayloadSize: 1024 * 1024, // 1MB
    signatureHeader: 'x-signature',
    timestampHeader: 'x-timestamp'
  },
  
  /**
   * Configuração para APIs internas
   */
  internal: {
    requiredPermissions: ['analysis.read', 'analysis.write', 'callback.manage'],
    allowedServices: ['cloud-run', 'firebase-functions'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000 // máximo 1000 requests por janela
    }
  }
};

/**
 * Utilitários para configuração
 */
export const authUtils = {
  /**
   * Verifica se está em ambiente de produção
   */
  isProduction: (): boolean => process.env.NODE_ENV === 'production',
  
  /**
   * Verifica se está em ambiente de desenvolvimento
   */
  isDevelopment: (): boolean => process.env.NODE_ENV === 'development',
  
  /**
   * Verifica se está em ambiente de teste
   */
  isTest: (): boolean => process.env.NODE_ENV === 'test',
  
  /**
   * Obtém URL base do serviço
   */
  getServiceBaseUrl: (): string => {
    if (authUtils.isProduction()) {
      return process.env.CLOUD_RUN_SERVICE_URL || '';
    }
    return process.env.CLOUD_RUN_SERVICE_URL || 'http://localhost:8080';
  },
  
  /**
   * Gera ID único para requisições
   */
  generateRequestId: (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Valida formato de token JWT
   */
  isValidJWTFormat: (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3;
  }
};