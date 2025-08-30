import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers, testDocuments, errorMessages } from '../fixtures/test-data';

/**
 * Testes E2E para cenários de erro e recuperação
 * Testa a robustez do sistema em situações adversas
 */
test.describe('Cenários de Erro e Recuperação', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Erros de Autenticação', () => {
    test('deve exibir erro para credenciais inválidas', async ({ page }) => {
      await page.goto('/login');
      
      // Tentar login com credenciais inválidas
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Verificar mensagem de erro
      await expect(
        page.locator('[data-testid="login-error"]')
      ).toContainText(errorMessages.auth.invalidCredentials);
      
      // Verificar que não houve redirecionamento
      expect(page.url()).toContain('/login');
    });

    test('deve redirecionar para login quando sessão expira', async ({ page }) => {
      // Login normal
      await helpers.login();
      
      // Simular expiração de sessão
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      });
      
      // Tentar acessar página protegida
      await page.goto('/dashboard');
      
      // Verificar redirecionamento para login
      await expect(page).toHaveURL(/\/login/);
      
      // Verificar mensagem de sessão expirada
      await expect(
        page.locator('[data-testid="session-expired-message"]')
      ).toBeVisible();
    });

    test('deve recuperar sessão após reconexão', async ({ page }) => {
      // Login normal
      await helpers.login();
      
      // Simular perda de conexão
      await helpers.simulateNetworkError('**/api/auth/**');
      
      // Tentar fazer uma ação que requer autenticação
      await page.goto('/documents');
      
      // Verificar indicador de conexão perdida
      await expect(
        page.locator('[data-testid="connection-lost"]')
      ).toBeVisible();
      
      // Restaurar conexão
      await helpers.restoreNetwork();
      
      // Verificar recuperação automática
      await expect(
        page.locator('[data-testid="connection-restored"]')
      ).toBeVisible();
      
      // Verificar que a página funciona normalmente
      await expect(
        page.locator('[data-testid="documents-list"]')
      ).toBeVisible();
    });
  });

  test.describe('Erros de Upload', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login();
    });

    test('deve rejeitar arquivo muito grande', async ({ page }) => {
      await page.goto('/upload');
      
      // Simular upload de arquivo muito grande (>10MB)
      const largeFileContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const filePath = require('path').join(__dirname, '../fixtures/files/large-file.pdf');
      
      // Criar arquivo temporário grande
      require('fs').writeFileSync(filePath, largeFileContent);
      
      try {
        // Tentar fazer upload
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Verificar mensagem de erro
        await expect(
          page.locator('[data-testid="upload-error"]')
        ).toContainText(errorMessages.upload.fileTooBig);
        
        // Verificar que o upload não foi processado
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).not.toBeVisible();
      } finally {
        // Limpar arquivo temporário
        require('fs').unlinkSync(filePath);
      }
    });

    test('deve rejeitar formato de arquivo inválido', async ({ page }) => {
      await page.goto('/upload');
      
      // Criar arquivo de texto simples
      const textFilePath = require('path').join(__dirname, '../fixtures/files/invalid.txt');
      require('fs').writeFileSync(textFilePath, 'Este é um arquivo de texto');
      
      try {
        // Tentar fazer upload
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(textFilePath);
        
        // Verificar mensagem de erro
        await expect(
          page.locator('[data-testid="upload-error"]')
        ).toContainText(errorMessages.upload.invalidFormat);
      } finally {
        // Limpar arquivo temporário
        require('fs').unlinkSync(textFilePath);
      }
    });

    test('deve permitir retry após falha de upload', async ({ page }) => {
      await page.goto('/upload');
      
      // Simular falha de rede durante upload
      await helpers.simulateNetworkError('**/api/documents/upload');
      
      // Tentar fazer upload
      const validFilePath = require('path').join(__dirname, '../fixtures/files/test-document.pdf');
      require('fs').writeFileSync(validFilePath, 'PDF content');
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(validFilePath);
        
        // Verificar erro de upload
        await expect(
          page.locator('[data-testid="upload-error"]')
        ).toBeVisible();
        
        // Verificar botão de retry
        await expect(
          page.locator('[data-testid="retry-upload-button"]')
        ).toBeVisible();
        
        // Restaurar conexão
        await helpers.restoreNetwork();
        
        // Tentar novamente
        await page.click('[data-testid="retry-upload-button"]');
        
        // Verificar sucesso
        await expect(
          page.locator('[data-testid="upload-success"]')
        ).toBeVisible({ timeout: 15000 });
      } finally {
        require('fs').unlinkSync(validFilePath);
      }
    });
  });

  test.describe('Erros de Análise', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login();
    });

    test('deve lidar com timeout de análise', async ({ page }) => {
      // Simular análise que demora muito
      await page.route('**/api/analysis/**', route => {
        // Simular resposta lenta (mais de 30 segundos)
        setTimeout(() => {
          route.fulfill({
            status: 408,
            body: JSON.stringify({ error: errorMessages.analysis.timeoutError })
          });
        }, 35000);
      });
      
      await page.goto('/analysis/start');
      
      // Iniciar análise
      await page.click('[data-testid="start-analysis-button"]');
      
      // Verificar timeout
      await expect(
        page.locator('[data-testid="analysis-error"]')
      ).toContainText(errorMessages.analysis.timeoutError, { timeout: 40000 });
      
      // Verificar opções de recuperação
      await expect(
        page.locator('[data-testid="retry-analysis-button"]')
      ).toBeVisible();
      
      await expect(
        page.locator('[data-testid="contact-support-button"]')
      ).toBeVisible();
    });

    test('deve recuperar de erro de processamento', async ({ page }) => {
      // Simular erro de processamento
      let requestCount = 0;
      await page.route('**/api/analysis/start', route => {
        requestCount++;
        if (requestCount === 1) {
          // Primeira tentativa falha
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: errorMessages.analysis.processingError })
          });
        } else {
          // Segunda tentativa sucede
          route.fulfill({
            status: 200,
            body: JSON.stringify({ analysisId: 'recovery-test-123', status: 'started' })
          });
        }
      });
      
      await page.goto('/analysis/start');
      
      // Primeira tentativa (falha)
      await page.click('[data-testid="start-analysis-button"]');
      
      // Verificar erro
      await expect(
        page.locator('[data-testid="analysis-error"]')
      ).toContainText(errorMessages.analysis.processingError);
      
      // Tentar novamente
      await page.click('[data-testid="retry-analysis-button"]');
      
      // Verificar sucesso
      await expect(
        page.locator('[data-testid="analysis-started"]')
      ).toBeVisible();
    });

    test('deve cancelar análise em andamento', async ({ page }) => {
      await page.goto('/analysis/test-analysis-running');
      
      // Verificar que análise está em andamento
      await expect(
        page.locator('[data-testid="analysis-status"]')
      ).toHaveText('Em andamento');
      
      // Cancelar análise
      await page.click('[data-testid="cancel-analysis-button"]');
      
      // Confirmar cancelamento
      await page.click('[data-testid="confirm-cancel"]');
      
      // Verificar cancelamento
      await expect(
        page.locator('[data-testid="analysis-status"]')
      ).toHaveText('Cancelada');
      
      // Verificar opção de reiniciar
      await expect(
        page.locator('[data-testid="restart-analysis-button"]')
      ).toBeVisible();
    });
  });

  test.describe('Erros de Conectividade', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.login();
    });

    test('deve funcionar offline com dados em cache', async ({ page }) => {
      // Carregar dados primeiro
      await page.goto('/documents');
      await expect(page.locator('[data-testid="documents-list"]')).toBeVisible();
      
      // Simular modo offline
      await page.context().setOffline(true);
      
      // Recarregar página
      await page.reload();
      
      // Verificar indicador offline
      await expect(
        page.locator('[data-testid="offline-indicator"]')
      ).toBeVisible();
      
      // Verificar que dados em cache ainda estão disponíveis
      await expect(
        page.locator('[data-testid="cached-documents"]')
      ).toBeVisible();
      
      // Restaurar conexão
      await page.context().setOffline(false);
      
      // Verificar sincronização automática
      await expect(
        page.locator('[data-testid="sync-indicator"]')
      ).toBeVisible();
    });

    test('deve sincronizar dados após reconexão', async ({ page }) => {
      await page.goto('/documents');
      
      // Simular perda de conexão
      await page.context().setOffline(true);
      
      // Tentar fazer uma ação
      await page.click('[data-testid="refresh-button"]');
      
      // Verificar que ação foi enfileirada
      await expect(
        page.locator('[data-testid="pending-actions"]')
      ).toContainText('1 ação pendente');
      
      // Restaurar conexão
      await page.context().setOffline(false);
      
      // Verificar sincronização automática
      await expect(
        page.locator('[data-testid="sync-complete"]')
      ).toBeVisible({ timeout: 10000 });
      
      // Verificar que não há ações pendentes
      await expect(
        page.locator('[data-testid="pending-actions"]')
      ).not.toBeVisible();
    });
  });

  test.describe('Recuperação de Estado', () => {
    test('deve restaurar progresso após refresh da página', async ({ page }) => {
      await helpers.login();
      
      // Iniciar upload
      await page.goto('/upload');
      const filePath = require('path').join(__dirname, '../fixtures/files/test.pdf');
      require('fs').writeFileSync(filePath, 'PDF content');
      
      try {
        const fileInput = page.locator('[data-testid="file-input"]');
        await fileInput.setInputFiles(filePath);
        
        // Aguardar início do upload
        await expect(
          page.locator('[data-testid="upload-progress"]')
        ).toBeVisible();
        
        // Refresh da página
        await page.reload();
        
        // Verificar que o progresso foi restaurado
        await expect(
          page.locator('[data-testid="upload-resumed"]')
        ).toBeVisible();
      } finally {
        require('fs').unlinkSync(filePath);
      }
    });

    test('deve manter dados do formulário após erro', async ({ page }) => {
      await helpers.login();
      await page.goto('/parameters');
      
      // Preencher formulário
      await page.fill('[data-testid="criterion-technical"]', '40');
      await page.fill('[data-testid="criterion-financial"]', '30');
      await page.fill('[data-testid="threshold-minimum"]', '75');
      
      // Simular erro de salvamento
      await helpers.simulateNetworkError('**/api/parameters');
      
      // Tentar salvar
      await page.click('[data-testid="save-parameters"]');
      
      // Verificar erro
      await expect(
        page.locator('[data-testid="save-error"]')
      ).toBeVisible();
      
      // Verificar que dados do formulário foram mantidos
      await expect(
        page.locator('[data-testid="criterion-technical"]')
      ).toHaveValue('40');
      
      await expect(
        page.locator('[data-testid="criterion-financial"]')
      ).toHaveValue('30');
      
      await expect(
        page.locator('[data-testid="threshold-minimum"]')
      ).toHaveValue('75');
    });
  });
});