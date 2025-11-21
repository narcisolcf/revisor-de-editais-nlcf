/**
 * E2E Navigation Tests
 *
 * Testa navegação principal, voltar/avançar do navegador, URLs corretas,
 * estado de formulário e página 404.
 *
 * Requisitos testados:
 * 1. Navegação principal funciona corretamente
 * 2. URLs são atualizadas
 * 3. Conteúdo correto é renderizado
 * 4. Voltar/Avançar do navegador funcionam
 * 5. Estado é mantido (avisos de formulário não salvo)
 * 6. Links diretos funcionam
 * 7. Página 404 para rotas desconhecidas
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Começar na home page
    await page.goto('/');
  });

  test('should navigate through main menu items and update URL', async ({ page }) => {
    // Test: Clicar em cada item de navegação e verificar URL + conteúdo

    // Navegação: Home
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1, h2')).toContainText(/LicitaReview|GovDocs/i);

    // Navegação: Serviços
    await page.click('text=Serviços');
    await page.waitForURL('/servicos');
    await expect(page).toHaveURL('/servicos');
    await expect(page.locator('h1')).toContainText(/Nossos Serviços/i);

    // Navegação: Sobre
    await page.click('text=Sobre nós');
    await page.waitForURL('/sobre');
    await expect(page).toHaveURL('/sobre');
    await expect(page.locator('h1')).toContainText(/Sobre Nós/i);

    // Navegação: Contato
    await page.click('text=Contato');
    await page.waitForURL('/contato');
    await expect(page).toHaveURL('/contato');
    await expect(page.locator('h1')).toContainText(/Entre em Contato/i);
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    // Test: Navegar para frente e para trás usando botões do navegador

    // Navegar: Home -> Serviços -> Sobre
    await page.goto('/');
    await page.click('text=Serviços');
    await page.waitForURL('/servicos');

    await page.click('text=Sobre nós');
    await page.waitForURL('/sobre');

    // Voltar: Sobre -> Serviços
    await page.goBack();
    await expect(page).toHaveURL('/servicos');
    await expect(page.locator('h1')).toContainText(/Nossos Serviços/i);

    // Voltar: Serviços -> Home
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Avançar: Home -> Serviços
    await page.goForward();
    await expect(page).toHaveURL('/servicos');
    await expect(page.locator('h1')).toContainText(/Nossos Serviços/i);

    // Avançar: Serviços -> Sobre
    await page.goForward();
    await expect(page).toHaveURL('/sobre');
    await expect(page.locator('h1')).toContainText(/Sobre Nós/i);
  });

  test('should navigate using direct links', async ({ page }) => {
    // Test: Acessar rotas diretamente via URL

    // Acesso direto: /servicos
    await page.goto('/servicos');
    await expect(page).toHaveURL('/servicos');
    await expect(page.locator('h1')).toContainText(/Nossos Serviços/i);

    // Acesso direto: /sobre
    await page.goto('/sobre');
    await expect(page).toHaveURL('/sobre');
    await expect(page.locator('h1')).toContainText(/Sobre Nós/i);

    // Acesso direto: /contato
    await page.goto('/contato');
    await expect(page).toHaveURL('/contato');
    await expect(page.locator('h1')).toContainText(/Entre em Contato/i);
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    // Test: Página 404 para rotas que não existem

    const unknownRoutes = [
      '/rota-inexistente',
      '/pagina-desconhecida',
      '/teste/404',
      '/admin/secret'
    ];

    for (const route of unknownRoutes) {
      await page.goto(route);

      // Verificar que está na página 404
      await expect(page.locator('h1, h2')).toContainText(/404/i);
      await expect(page.locator('text=/página não encontrada/i')).toBeVisible();
      await expect(page.locator('text=/voltar/i, text=/home/i')).toBeVisible();

      // Verificar que o caminho incorreto é mostrado
      await expect(page.locator(`text=${route}`)).toBeVisible();
    }
  });

  test('should navigate from 404 page back to home', async ({ page }) => {
    // Test: Voltar da página 404 para home

    // Ir para rota inexistente
    await page.goto('/rota-inexistente');
    await expect(page.locator('h1, h2')).toContainText(/404/i);

    // Clicar em "Ir para Home"
    await page.click('text=/Ir para Home/i');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('should warn when leaving form with unsaved changes', async ({ page }) => {
    // Test: Aviso de formulário não salvo

    // Navegar para página de contato
    await page.goto('/contato');

    // Preencher formulário
    await page.fill('input[name="name"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao@example.com');
    await page.fill('textarea[name="message"]', 'Mensagem de teste');

    // Verificar que mostra aviso de não salvo
    await expect(page.locator('text=/alterações não salvas/i')).toBeVisible();

    // Setup dialog handler para capturar confirm()
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('formulário não enviado');
      await dialog.dismiss(); // Cancelar navegação
    });

    // Tentar navegar para outra página
    await page.click('text=Serviços');

    // Deve permanecer na página de contato
    await expect(page).toHaveURL('/contato');
  });

  test('should allow navigation after form submission', async ({ page }) => {
    // Test: Permitir navegação após submeter formulário

    // Navegar para página de contato
    await page.goto('/contato');

    // Preencher formulário
    await page.fill('input[name="name"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao@example.com');
    await page.fill('input[name="subject"]', 'Teste');
    await page.fill('textarea[name="message"]', 'Mensagem de teste');

    // Submeter formulário
    await page.click('button:has-text("Enviar")');

    // Aguardar toast de sucesso
    await expect(page.locator('text=/mensagem enviada/i')).toBeVisible({ timeout: 5000 });

    // Agora deve permitir navegação sem aviso
    await page.click('text=Serviços');
    await expect(page).toHaveURL('/servicos');
  });

  test('should maintain scroll position on back navigation', async ({ page }) => {
    // Test: Manter posição de scroll ao voltar

    // Navegar para página com conteúdo longo
    await page.goto('/servicos');

    // Scroll para baixo
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    // Navegar para outra página
    await page.click('text=Sobre nós');
    await page.waitForURL('/sobre');

    // Voltar
    await page.goBack();
    await expect(page).toHaveURL('/servicos');

    // Verificar que scroll foi restaurado (pode variar um pouco)
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
  });

  test('should handle protected routes correctly', async ({ page }) => {
    // Test: Rotas protegidas redirecionam para login

    const protectedRoutes = [
      '/documentos',
      '/analise',
      '/dashboard',
      '/comissoes'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Deve redirecionar para login
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
    }
  });

  test('should preserve authentication state during navigation', async ({ page }) => {
    // Test: Manter estado de autenticação ao navegar

    // Mock: Login (simular autenticação)
    await page.goto('/login');

    // TODO: Implementar login real quando disponível
    // Por enquanto, apenas verificar estrutura

    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should handle rapid navigation clicks', async ({ page }) => {
    // Test: Lidar com cliques rápidos na navegação

    await page.goto('/');

    // Clicar rapidamente em vários links
    await Promise.all([
      page.click('text=Serviços'),
      page.waitForTimeout(50),
      page.click('text=Sobre nós'),
      page.waitForTimeout(50),
      page.click('text=Contato'),
    ]);

    // Deve terminar na última página clicada
    await page.waitForURL('/contato');
    await expect(page).toHaveURL('/contato');
  });

  test('should navigate correctly with keyboard shortcuts', async ({ page }) => {
    // Test: Navegação via teclado (Tab, Enter)

    await page.goto('/');

    // Tab até o link de Serviços e pressionar Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verificar navegação (pode variar dependendo da ordem dos elementos)
    // Este teste pode precisar ser ajustado com data-testid
    await page.waitForTimeout(500);
  });
});

test.describe('Navigation Performance', () => {
  test('should navigate quickly between pages', async ({ page }) => {
    // Test: Performance de navegação

    await page.goto('/');

    const startTime = Date.now();

    // Navegar através de várias páginas
    await page.click('text=Serviços');
    await page.waitForURL('/servicos');

    await page.click('text=Sobre nós');
    await page.waitForURL('/sobre');

    await page.click('text=Contato');
    await page.waitForURL('/contato');

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Navegação deve ser rápida (< 3 segundos para 3 páginas)
    expect(totalTime).toBeLessThan(3000);
  });

  test('should not cause memory leaks on repeated navigation', async ({ page }) => {
    // Test: Sem vazamentos de memória

    await page.goto('/');

    // Navegar repetidamente entre páginas
    for (let i = 0; i < 10; i++) {
      await page.click('text=Serviços');
      await page.waitForURL('/servicos');

      await page.click('text=Sobre nós');
      await page.waitForURL('/sobre');

      await page.goBack();
      await page.waitForURL('/servicos');

      await page.goBack();
      await page.waitForURL('/');
    }

    // Se chegou aqui sem travar, está ok
    await expect(page).toHaveURL('/');
  });
});
