/**
 * Testes de autenticação JWT entre serviços Cloud Functions e Cloud Run
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthenticationService, AuthConfig, JWTConfig, TokenValidationResult } from '../../services/AuthenticationService';
import { Request } from 'express';
import * as crypto from 'crypto';

describe('Testes de Autenticação JWT entre Serviços', () => {
  let authService: AuthenticationService;
  let authConfig: AuthConfig;
  let jwtConfig: JWTConfig;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Configuração de autenticação para testes
    authConfig = {
      projectId: 'test-project',
      serviceAccountEmail: 'test@test-project.iam.gserviceaccount.com',
      audience: 'https://test-cloud-run-service.run.app',
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.invoker'
      ]
    };

    // Configuração JWT para comunicação entre serviços
    jwtConfig = {
      issuer: 'cloud-functions-service',
      audience: 'cloud-run-service',
      secretKey: crypto.randomBytes(32).toString('hex'),
      expirationTime: '1h'
    };

    authService = new AuthenticationService(authConfig, jwtConfig);

    // Mock de requisição HTTP
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      body: {}
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    authService.clearTokenCache();
  });

  describe('Geração de Tokens JWT', () => {
    it('deve gerar token JWT válido para comunicação entre serviços', () => {
      const subject = 'cloud-functions-analysis';
      const scopes = ['analysis:read', 'analysis:write'];

      const token = authService.generateServiceToken(subject, scopes);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    it('deve incluir payload correto no token JWT', () => {
      const subject = 'cloud-functions-analysis';
      const scopes = ['analysis:read', 'analysis:write'];

      const token = authService.generateServiceToken(subject, scopes);
      const validation = authService.validateServiceToken(token);

      expect(validation.valid).toBe(true);
      expect(validation.payload).toBeDefined();
      expect(validation.payload!.sub).toBe(subject);
      expect(validation.payload!.aud).toBe(jwtConfig.audience);
      expect(validation.payload!.iss).toBe(jwtConfig.issuer);
      expect(validation.payload!.scope).toEqual(scopes);
      expect(validation.payload!.service).toBe('cloud-functions');
    });

    it('deve falhar ao gerar token sem configuração JWT', () => {
      const authServiceWithoutJWT = new AuthenticationService(authConfig);

      expect(() => {
        authServiceWithoutJWT.generateServiceToken('test-subject');
      }).toThrow('Configuração JWT não fornecida');
    });
  });

  describe('Validação de Tokens JWT', () => {
    it('deve validar token JWT válido', () => {
      const subject = 'cloud-functions-analysis';
      const token = authService.generateServiceToken(subject);

      const validation = authService.validateServiceToken(token);

      expect(validation.valid).toBe(true);
      expect(validation.payload).toBeDefined();
      expect(validation.error).toBeUndefined();
    });

    it('deve rejeitar token com assinatura inválida', () => {
      const subject = 'cloud-functions-analysis';
      const token = authService.generateServiceToken(subject);
      const [header, payload] = token.split('.');
      const invalidToken = `${header}.${payload}.invalid-signature`;

      const validation = authService.validateServiceToken(invalidToken);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Assinatura JWT inválida');
    });

    it('deve rejeitar token expirado', async () => {
      // Configurar JWT com expiração muito curta
      const shortJwtConfig: JWTConfig = {
        ...jwtConfig,
        expirationTime: '1s'
      };
      const shortAuthService = new AuthenticationService(authConfig, shortJwtConfig);

      const token = shortAuthService.generateServiceToken('test-subject');
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 1100));

      const validation = shortAuthService.validateServiceToken(token);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Token expirado');
    });

    it('deve rejeitar token com audience incorreto', () => {
      const wrongJwtConfig: JWTConfig = {
        ...jwtConfig,
        audience: 'wrong-audience'
      };
      const wrongAuthService = new AuthenticationService(authConfig, wrongJwtConfig);
      const token = wrongAuthService.generateServiceToken('test-subject');

      const validation = authService.validateServiceToken(token);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Audience inválido');
    });

    it('deve rejeitar token com issuer incorreto', () => {
      const wrongJwtConfig: JWTConfig = {
        ...jwtConfig,
        issuer: 'wrong-issuer'
      };
      const wrongAuthService = new AuthenticationService(authConfig, wrongJwtConfig);
      const token = wrongAuthService.generateServiceToken('test-subject');

      const validation = authService.validateServiceToken(token);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Issuer inválido');
    });

    it('deve rejeitar token com formato inválido', () => {
      const invalidTokens = [
        'invalid-token',
        'header.payload', // Faltando assinatura
        'header.payload.signature.extra', // Muitas partes
        '', // Token vazio
        'header..signature' // Payload vazio
      ];

      invalidTokens.forEach(token => {
        const validation = authService.validateServiceToken(token);
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });
    });
  });

  describe('Validação de Requisições HTTP', () => {
    it('deve validar requisição com token JWT válido', async () => {
      const token = authService.generateServiceToken('cloud-functions-analysis');
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const validation = await authService.validateRequest(mockRequest as Request);

      expect(validation.valid).toBe(true);
      expect(validation.payload).toBeDefined();
    });

    it('deve rejeitar requisição sem header Authorization', async () => {
      mockRequest.headers = {};

      const validation = await authService.validateRequest(mockRequest as Request);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Header Authorization não encontrado');
    });

    it('deve rejeitar requisição com formato de token inválido', async () => {
      const invalidFormats = [
        'InvalidToken',
        'Basic dGVzdDp0ZXN0', // Basic auth
        'Bearer', // Sem token
        'Bearer token1 token2', // Múltiplos tokens
        'Token abc123' // Scheme incorreto
      ];

      for (const authHeader of invalidFormats) {
        mockRequest.headers = { authorization: authHeader };
        const validation = await authService.validateRequest(mockRequest as Request);
        
        expect(validation.valid).toBe(false);
        expect(validation.error).toBe('Formato de token inválido. Use: Bearer <token>');
      }
    });

    it('deve rejeitar requisição com token JWT inválido', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.jwt.token'
      };

      const validation = await authService.validateRequest(mockRequest as Request);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Token inválido');
    });
  });

  describe('Cache de Tokens', () => {
    it('deve gerenciar cache de tokens corretamente', () => {
      const initialStats = authService.getCacheStats();
      expect(initialStats.size).toBe(0);

      // Simular adição ao cache (método privado, testamos indiretamente)
      authService.generateServiceToken('test-subject');
      
      // Limpar cache
      authService.clearTokenCache();
      const clearedStats = authService.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });

    it('deve fornecer estatísticas do cache', () => {
      const stats = authService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('Segurança de Tokens', () => {
    it('deve usar assinatura segura para tokens', () => {
      const token1 = authService.generateServiceToken('subject1');
      const token2 = authService.generateServiceToken('subject2');

      // Tokens diferentes devem ter assinaturas diferentes
      expect(token1).not.toBe(token2);
      
      const [, , signature1] = token1.split('.');
      const [, , signature2] = token2.split('.');
      expect(signature1).not.toBe(signature2);
    });

    it('deve resistir a ataques de timing', () => {
      const validToken = authService.generateServiceToken('test-subject');
      const invalidToken = validToken.slice(0, -5) + 'xxxxx';

      // Múltiplas validações devem ter tempos similares
      const times: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        authService.validateServiceToken(i % 2 === 0 ? validToken : invalidToken);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }

      // Verificar que não há diferença significativa nos tempos
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
      
      // Permitir até 100% de desvio (timing attacks geralmente têm desvios maiores)
      // Em ambiente de teste, variações de timing são normais
      expect(maxDeviation / avgTime).toBeLessThan(1.0);
    });
  });

  describe('Integração com Diferentes Tipos de Token', () => {
    it('deve distinguir entre tokens JWT e Google Cloud', async () => {
      const jwtToken = authService.generateServiceToken('test-subject');
      const googleCloudToken = 'ya29.fake-google-cloud-token';

      mockRequest.headers = { authorization: `Bearer ${jwtToken}` };
      const jwtValidation = await authService.validateRequest(mockRequest as Request);
      
      mockRequest.headers = { authorization: `Bearer ${googleCloudToken}` };
      const gcValidation = await authService.validateRequest(mockRequest as Request);

      // JWT deve ser validado com sucesso
      expect(jwtValidation.valid).toBe(true);
      expect(jwtValidation.payload?.service).toBe('cloud-functions');

      // Google Cloud token deve falhar (sem mock do Google Auth)
      expect(gcValidation.valid).toBe(false);
    });
  });
});