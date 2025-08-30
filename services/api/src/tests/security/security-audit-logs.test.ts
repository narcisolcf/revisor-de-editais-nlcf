/**
 * Testes de auditoria de logs de segurança
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { auditAccessMiddleware, attackProtection, initializeSecurity } from '../../middleware/security';
import { AuditService } from '../../services/AuditService';
import { LoggingService } from '../../services/LoggingService';
import { AlertService } from '../../services/AlertService';
import { MetricsService } from '../../services/MetricsService';

// Mock das dependências
jest.mock('../../services/AuditService');
jest.mock('../../services/LoggingService');
jest.mock('../../services/AlertService');
jest.mock('../../services/MetricsService');
jest.mock('firebase-admin/firestore');

const mockAuditService = AuditService as jest.MockedClass<typeof AuditService>;
const mockLoggingService = LoggingService as jest.MockedClass<typeof LoggingService>;
const mockAlertService = AlertService as jest.MockedClass<typeof AlertService>;
const mockMetricsService = MetricsService as jest.MockedClass<typeof MetricsService>;

describe('Testes de Auditoria e Logs de Segurança', () => {
  let app: express.Application;
  let auditService: jest.Mocked<AuditService>;
  let loggingInstance: jest.Mocked<LoggingService>;
  let alertInstance: jest.Mocked<AlertService>;
  let metricsInstance: jest.Mocked<MetricsService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock do Firestore
    const mockDb = {
      collection: jest.fn().mockReturnValue({
        add: jest.fn(),
        doc: jest.fn().mockReturnValue({
          set: jest.fn(),
          get: jest.fn(),
          update: jest.fn()
        })
      })
    };

    // Criar instâncias mockadas com argumentos necessários
    auditInstance = {
      logSecurityViolation: jest.fn(),
      logEndpointAccess: jest.fn(),
      logAuthAttempt: jest.fn(),
      getAuditStats: jest.fn(),
      clear: jest.fn(),
      getAllEntries: jest.fn()
    } as any;

    loggingInstance = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    alertInstance = {
      createAlertRule: jest.fn(),
      updateAlertRule: jest.fn(),
      deleteAlertRule: jest.fn(),
      getAlertRules: jest.fn(),
      evaluateAlerts: jest.fn(),
      acknowledgeAlert: jest.fn(),
      resolveAlert: jest.fn(),
      getAlerts: jest.fn()
    } as any;

    metricsInstance = {
      incrementCounter: jest.fn(),
      setGauge: jest.fn(),
      recordHistogram: jest.fn(),
      startTimer: jest.fn(),
      timeFunction: jest.fn(),
      recordHttpRequest: jest.fn(),
      recordSecurityEvent: jest.fn(),
      recordRateLimit: jest.fn(),
      recordAuthEvent: jest.fn(),
      getMetrics: jest.fn(),
      getMetricsSummary: jest.fn(),
      cleanup: jest.fn(),
      clear: jest.fn(),
      recordMetric: jest.fn()
    } as any;
    
    // Inicializar SecurityManager
    initializeSecurity(mockDb as any, loggingInstance, metricsInstance);
    
    // Configurar middleware de auditoria
    app.use(auditAccessMiddleware);
    app.use(attackProtection);
    
    setupTestRoutes();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupTestRoutes() {
    // Rota pública
    app.get('/api/public', (req, res) => {
      res.json({ message: 'Public data' });
    });

    // Rota de autenticação
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'admin@licitareview.com' && password === 'correct') {
        res.json({ token: 'valid-token', user: { id: 1, email, role: 'admin' } });
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    });

    // Rota protegida
    app.get('/api/admin/users', (req, res) => {
      const token = req.headers.authorization;
      if (token === 'Bearer valid-token') {
        res.json({ users: [{ id: 1, email: 'admin@licitareview.com' }] });
      } else {
        res.status(403).json({ error: 'Acesso negado' });
      }
    });

    // Rota sensível
    app.delete('/api/admin/users/:id', (req, res) => {
      const token = req.headers.authorization;
      if (token === 'Bearer valid-token') {
        res.json({ message: `Usuário ${req.params.id} removido` });
      } else {
        res.status(403).json({ error: 'Acesso negado' });
      }
    });

    // Rota de upload
    app.post('/api/documents/upload', (req, res) => {
      res.json({ uploadId: 'upload-123', status: 'success' });
    });

    // Rota de configuração
    app.put('/api/admin/config', (req, res) => {
      res.json({ message: 'Configuração atualizada' });
    });

    // Rota de webhook
    app.post('/api/webhooks/payment', (req, res) => {
      res.json({ received: true });
    });
  }

  describe('Auditoria de Autenticação', () => {
    it('deve registrar tentativas de login bem-sucedidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'correct'
        })
        .expect(200);

      // Verificar que o evento foi registrado
      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'AUTHENTICATION_SUCCESS',
        userId: 1,
        userEmail: 'admin@licitareview.com',
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/auth/login',
        method: 'POST',
        timestamp: expect.any(Date),
        details: {
          loginMethod: 'email_password',
          sessionId: expect.any(String)
        }
      });

      expect(loggingInstance.info).toHaveBeenCalledWith(
        'Successful authentication',
        expect.objectContaining({
          userId: 1,
          email: 'admin@licitareview.com',
          ip: expect.any(String)
        })
      );
    });

    it('deve registrar tentativas de login falhadas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'wrong-password'
        })
        .expect(401);

      // Verificar que o evento foi registrado
      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'AUTHENTICATION_FAILURE',
        userEmail: 'admin@licitareview.com',
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/auth/login',
        method: 'POST',
        timestamp: expect.any(Date),
        details: {
          reason: 'invalid_credentials',
          attemptCount: expect.any(Number)
        }
      });

      expect(loggingInstance.warn).toHaveBeenCalledWith(
        'Failed authentication attempt',
        expect.objectContaining({
          email: 'admin@licitareview.com',
          ip: expect.any(String),
          reason: 'invalid_credentials'
        })
      );
    });

    it('deve detectar múltiplas tentativas de login falhadas', async () => {
      const ip = '192.168.1.100';
      
      // Simular 5 tentativas falhadas
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', ip)
          .send({
            email: 'admin@licitareview.com',
            password: 'wrong-password'
          })
          .expect(401);
      }

      // Verificar que o alerta foi disparado
      expect(alertInstance.createAlertRule).toHaveBeenCalledWith({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        ip: ip,
        details: {
          attemptCount: 5,
          timeWindow: expect.any(String),
          targetEmail: 'admin@licitareview.com'
        }
      });
    });
  });

  describe('Auditoria de Autorização', () => {
    it('deve registrar acessos autorizados a recursos protegidos', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'AUTHORIZATION_SUCCESS',
        userId: expect.any(Number),
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/admin/users',
        method: 'GET',
        timestamp: expect.any(Date),
        details: {
          resource: 'admin_users',
          action: 'read',
          requiredRole: 'admin'
        }
      });
    });

    it('deve registrar tentativas de acesso não autorizadas', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'AUTHORIZATION_FAILURE',
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/admin/users',
        method: 'GET',
        timestamp: expect.any(Date),
        details: {
          reason: 'invalid_token',
          resource: 'admin_users',
          action: 'read'
        }
      });

      expect(loggingInstance.warn).toHaveBeenCalledWith(
        'Unauthorized access attempt',
        expect.objectContaining({
          endpoint: '/api/admin/users',
          ip: expect.any(String),
          reason: 'invalid_token'
        })
      );
    });

    it('deve registrar tentativas de acesso sem token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(403);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'AUTHORIZATION_FAILURE',
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/admin/users',
        method: 'GET',
        timestamp: expect.any(Date),
        details: {
          reason: 'missing_token',
          resource: 'admin_users',
          action: 'read'
        }
      });
    });
  });

  describe('Auditoria de Ações Sensíveis', () => {
    it('deve registrar exclusão de usuários', async () => {
      const response = await request(app)
        .delete('/api/admin/users/123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'SENSITIVE_ACTION',
        userId: expect.any(Number),
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/admin/users/123',
        method: 'DELETE',
        timestamp: expect.any(Date),
        details: {
          action: 'user_deletion',
          targetUserId: '123',
          severity: 'HIGH'
        }
      });

      expect(loggingInstance.warn).toHaveBeenCalledWith(
        'Sensitive action performed',
        expect.objectContaining({
          action: 'user_deletion',
          targetUserId: '123',
          performedBy: expect.any(Number)
        })
      );
    });

    it('deve registrar mudanças de configuração', async () => {
      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', 'Bearer valid-token')
        .send({ setting: 'max_upload_size', value: '100MB' })
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'CONFIGURATION_CHANGE',
        userId: expect.any(Number),
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/admin/config',
        method: 'PUT',
        timestamp: expect.any(Date),
        details: {
          configKey: 'setting',
          oldValue: expect.any(String),
          newValue: 'max_upload_size',
          severity: 'MEDIUM'
        }
      });
    });

    it('deve registrar uploads de documentos', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('file', Buffer.from('fake file content'), 'test.pdf')
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'FILE_UPLOAD',
        ip: expect.any(String),
        userAgent: expect.any(String),
        endpoint: '/api/documents/upload',
        method: 'POST',
        timestamp: expect.any(Date),
        details: {
          fileName: 'test.pdf',
          fileSize: expect.any(Number),
          mimeType: 'application/pdf',
          uploadId: 'upload-123'
        }
      });
    });
  });

  describe('Detecção de Atividades Suspeitas', () => {
    it('deve detectar múltiplas requisições do mesmo IP', async () => {
      const suspiciousIp = '192.168.1.200';
      
      // Fazer 20 requisições rapidamente
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/api/public')
            .set('X-Forwarded-For', suspiciousIp)
        );
      }
      
      await Promise.all(promises);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'HIGH_FREQUENCY_REQUESTS',
          ip: suspiciousIp,
          requestCount: 20
        })
      );
    });

    it('deve detectar tentativas de acesso a múltiplos endpoints protegidos', async () => {
      const suspiciousIp = '192.168.1.201';
      const protectedEndpoints = [
        '/api/admin/users',
        '/api/admin/config',
        '/api/admin/logs'
      ];
      
      // Tentar acessar múltiplos endpoints sem autorização
      for (const endpoint of protectedEndpoints) {
        await request(app)
          .get(endpoint)
          .set('X-Forwarded-For', suspiciousIp)
          .expect(403);
      }

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ENDPOINT_ENUMERATION',
          ip: suspiciousIp,
          endpoints: protectedEndpoints
        })
      );
    });

    it('deve detectar User-Agents suspeitos', async () => {
      const suspiciousUserAgents = [
        'sqlmap/1.0',
        'nikto/2.1.6',
        'Nmap Scripting Engine'
      ];
      
      for (const userAgent of suspiciousUserAgents) {
        await request(app)
          .get('/api/public')
          .set('User-Agent', userAgent)
          .expect(403);

        expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SUSPICIOUS_USER_AGENT',
            userAgent: userAgent,
            ip: expect.any(String)
          })
        );
      }
    });

    it('deve detectar tentativas de SQL injection', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        await request(app)
          .get(`/api/public?search=${encodeURIComponent(payload)}`)
          .expect(400);

        expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SQL_INJECTION_ATTEMPT',
            payload: payload,
            ip: expect.any(String),
            endpoint: '/api/public'
          })
        );
      }
    });
  });

  describe('Logs Estruturados', () => {
    it('deve gerar logs em formato JSON estruturado', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'correct'
        })
        .expect(200);

      expect(loggingInstance.info).toHaveBeenCalledWith(
        'Successful authentication',
        expect.objectContaining({
          timestamp: expect.any(String),
          level: 'info',
          event: 'authentication_success',
          userId: expect.any(Number),
          email: 'admin@licitareview.com',
          ip: expect.any(String),
          userAgent: expect.any(String),
          sessionId: expect.any(String),
          correlationId: expect.any(String)
        })
      );
    });

    it('deve incluir contexto de requisição nos logs', async () => {
      const correlationId = 'req-123-456';
      
      await request(app)
        .get('/api/public')
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      expect(loggingInstance.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          correlationId: correlationId,
          requestId: expect.any(String),
          method: 'GET',
          endpoint: '/api/public',
          responseTime: expect.any(Number)
        })
      );
    });

    it('deve mascarar dados sensíveis nos logs', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'secret-password',
          creditCard: '4111111111111111'
        })
        .expect(200);

      // Verificar que dados sensíveis foram mascarados
      const logCall = loggingInstance.info.mock.calls.find(
        call => call[0] === 'Successful authentication'
      );
      
      expect(logCall).toBeDefined();
      if (logCall && logCall[1]) {
        expect(logCall[1]).not.toContain('secret-password');
        expect(logCall[1]).not.toContain('4111111111111111');
        expect(logCall[1].password).toBe('[MASKED]');
        expect(logCall[1].creditCard).toBe('[MASKED]');
      }
    });
  });

  describe('Retenção e Arquivamento de Logs', () => {
    it('deve configurar retenção apropriada para logs de segurança', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'correct'
        })
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
        expect.objectContaining({
          retentionPeriod: '7_YEARS', // Logs de segurança devem ser mantidos por 7 anos
          archiveAfter: '1_YEAR'
        })
      );
    });

    it('deve marcar logs críticos para retenção estendida', async () => {
      await request(app)
        .delete('/api/admin/users/123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
        expect.objectContaining({
          retentionPeriod: 'INDEFINITE', // Ações críticas mantidas indefinidamente
          criticality: 'HIGH'
        })
      );
    });
  });

  describe('Compliance e Regulamentações', () => {
    it('deve gerar logs compatíveis com LGPD', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance: {
            lgpd: true,
            dataAccessed: 'personal_data',
            legalBasis: 'legitimate_interest',
            purpose: 'user_management'
          }
        })
      );
    });

    it('deve registrar consentimento do usuário', async () => {
      await request(app)
        .post('/api/users/consent')
        .send({
          userId: 123,
          consentType: 'data_processing',
          granted: true
        })
        .expect(200);

      expect(auditInstance.logSecurityViolation).toHaveBeenCalledWith({
        eventType: 'CONSENT_GRANTED',
        userId: 123,
        timestamp: expect.any(Date),
        details: {
          consentType: 'data_processing',
          granted: true,
          ipAddress: expect.any(String),
          userAgent: expect.any(String)
        },
        compliance: {
          lgpd: true
        }
      });
    });
  });

  describe('Alertas e Notificações', () => {
    it('deve enviar alertas para eventos críticos', async () => {
      // Simular múltiplas tentativas de login falhadas
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@licitareview.com',
            password: 'wrong-password'
          })
          .expect(401);
      }

      expect(alertInstance.createAlertRule).toHaveBeenCalledWith({
        type: 'CRITICAL_SECURITY_EVENT',
        severity: 'CRITICAL',
        title: 'Múltiplas tentativas de login falhadas',
        description: expect.any(String),
        details: {
          email: 'admin@licitareview.com',
          attemptCount: 10,
          timeWindow: expect.any(String)
        },
        recipients: ['security@licitareview.com']
      });
    });

    it('deve escalar alertas baseado na severidade', async () => {
      // Simular tentativa de acesso a dados sensíveis
      await request(app)
        .get('/api/admin/sensitive-data')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(alertInstance.acknowledgeAlert).toHaveBeenCalledWith(
        expect.any(String),
        'admin@licitareview.com'
      );
    });
  });

  describe('Métricas de Segurança', () => {
    it('deve gerar métricas de eventos de segurança', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'correct'
        })
        .expect(200);

      expect(metricsInstance.recordSecurityEvent).toHaveBeenCalledWith(
        'authentication_success',
        'low',
        {
          endpoint: '/api/auth/login',
          method: 'email_password',
          userRole: 'admin'
        }
      );
    });

    it('deve calcular taxas de sucesso/falha', async () => {
      // Login bem-sucedido
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'correct'
        })
        .expect(200);

      // Login falhado
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@licitareview.com',
          password: 'wrong'
        })
        .expect(401);

      expect(metricsInstance.getMetricsSummary).toHaveBeenCalled();
    });
  });
});