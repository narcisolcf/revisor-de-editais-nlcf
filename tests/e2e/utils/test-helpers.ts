import { Page, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Utilitários para testes E2E
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Realiza login com usuário de teste
   */
  async login(email: string = 'test@example.com', password: string = 'testpassword') {
    await this.page.goto('/login');
    
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Aguardar redirecionamento após login
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verificar se o login foi bem-sucedido
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  /**
   * Realiza logout
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    
    // Aguardar redirecionamento para página de login
    await this.page.waitForURL('/login', { timeout: 10000 });
  }

  /**
   * Faz upload de um arquivo de teste
   */
  async uploadFile(fileName: string, filePath?: string) {
    const testFilePath = filePath || path.join(__dirname, '../fixtures/files', fileName);
    
    // Navegar para página de upload
    await this.page.goto('/upload');
    
    // Fazer upload do arquivo
    const fileInput = this.page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Aguardar upload ser processado
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    
    // Retornar ID do documento uploadado
    const documentId = await this.page.locator('[data-testid="document-id"]').textContent();
    return documentId;
  }

  /**
   * Aguarda análise ser concluída
   */
  async waitForAnalysisComplete(documentId: string, timeout: number = 60000) {
    await this.page.goto(`/analysis/${documentId}`);
    
    // Aguardar status de análise concluída
    await expect(
      this.page.locator('[data-testid="analysis-status"]')
    ).toHaveText('Concluída', { timeout });
    
    // Verificar se os resultados estão visíveis
    await expect(this.page.locator('[data-testid="analysis-results"]')).toBeVisible();
  }

  /**
   * Configura parâmetros de análise
   */
  async configureAnalysisParameters(params: AnalysisParameters) {
    await this.page.goto('/parameters');
    
    // Configurar critérios de avaliação
    if (params.evaluationCriteria) {
      for (const [criterion, weight] of Object.entries(params.evaluationCriteria)) {
        await this.page.fill(`[data-testid="criterion-${criterion}"]`, weight.toString());
      }
    }
    
    // Configurar thresholds
    if (params.thresholds) {
      for (const [threshold, value] of Object.entries(params.thresholds)) {
        await this.page.fill(`[data-testid="threshold-${threshold}"]`, value.toString());
      }
    }
    
    // Salvar configurações
    await this.page.click('[data-testid="save-parameters"]');
    await expect(this.page.locator('[data-testid="save-success"]')).toBeVisible();
  }

  /**
   * Verifica se há erros na página
   */
  async checkForErrors() {
    const errorElements = await this.page.locator('[data-testid*="error"]').all();
    const errors = [];
    
    for (const element of errorElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const errorText = await element.textContent();
        errors.push(errorText);
      }
    }
    
    return errors;
  }

  /**
   * Aguarda elemento carregar com retry
   */
  async waitForElementWithRetry(selector: string, timeout: number = 10000, retries: number = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.waitForSelector(selector, { timeout });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Captura métricas de performance
   */
  async capturePerformanceMetrics() {
    const performanceEntries = await this.page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')));
    });
    
    return {
      loadTime: performanceEntries[0]?.loadEventEnd - performanceEntries[0]?.loadEventStart,
      domContentLoaded: performanceEntries[0]?.domContentLoadedEventEnd - performanceEntries[0]?.domContentLoadedEventStart,
      firstContentfulPaint: await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('paint');
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        return fcp?.startTime || 0;
      })
    };
  }

  /**
   * Simula erro de rede
   */
  async simulateNetworkError(url: string) {
    await this.page.route(url, route => {
      route.abort('failed');
    });
  }

  /**
   * Restaura conexão de rede
   */
  async restoreNetwork() {
    await this.page.unrouteAll();
  }
}

/**
 * Interface para parâmetros de análise
 */
export interface AnalysisParameters {
  evaluationCriteria?: Record<string, number>;
  thresholds?: Record<string, number>;
  customRules?: string[];
}

/**
 * Utilitários para dados de teste
 */
export class TestDataUtils {
  /**
   * Gera dados de usuário de teste
   */
  static generateTestUser() {
    const timestamp = Date.now();
    return {
      email: `test-user-${timestamp}@example.com`,
      password: 'TestPassword123!',
      displayName: `Usuário Teste ${timestamp}`,
      uid: `test-uid-${timestamp}`
    };
  }

  /**
   * Gera dados de documento de teste
   */
  static generateTestDocument() {
    const timestamp = Date.now();
    return {
      id: `test-doc-${timestamp}`,
      name: `Edital-Teste-${timestamp}.pdf`,
      type: 'application/pdf',
      size: 1024 * 1024, // 1MB
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Cria arquivo de teste temporário
   */
  static createTestFile(content: string, fileName: string): string {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, fileName);
    
    fs.writeFileSync(filePath, content);
    return filePath;
  }
}