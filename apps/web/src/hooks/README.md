# Hooks de Análise Adaptativa

Este diretório contém os hooks React personalizados para gerenciar análises adaptativas e configurações de análise no Revisor de Editais.

## 🎯 Visão Geral

Os hooks implementam funcionalidades avançadas para:
- **Gerenciamento de Configurações**: CRUD completo para configurações de análise organizacionais
- **Análise Adaptativa**: Execução de análises com parâmetros personalizados
- **Cache Inteligente**: Gerenciamento automático de cache com React Query
- **Fallback System**: Tratamento robusto de erros e degradação graciosa
- **Real-time Updates**: Atualizações em tempo real do progresso de análise

## 📚 Hooks Disponíveis

### `useAnalysisConfig`

Hook principal para gerenciar configurações de análise da organização.

#### Funcionalidades
- ✅ **CRUD Operations**: Criar, ler, atualizar e deletar configurações
- ✅ **Cache Management**: Cache local com React Query e invalidação inteligente
- ✅ **Template System**: Aplicar e gerenciar templates de configuração
- ✅ **Batch Operations**: Operações em lote para múltiplas configurações
- ✅ **Auto-sync**: Sincronização automática com backend
- ✅ **Validation**: Validação client-side robusta

#### Uso Básico

```tsx
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';

function ConfigurationManager() {
  const {
    configs,
    activeConfig,
    templates,
    createConfig,
    updateConfig,
    deleteConfig,
    applyTemplate,
    isLoadingConfigs,
    hasActiveConfig
  } = useAnalysisConfig('org-123');

  const handleCreateConfig = async () => {
    const newConfig = {
      organizationId: 'org-123',
      name: 'Configuração Padrão',
      description: 'Configuração padrão para editais',
      parameters: [
        {
          name: 'structural_weight',
          description: 'Peso da análise estrutural',
          category: 'structural',
          type: 'number',
          value: 25,
          defaultValue: 25,
          required: true,
          weight: 25,
          enabled: true
        }
      ],
      rules: [
        {
          name: 'check_sections',
          description: 'Verificar seções obrigatórias',
          category: 'structural',
          type: 'keyword_presence',
          keywordsAll: ['OBJETO', 'JUSTIFICATIVA', 'CRITÉRIOS'],
          severity: 'alta',
          suggestion: 'Adicionar seções obrigatórias',
          enabled: true,
          priority: 1
        }
      ],
      isDefault: true,
      isActive: true,
      version: '1.0.0'
    };

    try {
      await createConfig(newConfig);
      console.log('Configuração criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
    }
  };

  return (
    <div>
      <h2>Configurações de Análise</h2>
      
      {isLoadingConfigs ? (
        <div>Carregando configurações...</div>
      ) : (
        <div>
          <div className="mb-4">
            <button onClick={handleCreateConfig}>
              Nova Configuração
            </button>
          </div>
          
          <div className="grid gap-4">
            {configs?.map(config => (
              <div key={config.id} className="border p-4 rounded">
                <h3>{config.name}</h3>
                <p>{config.description}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateConfig(config.id, { isActive: !config.isActive })}>
                    {config.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => deleteConfig(config.id)}>
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### API Completa

```tsx
const {
  // Data
  configs,                    // Array de configurações
  activeConfig,               // Configuração ativa
  templates,                  // Templates disponíveis
  enabledConfigs,             // Configurações habilitadas
  disabledConfigs,            // Configurações desabilitadas
  configsByCategory,          // Configurações agrupadas por categoria
  
  // Loading states
  isLoadingConfigs,           // Carregando configurações
  isLoadingActiveConfig,      // Carregando configuração ativa
  isLoadingTemplates,         // Carregando templates
  
  // Errors
  configsError,               // Erro ao carregar configurações
  activeConfigError,          // Erro ao carregar configuração ativa
  templatesError,             // Erro ao carregar templates
  
  // Filters
  filters,                    // Filtros atuais
  updateFilters,              // Atualizar filtros
  resetFilters,               // Resetar filtros
  
  // Mutations
  createConfig,               // Criar configuração
  updateConfig,               // Atualizar configuração
  deleteConfig,               // Deletar configuração
  toggleConfigStatus,         // Alternar status
  applyTemplate,              // Aplicar template
  duplicateConfig,            // Duplicar configuração
  
  // Mutation states
  isCreating,                 // Criando configuração
  isUpdating,                 // Atualizando configuração
  isDeleting,                 // Deletando configuração
  isToggling,                 // Alternando status
  isApplyingTemplate,         // Aplicando template
  isDuplicating,              // Duplicando configuração
  
  // Utilities
  refetchConfigs,             // Recarregar configurações
  hasActiveConfig,            // Tem configuração ativa
  totalConfigs,               // Total de configurações
  totalTemplates              // Total de templates
} = useAnalysisConfig(organizationId);
```

### `useAdaptiveAnalysis`

Hook para executar análises adaptativas com parâmetros personalizados.

#### Funcionalidades
- ✅ **Adaptive Execution**: Análise com parâmetros customizados
- ✅ **Real-time Progress**: Tracking em tempo real do progresso
- ✅ **Status Management**: Gerenciamento de status de análises ativas
- ✅ **Baseline Comparison**: Comparação com análises baseline
- ✅ **Performance Metrics**: Métricas detalhadas de performance
- ✅ **Error Handling**: Tratamento robusto de erros

#### Uso Básico

```tsx
import { useAdaptiveAnalysis } from '@/hooks/useAdaptiveAnalysis';

function DocumentAnalyzer() {
  const {
    executeAnalysis,
    activeAnalyses,
    recentAnalyses,
    isExecuting,
    cancelAnalysis
  } = useAdaptiveAnalysis('org-123');

  const handleAnalyze = async () => {
    const request = {
      documentId: 'doc-123',
      text: 'Conteúdo do documento...',
      classification: {
        tipoObjeto: 'OBRA',
        modalidade: 'PREGÃO_ELETRÔNICO',
        subtipo: 'OBRA_PÚBLICA'
      },
      configId: 'config-456',
      customParameters: {
        structural_weight: 30,
        legal_strictness: 'high',
        clarity_threshold: 0.8
      },
      priority: 'high',
      enableRealTime: true
    };

    try {
      const result = await executeAnalysis(request);
      console.log('Análise concluída:', result);
    } catch (error) {
      console.error('Erro na análise:', error);
    }
  };

  const handleCancel = async (analysisId: string) => {
    try {
      await cancelAnalysis(analysisId);
      console.log('Análise cancelada');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
  };

  return (
    <div>
      <h2>Análise de Documentos</h2>
      
      <div className="mb-4">
        <button 
          onClick={handleAnalyze}
          disabled={isExecuting}
        >
          {isExecuting ? 'Analisando...' : 'Iniciar Análise'}
        </button>
      </div>
      
      {/* Análises Ativas */}
      <div className="mb-6">
        <h3>Análises Ativas ({activeAnalyses.length})</h3>
        {activeAnalyses.map(analysis => (
          <div key={analysis.id} className="border p-4 rounded mb-2">
            <div className="flex justify-between items-center">
              <div>
                <p>Status: {analysis.status}</p>
                <p>Progresso: {analysis.progress}%</p>
                <p>Etapa: {analysis.currentStep}</p>
              </div>
              <button 
                onClick={() => handleCancel(analysis.id)}
                disabled={analysis.status !== 'processing'}
              >
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Análises Recentes */}
      <div>
        <h3>Análises Recentes ({recentAnalyses.length})</h3>
        {recentAnalyses.map(analysis => (
          <div key={analysis.id} className="border p-4 rounded mb-2">
            <p>Score: {analysis.overallScore.toFixed(1)}/100</p>
            <p>Problemas: {analysis.problems.length}</p>
            <p>Configuração: {analysis.configId || 'Padrão'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### API Completa

```tsx
const {
  // Data
  recentAnalyses,             // Análises recentes
  activeAnalyses,             // Análises ativas
  
  // Loading states
  isLoadingRecentAnalyses,    // Carregando análises recentes
  isExecuting,                // Executando análise
  isCancelling,               // Cancelando análise
  
  // Errors
  recentAnalysesError,        // Erro ao carregar análises
  executionError,             // Erro na execução
  
  // Functions
  executeAnalysis,            // Executar análise
  cancelAnalysis,             // Cancelar análise
  getAnalysisById,            // Buscar análise por ID
  getAnalysisProgress,        // Obter progresso da análise
  getActiveAnalysisStatus,    // Obter status da análise
  compareWithBaseline,        // Comparar com baseline
  clearCompletedAnalyses,     // Limpar análises concluídas
  startProgressTracking,      // Iniciar tracking de progresso
  
  // Utilities
  refetchRecentAnalyses,      // Recarregar análises recentes
  hasActiveAnalyses,          // Tem análises ativas
  totalActiveAnalyses,        // Total de análises ativas
  totalRecentAnalyses         // Total de análises recentes
} = useAdaptiveAnalysis(organizationId);
```

## 🔧 Configuração

### Dependências

Certifique-se de ter as seguintes dependências instaladas:

```bash
npm install @tanstack/react-query
npm install lucide-react
```

### Setup do React Query

Configure o React Query no seu app:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Seu app aqui */}
    </QueryClientProvider>
  );
}
```

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ORGANIZATION_ID=org-123
```

## 📊 Tipos e Interfaces

### AnalysisParameter

```tsx
interface AnalysisParameter {
  id: string;
  name: string;
  description: string;
  category: 'structural' | 'legal' | 'clarity' | 'abnt' | 'general';
  type: 'boolean' | 'number' | 'string' | 'select' | 'range';
  value: any;
  defaultValue: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  weight: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### OrganizationConfig

```tsx
interface OrganizationConfig {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  parameters: AnalysisParameter[];
  rules: AnalysisRule[];
  isDefault: boolean;
  isActive: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AdaptiveAnalysisRequest

```tsx
interface AdaptiveAnalysisRequest {
  documentId: string;
  text: string;
  classification: any;
  configId?: string;
  customParameters?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  enableRealTime?: boolean;
}
```

## 🚀 Casos de Uso Avançados

### A/B Testing de Configurações

```tsx
const { createABTest, getABTestResults } = useAnalysisConfig(organizationId);

const handleABTest = async () => {
  const test = await createABTest({
    configA: 'config-123',
    configB: 'config-456',
    organizationId: 'org-123',
    duration: 30 // 30 dias
  });
  
  console.log('A/B Test criado:', test.id);
};

const handleGetResults = async (testId: string) => {
  const results = await getABTestResults(testId);
  console.log('Resultados:', results);
};
```

### Análise de Impacto

```tsx
const { analyzeConfigImpact } = useAnalysisConfig(organizationId);

const handleImpactAnalysis = async (configId: string) => {
  const impact = await analyzeConfigImpact(configId, 'org-123');
  
  console.log('Documentos afetados:', impact.affectedDocuments);
  console.log('Mudança estimada no score:', impact.estimatedScoreChange);
  console.log('Nível de risco:', impact.riskLevel);
  console.log('Recomendações:', impact.recommendations);
};
```

### Preview de Mudanças

```tsx
const { previewConfigChanges } = useAnalysisConfig(organizationId);

const handlePreview = async (configId: string, changes: UpdateConfigRequest) => {
  const preview = await previewConfigChanges(configId, changes);
  
  console.log('Score atual:', preview.currentScore);
  console.log('Score projetado:', preview.projectedScore);
  console.log('Mudanças:', preview.changes);
  console.log('Riscos:', preview.risks);
};
```

## 🎨 Integração com UI

### Componente de Resultados

```tsx
import { AdaptiveAnalysisResults } from '@/components/analysis';

function AnalysisPage() {
  const [result, setResult] = useState<AdaptiveAnalysisResult | null>(null);
  
  return (
    <div>
      {result && (
        <AdaptiveAnalysisResults
          result={result}
          onExport={(format) => {
            console.log(`Exportando em ${format}`);
          }}
          showAdvancedMetrics={true}
        />
      )}
    </div>
  );
}
```

### Gerenciador de Configurações

```tsx
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';

function ConfigManager() {
  const {
    configs,
    createConfig,
    updateConfig,
    deleteConfig,
    isLoadingConfigs
  } = useAnalysisConfig('org-123');
  
  // Implementar UI de gerenciamento
}
```

## 🔍 Debugging e Monitoramento

### React Query DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Seu app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Logs de Performance

```tsx
const { executeAnalysis } = useAdaptiveAnalysis('org-123');

const handleAnalyze = async () => {
  const startTime = performance.now();
  
  try {
    const result = await executeAnalysis(request);
    const endTime = performance.now();
    
    console.log(`Análise concluída em ${endTime - startTime}ms`);
    console.log('Métricas:', result.performanceMetrics);
  } catch (error) {
    console.error('Erro na análise:', error);
  }
};
```

## 🧪 Testes

### Testes Unitários

```tsx
import { renderHook, act } from '@testing-library/react';
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';

describe('useAnalysisConfig', () => {
  it('should create a new configuration', async () => {
    const { result } = renderHook(() => useAnalysisConfig('org-123'));
    
    await act(async () => {
      await result.current.createConfig(mockConfig);
    });
    
    expect(result.current.configs).toHaveLength(1);
  });
});
```

### Testes de Integração

```tsx
import { useAdaptiveAnalysis } from '@/hooks/useAdaptiveAnalysis';

describe('useAdaptiveAnalysis', () => {
  it('should execute analysis successfully', async () => {
    const { result } = renderHook(() => useAdaptiveAnalysis('org-123'));
    
    await act(async () => {
      const analysisResult = await result.current.executeAnalysis(mockRequest);
      expect(analysisResult.overallScore).toBeGreaterThan(0);
    });
  });
});
```

## 📈 Performance e Otimização

### Otimizações Recomendadas

1. **Debounce em Filtros**: Use debounce para filtros de busca
2. **Virtualização**: Para listas grandes de configurações
3. **Lazy Loading**: Carregar configurações sob demanda
4. **Memoização**: Use `useMemo` e `useCallback` adequadamente

### Exemplo de Otimização

```tsx
import { useMemo, useCallback } from 'react';
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';

function OptimizedConfigList() {
  const { configs, updateFilters } = useAnalysisConfig('org-123');
  
  // Memoizar filtros
  const activeConfigs = useMemo(() => 
    configs?.filter(c => c.isActive) || [], 
    [configs]
  );
  
  // Callback memoizado
  const handleFilterChange = useCallback((category: string) => {
    updateFilters({ category });
  }, [updateFilters]);
  
  return (
    <div>
      {activeConfigs.map(config => (
        <ConfigItem key={config.id} config={config} />
      ))}
    </div>
  );
}
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Configuração não carrega**
   - Verifique se `organizationId` está correto
   - Confirme se a API está respondendo
   - Verifique os logs do React Query

2. **Análise falha**
   - Verifique se o orquestrador está inicializado
   - Confirme se os parâmetros são válidos
   - Verifique se há erros de rede

3. **Cache não funciona**
   - Verifique se React Query está configurado
   - Confirme se as query keys estão corretas
   - Verifique se o staleTime está adequado

### Logs de Debug

```tsx
// Habilitar logs detalhados
const { executeAnalysis } = useAdaptiveAnalysis('org-123');

const handleAnalyze = async () => {
  console.log('Iniciando análise...');
  
  try {
    const result = await executeAnalysis(request);
    console.log('Análise bem-sucedida:', result);
  } catch (error) {
    console.error('Erro na análise:', error);
    console.error('Stack trace:', error.stack);
  }
};
```

## 🔮 Roadmap e Melhorias Futuras

### Funcionalidades Planejadas

- [ ] **WebSocket Integration**: Atualizações em tempo real via WebSocket
- [ ] **Offline Support**: Funcionamento offline com sincronização
- [ ] **Advanced Caching**: Cache inteligente com machine learning
- [ ] **Batch Processing**: Processamento em lote de múltiplos documentos
- [ ] **Custom Analytics**: Dashboards personalizáveis
- [ ] **Integration APIs**: APIs para integração com sistemas externos

### Contribuições

Para contribuir com melhorias:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Adicione testes
5. Submeta um pull request

## 📚 Recursos Adicionais

- [Documentação da API](./api/README.md)
- [Guia de Arquitetura](./architecture/README.md)
- [Exemplos de Uso](./examples/README.md)
- [FAQ](./FAQ.md)

---

**Desenvolvido com ❤️ pela equipe do Revisor de Editais**
