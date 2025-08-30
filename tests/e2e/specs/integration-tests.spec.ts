import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testDocuments, apiEndpoints } from '../fixtures/test-data';

/**
 * Testes de Integração E2E
 * Valida a comunicação entre Cloud Functions, Cloud Run e frontend
 */
test.describe('Testes de Integração de Serviços', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test.describe('Integração Cloud Functions ↔ Cloud Run', () => {
    test('upload deve acionar Cloud Function que comunica com Cloud Run', async ({ page }) => {
      // Interceptar chamadas para monitorar fluxo
      const apiCalls: string[] = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('cloudfunctions') || url.includes('run.app')) {
          apiCalls.push(`${request.method()} ${url}`);
        }
      });
      
      await page.goto('/upload');
      
      // Criar arquivo de teste
      const filePath = require('path').join(__dirname, '../fixtures/files/integration-test.pdf');
      require('fs').writeFileSync(filePath, 'PDF content for integration test');
      
      try {
        // Upload do arquivo
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Aguardar processamento completo
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).toBeVisible({ timeout: 15000 });
        
        // Verificar que as chamadas corretas foram feitas
        const uploadCalls = apiCalls.filter(call => call.includes('upload'));
        const processingCalls = apiCalls.filter(call => call.includes('process'));
        const storageCalls = apiCalls.filter(call => call.includes('storage'));
        
        expect(uploadCalls.length).toBeGreaterThan(0);
        expect(processingCalls.length).toBeGreaterThan(0);
        expect(storageCalls.length).toBeGreaterThan(0);
        
        console.log('API calls made:', apiCalls);
        
      } finally {
        require('fs').unlinkSync(filePath);
      }
    });

    test('análise deve orquestrar múltiplos serviços', async ({ page }) => {
      const serviceResponses: Record<string, any> = {};
      
      // Interceptar respostas dos serviços
      await page.route('**/api/analysis/**', async route => {
        const response = await route.fetch();
        const responseData = await response.json();
        serviceResponses[route.request().url()] = responseData;
        route.fulfill({ response });
      });
      
      await page.route('**/cloudfunctions/**', async route => {
        const response = await route.fetch();
        const responseData = await response.json();
        serviceResponses[route.request().url()] = responseData;
        route.fulfill({ response });
      });
      
      await page.goto('/analysis/start');
      
      // Iniciar análise
      await page.click('[data-testid="start-analysis-button"]');
      
      // Aguardar conclusão
      await expect(
        page.locator('[data-testid="analysis-complete"]')
      ).toBeVisible({ timeout: 30000 });
      
      // Verificar que múltiplos serviços foram chamados
      const serviceUrls = Object.keys(serviceResponses);
      
      // Deve ter chamado pelo menos:
      // - Serviço de classificação
      // - Serviço de análise técnica
      // - Serviço de análise financeira
      // - Serviço de geração de relatório
      expect(serviceUrls.some(url => url.includes('classify'))).toBe(true);
      expect(serviceUrls.some(url => url.includes('analyze'))).toBe(true);
      expect(serviceUrls.some(url => url.includes('report'))).toBe(true);
      
      console.log('Services called:', serviceUrls);
      console.log('Service responses:', serviceResponses);
    });

    test('falha em um serviço deve ser tratada graciosamente', async ({ page }) => {
      // Simular falha no serviço de classificação
      await page.route('**/api/classification/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Classification service unavailable' })
        });
      });
      
      await page.goto('/upload');
      
      const filePath = require('path').join(__dirname, '../fixtures/files/failure-test.pdf');
      require('fs').writeFileSync(filePath, 'PDF content for failure test');
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Deve mostrar erro específico do serviço
        await expect(
          page.locator('[data-testid="classification-error"]')
        ).toBeVisible({ timeout: 10000 });
        
        // Deve oferecer opção de retry
        await expect(
          page.locator('[data-testid="retry-classification"]')
        ).toBeVisible();
        
        // Deve permitir classificação manual como fallback
        await expect(
          page.locator('[data-testid="manual-classification"]')
        ).toBeVisible();
        
      } finally {
        require('fs').unlinkSync(filePath);
      }
    });
  });

  test.describe('Integração Frontend ↔ API Gateway', () => {
    test('autenticação deve funcionar em todos os endpoints', async ({ page }) => {
      const protectedEndpoints = [
        '/api/documents',
        '/api/analysis',
        '/api/reports',
        '/api/user/profile',
        '/api/parameters'
      ];
      
      for (const endpoint of protectedEndpoints) {
        // Testar sem autenticação
        const unauthResponse = await page.request.get(endpoint);
        expect(unauthResponse.status()).toBe(401);
        
        // Testar com autenticação
        const authResponse = await page.request.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${await helpers.getAuthToken()}`
          }
        });
        
        expect([200, 404]).toContain(authResponse.status()); // 200 ou 404 (se endpoint não existe)
      }
    });

    test('rate limiting deve funcionar corretamente', async ({ page }) => {
      const endpoint = '/api/documents';
      const requests: Promise<any>[] = [];
      
      // Fazer muitas requisições rapidamente
      for (let i = 0; i < 20; i++) {
        requests.push(
          page.request.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${await helpers.getAuthToken()}`
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status());
      
      // Deve ter pelo menos algumas respostas 429 (Too Many Requests)
      const rateLimitedRequests = statusCodes.filter(code => code === 429);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      
      console.log('Status codes:', statusCodes);
    });

    test('CORS deve estar configurado corretamente', async ({ page }) => {
      // Fazer requisição OPTIONS para verificar CORS
      const response = await page.request.fetch('/api/documents', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization'
        }
      });
      
      expect(response.status()).toBe(200);
      
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBeTruthy();
      expect(headers['access-control-allow-methods']).toContain('GET');
      expect(headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  test.describe('Integração com Banco de Dados', () => {
    test('operações CRUD devem funcionar end-to-end', async ({ page }) => {
      // CREATE - Criar novo documento
      await page.goto('/upload');
      
      const filePath = require('path').join(__dirname, '../fixtures/files/crud-test.pdf');
      require('fs').writeFileSync(filePath, 'PDF content for CRUD test');
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).toBeVisible({ timeout: 15000 });
        
        // Capturar ID do documento criado
        const documentId = await page.locator('[data-testid="document-id"]').textContent();
        expect(documentId).toBeTruthy();
        
        // READ - Verificar que documento aparece na lista
        await page.goto('/documents');
        await expect(
          page.locator(`[data-testid="document-${documentId}"]`)
        ).toBeVisible();
        
        // UPDATE - Atualizar metadados do documento
        await page.click(`[data-testid="edit-document-${documentId}"]`);
        await page.fill('[data-testid="document-title"]', 'Título Atualizado');
        await page.click('[data-testid="save-document"]');
        
        await expect(
          page.locator('[data-testid="update-success"]')
        ).toBeVisible();
        
        // Verificar que mudança foi persistida
        await page.reload();
        await expect(
          page.locator(`[data-testid="document-${documentId}"] .title`)
        ).toContainText('Título Atualizado');
        
        // DELETE - Remover documento
        await page.click(`[data-testid="delete-document-${documentId}"]`);
        await page.click('[data-testid="confirm-delete"]');
        
        await expect(
          page.locator('[data-testid="delete-success"]')
        ).toBeVisible();
        
        // Verificar que documento foi removido
        await page.reload();
        await expect(
          page.locator(`[data-testid="document-${documentId}"]`)
        ).not.toBeVisible();
        
      } finally {
        require('fs').unlinkSync(filePath);
      }
    });

    test('transações devem manter consistência', async ({ page }) => {
      // Simular falha durante operação complexa
      let requestCount = 0;
      
      await page.route('**/api/analysis/start', route => {
        requestCount++;
        if (requestCount === 1) {
          // Primeira tentativa falha após início
          setTimeout(() => {
            route.fulfill({
              status: 500,
              body: JSON.stringify({ error: 'Database transaction failed' })
            });
          }, 2000);
        } else {
          // Segunda tentativa sucede
          route.continue();
        }
      });
      
      await page.goto('/analysis/start');
      
      // Primeira tentativa (falha)
      await page.click('[data-testid="start-analysis-button"]');
      
      await expect(
        page.locator('[data-testid="analysis-error"]')
      ).toBeVisible({ timeout: 10000 });
      
      // Verificar que estado não ficou inconsistente
      await page.goto('/documents');
      
      // Não deve haver análises "órfãs" ou em estado inválido
      const orphanAnalyses = await page.locator('[data-testid="orphan-analysis"]').count();
      expect(orphanAnalyses).toBe(0);
      
      // Segunda tentativa (sucesso)
      await page.goto('/analysis/start');
      await page.click('[data-testid="start-analysis-button"]');
      
      await expect(
        page.locator('[data-testid="analysis-started"]')
      ).toBeVisible();
    });
  });

  test.describe('Integração com Serviços Externos', () => {
    test('integração com serviço de OCR deve funcionar', async ({ page }) => {
      // Mock do serviço de OCR
      await page.route('**/api/ocr/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            text: 'Texto extraído do documento PDF',
            confidence: 0.95,
            pages: 1
          })
        });
      });
      
      await page.goto('/upload');
      
      const filePath = require('path').join(__dirname, '../fixtures/files/ocr-test.pdf');
      require('fs').writeFileSync(filePath, 'PDF content for OCR test');
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Aguardar processamento OCR
        await expect(
          page.locator('[data-testid="ocr-complete"]')
        ).toBeVisible({ timeout: 15000 });
        
        // Verificar que texto foi extraído
        await expect(
          page.locator('[data-testid="extracted-text"]')
        ).toContainText('Texto extraído do documento PDF');
        
        // Verificar confiança do OCR
        const confidence = await page.locator('[data-testid="ocr-confidence"]').textContent();
        expect(parseFloat(confidence || '0')).toBeGreaterThan(0.9);
        
      } finally {
        require('fs').unlinkSync(filePath);
      }
    });

    test('integração com serviço de IA deve funcionar', async ({ page }) => {
      // Mock do serviço de IA
      await page.route('**/api/ai/analyze', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            classification: 'Licitação de Obras',
            technicalScore: 85,
            financialScore: 78,
            legalScore: 92,
            overallScore: 85,
            recommendations: [
              'Verificar especificações técnicas',
              'Analisar cronograma proposto'
            ]
          })
        });
      });
      
      await page.goto('/analysis/start');
      
      // Iniciar análise com IA
      await page.click('[data-testid="start-ai-analysis"]');
      
      // Aguardar resultado da IA
      await expect(
        page.locator('[data-testid="ai-analysis-complete"]')
      ).toBeVisible({ timeout: 20000 });
      
      // Verificar resultados
      await expect(
        page.locator('[data-testid="classification-result"]')
      ).toContainText('Licitação de Obras');
      
      await expect(
        page.locator('[data-testid="overall-score"]')
      ).toContainText('85');
      
      // Verificar recomendações
      await expect(
        page.locator('[data-testid="recommendations"]')
      ).toContainText('Verificar especificações técnicas');
    });

    test('fallback deve funcionar quando serviços externos falham', async ({ page }) => {
      // Simular falha no serviço de IA
      await page.route('**/api/ai/**', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'AI service unavailable' })
        });
      });
      
      await page.goto('/analysis/start');
      
      // Tentar análise com IA
      await page.click('[data-testid="start-ai-analysis"]');
      
      // Deve mostrar erro e oferecer fallback
      await expect(
        page.locator('[data-testid="ai-service-error"]')
      ).toBeVisible();
      
      await expect(
        page.locator('[data-testid="use-manual-analysis"]')
      ).toBeVisible();
      
      // Usar análise manual como fallback
      await page.click('[data-testid="use-manual-analysis"]');
      
      // Verificar que análise manual funciona
      await expect(
        page.locator('[data-testid="manual-analysis-form"]')
      ).toBeVisible();
    });
  });

  test.describe('Monitoramento e Observabilidade', () => {
    test('logs devem ser gerados corretamente', async ({ page }) => {
      const logEntries: any[] = [];
      
      // Capturar logs do console
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('API_CALL')) {
          logEntries.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      await page.goto('/dashboard');
      
      // Fazer algumas operações que devem gerar logs
      await page.goto('/documents');
      await page.goto('/analysis');
      
      // Verificar que logs foram gerados
      expect(logEntries.length).toBeGreaterThan(0);
      
      console.log('Log entries captured:', logEntries);
    });

    test('métricas de performance devem ser coletadas', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Aguardar carregamento completo
      await page.waitForLoadState('networkidle');
      
      // Verificar que métricas estão sendo enviadas
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation');
      });
      
      expect(performanceEntries.length).toBeGreaterThan(0);
      
      // Verificar métricas específicas
      const metrics = await helpers.capturePerformanceMetrics();
      
      expect(metrics.loadTime).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      
      console.log('Performance metrics:', metrics);
    });
  });
});