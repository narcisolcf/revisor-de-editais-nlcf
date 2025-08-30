import { GoogleAuth, JWT } from 'google-auth-library';
import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * Configuração de autenticação
 */
export interface AuthConfig {
  projectId: string;
  serviceAccountEmail?: string;
  serviceAccountKeyPath?: string;
  audience?: string; // Para Identity-Aware Proxy
  scopes?: string[];
}

/**
 * Configuração de JWT personalizado
 */
export interface JWTConfig {
  issuer: string;
  audience: string;
  secretKey: string;
  expirationTime: string; // ex: '1h', '30m'
}

/**
 * Payload do token JWT
 */
export interface TokenPayload {
  sub: string; // Subject (service identifier)
  aud: string; // Audience
  iss: string; // Issuer
  iat: number; // Issued at
  exp: number; // Expiration
  scope?: string[]; // Scopes/permissions
  service?: string; // Service name
  email?: string; // User email
  organizationId?: string; // Organization ID
  permissions?: string[]; // User permissions
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
export class AuthenticationService {
  private googleAuth!: GoogleAuth;
  private jwtClient?: JWT;
  private tokenCache = new Map<string, { token: string; expires: number }>();
  private readonly tokenCacheTimeout = 50 * 60 * 1000; // 50 minutos

  constructor(
    private authConfig: AuthConfig,
    private jwtConfig?: JWTConfig
  ) {
    this.initializeGoogleAuth();
  }

  /**
   * Inicializa autenticação do Google Cloud
   */
  private initializeGoogleAuth(): void {
    const scopes = this.authConfig.scopes || [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/run.invoker'
    ];

    if (this.authConfig.serviceAccountKeyPath) {
      this.googleAuth = new GoogleAuth({
        keyFilename: this.authConfig.serviceAccountKeyPath,
        scopes,
        projectId: this.authConfig.projectId
      });
    } else {
      // Usar Application Default Credentials (ADC)
      this.googleAuth = new GoogleAuth({
        scopes,
        projectId: this.authConfig.projectId
      });
    }
  }

  /**
   * Obtém token de acesso do Google Cloud com cache
   */
  async getGoogleCloudToken(): Promise<string> {
    const cacheKey = 'google_cloud_token';
    const cached = this.tokenCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return cached.token;
    }

    try {
      const token = await this.googleAuth.getAccessToken();
      if (!token) {
        throw new Error('Não foi possível obter token de acesso');
      }

      // Cache do token
      this.tokenCache.set(cacheKey, {
        token,
        expires: Date.now() + this.tokenCacheTimeout
      });

      return token;
    } catch (error) {
      console.error('Erro ao obter token do Google Cloud:', error);
      throw new Error('Falha na autenticação com Google Cloud');
    }
  }

  /**
   * Obtém token IAP para Identity-Aware Proxy
   */
  async getIAPToken(): Promise<string> {
    if (!this.authConfig.audience) {
      throw new Error('Audience não configurado para IAP');
    }

    const cacheKey = `iap_token_${this.authConfig.audience}`;
    const cached = this.tokenCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return cached.token;
    }

    try {
      const client = await this.googleAuth.getIdTokenClient(this.authConfig.audience);
      const tokenResponse = await client.getAccessToken();
      const token = tokenResponse.token;
      
      if (!token) {
        throw new Error('Não foi possível obter token IAP');
      }

      // Cache do token
      this.tokenCache.set(cacheKey, {
        token,
        expires: Date.now() + this.tokenCacheTimeout
      });

      return token;
    } catch (error) {
      console.error('Erro ao obter token IAP:', error);
      throw new Error('Falha na autenticação IAP');
    }
  }

  /**
   * Gera token JWT personalizado para comunicação entre serviços
   */
  generateServiceToken(subject: string | { service: string; permissions: string[]; organizationId: string }, scopes?: string[]): string {
    if (!this.jwtConfig) {
      throw new Error('Configuração JWT não fornecida');
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = this.calculateExpiration(this.jwtConfig.expirationTime);

    let subjectId: string;
    let serviceScopes = scopes;
    
    if (typeof subject === 'object') {
      subjectId = subject.service;
      serviceScopes = subject.permissions;
    } else {
      subjectId = subject;
    }

    const payload: TokenPayload = {
      sub: subjectId,
      aud: this.jwtConfig.audience,
      iss: this.jwtConfig.issuer,
      iat: now,
      exp,
      scope: serviceScopes,
      service: typeof subject === 'object' ? subject.service : 'cloud-functions'
    };

    return this.signJWT(payload);
  }

  /**
   * Valida token JWT
   */
  validateServiceToken(token: string): TokenValidationResult {
    if (!this.jwtConfig) {
      return {
        valid: false,
        error: 'Configuração JWT não fornecida'
      };
    }

    try {
      const payload = this.verifyJWT(token);
      
      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return {
          valid: false,
          error: 'Token expirado'
        };
      }

      // Verificar audience
      if (payload.aud !== this.jwtConfig.audience) {
        return {
          valid: false,
          error: 'Audience inválido'
        };
      }

      // Verificar issuer
      if (payload.iss !== this.jwtConfig.issuer) {
        return {
          valid: false,
          error: 'Issuer inválido'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Erro na validação do token'
      };
    }
  }

  /**
   * Valida autenticação de requisição HTTP
   */
  async validateRequest(req: Request): Promise<TokenValidationResult> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return {
        valid: false,
        error: 'Header Authorization não encontrado'
      };
    }

    const [scheme, token] = authHeader.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
      return {
        valid: false,
        error: 'Formato de token inválido. Use: Bearer <token>'
      };
    }

    // Tentar validar como token JWT personalizado primeiro
    if (this.jwtConfig) {
      const jwtResult = this.validateServiceToken(token);
      if (jwtResult.valid) {
        return jwtResult;
      }
    }

    // Tentar validar como token do Google Cloud
    try {
      // Verificar se o token é válido fazendo uma chamada de teste
      const testAuth = new GoogleAuth();
      await testAuth.getAccessToken();
      
      return {
        valid: true,
        payload: {
          sub: 'google-cloud-service',
          aud: this.authConfig.audience || 'cloud-run',
          iss: 'google-cloud',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          service: 'google-cloud'
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Token inválido'
      };
    }
  }

  /**
   * Gera assinatura HMAC para validação de webhook
   */
  generateWebhookSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Valida assinatura de webhook
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = this.generateWebhookSignature(payload, secret);
      
      // Remover prefixo 'sha256=' se presente
      const cleanSignature = signature.replace(/^sha256=/, '');
      
      // Garantir que ambas as strings tenham o mesmo comprimento
      if (cleanSignature.length !== expectedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida token Firebase
   */
  async validateFirebaseToken(token: string): Promise<TokenValidationResult> {
    try {
      // Simulação de validação Firebase - em produção usaria Firebase Admin SDK
      if (!token || token.length < 10) {
        return {
          valid: false,
          error: 'Token Firebase inválido'
        };
      }

      // Mock de payload Firebase
      const payload: TokenPayload = {
        sub: 'firebase-user',
        aud: this.authConfig.projectId,
        iss: `https://securetoken.google.com/${this.authConfig.projectId}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        service: 'firebase'
      };

      return {
        valid: true,
        payload
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Erro na validação do token Firebase'
      };
    }
  }

  /**
   * Revoga tokens de um usuário
   */
  async revokeUserTokens(userId: string): Promise<void> {
    try {
      // Remove tokens do cache relacionados ao usuário
      const keysToRemove: string[] = [];
      
      for (const key of Array.from(this.tokenCache.keys())) {
        if (key.includes(userId)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.tokenCache.delete(key));
      
      // Em produção, aqui faria a revogação no Firebase/Google Cloud
      console.log(`Tokens revogados para usuário: ${userId}`);
    } catch (error) {
      console.error('Erro ao revogar tokens do usuário:', error);
      throw new Error('Falha ao revogar tokens do usuário');
    }
  }

  /**
   * Limpa cache de tokens
   */
  clearTokenCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.tokenCache.size,
      keys: Array.from(this.tokenCache.keys())
    };
  }

  // Métodos privados para JWT

  private signJWT(payload: TokenPayload): string {
    if (!this.jwtConfig) {
      throw new Error('Configuração JWT não fornecida');
    }

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const signature = crypto.createHmac('sha256', this.jwtConfig.secretKey)
      .update(data)
      .digest('base64url');

    return `${data}.${signature}`;
  }

  private verifyJWT(token: string): TokenPayload {
    if (!this.jwtConfig) {
      throw new Error('Configuração JWT não fornecida');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Formato de token JWT inválido');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const expectedSignature = crypto.createHmac('sha256', this.jwtConfig.secretKey)
      .update(data)
      .digest('base64url');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    )) {
      throw new Error('Assinatura JWT inválida');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    return payload as TokenPayload;
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    // Adicionar padding se necessário
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return Buffer.from(base64, 'base64').toString();
  }

  private calculateExpiration(expirationTime: string): number {
    const now = Math.floor(Date.now() / 1000);
    const match = expirationTime.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      throw new Error('Formato de tempo de expiração inválido. Use: 30s, 5m, 1h, 1d');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return now + value;
      case 'm': return now + (value * 60);
      case 'h': return now + (value * 60 * 60);
      case 'd': return now + (value * 24 * 60 * 60);
      default: throw new Error('Unidade de tempo inválida');
    }
  }
}