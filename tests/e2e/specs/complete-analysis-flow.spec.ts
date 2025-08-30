import { test, expect } from '@playwright/test';
import { TestHelpers, AnalysisParameters } from '../utils/test-helpers';
import { testUsers, testDocuments, testAnalysisParameters, performanceThresholds } from '../fixtures/test-data';
import path from 'path';

/**
 * Testes E2E para o fluxo completo de análise de edital
 * Cobre: Upload → Classificação → Configuração → Análise → Resultado
 */
test.describe('Fluxo Completo de Análise', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Login com usuário analista
    await helpers.login(testUsers.analyst.email, testUsers.analyst.password);
  });

  test.afterEach(async ({ page }) => {
    // Verificar se não há erros na página
    const errors = await helpers.checkForErrors();
    if (errors.length > 0) {
      console.warn('Erros encontrados na página:', errors);
    }
    
    // Logout
    await helpers.logout();
  });

  test('deve completar análise de edital válido em menos de 30 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    // 1. Upload do documento
    test.step('Upload do documento', async () => {
      const documentId = await helpers.uploadFile('edital-valido.pdf');
      expect(documentId).toBeTruthy();
      
      // Verificar se o documento aparece na lista
      await page.goto('/documents');
      await expect(page.locator(`[data-testid="document-${documentId}"]`)).toBeVisible();
    });

    // 2. Classificação automática
    test.step('Verificar classificação automática', async () => {
      // Aguardar classificação ser processada
      await expect(
        page.locator('[data-testid="classification-status"]')
      ).toHaveText('Concluída', { timeout: 15000 });
      
      // Verificar se a categoria foi identificada
      const category = await page.locator('[data-testid="document-category"]').textContent();
      expect(category).toBeTruthy();
    });

    // 3. Configuração de parâmetros
    test.step('Configurar parâmetros de análise', async () => {
      await helpers.configureAnalysisParameters(testAnalysisParameters.default);
      
      // Verificar se os parâmetros foram salvos
      await expect(page.locator('[data-testid="parameters-saved"]')).toBeVisible();
    });

    // 4. Iniciar análise
    test.step('Iniciar análise', async () => {
      await page.click('[data-testid="start-analysis-button"]');
      
      // Verificar se a análise foi iniciada
      await expect(
        page.locator('[data-testid="analysis-status"]')
      ).toHaveText('Em andamento', { timeout: 5000 });
    });

    // 5. Aguardar conclusão da análise
    test.step('Aguardar conclusão da análise', async () => {
      // Aguardar análise ser concluída (máximo 30 segundos)
      await expect(
        page.locator('[data-testid="analysis-status"]')
      ).toHaveText('Concluída', { timeout: 30000 });
      
      // Verificar se os resultados estão visíveis
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    });

    // 6. Verificar resultados
    test.step('Verificar resultados da análise', async () => {
      // Verificar score geral
      const overallScore = await page.locator('[data-testid="overall-score"]').textContent();
      expect(parseInt(overallScore || '0')).toBeGreaterThan(0);
      
      // Verificar scores individuais
      const technicalScore = await page.locator('[data-testid="technical-score"]').textContent();
      const financialScore = await page.locator('[data-testid="financial-score"]').textContent();
      const legalScore = await page.locator('[data-testid="legal-score"]').textContent();
      
      expect(parseInt(technicalScore || '0')).toBeGreaterThanOrEqual(0);
      expect(parseInt(financialScore || '0')).toBeGreaterThanOrEqual(0);
      expect(parseInt(legalScore || '0')).toBeGreaterThanOrEqual(0);
      
      // Verificar recomendação
      const recommendation = await page.locator('[data-testid="recommendation"]').textContent();
      expect(['Aprovado', 'Rejeitado', 'Requer Revisão']).toContain(recommendation);
    });

    // 7. Verificar performance
    test.step('Verificar performance do fluxo', async () => {
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(performanceThresholds.analysisComplete);
      
      console.log(`Fluxo completo executado em ${totalTime}ms`);
    });
  });

  test('deve permitir download do relatório de análise', async ({ page }) => {
    // Assumindo que já temos uma análise concluída
    await page.goto('/analysis/test-analysis-123');
    
    // Aguardar página carregar
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Iniciar download do relatório
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-report-button"]');
    const download = await downloadPromise;
    
    // Verificar se o download foi iniciado
    expect(download.suggestedFilename()).toMatch(/relatorio-analise.*\.pdf/);
  });

  test('deve permitir compartilhamento de resultados', async ({ page }) => {
    // Assumindo que já temos uma análise concluída
    await page.goto('/analysis/test-analysis-123');
    
    // Aguardar página carregar
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Abrir modal de compartilhamento
    await page.click('[data-testid="share-button"]');
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    
    // Gerar link de compartilhamento
    await page.click('[data-testid="generate-link-button"]');
    
    // Verificar se o link foi gerado
    const shareLink = await page.locator('[data-testid="share-link"]').textContent();
    expect(shareLink).toMatch(/^https?:\/\/.+/);
    
    // Copiar link para clipboard
    await page.click('[data-testid="copy-link-button"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  });

  test('deve permitir reprocessamento de análise', async ({ page }) => {
    // Assumindo que já temos uma análise concluída
    await page.goto('/analysis/test-analysis-123');
    
    // Aguardar página carregar
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Iniciar reprocessamento
    await page.click('[data-testid="reprocess-button"]');
    
    // Confirmar reprocessamento
    await page.click('[data-testid="confirm-reprocess"]');
    
    // Verificar se o reprocessamento foi iniciado
    await expect(
      page.locator('[data-testid="analysis-status"]')
    ).toHaveText('Em andamento', { timeout: 5000 });
    
    // Aguardar nova conclusão
    await expect(
      page.locator('[data-testid="analysis-status"]')
    ).toHaveText('Concluída', { timeout: 30000 });
  });

  test('deve manter histórico de análises', async ({ page }) => {
    // Navegar para página de histórico
    await page.goto('/history');
    
    // Verificar se a lista de análises está visível
    await expect(page.locator('[data-testid="analysis-history"]')).toBeVisible();
    
    // Verificar se há pelo menos uma análise no histórico
    const analysisItems = page.locator('[data-testid^="history-item-"]');
    await expect(analysisItems.first()).toBeVisible();
    
    // Verificar informações da análise
    const firstItem = analysisItems.first();
    await expect(firstItem.locator('[data-testid="document-name"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="analysis-date"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="analysis-score"]')).toBeVisible();
    
    // Clicar para ver detalhes
    await firstItem.click();
    
    // Verificar se navega para página de detalhes
    await expect(page.locator('[data-testid="analysis-details"]')).toBeVisible();
  });

  test('deve permitir comparação entre análises', async ({ page }) => {
    // Navegar para página de comparação
    await page.goto('/compare');
    
    // Selecionar primeira análise
    await page.selectOption('[data-testid="analysis-select-1"]', 'analysis-123');
    
    // Selecionar segunda análise
    await page.selectOption('[data-testid="analysis-select-2"]', 'analysis-456');
    
    // Iniciar comparação
    await page.click('[data-testid="compare-button"]');
    
    // Verificar se a comparação foi gerada
    await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();
    
    // Verificar elementos da comparação
    await expect(page.locator('[data-testid="score-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="criteria-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendation-comparison"]')).toBeVisible();
  });
});