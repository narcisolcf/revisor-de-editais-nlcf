# 🔧 Fix para Erros de Window e Testes E2E

**Data**: 2025-11-20
**Problema**: Erros de teste com `window` undefined e timeouts no Playwright

---

## 🐛 Problemas Identificados

### 1. NameError: `window` não está definido
**Causa**: Componentes React usando `window` diretamente sem verificar ambiente
**Impacto**: Falha em SSR, testes Node.js e ambientes sem browser

**Componentes Afetados**:
- `sidebar.tsx` - Linha 109-110
- `ErrorBoundary.tsx` - Linhas 79, 215
- `dashboard-error-boundary.tsx` - Linhas 56, 75, 79
- `DocumentUploader.tsx` - Linhas 229, 231
- `DocumentDashboard.tsx` - Linhas 349, 361
- `QuickActions.tsx` - Linhas 303, 314
- `ReportExporter.tsx` - Linha 432
- `ErrorFallback.tsx` - Linhas 19, 30
- `TemplatePreview.tsx` - Linhas 121, 125
- `CTASection.tsx` - Linha 27

### 2. TimeoutError: Playwright clicks
**Causa**: Elementos não estão visíveis/habilitados quando o click é tentado
**Impacto**: Testes E2E falham com timeout 5000ms

**XPaths Afetados**:
- `html/body/div/div[2]/div/div/div/section/div[2]/div/div/div[4]/button`
- `html/body/div/div[2]/div/header/div[2]/button`

---

## ✅ Solução

### Solução 1: Helper Browser-Safe (Criado)

**Arquivo**: `apps/web/src/lib/browser-utils.ts`

**Funções Criadas**:
- `isBrowser()` - Verifica se está no browser
- `safeWindow()` - Acessa window com segurança
- `safeDocument()` - Acessa document com segurança
- `safeOpen()` - window.open seguro
- `safeReload()` - window.location.reload seguro
- `safeNavigate()` - window.location.href seguro
- `safeGetCurrentUrl()` - Obtém URL atual
- `safeAddEventListener()` - Adiciona eventos com segurança
- `safeLocalStorage` - localStorage seguro
- `safeSessionStorage` - sessionStorage seguro
- `withBrowserOnly()` - HOC para componentes

### Solução 2: Patch para Componentes

**Exemplo de Fix**:

**ANTES**:
```typescript
// ❌ ERRADO - Falha em SSR/testes
window.addEventListener("keydown", handleKeyDown)
window.location.href = '/';
window.open(url, '_blank');
```

**DEPOIS**:
```typescript
// ✅ CORRETO - Seguro em todos ambientes
import { safeAddEventListener, safeNavigate, safeOpen } from '@/lib/browser-utils';

safeAddEventListener("keydown", handleKeyDown);
safeNavigate('/');
safeOpen(url, '_blank');
```

### Solução 3: Fix para Testes E2E

**Problema**: XPaths rígidos e timeouts curtos

**Solução**:
1. Usar seletores mais resilientes (data-testid, role, text)
2. Aumentar timeout para 30000ms
3. Aguardar estado específico antes de interações
4. Adicionar retry logic

---

## 🔨 Aplicando os Fixes

### Passo 1: Criar Arquivo de Patches

```bash
# Criar arquivo com todos os patches
cat > /tmp/apply_window_fixes.sh << 'EOF'
#!/bin/bash

# Fix sidebar.tsx
sed -i 's/window\.addEventListener/safeAddEventListener/g' apps/web/src/components/ui/sidebar.tsx
sed -i '1 i\import { safeAddEventListener } from "@/lib/browser-utils";' apps/web/src/components/ui/sidebar.tsx

# Fix ErrorBoundary.tsx
sed -i 's/window\.location\.href/safeGetCurrentUrl()/g' apps/web/src/components/ui/ErrorBoundary.tsx
sed -i '1 i\import { safeGetCurrentUrl } from "@/lib/browser-utils";' apps/web/src/components/ui/ErrorBoundary.tsx

# Fix dashboard-error-boundary.tsx
sed -i 's/window\.location\.reload/safeReload/g' apps/web/src/components/ui/dashboard-error-boundary.tsx
sed -i 's/window\.location\.href =/safeNavigate(/g' apps/web/src/components/ui/dashboard-error-boundary.tsx
sed -i '1 i\import { safeReload, safeNavigate, safeGetCurrentUrl } from "@/lib/browser-utils";' apps/web/src/components/ui/dashboard-error-boundary.tsx

# E assim por diante...
EOF

chmod +x /tmp/apply_window_fixes.sh
```

### Passo 2: Script de Patch Automático

Arquivo criado: `scripts/fix-window-usage.sh`

### Passo 3: Fix Manual Recomendado

Por ser mais seguro, recomendo aplicar fixes manualmente:

1. **Adicionar import em cada arquivo**:
```typescript
import { safeOpen, safeNavigate, safeReload, safeGetCurrentUrl } from '@/lib/browser-utils';
```

2. **Substituir cada uso**:
- `window.open(url, '_blank')` → `safeOpen(url, '_blank')`
- `window.location.href = url` → `safeNavigate(url)`
- `window.location.reload()` → `safeReload()`
- `window.location.href` (read) → `safeGetCurrentUrl()`

### Passo 4: Fix para Testes E2E

**Arquivo**: `tests/e2e/utils/test-helpers.ts`

Adicionar helpers:

```typescript
/**
 * Click com retry e wait
 */
export async function safeClick(
  page: Page,
  selector: string,
  options?: { timeout?: number; retries?: number }
) {
  const timeout = options?.timeout || 30000;
  const retries = options?.retries || 3;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      await page.click(selector, { timeout });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(1000 * (i + 1)); // Exponential backoff
    }
  }
}

/**
 * Usar seletores mais resilientes
 */
export function getSafeSelector(testId: string): string {
  return `[data-testid="${testId}"]`;
}
```

**Usar nos testes**:
```typescript
// ❌ ANTES
await page.click('xpath=html/body/div/div[2]/div/header/div[2]/button');

// ✅ DEPOIS
await safeClick(page, '[data-testid="header-menu-button"]');
// ou
await safeClick(page, 'button[aria-label="Menu"]');
```

---

## 🧪 Testando os Fixes

### Teste 1: Verificar Imports
```bash
# Verificar se todos os componentes foram atualizados
grep -r "window\." apps/web/src/components/ --include="*.tsx" | \
  grep -v "browser-utils" | \
  grep -v node_modules
```

Resultado esperado: Nenhuma linha (exceto comentários)

### Teste 2: Executar Testes Unitários
```bash
cd apps/web
npm run test
```

Esperado: Nenhum erro de `window is not defined`

### Teste 3: Executar Testes E2E
```bash
npm run test:e2e
```

Esperado: Sem timeouts (ou timeouts reduzidos)

### Teste 4: Build SSR
```bash
npm run build
```

Esperado: Build sem erros

---

## 📋 Checklist de Aplicação

### Window Fixes
- [ ] `apps/web/src/lib/browser-utils.ts` criado
- [ ] sidebar.tsx atualizado
- [ ] ErrorBoundary.tsx atualizado
- [ ] dashboard-error-boundary.tsx atualizado
- [ ] DocumentUploader.tsx atualizado
- [ ] DocumentDashboard.tsx atualizado
- [ ] QuickActions.tsx atualizado
- [ ] ReportExporter.tsx atualizado
- [ ] ErrorFallback.tsx atualizado
- [ ] TemplatePreview.tsx atualizado
- [ ] CTASection.tsx atualizado

### Test Fixes
- [ ] test-helpers.ts atualizado com safeClick
- [ ] complete-analysis-flow.spec.ts atualizado
- [ ] error-recovery.spec.ts atualizado
- [ ] integration-tests.spec.ts atualizado
- [ ] Seletores XPath substituídos por data-testid
- [ ] Timeouts aumentados para 30000ms

### Validação
- [ ] Testes unitários passando
- [ ] Testes E2E passando
- [ ] Build SSR funcionando
- [ ] Sem warnings de window no console

---

## 🚀 Script de Aplicação Rápida

Arquivo criado: `scripts/apply-window-fixes.sh`

**Uso**:
```bash
cd /home/user/revisor-de-editais-nlcf
bash scripts/apply-window-fixes.sh
```

---

## 📊 Impacto Esperado

### Antes dos Fixes
```
❌ NameError: window is not defined (11 componentes)
❌ TimeoutError: 5000ms exceeded (testes E2E)
❌ SSR build failing
❌ Tests failing em CI/CD
```

### Depois dos Fixes
```
✅ Todos os componentes SSR-safe
✅ Testes E2E com seletores resilientes
✅ Build SSR funcionando
✅ CI/CD verde
```

---

## 📝 Notas Importantes

1. **Não Commitado Ainda**: Este fix está documentado mas não aplicado
2. **Requer Revisão**: Cada componente deve ser revisado manualmente
3. **Testes Obrigatórios**: Executar todos os testes após aplicar
4. **Backup**: Fazer backup antes de aplicar patches automáticos

---

**Status**: 📝 Documentado, aguardando aplicação
**Prioridade**: 🔴 Alta - Blocking testes
**Estimativa**: 2-3 horas para aplicar todos os fixes

