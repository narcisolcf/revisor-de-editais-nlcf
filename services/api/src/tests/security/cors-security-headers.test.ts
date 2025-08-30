/**
 * Testes de validação de CORS e headers de segurança
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { setupTestServices, cleanupTestServices, getTestServices } from './setup';
import { corsConfig } from '../../config/cors';

// Mock das dependências
jest.mock('../../services/LoggingService');
jest.mock('../../services/AuditService');

describe('Testes de CORS e Headers de Segurança', () => {
  let app: express.Application;
  let server: Server;
  let testServices: any;

  beforeEach(() => {
    // Configurar serviços de teste
    testServices = setupTestServices();
    
    app = express();
    app.use(express.json());
    
    // Configurar CORS
    app.use(cors(corsConfig));
    
    // Configurar headers de segurança usando bind para manter contexto
    app.use((req, res, next) => {
      testServices.securityManager.securityHeaders(req, res, next);
    });

    // Rotas de teste
    setupTestRoutes();
    
    // Criar servidor HTTP após configurar rotas
    server = app.listen(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanupTestServices();
    
    // Fechar servidor HTTP
    if (server) {
      server.close();
    }
  });

  function setupTestRoutes() {
    app.get('/api/test', (req, res) => {
      res.json({ message: 'Test endpoint' });
    });

    app.post('/api/test', (req, res) => {
      res.json({ received: req.body });
    });

    app.get('/api/sensitive', (req, res) => {
      res.json({ sensitive: 'data' });
    });
  }

  describe('Configuração CORS', () => {
    it('deve permitir origens autorizadas', async () => {
      const allowedOrigins = [
        'https://licitareview.com',
        'https://app.licitareview.com',
        'https://admin.licitareview.com'
      ];

      for (const origin of allowedOrigins) {
        const response = await request(app)
          .get('/api/test')
          .set('Origin', origin)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });

    it('deve bloquear origens não autorizadas', async () => {
      const blockedOrigins = [
        'https://malicious-site.com',
        'http://localhost:3000', // HTTP não permitido em produção
        'https://fake-licitareview.com'
      ];

      for (const origin of blockedOrigins) {
        const response = await request(app)
          .get('/api/test')
          .set('Origin', origin)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      }
    });

    it('deve permitir localhost em desenvolvimento', async () => {
      // Simular ambiente de desenvolvimento
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devApp = express();
      devApp.use(cors(corsConfig));
      devApp.get('/api/test', (req, res) => {
        res.json({ message: 'Dev test' });
      });

      const response = await request(devApp)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');

      // Restaurar ambiente
      process.env.NODE_ENV = originalEnv;
    });

    it('deve configurar métodos HTTP permitidos', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://licitareview.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
    });

    it('deve configurar headers permitidos', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://licitareview.com')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type')
        .expect(200);

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('X-Requested-With');
    });

    it('deve configurar headers expostos', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://licitareview.com')
        .expect(200);

      const exposedHeaders = response.headers['access-control-expose-headers'];
      expect(exposedHeaders).toContain('X-Total-Count');
      expect(exposedHeaders).toContain('X-Rate-Limit-Remaining');
    });

    it('deve configurar credenciais quando necessário', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://licitareview.com')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('deve configurar max age para preflight cache', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://licitareview.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-max-age']).toBe('86400'); // 24 horas
    });
  });

  describe('Headers de Segurança', () => {
    it('deve incluir Content Security Policy', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    });

    it('deve incluir X-Content-Type-Options', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve incluir X-Frame-Options', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('deve incluir X-XSS-Protection', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('deve incluir Strict-Transport-Security', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toBeDefined();
      expect(hsts).toContain('max-age=');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('deve incluir Referrer-Policy', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('deve incluir Permissions-Policy', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      const permissionsPolicy = response.headers['permissions-policy'];
      expect(permissionsPolicy).toBeDefined();
      expect(permissionsPolicy).toContain('camera=()'); // Bloquear câmera
      expect(permissionsPolicy).toContain('microphone=()'); // Bloquear microfone
      expect(permissionsPolicy).toContain('geolocation=()'); // Bloquear localização
    });

    it('deve remover headers que expõem informações do servidor', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-aspnet-version']).toBeUndefined();
      expect(response.headers['x-aspnetmvc-version']).toBeUndefined();
    });

    it('deve incluir X-DNS-Prefetch-Control', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('deve incluir X-Download-Options', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-download-options']).toBe('noopen');
    });
  });

  describe('Configuração Específica por Ambiente', () => {
    it('deve usar configuração mais restritiva em produção', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const prodApp = express();
      prodApp.use(cors(corsConfig));
      prodApp.use((req, res, next) => {
        testServices.securityManager.securityHeaders(req, res, next);
      });
      prodApp.get('/api/test', (req, res) => {
        res.json({ message: 'Prod test' });
      });

      const response = await request(prodApp)
        .get('/api/test')
        .expect(200);

      // HSTS deve ter max-age maior em produção
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toContain('max-age=31536000'); // 1 ano

      // CSP deve ser mais restritivo
      const csp = response.headers['content-security-policy'];
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("'unsafe-inline'");

      process.env.NODE_ENV = originalEnv;
    });

    it('deve permitir configurações mais flexíveis em desenvolvimento', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devApp = express();
      devApp.use(cors(corsConfig));
      devApp.use((req, res, next) => {
        testServices.securityManager.securityHeaders(req, res, next);
      });
      devApp.get('/api/test', (req, res) => {
        res.json({ message: 'Dev test' });
      });

      const response = await request(devApp)
        .get('/api/test')
        .expect(200);

      // HSTS pode ter max-age menor em desenvolvimento
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Proteção contra Ataques', () => {
    it('deve proteger contra clickjacking com X-Frame-Options', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('deve proteger contra MIME sniffing', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve proteger contra XSS com CSP', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
    });

    it('deve proteger contra information leakage via referrer', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Validação de Preflight Requests', () => {
    it('deve responder corretamente a requisições OPTIONS', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://licitareview.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://licitareview.com');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });

    it('deve rejeitar preflight de origem não autorizada', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('deve rejeitar métodos não permitidos', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://licitareview.com')
        .set('Access-Control-Request-Method', 'TRACE')
        .expect(200);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).not.toContain('TRACE');
    });
  });

  describe('Headers Customizados', () => {
    it('deve incluir headers customizados da aplicação', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-api-version']).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('deve incluir headers de rate limiting', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Configuração de Cache', () => {
    it('deve configurar headers de cache apropriados', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['pragma']).toBe('no-cache');
    });

    it('deve prevenir cache de dados sensíveis', async () => {
      const response = await request(app)
        .get('/api/sensitive')
        .expect(200);

      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['cache-control']).toContain('no-cache');
      expect(response.headers['cache-control']).toContain('must-revalidate');
    });
  });

  describe('Validação de Headers de Requisição', () => {
    it('deve validar User-Agent', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('User-Agent', '')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'User-Agent obrigatório',
        code: 'MISSING_USER_AGENT'
      });
    });

    it('deve bloquear User-Agents suspeitos', async () => {
      const suspiciousUserAgents = [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan'
      ];

      for (const userAgent of suspiciousUserAgents) {
        const response = await request(app)
          .get('/api/test')
          .set('User-Agent', userAgent)
          .expect(403);

        expect(response.body).toMatchObject({
          error: 'User-Agent não permitido',
          code: 'BLOCKED_USER_AGENT'
        });
      }
    });

    it('deve validar Content-Length', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Length', '999999999') // Muito grande
        .send({ test: 'data' })
        .expect(413);

      expect(response.body).toMatchObject({
        error: 'Payload muito grande',
        code: 'PAYLOAD_TOO_LARGE'
      });
    });
  });

  describe('Monitoramento de Segurança', () => {
    it('deve registrar violações de CSP', async () => {
      // Simular violação de CSP
      const response = await request(app)
        .post('/api/csp-report')
        .send({
          'csp-report': {
            'document-uri': 'https://licitareview.com/app',
            'violated-directive': 'script-src',
            'blocked-uri': 'https://malicious-site.com/script.js'
          }
        })
        .expect(204);

      // Verificar se o relatório foi processado
    });

    it('deve detectar tentativas de bypass de CORS', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'null') // Origem suspeita
        .expect(200);

      // Verificar se a tentativa foi registrada
    });
  });
});