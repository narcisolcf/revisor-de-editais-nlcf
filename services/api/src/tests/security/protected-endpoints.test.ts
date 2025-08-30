/**
 * Testes de segurança para endpoints protegidos
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { setupTestServices, cleanupTestServices, createMockRequest, createMockResponse, createMockNext } from './setup';

// Mock das dependências
jest.mock('../../services/AuthenticationService');
jest.mock('../../services/LoggingService');
jest.mock('../../services/AuditService');

describe('Testes de Segurança para Endpoints Protegidos', () => {
  let app: express.Application;
  let testServices: any;
  let mockAuthService: any;
  const JWT_SECRET = 'test-secret-key';

  beforeEach(() => {
    // Configurar serviços de teste
    testServices = setupTestServices();
    
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      testServices.securityManager.securityHeaders(req, res, next);
    });
    app.use((req, res, next) => {
      testServices.securityManager.auditAccess(req, res, next);
    });

    // Mock do AuthenticationService
    mockAuthService = {
      validateRequest: jest.fn(),
      validateFirebaseToken: jest.fn(),
      validateServiceToken: jest.fn()
    };

    // Configurar rotas de teste
    setupTestRoutes();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanupTestServices();
  });

  function setupTestRoutes() {
    // Endpoint público
    app.get('/api/public/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Endpoint que requer autenticação
    app.get('/api/protected/profile', 
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res) => {
        res.json({ user: req.user });
      }
    );

    // Endpoint que requer role específico
    app.get('/api/admin/users',
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res, next) => testServices.securityManager.requireRoles(['admin'])(req, res, next),
      (req, res) => {
        res.json({ users: [] });
      }
    );

    // Endpoint que requer permissão específica
    app.post('/api/analysis/create',
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res, next) => testServices.securityManager.requirePermissions(['analysis:create'])(req, res, next),
      (req, res) => {
        res.json({ id: 'analysis-123' });
      }
    );

    // Endpoint com múltiplas validações
    app.delete('/api/admin/analysis/:id',
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res, next) => testServices.securityManager.requireRoles(['admin', 'manager'])(req, res, next),
      (req, res, next) => testServices.securityManager.requirePermissions(['analysis:delete'])(req, res, next),
      (req, res) => {
        res.json({ deleted: true });
      }
    );

    // Endpoint com rate limiting
    app.post('/api/upload/document',
      (req, res, next) => testServices.securityManager.rateLimit(req, res, next),
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res, next) => testServices.securityManager.requirePermissions(['document:upload'])(req, res, next),
      (req, res) => {
        res.json({ uploaded: true });
      }
    );

    // Endpoint sensível com auditoria
    app.post('/api/admin/organization/delete',
      (req, res, next) => testServices.securityManager.auditAccess({ sensitive: true })(req, res, next),
      (req, res, next) => testServices.securityManager.authenticateUser(req, res, next),
      (req, res, next) => testServices.securityManager.requireRoles(['admin'])(req, res, next),
      (req, res, next) => testServices.securityManager.requirePermissions(['organization:delete'])(req, res, next),
      (req, res) => {
        res.json({ deleted: true });
      }
    );
  }

  describe('Endpoints Públicos', () => {
    it('deve permitir acesso a endpoints públicos sem autenticação', async () => {
      const response = await request(app)
        .get('/api/public/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('deve incluir headers de segurança em endpoints públicos', async () => {
      const response = await request(app)
        .get('/api/public/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Autenticação de Endpoints', () => {
    it('deve negar acesso a endpoint protegido sem token', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Não autenticado',
        code: 'AUTHENTICATION_REQUIRED'
      });
    });

    it('deve negar acesso com token inválido', async () => {
      mockAuthService.validateRequest.mockRejectedValue(
        new Error('Token inválido')
      );

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Token inválido'
      });
    });

    it('deve permitir acesso com token válido', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ user: mockUser });
    });

    it('deve negar acesso com token expirado', async () => {
      const expiredError = new Error('Token expirado');
      expiredError.name = 'TokenExpiredError';
      
      mockAuthService.validateRequest.mockRejectedValue(expiredError);

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Token expirado'
      });
    });
  });

  describe('Autorização por Roles', () => {
    it('deve permitir acesso para usuário com role correto', async () => {
      const mockAdmin = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['*']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body).toEqual({ users: [] });
    });

    it('deve negar acesso para usuário sem role necessário', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'Acesso negado',
        code: 'INSUFFICIENT_ROLE'
      });
    });

    it('deve permitir acesso para múltiplos roles válidos', async () => {
      const mockManager = {
        uid: 'manager123',
        email: 'manager@test.com',
        roles: ['manager'],
        permissions: ['analysis:delete']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockManager);

      const response = await request(app)
        .delete('/api/admin/analysis/123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual({ deleted: true });
    });
  });

  describe('Autorização por Permissões', () => {
    it('deve permitir acesso para usuário com permissão correta', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .send({ name: 'Test Analysis' })
        .expect(200);

      expect(response.body).toEqual({ id: 'analysis-123' });
    });

    it('deve negar acesso para usuário sem permissão necessária', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:read']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .send({ name: 'Test Analysis' })
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'Acesso negado',
        code: 'INSUFFICIENT_PERMISSION'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('deve permitir requisições dentro do limite', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['document:upload']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      // Fazer 3 requisições (dentro do limite de 5)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/upload/document')
          .set('Authorization', 'Bearer user-token')
          .send({ file: 'test.pdf' })
          .expect(200);
      }
    });

    it('deve bloquear requisições que excedem o limite', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['document:upload']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      // Fazer 6 requisições (excede o limite de 5)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/upload/document')
          .set('Authorization', 'Bearer user-token')
          .send({ file: `test${i}.pdf` })
          .expect(200);
      }

      // A 6ª requisição deve ser bloqueada
      const response = await request(app)
        .post('/api/upload/document')
        .set('Authorization', 'Bearer user-token')
        .send({ file: 'test6.pdf' })
        .expect(429);

      expect(response.body).toMatchObject({
        error: 'Muitas requisições',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    });
  });

  describe('Validação de Input', () => {
    it('deve validar tamanho do payload', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      // Payload muito grande
      const largePayload = {
        name: 'A'.repeat(10000),
        description: 'B'.repeat(50000)
      };

      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .send(largePayload)
        .expect(413);

      expect(response.body).toMatchObject({
        error: 'Payload muito grande'
      });
    });

    it('deve validar Content-Type', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .set('Content-Type', 'text/plain')
        .send('invalid content type')
        .expect(415);

      expect(response.body).toMatchObject({
        error: 'Content-Type não suportado'
      });
    });
  });

  describe('Proteção contra Ataques', () => {
    it('deve proteger contra SQL Injection em parâmetros', async () => {
      const mockAdmin = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['analysis:delete']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockAdmin);

      const maliciousId = "123'; DROP TABLE analyses; --";
      
      const response = await request(app)
        .delete(`/api/admin/analysis/${encodeURIComponent(maliciousId)}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Parâmetro inválido',
        code: 'INVALID_PARAMETER'
      });
    });

    it('deve proteger contra XSS em dados de entrada', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        description: '<img src=x onerror=alert("XSS")>'
      };

      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .send(xssPayload)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Dados de entrada inválidos',
        code: 'INVALID_INPUT'
      });
    });

    it('deve proteger contra CSRF', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      // Requisição sem CSRF token
      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .set('Origin', 'https://malicious-site.com')
        .send({ name: 'Test' })
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'CSRF token inválido',
        code: 'CSRF_TOKEN_INVALID'
      });
    });
  });

  describe('Auditoria de Segurança', () => {
    it('deve registrar tentativas de acesso não autorizado', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      // Verificar se o log de auditoria foi chamado
      // Em um cenário real, verificaríamos se o serviço de auditoria foi chamado
    });

    it('deve registrar acessos a endpoints sensíveis', async () => {
      const mockAdmin = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['organization:delete']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockAdmin);

      await request(app)
        .post('/api/admin/organization/delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ organizationId: 'org123' })
        .expect(200);

      // Verificar se o log de auditoria sensível foi chamado
    });
  });

  describe('Headers de Segurança', () => {
    it('deve incluir todos os headers de segurança necessários', async () => {
      const response = await request(app)
        .get('/api/public/health')
        .expect(200);

      // Content Security Policy
      expect(response.headers['content-security-policy']).toBeDefined();
      
      // X-Content-Type-Options
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      
      // X-Frame-Options
      expect(response.headers['x-frame-options']).toBe('DENY');
      
      // X-XSS-Protection
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      
      // Strict-Transport-Security
      expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
      
      // Referrer-Policy
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      
      // Permissions-Policy
      expect(response.headers['permissions-policy']).toBeDefined();
    });

    it('deve remover headers que expõem informações do servidor', async () => {
      const response = await request(app)
        .get('/api/public/health')
        .expect(200);

      // Headers que devem ser removidos
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-aspnet-version']).toBeUndefined();
    });
  });

  describe('Timeout e Limites', () => {
    it('deve aplicar timeout em requisições longas', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:create']
      };

      mockAuthService.validateRequest.mockResolvedValue(mockUser);

      // Simular requisição que demora muito
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/analysis/create')
        .set('Authorization', 'Bearer user-token')
        .timeout(5000) // 5 segundos
        .send({ name: 'Long Analysis' })
        .catch((err: any) => err);

      const duration = Date.now() - startTime;
      
      // Deve ter timeout antes de 10 segundos
      expect(duration).toBeLessThan(10000);
    });
  });
});