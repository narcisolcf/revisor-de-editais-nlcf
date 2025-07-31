# Sistema de Tratamento de Erros

Este documento descreve o sistema completo de tratamento e relatório de erros implementado na aplicação.

## Visão Geral

O sistema de tratamento de erros é composto por múltiplas camadas que trabalham juntas para:
- Capturar erros automaticamente em toda a aplicação
- Fornecer interfaces amigáveis para recuperação
- Coletar feedback detalhado dos usuários
- Centralizar o monitoramento e análise de erros
- Facilitar o desenvolvimento e debugging

## Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   ErrorBoundary  │    │  ErrorFallback  │
│                 │───▶│                  │───▶│                 │
│   Components    │    │   (Auto Catch)   │    │  (User Interface)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ MonitoringService│◀───│  useErrorHandler │    │ErrorReportDialog│
│                 │    │                  │    │                 │
│ (Centralization)│    │ (Manual Capture) │    │ (User Feedback) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Componentes Principais

### 1. ErrorBoundary

Componente React que captura erros JavaScript não tratados em qualquer lugar da árvore de componentes.

**Uso:**
```tsx
import { ErrorBoundary } from '@/components/error';

// Proteção global (já implementado em App.tsx)
<ErrorBoundary onError={handleGlobalError}>
  <MyApplication />
</ErrorBoundary>

// Proteção específica de componente
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>
```

**Características:**
- Auto-reset após 30 segundos
- Integração automática com monitoringService
- Fallback UI configurável
- Logging detalhado em desenvolvimento

### 2. ErrorFallback

Interface de usuário exibida quando um erro é capturado pelo ErrorBoundary.

**Funcionalidades:**
- Mensagem amigável baseada no tipo de erro
- Botões de recuperação (Tentar Novamente, Recarregar, Início)
- Botão para reportar problema (abre ErrorReportDialog)
- Detalhes técnicos em modo desenvolvimento

### 3. ErrorReportDialog

Modal para coleta de feedback detalhado do usuário sobre erros.

**Uso:**
```tsx
import ErrorReportDialog from '@/components/error/ErrorReportDialog';

const [isOpen, setIsOpen] = useState(false);

<ErrorReportDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  errorId="error_123"
  error={errorInstance}
/>
```

**Campos do formulário:**
- Descrição do problema (obrigatório)
- Passos para reproduzir (opcional)
- Email para contato (opcional)
- Severidade (baixa, média, alta, crítica)

### 4. useErrorHandler

Hook customizado para tratamento programático de erros.

**Uso:**
```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { logError, handleAsyncError, wrapAsync, reportManualError } = useErrorHandler();

  // Captura manual de erros
  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      logError(error, { component: 'MyComponent', action: 'handleClick' });
    }
  };

  // Wrapper para operações assíncronas
  const fetchData = handleAsyncError(
    async () => {
      const response = await api.getData();
      return response.data;
    },
    { component: 'MyComponent', action: 'fetchData' }
  );

  // Wrapper para funções assíncronas
  const processData = wrapAsync(
    async (data: any) => {
      return await api.processData(data);
    },
    { component: 'MyComponent', action: 'processData' }
  );

  // Relatório manual de problemas
  const reportIssue = () => {
    reportManualError(
      'Dados inconsistentes detectados',
      { component: 'MyComponent', userId: user.id },
      'medium'
    );
  };
}
```

### 5. MonitoringService

Serviço centralizado para todas as operações de monitoramento e relatório.

**Funcionalidades:**
- Coleta e armazenamento de erros
- Queue local para buffering
- Integração com serviços externos (futuro)
- Sanitização de dados sensíveis
- Estatísticas de desenvolvimento

**Uso direto (geralmente via hooks):**
```tsx
import { monitoringService } from '@/services/monitoringService';

// Reportar erro
await monitoringService.reportError(error, context);

// Submeter relatório do usuário
await monitoringService.submitUserReport(reportData);

// Desenvolvimento - visualizar estatísticas
const stats = monitoringService.getErrorStats();
console.log(stats); // { total: 5, byCategory: { network: 2, validation: 3 } }
```

### 6. useMonitoring

Hook para interação com o monitoringService.

**Uso:**
```tsx
import { useMonitoring } from '@/hooks/useMonitoring';

function DevTools() {
  const { reportError, trackEvent, getErrorStats, clearErrors } = useMonitoring();

  const handleCustomReport = () => {
    reportError(new Error('Custom error'), { 
      component: 'DevTools',
      isCustom: true 
    });
  };

  const viewStats = () => {
    const stats = getErrorStats();
    console.log('Error Statistics:', stats);
  };
}
```

## Fluxo Completo de Erro

### 1. Erro Automático (via ErrorBoundary)
```
Error occurs → ErrorBoundary catches → ErrorFallback displays → User reports → Dialog opens → Report submitted → Service processes
```

### 2. Erro Manual (via useErrorHandler)
```
Developer calls logError → monitoringService receives → Toast notification → Optional user report
```

### 3. Operação Assíncrona
```
Async operation fails → useErrorHandler catches → Error logged → Toast shown → Context preserved
```

## Classificação de Erros

O sistema automaticamente classifica erros nas seguintes categorias:

- **Network**: Problemas de conectividade, falhas de API
- **Validation**: Dados inválidos, falhas de validação
- **Authentication**: Problemas de autenticação, sessão expirada
- **Business Logic**: Erros de regras de negócio
- **UI Rendering**: Problemas de renderização, componentes
- **Unknown**: Erros não classificados

**Severidades:**
- **Low**: Não afeta o uso normal
- **Medium**: Dificulta algumas funcionalidades
- **High**: Impede funcionalidades importantes
- **Critical**: Aplicação inutilizável

## Integração com Serviços

### Desenvolvimento
- Logging detalhado no console
- Queue local de erros
- Estatísticas em tempo real
- Ferramentas de debugging

### Produção (Futuro)
- Integração com Sentry/LogRocket
- Envio automático para backend
- Dashboards de monitoramento
- Alertas automáticos

## Boas Práticas

### Para Desenvolvedores

1. **Use ErrorBoundary strategicamente:**
```tsx
// ✅ Bom - proteção específica
<ErrorBoundary>
  <CriticalFeature />
</ErrorBoundary>

// ❌ Evitar - muitos boundaries pequenos
<ErrorBoundary>
  <SimpleButton />
</ErrorBoundary>
```

2. **Forneça contexto relevante:**
```tsx
// ✅ Bom - contexto detalhado
logError(error, {
  component: 'DocumentUpload',
  action: 'processFile',
  userId: user.id,
  metadata: { fileType, fileSize }
});

// ❌ Evitar - contexto genérico
logError(error);
```

3. **Use wrappers para operações assíncronas:**
```tsx
// ✅ Bom - uso do wrapper
const uploadFile = wrapAsync(
  async (file: File) => {
    return await documentService.upload(file);
  },
  { component: 'DocumentUpload', action: 'upload' }
);

// ❌ Evitar - try/catch manual repetitivo
const uploadFile = async (file: File) => {
  try {
    return await documentService.upload(file);
  } catch (error) {
    console.error(error);
    toast({ variant: "destructive", title: "Erro no upload" });
  }
};
```

### Para UX

1. **Mensagens amigáveis:** Use `getErrorDisplayMessage()` para converter erros técnicos em linguagem do usuário
2. **Opções de recuperação:** Sempre forneça caminhos alternativos (recarregar, voltar, tentar novamente)
3. **Coleta de feedback:** Facilite o reporte de problemas sem ser intrusivo

## Testes

### Executar Testes
```bash
# Todos os testes do sistema de erros
npm test src/__tests__/components/ErrorBoundary.test.tsx
npm test src/__tests__/components/ErrorReportDialog.test.tsx
npm test src/__tests__/hooks/useErrorHandler.test.ts

# Todos os testes
npm test
```

### Cenários Testados
- ErrorBoundary captura erros corretamente
- ErrorFallback exibe interface apropriada
- ErrorReportDialog valida entrada e submete dados
- useErrorHandler trata erros síncronos e assíncronos
- Integração completa do fluxo de erro

## Troubleshooting

### Problemas Comuns

**Erro não é capturado pelo ErrorBoundary:**
- Verifique se o erro ocorre durante o render
- ErrorBoundary não captura erros em event handlers, async code, ou durante SSR

**Toast não aparece:**
- Verifique se o ToastProvider está no topo da aplicação
- Confirme que useToast está sendo usado corretamente

**Relatórios não são enviados:**
- Verifique a implementação do monitoringService
- Confirme conectividade de rede em produção

### Debug em Desenvolvimento

```tsx
// Visualizar queue de erros
console.log(monitoringService.getErrorQueue());

// Limpar queue
monitoringService.clearErrorQueue();

// Forçar erro para teste
throw new Error('Test error for development');
```

## Roadmap

### Próximas Implementações
- [ ] Integração com Sentry
- [ ] Dashboard interno de erros
- [ ] Métricas de performance
- [ ] Alertas automáticos
- [ ] Análise de padrões
- [ ] Integração com sistema de tickets

### Melhorias Futuras
- [ ] Captura de screenshots automática
- [ ] Gravação de sessão em erros críticos
- [ ] Machine learning para categorização
- [ ] Integração com analytics
- [ ] Sistema de feedback bidirecionais