import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import { CloudRunClient } from '../../services/CloudRunClient';
import { AuthenticationService } from '../../services/AuthenticationService';
import { getAuthConfig } from '../../config/auth';
import { createApp } from '../../api/callbacks';

/**
 * Testes de integração para comunicação bidirecional entre Cloud Functions e Cloud Run
 */
describe('Comunicação Bidirecional - Integração', () => {
  let app: Express;
  let cloudRunClient: CloudRunClient;
  let authService: AuthenticationService;
  let authConfig: any;
  let validToken: string;
  let validWebhookSignature: string;

  beforeAll(async () => {
    // Configurar ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.SKIP_WEBHOOK_VALIDATION = 'false';
    
    // Obter configuração de autenticação
    authConfig = getAuthConfig();
    
    // Inicializar serviços
    authService = new AuthenticationService(
      authConfig.googleCloud,
      authConfig.jwt
    );
    
    cloudRunClient = new CloudRunClient(
      process.env.CLOUD_RUN_SERVICE_URL || 'http://localhost:8080',
      authConfig.googleCloud,
      authConfig.jwt
    );
    
    // Criar aplicação de teste
    app = createApp();
    
    // Gerar token válido para testes
    validToken = await authService.generateJWTToken({
      sub: 'test-service',
      aud: 'cloud-run',
      iss: 'cloud-functions',
      service: 'test'
    });
    
    // Gerar assinatura de webhook válida
    const payload = JSON.stringify({ test: 'data' });
    validWebhookSignature = await authService.generateHMACSignature(payload, authConfig.webhook.secretKey);
  });

  afterAll(async () => {
    // Limpeza após os testes
    if (cloudRunClient) {
      // Cleanup do cliente se necessário
    }
  });

  beforeEach(() => {
    // Reset de estado antes de cada teste
    jest.clearAllMocks();
  });

  describe('Endpoints de Callback', () => {
    it('deve aceitar callback de análise válido', async () => {
      const callbackPayload = {
        analysis_id: 'test-analysis-123',
        status: 'completed',
        result: {
          score: 85,
          recommendations: ['Recomendação 1', 'Recomendação 2']
        },
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/callback/analysis')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-webhook-signature', validWebhookSignature)
        .set('x-webhook-timestamp', Math.floor(Date.now() / 1000).toString())
        .set('x-event-type', 'analysis.completed')
        .send(callbackPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('deve aceitar callback de documento válido', async () => {
      const callbackPayload = {
        document_id: 'test-doc-456',
        status: 'processed',
        processing_info: {
          pages_processed: 10,
          text_extracted: true,
          metadata_extracted: true
        },
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/callback/document')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-webhook-signature', validWebhookSignature)
        .set('x-webhook-timestamp', Math.floor(Date.now() / 1000).toString())
        .set('x-event-type', 'document.processed')
        .send(callbackPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('deve rejeitar callback sem autenticação', async () => {
      const callbackPayload = {
        analysis_id: 'test-analysis-123',
        status: 'completed'
      };

      await request(app)
        .post('/callback/analysis')
        .send(callbackPayload)
        .expect(401);
    });

    it('deve rejeitar callback com assinatura inválida', async () => {
      const callbackPayload = {
        analysis_id: 'test-analysis-123',
        status: 'completed'
      };

      await request(app)
        .post('/callback/analysis')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-webhook-signature', 'invalid-signature')
        .set('x-webhook-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(callbackPayload)
        .expect(401);
    });
  });

  describe('Cliente Cloud Run', () => {
    it('deve configurar callbacks corretamente', async () => {
      const callbackConfig = {
        analysis_callback_url: 'https://test-function.cloudfunctions.net/callback/analysis',
        document_callback_url: 'https://test-function.cloudfunctions.net/callback/document',
        webhook_secret: authConfig.webhook.secretKey
      };

      // Mock da resposta do Cloud Run
      const mockResponse = {
        success: true,
        data: {
          callback_id: 'callback-123',
          status: 'configured'
        }
      };

      // Simular configuração de callback
      const result = await cloudRunClient.configureWebhook(callbackConfig);
      
      // Verificar se a configuração foi enviada corretamente
      expect(result).toBeDefined();
    });

    it('deve enviar requisição para Cloud Run com autenticação', async () => {
      const analysisRequest = {
        document_id: 'test-doc-789',
        analysis_type: 'compliance_check',
        parameters: {
          strict_mode: true,
          include_recommendations: true
        }
      };

      // Mock da resposta do Cloud Run
      const mockResponse = {
        success: true,
        data: {
          analysis_id: 'analysis-456',
          status: 'started',
          estimated_completion: '2024-01-15T10:30:00Z'
        }
      };

      // Simular envio de requisição
      const result = await cloudRunClient.startAnalysis(analysisRequest);
      
      // Verificar se a requisição foi enviada corretamente
      expect(result).toBeDefined();
    });

    it('deve implementar retry logic para falhas temporárias', async () => {
      const analysisRequest = {
        document_id: 'test-doc-retry',
        analysis_type: 'compliance_check'
      };

      // Simular falha temporária seguida de sucesso
      let attemptCount = 0;
      const originalRequest = cloudRunClient.makeRequest;
      
      cloudRunClient.makeRequest = jest.fn().mockImplementation(async (...args) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, data: { analysis_id: 'retry-success' } };
      });

      const result = await cloudRunClient.startAnalysis(analysisRequest);
      
      expect(result).toBeDefined();
      expect(attemptCount).toBe(3); // Deve ter tentado 3 vezes
      
      // Restaurar método original
      cloudRunClient.makeRequest = originalRequest;
    });
  });

  describe('Endpoints de Monitoramento', () => {
    it('deve retornar health check', async () => {
      const response = await request(app)
        .get('/callback/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.configuration).toBeDefined();
    });

    it('deve retornar métricas', async () => {
      const response = await request(app)
        .get('/callback/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.callbacks_processed).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });

    it('deve retornar estatísticas de segurança com autenticação', async () => {
      const response = await request(app)
        .get('/callback/security/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.security_stats).toBeDefined();
    });
  });

  describe('Teste de Webhook', () => {
    it('deve validar webhook de teste corretamente', async () => {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/callback/webhook/test')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-webhook-signature', validWebhookSignature)
        .set('x-webhook-timestamp', Math.floor(Date.now() / 1000).toString())
        .set('x-event-type', 'test.webhook')
        .send(testPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('validado com sucesso');
      expect(response.body.data.validation_result.signature_valid).toBe(true);
    });
  });

  describe('Fluxo Completo de Comunicação', () => {
    it('deve executar fluxo completo: requisição -> callback', async () => {
      // 1. Simular envio de requisição para Cloud Run
      const analysisRequest = {
        document_id: 'integration-test-doc',
        analysis_type: 'full_compliance',
        callback_url: 'https://test-function.cloudfunctions.net/callback/analysis'
      };

      // Mock do envio para Cloud Run
      const analysisResult = await cloudRunClient.startAnalysis(analysisRequest);
      expect(analysisResult).toBeDefined();

      // 2. Simular callback de retorno do Cloud Run
      const callbackPayload = {
        analysis_id: 'integration-analysis-123',
        status: 'completed',
        result: {
          compliance_score: 92,
          issues_found: 2,
          recommendations: [
            'Adicionar cláusula de sustentabilidade',
            'Revisar critérios de qualificação técnica'
          ]
        },
        processing_time: 45000, // 45 segundos
        timestamp: new Date().toISOString()
      };

      const callbackResponse = await request(app)
        .post('/callback/analysis')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-webhook-signature', validWebhookSignature)
        .set('x-webhook-timestamp', Math.floor(Date.now() / 1000).toString())
        .set('x-event-type', 'analysis.completed')
        .send(callbackPayload)
        .expect(200);

      expect(callbackResponse.body.success).toBe(true);
      expect(callbackResponse.body.data).toBeDefined();

      // 3. Verificar se o callback foi processado corretamente
      // (aqui você poderia verificar se os dados foram salvos no banco, etc.)
    });
  });
});