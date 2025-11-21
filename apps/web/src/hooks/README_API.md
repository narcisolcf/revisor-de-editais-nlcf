# 🚀 Guia de Uso - API Client & useApi Hook

## Visão Geral

Este sistema fornece tratamento robusto de requisições HTTP com:
- ✅ Retry automático com exponential backoff
- ✅ Interceptors para autenticação e logging
- ✅ Error handling com toasts amigáveis
- ✅ Botão de retry manual em erros
- ✅ TypeScript com tipos completos
- ✅ Cancelamento automático de requisições

---

## 📦 Instalação e Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Inicialização

O API Client é inicializado automaticamente no `App.tsx`:

```tsx
import { initializeApiClient } from '@/lib/api-config';

useEffect(() => {
  initializeApiClient();
}, []);
```

---

## 🎯 Uso do Hook `useApi`

### Exemplo Básico (GET)

```tsx
import { useGet } from '@/hooks/useApi';

function UserProfile() {
  const { data, loading, error, execute } = useGet<User>('/api/users/me', {
    immediate: true, // Executa automaticamente ao montar
    showErrorToast: true
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{data?.name}</div>;
}
```

### Exemplo com POST

```tsx
import { usePost } from '@/hooks/useApi';

function CreateDocument() {
  const { execute, loading } = usePost('/api/documents', {
    onSuccess: (data) => {
      console.log('Documento criado:', data);
      navigate(`/documents/${data.id}`);
    },
    successMessage: 'Documento criado com sucesso!',
    showSuccessToast: true
  });

  const handleSubmit = async (formData: DocumentData) => {
    await execute({ body: formData });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <Button disabled={loading}>
        {loading ? 'Criando...' : 'Criar Documento'}
      </Button>
    </form>
  );
}
```

### Exemplo com Retry Manual

```tsx
import { useGet } from '@/hooks/useApi';

function DocumentList() {
  const { data, error, retry, loading } = useGet('/api/documents');

  if (error) {
    return (
      <div>
        <p>Erro ao carregar documentos</p>
        <Button onClick={retry} disabled={loading}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return <DocumentTable data={data} />;
}
```

### Exemplo com Custom Error Handling

```tsx
import { useApi } from '@/hooks/useApi';

function AnalyzeDocument() {
  const { execute, loading, error } = useApi('/api/analyze', {
    method: 'POST',
    showErrorToast: false, // Desabilita toast automático
    onError: (error) => {
      // Tratamento customizado
      if (error.status === 422) {
        setValidationErrors(error.responseBody.errors);
      } else {
        showCustomErrorDialog(error);
      }
    }
  });

  return (
    <Button onClick={() => execute({ body: documentData })}>
      Analisar
    </Button>
  );
}
```

---

## 🔧 Uso Direto do ApiClient

Para casos avançados, use o `apiClient` diretamente:

```tsx
import { apiClient } from '@/lib/api-config';

// GET simples
const response = await apiClient.get('/api/users');

// POST com dados
const response = await apiClient.post('/api/documents', {
  title: 'Novo Documento',
  content: '...'
});

// PUT com headers customizados
const response = await apiClient.put('/api/documents/123',
  { title: 'Atualizado' },
  { headers: { 'X-Custom': 'value' } }
);

// DELETE
await apiClient.delete('/api/documents/123');

// Cancelar requisição específica
apiClient.cancelRequest('request_id');

// Cancelar todas as requisições
apiClient.cancelAllRequests();
```

---

## ⚙️ Configuração Avançada

### Adicionar Interceptor Customizado

```tsx
import { apiClient } from '@/lib/api-config';

// Request Interceptor
const customInterceptor = async (config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
};

apiClient.addRequestInterceptor(customInterceptor);

// Response Interceptor
const loggingInterceptor = {
  onSuccess: async (response) => {
    console.log('Response:', response);
    return response;
  },
  onError: async (error) => {
    console.error('Error:', error);
    throw error;
  }
};

apiClient.addResponseInterceptor(loggingInterceptor);
```

### Atualizar Configuração Dinamicamente

```tsx
import { apiClient } from '@/lib/api-config';

// Alterar base URL
apiClient.updateConfig({
  baseUrl: 'https://api.producao.com'
});

// Alterar timeout
apiClient.updateConfig({
  timeout: 60000 // 60 segundos
});

// Desabilitar retry
apiClient.updateConfig({
  enableRetry: false
});
```

---

## 🧪 Testando Componentes

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useGet } from '@/hooks/useApi';
import { apiClient } from '@/services/core/api';

vi.mock('@/services/core/api');

test('deve carregar dados com sucesso', async () => {
  vi.mocked(apiClient.request).mockResolvedValueOnce({
    data: { id: 1, name: 'Test' },
    status: 200
  });

  const { result } = renderHook(() => useGet('/test'));

  await result.current.execute();

  await waitFor(() => {
    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
  });
});
```

---

## 📊 Tipos Disponíveis

```tsx
interface UseApiOptions<T> {
  immediate?: boolean;              // Executar ao montar
  onSuccess?: (data: T) => void;   // Callback de sucesso
  onError?: (error: NetworkError) => void; // Callback de erro
  successMessage?: string;          // Mensagem toast sucesso
  errorMessage?: string;            // Mensagem toast erro
  showErrorToast?: boolean;         // Exibir toast de erro
  showSuccessToast?: boolean;       // Exibir toast de sucesso
  enableRetryButton?: boolean;      // Botão retry no toast
}

interface UseApiReturn<T> {
  data: T | null;                   // Dados da resposta
  error: NetworkError | null;       // Erro se ocorreu
  loading: boolean;                 // Estado de loading
  status: number | null;            // Status HTTP
  called: boolean;                  // Se já foi executado
  execute: (config?) => Promise;    // Executa requisição
  retry: () => Promise;             // Refaz última requisição
  reset: () => void;                // Reseta estado
  cancel: () => void;               // Cancela requisição
}
```

---

## 🚨 Tratamento de Erros

### Códigos de Erro Mapeados

| Status | Mensagem Padrão |
|--------|----------------|
| 400 | Requisição inválida. Verifique os dados. |
| 401 | Você não está autenticado. Faça login. |
| 403 | Sem permissão para acessar. |
| 404 | Recurso não encontrado. |
| 422 | Dados inválidos. Verifique os campos. |
| 429 | Muitas requisições. Aguarde. |
| 500+ | Erro no servidor. Tente novamente. |

### Timeout e Network Errors

- **Timeout**: "A requisição demorou muito. Verifique sua conexão."
- **Network**: "Erro de conexão. Verifique sua internet."

---

## 🎨 Exemplos de UI

### Loading State

```tsx
{loading && <Skeleton className="h-32" />}
```

### Error State com Retry

```tsx
{error && (
  <Alert variant="destructive">
    <AlertTitle>Erro ao carregar dados</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
    <Button onClick={retry} size="sm">
      Tentar Novamente
    </Button>
  </Alert>
)}
```

### Success State

```tsx
{data && <DataTable data={data} />}
```

---

## 📝 Boas Práticas

1. **Use hooks específicos**: Prefira `useGet`, `usePost` ao invés de `useApi` genérico
2. **Cancele requisições longas**: Em listas ou páginas que navegam rápido
3. **Toast de sucesso**: Use apenas para ações (POST/PUT/DELETE), não para GET
4. **Custom error handling**: Para validações complexas, desabilite toast e trate manualmente
5. **Immediate loading**: Use `immediate: true` apenas em dados críticos da página
6. **Retry button**: Sempre habilite para melhor UX

---

## 🔍 Debug

### Ver logs de requisições

Logs automáticos em modo desenvolvimento:

```
[API] GET /api/documents 200 OK
[API ERROR] Network Error: timeout
```

### Verificar configuração atual

```tsx
import { getApiConfig } from '@/lib/api-config';

console.log(getApiConfig());
```

---

## 🆘 Problemas Comuns

### Requisição não executa

- ✅ Verifique se `immediate: true` ou chamou `execute()`
- ✅ Verifique se o componente está montado

### Toast não aparece

- ✅ Verifique se `<Toaster />` está no App.tsx
- ✅ Confirme `showErrorToast: true` (padrão)

### Retry não funciona

- ✅ Use `retry()`, não `execute()` novamente
- ✅ Verifique se `enableRetryButton: true` (padrão)

### Autenticação não funciona

- ✅ Token está em `localStorage` como `auth_token`?
- ✅ Interceptor de auth está adicionado? (automático)

---

## 📚 Recursos Adicionais

- [Documentação ApiClient](/apps/web/src/services/core/api.ts)
- [Documentação ErrorService](/apps/web/src/services/core/error.ts)
- [Testes useApi](/apps/web/src/hooks/__tests__/useApi.test.tsx)

---

**Dúvidas?** Entre em contato com o time de desenvolvimento.
