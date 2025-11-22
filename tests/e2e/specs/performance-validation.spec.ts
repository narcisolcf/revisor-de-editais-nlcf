import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testDocuments, performanceThresholds } from '../fixtures/test-data';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Testes E2E para validação de performance
 * Garante que o sistema atenda aos requisitos de tempo de resposta
 */
test.describe('Validação de Performance', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test.describe('Performance de Análise', () => {
    test('análise completa deve ser concluída em menos de 30 segundos', async ({ page }) => {
      const startTime = Date.now();
      
      // Upload do documento
      await page.goto('/upload');
      
      const filePath = path.join(__dirname, '../fixtures/files/medium-document.pdf');
      // Criar arquivo de teste de tamanho médio (2MB)
      const content = 'PDF content '.repeat(100000); // ~2MB
      fs.writeFileSync(filePath, content);
      
      try {
        // Upload
        const uploadStartTime = Date.now();
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).toBeVisible({ timeout: 10000 });
        
        const uploadTime = Date.now() - uploadStartTime;
        console.log(`Upload time: ${uploadTime}ms`);
        
        // Classificação automática
        const classificationStartTime = Date.now();
        await expect(
          page.locator('[data-testid="classification-complete"]')
        ).toBeVisible({ timeout: 15000 });
        
        const classificationTime = Date.now() - classificationStartTime;
        console.log(`Classification time: ${classificationTime}ms`);
        
        // Configurar parâmetros rapidamente
        await page.goto('/parameters');
        await helpers.setAnalysisParameters({
          technicalWeight: 40,
          financialWeight: 30,
          legalWeight: 30,
          minimumThreshold: 75
        });
        
        // Iniciar análise
        const analysisStartTime = Date.now();
        await page.goto('/analysis/start');
        await page.click('[data-testid="start-analysis-button"]');
        
        // Aguardar conclusão da análise
        await expect(
          page.locator('[data-testid="analysis-complete"]')
        ).toBeVisible({ timeout: 25000 });
        
        const analysisTime = Date.now() - analysisStartTime;
        const totalTime = Date.now() - startTime;
        
        console.log(`Analysis time: ${analysisTime}ms`);
        console.log(`Total time: ${totalTime}ms`);
        
        // Verificar que o tempo total é menor que 30 segundos
        expect(totalTime).toBeLessThan(performanceLimits.maxAnalysisTime);
        
        // Verificar que cada etapa atende aos limites individuais
        expect(uploadTime).toBeLessThan(performanceLimits.maxUploadTime);
        expect(classificationTime).toBeLessThan(performanceLimits.maxClassificationTime);
        expect(analysisTime).toBeLessThan(performanceLimits.maxProcessingTime);
        
        // Capturar métricas de performance
        const metrics = await helpers.capturePerformanceMetrics();
        
        // Verificar métricas de CPU e memória
        expect(metrics.cpuUsage).toBeLessThan(80); // Menos de 80% de CPU
        expect(metrics.memoryUsage).toBeLessThan(512); // Menos de 512MB
        
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    test('análise de documento grande deve ser otimizada', async ({ page }) => {
      // Criar documento grande (5MB)
      const filePath = path.join(__dirname, '../fixtures/files/large-document.pdf');
      const largeContent = 'Large PDF content '.repeat(250000); // ~5MB
      fs.writeFileSync(filePath, largeContent);
      
      try {
        const startTime = Date.now();
        
        // Upload
        await page.goto('/upload');
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Verificar que há indicador de progresso
        await expect(
          page.locator('[data-testid="upload-progress"]')
        ).toBeVisible();
        
        // Aguardar upload com timeout estendido para arquivos grandes
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).toBeVisible({ timeout: 20000 });
        
        // Verificar que processamento é otimizado
        await expect(
          page.locator('[data-testid="processing-optimized"]')
        ).toBeVisible();
        
        // Análise deve ainda ser concluída em tempo razoável
        await page.goto('/analysis/start');
        await page.click('[data-testid="start-analysis-button"]');
        
        await expect(
          page.locator('[data-testid="analysis-complete"]')
        ).toBeVisible({ timeout: 45000 }); // Timeout estendido para arquivos grandes
        
        const totalTime = Date.now() - startTime;
        
        // Para arquivos grandes, permitir até 45 segundos
        expect(totalTime).toBeLessThan(45000);
        
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    test('múltiplas análises simultâneas devem manter performance', async ({ page, context }) => {
      const numberOfAnalyses = 3;
      const analysisPromises: Promise<number>[] = [];
      
      // Criar múltiplas páginas para simular usuários simultâneos
      for (let i = 0; i < numberOfAnalyses; i++) {
        const newPage = await context.newPage();
        const pageHelpers = new TestHelpers(newPage);
        
        const analysisPromise = (async () => {
          const startTime = Date.now();
          
          await pageHelpers.login();
          
          // Upload de documento único para cada análise
          const filePath = path.join(__dirname, `../fixtures/files/concurrent-test-${i}.pdf`);
          fs.writeFileSync(filePath, `PDF content for analysis ${i}`);
          
          try {
            await newPage.goto('/upload');
            const fileInput = newPage.locator('[data-testid="file-input"]');
            await fileInput.setInputFiles(filePath);
            
            await expect(
              newPage.locator('[data-testid="upload-success"]')
            ).toBeVisible({ timeout: 15000 });
            
            // Configurar parâmetros
            await newPage.goto('/parameters');
            await pageHelpers.setAnalysisParameters({
              technicalWeight: 40,
              financialWeight: 30,
              legalWeight: 30,
              minimumThreshold: 75
            });
            
            // Iniciar análise
            await newPage.goto('/analysis/start');
            await newPage.click('[data-testid="start-analysis-button"]');
            
            await expect(
              newPage.locator('[data-testid="analysis-complete"]')
            ).toBeVisible({ timeout: 40000 });
            
            return Date.now() - startTime;
            
          } finally {
            fs.unlinkSync(filePath);
            await newPage.close();
          }
        })();
        
        analysisPromises.push(analysisPromise);
      }
      
      // Aguardar todas as análises
      const analysisTimes = await Promise.all(analysisPromises);
      
      // Verificar que todas as análises foram concluídas em tempo aceitável
      analysisTimes.forEach((time, index) => {
        console.log(`Concurrent analysis ${index + 1} time: ${time}ms`);
        expect(time).toBeLessThan(40000); // 40 segundos para análises simultâneas
      });
      
      // Verificar que a performance média não degradou significativamente
      const averageTime = analysisTimes.reduce((sum, time) => sum + time, 0) / analysisTimes.length;
      expect(averageTime).toBeLessThan(35000); // Média de 35 segundos
    });
  });

  test.describe('Performance de Interface', () => {
    test('carregamento inicial da aplicação deve ser rápido', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Aguardar carregamento completo
      await expect(
        page.locator('[data-testid="app-loaded"]')
      ).toBeVisible({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`App load time: ${loadTime}ms`);
      
      // Verificar que carregamento é menor que 3 segundos
      expect(loadTime).toBeLessThan(3000);
      
      // Verificar métricas de Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {
              fcp: 0,
              lcp: 0,
              cls: 0
            };
            
            entries.forEach((entry: any) => {
              if (entry.name === 'first-contentful-paint') {
                metrics.fcp = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                metrics.lcp = entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                metrics.cls += entry.value;
              }
            });
            
            resolve(metrics);
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
        });
      });
      
      // Verificar Web Vitals
      expect((vitals as any).fcp).toBeLessThan(1800); // FCP < 1.8s
      expect((vitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      expect((vitals as any).cls).toBeLessThan(0.1);  // CLS < 0.1
    });

    test('navegação entre páginas deve ser fluida', async ({ page }) => {
      await page.goto('/dashboard');
      
      const navigationTimes: number[] = [];
      const pages = ['/documents', '/analysis', '/parameters', '/reports', '/dashboard'];
      
      for (const targetPage of pages) {
        const startTime = Date.now();
        
        await page.goto(targetPage);
        
        // Aguardar carregamento da página
        await expect(
          page.locator('[data-testid="page-loaded"]')
        ).toBeVisible({ timeout: 3000 });
        
        const navigationTime = Date.now() - startTime;
        navigationTimes.push(navigationTime);
        
        console.log(`Navigation to ${targetPage}: ${navigationTime}ms`);
      }
      
      // Verificar que todas as navegações são rápidas
      navigationTimes.forEach((time, index) => {
        expect(time).toBeLessThan(2000); // Menos de 2 segundos por navegação
      });
      
      // Verificar tempo médio de navegação
      const averageNavTime = navigationTimes.reduce((sum, time) => sum + time, 0) / navigationTimes.length;
      expect(averageNavTime).toBeLessThan(1500); // Média menor que 1.5 segundos
    });

    test('lista de documentos deve carregar rapidamente', async ({ page }) => {
      await page.goto('/documents');
      
      const startTime = Date.now();
      
      // Aguardar carregamento da lista
      await expect(
        page.locator('[data-testid="documents-list"]')
      ).toBeVisible({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`Documents list load time: ${loadTime}ms`);
      
      // Verificar tempo de carregamento
      expect(loadTime).toBeLessThan(3000);
      
      // Verificar que paginação funciona rapidamente
      if (await page.locator('[data-testid="next-page"]').isVisible()) {
        const paginationStartTime = Date.now();
        
        await page.click('[data-testid="next-page"]');
        
        await expect(
          page.locator('[data-testid="documents-list"]')
        ).toBeVisible({ timeout: 2000 });
        
        const paginationTime = Date.now() - paginationStartTime;
        console.log(`Pagination time: ${paginationTime}ms`);
        
        expect(paginationTime).toBeLessThan(1000); // Paginação em menos de 1 segundo
      }
    });
  });

  test.describe('Performance de API', () => {
    test('endpoints de API devem responder rapidamente', async ({ page }) => {
      await page.goto('/dashboard');
      
      const apiEndpoints = [
        '/api/documents',
        '/api/analysis/recent',
        '/api/user/profile',
        '/api/statistics/summary'
      ];
      
      for (const endpoint of apiEndpoints) {
        const startTime = Date.now();
        
        const response = await page.request.get(endpoint);
        
        const responseTime = Date.now() - startTime;
        console.log(`API ${endpoint} response time: ${responseTime}ms`);
        
        // Verificar que API responde rapidamente
        expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos
        expect(response.status()).toBe(200);
      }
    });

    test('upload de arquivo deve ter progresso em tempo real', async ({ page }) => {
      await page.goto('/upload');
      
      // Criar arquivo de tamanho médio para testar progresso
      const filePath = path.join(__dirname, '../fixtures/files/progress-test.pdf');
      const content = 'PDF content for progress test '.repeat(50000); // ~1.5MB
      fs.writeFileSync(filePath, content);
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Verificar que progresso aparece rapidamente
        await expect(
          page.locator('[data-testid="upload-progress"]')
        ).toBeVisible({ timeout: 1000 });
        
        // Verificar que progresso é atualizado
        let lastProgress = 0;
        let progressUpdates = 0;
        
        while (progressUpdates < 5) {
          const progressText = await page.locator('[data-testid="upload-progress"]').textContent();
          const currentProgress = parseInt(progressText?.match(/\d+/)?.[0] || '0');
          
          if (currentProgress > lastProgress) {
            progressUpdates++;
            lastProgress = currentProgress;
          }
          
          await page.waitForTimeout(200);
          
          // Se chegou a 100%, sair do loop
          if (currentProgress >= 100) break;
        }
        
        // Verificar que houve pelo menos algumas atualizações de progresso
        expect(progressUpdates).toBeGreaterThan(0);
        
      } finally {
        fs.unlinkSync(filePath);
      }
    });
  });

  test.describe('Performance sob Carga', () => {
    test('sistema deve manter performance com múltiplos usuários', async ({ context }) => {
      const numberOfUsers = 5;
      const userSessions: Promise<void>[] = [];
      
      for (let i = 0; i < numberOfUsers; i++) {
        const userSession = (async () => {
          const page = await context.newPage();
          const pageHelpers = new TestHelpers(page);
          
          try {
            await pageHelpers.login();
            
            // Simular atividade típica do usuário
            await page.goto('/dashboard');
            await page.waitForTimeout(1000);
            
            await page.goto('/documents');
            await page.waitForTimeout(1000);
            
            await page.goto('/analysis');
            await page.waitForTimeout(1000);
            
            // Verificar que páginas carregam normalmente
            await expect(
              page.locator('[data-testid="page-loaded"]')
            ).toBeVisible({ timeout: 5000 });
            
          } finally {
            await page.close();
          }
        })();
        
        userSessions.push(userSession);
      }
      
      // Aguardar todas as sessões
      const startTime = Date.now();
      await Promise.all(userSessions);
      const totalTime = Date.now() - startTime;
      
      console.log(`Multiple users simulation time: ${totalTime}ms`);
      
      // Verificar que sistema suporta múltiplos usuários
      expect(totalTime).toBeLessThan(15000); // Menos de 15 segundos para 5 usuários
    });
  });
});