/**
 * Testes de rate limiting e throttling
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { rateLimit } from '../../middleware/security';
import { RedisService } from '../../services/RedisService';
import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../services/MetricsService';

// Mock da função createCustomRateLimiter para os testes
const createCustomRateLimiter = (options: any) => {
  return (req: any, res: any, next: any) => {
    // Simular rate limiting customizado
    if (req.path === '/api/auth/login' && Math.random() > 0.8) {
      return res.status(429).json({ message: options.message || 'Rate limit exceeded' });
    }
    next();
  };
};

// Mock das dependências
jest.mock('../../services/RedisService');
jest.mock('../../services/LoggingService');
jest.mock('../../services/AuditService');

const mockRedisService = RedisService as jest.MockedClass<typeof RedisService>;
const mockLoggingService = LoggingService as jest.MockedClass<typeof LoggingService>;

describe('Testes de Rate Limiting e Throttling', () => {
  let app: express.Application;
  let redisInstance: jest.Mocked<RedisService>;
  let loggingInstance: jest.Mocked<LoggingService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock das instâncias
    redisInstance = new mockRedisService({ host: 'localhost', port: 6379 }) as jest.Mocked<RedisService>;
    loggingInstance = new mockLoggingService() as jest.Mocked<LoggingService>;
    
    // Configurar mocks padrão
    redisInstance.get.mockResolvedValue(null);
    redisInstance.set.mockResolvedValue('OK');
    redisInstance.incr.mockResolvedValue(1);
    redisInstance.expire.mockResolvedValue(1);
    
    setupTestRoutes();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupTestRoutes() {
    // Rota com rate limiting padrão
    app.get('/api/public', rateLimit, (req, res) => {
      res.json({ message: 'Public endpoint' });
    });

    // Rota com rate limiting customizado - mais restritivo
    app.post('/api/auth/login', 
      createCustomRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // 5 tentativas por IP
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        standardHeaders: true,
        legacyHeaders: false
      }),
      (req, res) => {
        res.json({ token: 'fake-jwt-token' });
      }
    );

    // Rota com rate limiting para upload - muito restritivo
    app.post('/api/documents/upload',
      createCustomRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 10, // 10 uploads por hora
        message: 'Limite de uploads excedido. Tente novamente em 1 hora.',
        keyGenerator: (req: any) => {
          // Rate limiting por usuário autenticado
          return req.headers.authorization || req.ip;
        }
      }),
      (req, res) => {
        res.json({ uploadId: 'fake-upload-id' });
      }
    );

    // Rota com rate limiting para API externa
    app.get('/api/external/data',
      createCustomRateLimiter({
        windowMs: 60 * 1000, // 1 minuto
        max: 100, // 100 requisições por minuto
        message: 'Rate limit excedido para API externa.',
        skipSuccessfulRequests: true // Não contar requisições bem-sucedidas
      }),
      (req, res) => {
        res.json({ data: 'external-data' });
      }
    );

    // Rota sem rate limiting
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy' });
    });

    // Rota para teste de burst protection
    app.post('/api/burst-test',
      createCustomRateLimiter({
        windowMs: 1000, // 1 segundo
        max: 3, // 3 requisições por segundo
        message: 'Burst limit exceeded'
      }),
      (req, res) => {
        res.json({ message: 'Burst test' });
      }
    );
  }

  describe('Rate Limiting Básico', () => {
    it('deve permitir requisições dentro do limite', async () => {
      const responses = [];
      
      // Fazer 5 requisições (dentro do limite padrão)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/public')
          .expect(200);
        
        responses.push(response);
        
        // Verificar headers de rate limiting
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      }
      
      // Verificar que o número de requisições restantes diminui
      const firstRemaining = parseInt(responses[0].headers['x-ratelimit-remaining']);
      const lastRemaining = parseInt(responses[4].headers['x-ratelimit-remaining']);
      expect(lastRemaining).toBeLessThan(firstRemaining);
    });

    it('deve bloquear requisições que excedem o limite', async () => {
      // Simular que o limite já foi atingido
      redisInstance.get.mockResolvedValue('100'); // Limite excedido
      
      const response = await request(app)
        .get('/api/public')
        .expect(429);
      
      expect(response.body).toMatchObject({
        error: 'Muitas requisições. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
      
      // Verificar headers de rate limiting
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('deve resetar o contador após o período da janela', async () => {
      // Simular reset do contador
      redisInstance.get
        .mockResolvedValueOnce('100') // Primeira chamada - limite excedido
        .mockResolvedValueOnce(null); // Segunda chamada - contador resetado
      
      // Primeira requisição - bloqueada
      await request(app)
        .get('/api/public')
        .expect(429);
      
      // Simular passagem do tempo (reset da janela)
      jest.advanceTimersByTime(60 * 1000); // 1 minuto
      
      // Segunda requisição - permitida
      await request(app)
        .get('/api/public')
        .expect(200);
    });
  });

  describe('Rate Limiting por IP', () => {
    it('deve aplicar rate limiting por IP', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      
      // Simular limite atingido para IP1
      redisInstance.get.mockImplementation((key: string) => {
        if (key.includes(ip1)) {
          return Promise.resolve('100'); // Limite excedido
        }
        return Promise.resolve('1'); // Dentro do limite
      });
      
      // IP1 - bloqueado
      await request(app)
        .get('/api/public')
        .set('X-Forwarded-For', ip1)
        .expect(429);
      
      // IP2 - permitido
      await request(app)
        .get('/api/public')
        .set('X-Forwarded-For', ip2)
        .expect(200);
    });

    it('deve considerar proxies e load balancers', async () => {
      const realIp = '203.0.113.1';
      const proxyIp = '10.0.0.1';
      
      const response = await request(app)
        .get('/api/public')
        .set('X-Forwarded-For', `${realIp}, ${proxyIp}`)
        .set('X-Real-IP', realIp)
        .expect(200);
      
      // Verificar que o IP real foi usado para rate limiting
      expect(redisInstance.get).toHaveBeenCalledWith(
        expect.stringContaining(realIp)
      );
    });
  });

  describe('Rate Limiting Customizado', () => {
    it('deve aplicar limite mais restritivo para login', async () => {
      // Simular 5 tentativas de login (limite)
      redisInstance.get.mockResolvedValue('5');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(429);
      
      expect(response.body.message).toContain('Muitas tentativas de login');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('deve aplicar limite para uploads por usuário', async () => {
      const authToken = 'Bearer jwt-token-123';
      
      // Simular limite de upload atingido
      redisInstance.get.mockResolvedValue('10');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('fake file content'), 'test.pdf')
        .expect(429);
      
      expect(response.body.message).toContain('Limite de uploads excedido');
      
      // Verificar que o rate limiting foi aplicado por token
      expect(redisInstance.get).toHaveBeenCalledWith(
        expect.stringContaining(authToken)
      );
    });

    it('deve não contar requisições bem-sucedidas quando configurado', async () => {
      redisInstance.get.mockResolvedValue('50'); // Dentro do limite
      
      const response = await request(app)
        .get('/api/external/data')
        .expect(200);
      
      // Verificar que o contador não foi incrementado para requisição bem-sucedida
      expect(redisInstance.incr).not.toHaveBeenCalled();
    });
  });

  describe('Burst Protection', () => {
    it('deve proteger contra rajadas de requisições', async () => {
      // Fazer 4 requisições rapidamente (excede limite de 3/segundo)
      const promises = [];
      for (let i = 0; i < 4; i++) {
        promises.push(
          request(app)
            .post('/api/burst-test')
            .send({ data: `request-${i}` })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Primeiras 3 devem passar, a 4ª deve ser bloqueada
      const successCount = responses.filter(r => r.status === 200).length;
      const blockedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBe(3);
      expect(blockedCount).toBe(1);
    });

    it('deve permitir requisições após o período de burst', async () => {
      // Simular burst inicial
      redisInstance.get.mockResolvedValueOnce('3'); // Limite atingido
      
      // Primeira requisição - bloqueada
      await request(app)
        .post('/api/burst-test')
        .expect(429);
      
      // Simular passagem de tempo
      jest.advanceTimersByTime(1100); // 1.1 segundos
      
      // Reset do contador
      redisInstance.get.mockResolvedValueOnce('0');
      
      // Segunda requisição - permitida
      await request(app)
        .post('/api/burst-test')
        .expect(200);
    });
  });

  describe('Headers de Rate Limiting', () => {
    it('deve incluir headers padrão de rate limiting', async () => {
      redisInstance.get.mockResolvedValue('5'); // 5 requisições feitas
      
      const response = await request(app)
        .get('/api/public')
        .expect(200);
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(response.headers['x-ratelimit-used']).toBe('5');
    });

    it('deve incluir Retry-After quando limite excedido', async () => {
      redisInstance.get.mockResolvedValue('100'); // Limite excedido
      
      const response = await request(app)
        .get('/api/public')
        .expect(429);
      
      expect(response.headers['retry-after']).toBeDefined();
      const retryAfter = parseInt(response.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
    });

    it('deve incluir headers customizados', async () => {
      const response = await request(app)
        .get('/api/public')
        .expect(200);
      
      expect(response.headers['x-ratelimit-policy']).toBeDefined();
      expect(response.headers['x-ratelimit-scope']).toBeDefined();
    });
  });

  describe('Bypass de Rate Limiting', () => {
    it('deve permitir bypass para IPs whitelistados', async () => {
      const whitelistedIp = '127.0.0.1'; // Localhost
      
      // Simular limite excedido
      redisInstance.get.mockResolvedValue('1000');
      
      const response = await request(app)
        .get('/api/public')
        .set('X-Forwarded-For', whitelistedIp)
        .expect(200);
      
      // Verificar que o rate limiting foi bypassado
      expect(response.headers['x-ratelimit-bypassed']).toBe('true');
    });

    it('deve permitir bypass para usuários premium', async () => {
      const premiumToken = 'Bearer premium-user-token';
      
      // Mock para identificar usuário premium
      redisInstance.get.mockImplementation((key: string) => {
        if (key.includes('premium')) {
          return Promise.resolve(null); // Bypass
        }
        return Promise.resolve('100'); // Limite excedido
      });
      
      const response = await request(app)
        .get('/api/public')
        .set('Authorization', premiumToken)
        .expect(200);
      
      expect(response.headers['x-ratelimit-tier']).toBe('premium');
    });

    it('deve permitir bypass para health checks', async () => {
      // Health check não deve ter rate limiting
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      // Verificar que não há headers de rate limiting
      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('Monitoramento e Alertas', () => {
    it('deve registrar violações de rate limit', async () => {
      redisInstance.get.mockResolvedValue('100'); // Limite excedido
      
      await request(app)
        .get('/api/public')
        .expect(429);
      
      // Verificar que a violação foi registrada
      expect(loggingInstance.warn).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          ip: expect.any(String),
          endpoint: '/api/public',
          limit: expect.any(Number)
        })
      );
    });

    it('deve detectar padrões suspeitos', async () => {
      const suspiciousIp = '192.168.1.100';
      
      // Simular múltiplas violações do mesmo IP
      redisInstance.get.mockResolvedValue('100');
      
      // Fazer múltiplas requisições
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/public')
          .set('X-Forwarded-For', suspiciousIp)
          .expect(429);
      }
      
      // Verificar que o padrão suspeito foi detectado
      expect(loggingInstance.error).toHaveBeenCalledWith(
        'Suspicious activity detected',
        expect.objectContaining({
          ip: suspiciousIp,
          violations: expect.any(Number)
        })
      );
    });

    it('deve gerar métricas de rate limiting', async () => {
      redisInstance.get.mockResolvedValue('50');
      
      await request(app)
        .get('/api/public')
        .expect(200);
      
      // Verificar que as métricas foram registradas
      expect(loggingInstance.info).toHaveBeenCalledWith(
        'Rate limit metrics',
        expect.objectContaining({
          endpoint: '/api/public',
          used: expect.any(Number),
          remaining: expect.any(Number),
          resetTime: expect.any(Number)
        })
      );
    });
  });

  describe('Configuração Dinâmica', () => {
    it('deve permitir ajuste dinâmico de limites', async () => {
      // Simular mudança de configuração
      const newLimit = 200;
      
      // Atualizar configuração via endpoint admin
      await request(app)
        .put('/api/admin/rate-limits')
        .set('Authorization', 'Bearer admin-token')
        .send({
          endpoint: '/api/public',
          limit: newLimit,
          windowMs: 60000
        })
        .expect(200);
      
      // Verificar que o novo limite foi aplicado
      const response = await request(app)
        .get('/api/public')
        .expect(200);
      
      expect(response.headers['x-ratelimit-limit']).toBe(newLimit.toString());
    });

    it('deve aplicar limites diferentes por ambiente', async () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Teste em produção - limite mais restritivo
      process.env.NODE_ENV = 'production';
      
      const prodResponse = await request(app)
        .get('/api/public')
        .expect(200);
      
      const prodLimit = parseInt(prodResponse.headers['x-ratelimit-limit']);
      
      // Teste em desenvolvimento - limite mais flexível
      process.env.NODE_ENV = 'development';
      
      const devResponse = await request(app)
        .get('/api/public')
        .expect(200);
      
      const devLimit = parseInt(devResponse.headers['x-ratelimit-limit']);
      
      expect(devLimit).toBeGreaterThan(prodLimit);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Integração com Redis', () => {
    it('deve usar Redis para armazenar contadores', async () => {
      await request(app)
        .get('/api/public')
        .expect(200);
      
      // Verificar que o Redis foi usado
      expect(redisInstance.get).toHaveBeenCalled();
      expect(redisInstance.incr).toHaveBeenCalled();
      expect(redisInstance.expire).toHaveBeenCalled();
    });

    it('deve lidar com falhas do Redis graciosamente', async () => {
      // Simular falha do Redis
      redisInstance.get.mockRejectedValue(new Error('Redis connection failed'));
      
      // A requisição deve continuar funcionando (fallback)
      const response = await request(app)
        .get('/api/public')
        .expect(200);
      
      // Verificar que o fallback foi usado
      expect(response.headers['x-ratelimit-fallback']).toBe('true');
    });

    it('deve usar TTL apropriado no Redis', async () => {
      await request(app)
        .get('/api/public')
        .expect(200);
      
      // Verificar que o TTL foi configurado
      expect(redisInstance.expire).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number)
      );
    });
  });
});