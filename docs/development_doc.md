# Development.md - Normas e Práticas de Codificação

## 🎯 Visão Geral

### Filosofia de Desenvolvimento
**"Código limpo, performante e sustentável"**

Nossos princípios fundamentais:
- **Clean Code**: Código legível é código sustentável
- **Performance-First**: Otimização desde o design
- **Type Safety**: TypeScript rigoroso para robustez
- **Test-Driven**: Testes como documentação viva
- **User-Centered**: Código que serve ao usuário final

### Metodologia
- **Agile Scrum**: Sprints de 2 semanas
- **Trunk-based Development**: Feature flags para releases
- **Code Reviews**: Obrigatórios para todo código
- **Pair Programming**: Sessões regulares para conhecimento compartilhado
- **Continuous Integration**: Automação de qualidade

## 🚨 Sistema de Tratamento de Erros

### Estado Atual
O sistema de tratamento de erros está **totalmente implementado** e funcional:

#### Componentes Existentes
```
src/components/error/
├── ErrorBoundary.tsx        # ✅ Implementado
├── ErrorFallback.tsx        # ✅ Implementado  
├── ErrorReportDialog.tsx    # ✅ Implementado
└── index.ts

src/hooks/
├── useErrorHandler.ts       # ✅ Implementado
└── useMonitoring.ts         # ✅ Implementado

src/services/
└── monitoringService.ts     # ✅ Implementado
```

#### Funcionalidades Ativas
- ✅ **ErrorBoundary**: Captura automática de erros React
- ✅ **ErrorFallback**: Interface amigável de recuperação
- ✅ **ErrorReportDialog**: Coleta de feedback do usuário
- ✅ **useErrorHandler**: Hook para tratamento programático
- ✅ **MonitoringService**: Centralização e buffering de erros
- ✅ **Classificação Automática**: Network, Validation, Business Logic, etc.

### Padrões de Uso Atual

#### Captura Automática
```typescript
// ✅ Já implementado em App.tsx
<ErrorBoundary onError={handleGlobalError}>
  <QueryClientProvider client={queryClient}>
    <MyApplication />
  </QueryClientProvider>
</ErrorBoundary>
```

#### Tratamento Programático
```typescript
// ✅ Hook funcional para desenvolvedores
const { logError, handleAsyncError, wrapAsync } = useErrorHandler();

// Wrapper para operações assíncronas  
const fetchData = handleAsyncError(
  async () => await api.getData(),
  { component: 'MyComponent', action: 'fetchData' }
);
```

#### Monitoramento Centralizado
```typescript
// ✅ Serviço ativo coletando métricas
const stats = monitoringService.getErrorStats();
// { total: 5, byCategory: { network: 2, validation: 3 } }
```

### Próximas Melhorias (Q1 2025)

#### Integração Externa
- [ ] **Sentry Integration**: Para produção com alertas automáticos
- [ ] **Dashboard Interno**: Visualização avançada de métricas
- [ ] **Error Replay**: Reprodução de contexto para debugging

#### Otimizações
- [ ] **Performance**: Reduzir overhead para < 2ms por erro
- [ ] **Batching Inteligente**: Otimizar envio de relatórios
- [ ] **Machine Learning**: Classificação automática melhorada

#### Funcionalidades Avançadas
- [ ] **Screenshots Automáticos**: Captura visual em erros críticos
- [ ] **Session Recording**: Gravação de sessão em erros críticos
- [ ] **Predictive Analytics**: Predição de erros baseada em padrões

### Documentação de Referência
Para detalhes completos do sistema implementado, consulte:
- `docs/architecture/error_handling.md` - Documentação técnica completa
- `docs/features/epic_sistema_reporte_erros.md` - Especificação original

---

## 📁 Estrutura de Projeto

### Organização de Pastas
```
src/
├── components/              # Componentes React reutilizáveis
│   ├── ui/                 # Componentes base do design system
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts        # Barrel exports
│   ├── forms/              # Componentes de formulário
│   ├── layout/             # Layout e navegação
│   └── analysis/           # Componentes específicos do domínio
├── pages/                  # Páginas da aplicação (React Router)
├── hooks/                  # Custom hooks reutilizáveis
├── services/               # Camada de serviços e APIs
├── types/                  # Definições de tipos TypeScript
├── utils/                  # Funções utilitárias puras
├── data/                   # Dados estáticos e configurações
├── assets/                 # Recursos estáticos (imagens, fonts)
├── __tests__/              # Testes utilitários e setup
│   ├── __mocks__/         # Mocks para testes
│   ├── fixtures/          # Dados de teste
│   └── utils/             # Helpers de teste
└── App.tsx                 # Componente raiz
```

### Convenções de Nomenclatura

#### Arquivos e Pastas
```typescript
// ✅ Bom
components/DocumentAnalysis/DocumentAnalysis.tsx
hooks/useDocumentAnalysis.ts
types/document.ts
utils/formatters.ts

// ❌ Evitar
components/docAnalysis.tsx
hooks/doc-analysis.ts
types/DocumentTypes.ts
utils/Formatters.ts
```

#### Componentes
```typescript
// ✅ PascalCase para componentes
export const DocumentAnalysisCard: React.FC<Props> = ({ document }) => {
  return <div>{document.title}</div>;
};

// ✅ camelCase para funções utilitárias
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// ✅ UPPER_SNAKE_CASE para constantes
export const DEFAULT_ANALYSIS_TIMEOUT = 30000;
```

---

## 🎨 Padrões de Código

### TypeScript Guidelines

#### Configuração Rigorosa
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Definição de Tipos
```typescript
// ✅ Interfaces para objetos
interface Document {
  readonly id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Union types para enums
type DocumentType = 'edital' | 'termo_referencia' | 'contrato';
type DocumentStatus = 'pending' | 'analyzed' | 'reviewed' | 'approved';

// ✅ Generics para reusabilidade
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// ✅ Utility types
type CreateDocumentRequest = Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;
type DocumentSummary = Pick<Document, 'id' | 'title' | 'status'>;
```

#### Tipagem de Props
```typescript
// ✅ Props interface explícita
interface DocumentCardProps {
  document: Document;
  onAnalyze: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  loading?: boolean;
  className?: string;
}

// ✅ Componente tipado
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onAnalyze,
  onDelete,
  loading = false,
  className = ''
}) => {
  // Implementação...
};

// ✅ Ref forwarding tipado
export const DocumentInput = React.forwardRef<
  HTMLInputElement,
  DocumentInputProps
>(({ onChange, ...props }, ref) => {
  return <input ref={ref} onChange={onChange} {...props} />;
});
```

### Padrões React

#### Componentes Funcionais
```typescript
// ✅ Componente limpo e focado
export const ConformityScore: React.FC<ConformityScoreProps> = ({ 
  score, 
  size = 'md' 
}) => {
  const scoreColor = useMemo(() => getScoreColor(score), [score]);
  const scoreLabel = useMemo(() => getScoreLabel(score), [score]);

  return (
    <div className={cn('conformity-score', `size-${size}`)}>
      <CircularProgress 
        value={score} 
        color={scoreColor}
        size={size}
      />
      <span className="score-label">{scoreLabel}</span>
    </div>
  );
};

// ✅ Custom hook isolado
export const useConformityScore = (analysisId: string) => {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchScore = async () => {
      try {
        setLoading(true);
        const result = await analysisService.getConformityScore(analysisId);
        
        if (!cancelled) {
          setScore(result.score);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchScore();

    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return { score, loading, error };
};
```

#### Gerenciamento de Estado
```typescript
// ✅ Context para estado global
interface AppContextType {
  user: User | null;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ✅ Reducer para estado complexo
interface AnalysisState {
  analyses: Record<string, Analysis>;
  currentAnalysis: string | null;
  loading: boolean;
  error: string | null;
}

type AnalysisAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYSIS'; payload: { id: string; analysis: Analysis } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT'; payload: string | null };

const analysisReducer = (state: AnalysisState, action: AnalysisAction): AnalysisState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ANALYSIS':
      return {
        ...state,
        analyses: {
          ...state.analyses,
          [action.payload.id]: action.payload.analysis
        }
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT':
      return { ...state, currentAnalysis: action.payload };
    
    default:
      return state;
  }
};
```

### Padrões de Serviços

#### Arquitetura de Serviços
```typescript
// ✅ Interface base para serviços
interface BaseService {
  readonly name: string;
  readonly version: string;
}

// ✅ Serviço tipado
class DocumentAnalysisService implements BaseService {
  readonly name = 'DocumentAnalysisService';
  readonly version = '1.0.0';

  private readonly httpClient: HttpClient;
  private readonly cache: AnalysisCache;

  constructor(httpClient: HttpClient, cache: AnalysisCache) {
    this.httpClient = httpClient;
    this.cache = cache;
  }

  async analyzeDocument(
    documentId: string, 
    options: AnalysisOptions = {}
  ): Promise<Analysis> {
    const cacheKey = `analysis:${documentId}:${hash(options)}`;
    
    // Verificar cache primeiro
    const cached = await this.cache.get(cacheKey);
    if (cached && !options.force) {
      return cached;
    }

    try {
      const analysis = await this.httpClient.post<Analysis>('/analyze', {
        documentId,
        ...options
      });

      // Cache do resultado
      await this.cache.set(cacheKey, analysis, { ttl: 3600 });

      return analysis;
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze document ${documentId}`,
        { cause: error, documentId, options }
      );
    }
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    return this.httpClient.get<AnalysisStatus>(`/analysis/${analysisId}/status`);
  }
}

// ✅ Factory pattern para injeção de dependências
export const createDocumentAnalysisService = (
  httpClient: HttpClient,
  cache: AnalysisCache
): DocumentAnalysisService => {
  return new DocumentAnalysisService(httpClient, cache);
};
```

#### Tratamento de Erros
```typescript
// ✅ Hierarquia de erros customizada
export class AppError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: { code?: string; context?: Record<string, unknown>; cause?: Error } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.context = options.context;
    
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field: string,
    value?: unknown
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      context: { field, value }
    });
  }
}

export class AnalysisError extends AppError {
  constructor(
    message: string,
    context: { documentId: string; options?: AnalysisOptions; cause?: Error }
  ) {
    super(message, {
      code: 'ANALYSIS_ERROR',
      context,
      cause: context.cause
    });
  }
}

// ✅ Wrapper para handling consistente
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: Record<string, unknown> = {}
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Unexpected error in ${fn.name}`,
        { cause: error as Error, context }
      );
    }
  };
};
```

---

## 🧪 Padrões de Teste

### Estrutura de Testes

#### Organização
```
src/
├── components/
│   └── DocumentCard/
│       ├── DocumentCard.tsx
│       ├── DocumentCard.test.tsx      # Testes unitários
│       └── DocumentCard.stories.tsx   # Storybook stories
├── services/
│   └── documentService.test.ts
├── __tests__/
│   ├── integration/                   # Testes de integração
│   ├── e2e/                          # Testes end-to-end
│   └── utils/                        # Utilities de teste
└── setupTests.ts                      # Configuração global
```

#### Convenções de Nomenclatura
```typescript
// ✅ Describe aninhados por funcionalidade
describe('DocumentAnalysisService', () => {
  describe('analyzeDocument', () => {
    it('should return cached analysis when available', async () => {
      // Test implementation
    });

    it('should throw AnalysisError when API fails', async () => {
      // Test implementation
    });

    describe('when force option is true', () => {
      it('should bypass cache and make API call', async () => {
        // Test implementation
      });
    });
  });
});
```

### Testes de Componentes

#### React Testing Library
```typescript
// ✅ Teste focado no comportamento do usuário
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from './DocumentCard';

const mockDocument: Document = {
  id: 'doc-1',
  title: 'Edital Teste',
  type: 'edital',
  status: 'pending',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

describe('DocumentCard', () => {
  it('should display document information correctly', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onAnalyze={jest.fn()}
      />
    );

    expect(screen.getByText('Edital Teste')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('should call onAnalyze when analyze button is clicked', async () => {
    const mockOnAnalyze = jest.fn();
    const user = userEvent.setup();

    render(
      <DocumentCard 
        document={mockDocument}
        onAnalyze={mockOnAnalyze}
      />
    );

    const analyzeButton = screen.getByRole('button', { name: /analisar/i });
    await user.click(analyzeButton);

    expect(mockOnAnalyze).toHaveBeenCalledWith('doc-1');
  });

  it('should show loading state during analysis', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onAnalyze={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: /analisando/i })).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Custom Render Wrapper
```typescript
// ✅ Provider wrapper para contextos
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContextProvider } from '@/contexts/AppContext';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    queryClient?: QueryClient;
    user?: User;
  } = {}
) => {
  const { queryClient = createTestQueryClient(), user = mockUser } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider initialUser={user}>
        {children}
      </AppContextProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper });
};
```

### Testes de Hooks

#### Testing Custom Hooks
```typescript
// ✅ Teste de custom hook
import { renderHook, waitFor } from '@testing-library/react';
import { useDocumentAnalysis } from './useDocumentAnalysis';

// Mock do serviço
jest.mock('@/services/documentService');
const mockDocumentService = jest.mocked(documentService);

describe('useDocumentAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useDocumentAnalysis('doc-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch analysis on mount', async () => {
    const mockAnalysis = { id: 'analysis-1', score: 85 };
    mockDocumentService.getAnalysis.mockResolvedValueOnce(mockAnalysis);

    const { result } = renderHook(() => useDocumentAnalysis('doc-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.analysis).toEqual(mockAnalysis);
    expect(mockDocumentService.getAnalysis).toHaveBeenCalledWith('doc-1');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Analysis failed');
    mockDocumentService.getAnalysis.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDocumentAnalysis('doc-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Analysis failed');
    expect(result.current.analysis).toBeNull();
  });
});
```

### Testes de Integração

#### API Integration Tests
```typescript
// ✅ Teste de integração com API real
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { DocumentAnalysisService } from '@/services/documentAnalysisService';

const server = setupServer(
  rest.post('/api/analyze', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'analysis-1',
        score: 85,
        problems: []
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DocumentAnalysisService Integration', () => {
  it('should successfully analyze document via API', async () => {
    const service = new DocumentAnalysisService(httpClient, cache);
    
    const result = await service.analyzeDocument('doc-1');
    
    expect(result).toEqual({
      id: 'analysis-1',
      score: 85,
      problems: []
    });
  });

  it('should handle API errors properly', async () => {
    server.use(
      rest.post('/api/analyze', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal error' }));
      })
    );

    const service = new DocumentAnalysisService(httpClient, cache);
    
    await expect(service.analyzeDocument('doc-1'))
      .rejects
      .toThrow(AnalysisError);
  });
});
```

---

## 🚀 Performance Guidelines

### Otimização de Bundle

#### Code Splitting
```typescript
// ✅ Lazy loading de rotas
import { lazy, Suspense } from 'react';

const DocumentReview = lazy(() => import('@/pages/DocumentReview'));
const AnalysisResults = lazy(() => import('@/pages/AnalysisResults'));

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route 
        path="/documents/:id/review" 
        element={
          <Suspense fallback={<PageLoader />}>
            <DocumentReview />
          </Suspense>
        } 
      />
      <Route 
        path="/analysis/:id" 
        element={
          <Suspense fallback={<PageLoader />}>
            <AnalysisResults />
          </Suspense>
        } 
      />
    </Routes>
  </BrowserRouter>
);

// ✅ Dynamic imports para funcionalidades opcionais
const loadPDFViewer = () => import('@/components/PDFViewer');

export const DocumentViewer: React.FC<Props> = ({ document }) => {
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (document.type === 'pdf') {
      loadPDFViewer().then(module => {
        setPDFViewer(() => module.default);
      });
    }
  }, [document.type]);

  if (document.type === 'pdf' && PDFViewer) {
    return <PDFViewer document={document} />;
  }

  return <TextViewer document={document} />;
};
```

#### Tree Shaking
```typescript
// ✅ Imports específicos para tree shaking
import { debounce } from 'lodash/debounce';
import { format } from 'date-fns/format';

// ❌ Evitar imports gerais
import _ from 'lodash';
import * as dateFns from 'date-fns';

// ✅ Re-exports específicos
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';

// ❌ Evitar barrel exports com * 
export * from './components';
```

### Otimização de Renderização

#### Memoização Estratégica
```typescript
// ✅ Memo para componentes pesados
export const DocumentAnalysisResults = React.memo<DocumentAnalysisResultsProps>(
  ({ analysis, onProblemClick }) => {
    const sortedProblems = useMemo(
      () => analysis.problems.sort((a, b) => 
        severityWeight[b.severity] - severityWeight[a.severity]
      ),
      [analysis.problems]
    );

    const handleProblemClick = useCallback(
      (problemId: string) => {
        onProblemClick?.(problemId);
      },
      [onProblemClick]
    );

    return (
      <div className="analysis-results">
        {sortedProblems.map(problem => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            onClick={handleProblemClick}
          />
        ))}
      </div>
    );
  }
);

// ✅ Comparação customizada para memo
const arePropsEqual = (
  prevProps: DocumentAnalysisResultsProps,
  nextProps: DocumentAnalysisResultsProps
) => {
  return (
    prevProps.analysis.id === nextProps.analysis.id &&
    prevProps.analysis.problems.length === nextProps.analysis.problems.length &&
    prevProps.onProblemClick === nextProps.onProblemClick
  );
};

export const DocumentAnalysisResults = React.memo(
  ComponentImplementation,
  arePropsEqual
);
```

#### Virtualização para Listas Grandes
```typescript
// ✅ Virtualização com react-window
import { FixedSizeList as List } from 'react-window';

interface DocumentListProps {
  documents: Document[];
  onDocumentClick: (id: string) => void;
}

const DocumentListItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: { documents: Document[]; onDocumentClick: (id: string) => void };
}> = ({ index, style, data }) => {
  const document = data.documents[index];
  
  return (
    <div style={style}>
      <DocumentCard 
        document={document}
        onClick={() => data.onDocumentClick(document.id)}
      />
    </div>
  );
};

export const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  onDocumentClick 
}) => (
  <List
    height={600}
    itemCount={documents.length}
    itemSize={120}
    itemData={{ documents, onDocumentClick }}
  >
    {DocumentListItem}
  </List>
);
```

### Otimização de Dados

#### Cache Strategy
```typescript
// ✅ React Query para cache inteligente
export const useDocuments = (filters: DocumentFilters) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentService.getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });
};

// ✅ Infinite queries para paginação
export const useInfiniteDocuments = (filters: DocumentFilters) => {
  return useInfiniteQuery({
    queryKey: ['documents-infinite', filters],
    queryFn: ({ pageParam = 1 }) => 
      documentService.getDocuments({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => 
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 1
  });
};

// ✅ Optimistic updates
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: documentService.updateDocument,
    onMutate: async (updatedDoc) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      
      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(['documents']);
      
      // Optimistically update
      queryClient.setQueryData(['documents'], (old: any) => 
        old?.map((doc: Document) => 
          doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc
        )
      );
      
      return { previousDocuments };
    },
    onError: (err, updatedDoc, context) => {
      // Rollback on error
      queryClient.setQueryData(['documents'], context?.previousDocuments);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
};
```

---

## 🔒 Segurança

### Validação de Dados

#### Input Sanitization
```typescript
// ✅ Validação com Zod
import { z } from 'zod';

const DocumentSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Caracteres inválidos no título'),
  
  type: z.enum(['edital', 'termo_referencia', 'contrato']),
  
  file: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;
    if (file.size > 10 * 1024 * 1024) return false; // 10MB
    if (!['application/pdf', 'application/msword'].includes(file.type)) return false;
    return true;
  }, 'Arquivo inválido')
});

type DocumentInput = z.infer<typeof DocumentSchema>;

// ✅ Hook para validação
export const useDocumentForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<DocumentInput>({
    resolver: zodResolver(DocumentSchema),
    mode: 'onChange'
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await documentService.createDocument(data);
      toast.success('Documento criado com sucesso');
    } catch (error) {
      toast.error('Erro ao criar documento');
    }
  });

  return { control, onSubmit, errors, isValid };
};
```

#### XSS Prevention
```typescript
// ✅ Sanitização de HTML
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class']
  });
};

// ✅ Componente para HTML seguro
interface SafeHtmlProps {
  html: string;
  className?: string;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
```

### Autenticação e Autorização

#### JWT Handling
```typescript
// ✅ Serviço de autenticação seguro
class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_KEY = 'refresh_token';

  setTokens(accessToken: string, refreshToken: string): void {
    // Usar httpOnly cookies em produção
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await response.json();
    this.setTokens(accessToken, newRefreshToken);
    
    return accessToken;
  }
}
```

#### Role-Based Access Control
```typescript
// ✅ Sistema de permissões
type Permission = 
  | 'documents.read'
  | 'documents.create'
  | 'documents.update'
  | 'documents.delete'
  | 'analysis.run'
  | 'rules.manage'
  | 'users.manage';

type Role = 'viewer' | 'analyst' | 'manager' | 'admin';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['documents.read'],
  analyst: ['documents.read', 'documents.create', 'analysis.run'],
  manager: ['documents.read', 'documents.create', 'analysis.run', 'rules.manage'],
  admin: ['documents.read', 'documents.create', 'documents.update', 'documents.delete', 'analysis.run', 'rules.manage', 'users.manage']
};

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  return { hasPermission, hasAnyPermission };
};

// ✅ Componente de proteção
interface ProtectedProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Protected: React.FC<ProtectedProps> = ({ 
  permission, 
  fallback = null, 
  children 
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

---

## 📊 Monitoramento e Observabilidade

### Error Tracking

#### Error Boundary com Reporting
```typescript
// ✅ Error boundary com contexto rico
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId!;
    
    // Coletar contexto adicional
    const context = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.props.user?.id,
      component: errorInfo.componentStack
    };

    // Reportar erro
    monitoringService.reportError(error, {
      errorId,
      context,
      stack: errorInfo.componentStack
    });

    this.setState({
      errorInfo,
      errorId
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

### Performance Monitoring

#### Core Web Vitals
```typescript
// ✅ Monitoramento de performance
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  private metrics: Record<string, number> = {};

  init() {
    getCLS(this.onCLS.bind(this));
    getFID(this.onFID.bind(this));
    getFCP(this.onFCP.bind(this));
    getLCP(this.onLCP.bind(this));
    getTTFB(this.onTTFB.bind(this));
  }

  private onCLS(metric: any) {
    this.metrics.cls = metric.value;
    this.sendMetric('CLS', metric.value);
  }

  private onFID(metric: any) {
    this.metrics.fid = metric.value;
    this.sendMetric('FID', metric.value);
  }

  private onFCP(metric: any) {
    this.metrics.fcp = metric.value;
    this.sendMetric('FCP', metric.value);
  }

  private onLCP(metric: any) {
    this.metrics.lcp = metric.value;
    this.sendMetric('LCP', metric.value);
  }

  private onTTFB(metric: any) {
    this.metrics.ttfb = metric.value;
    this.sendMetric('TTFB', metric.value);
  }

  private sendMetric(name: string, value: number) {
    // Enviar para serviço de analytics
    analytics.track('Core Web Vital', {
      metric: name,
      value: value,
      url: window.location.pathname,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## 🔧 Ferramentas e Automação

### Linting e Formatting

#### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": { "jsx": true },
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Git Hooks

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{css,scss,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

#### Commit Convention
```bash
# Formato: type(scope): description
feat(analysis): add real-time analysis progress
fix(auth): resolve token refresh issue
docs(api): update endpoint documentation
style(ui): improve button hover states
refactor(hooks): simplify useDocumentAnalysis
test(services): add unit tests for documentService
chore(deps): upgrade react to v18.2.0
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: npm run deploy:staging
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: npm run deploy:production
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

---

## 📈 Métricas de Qualidade

### Cobertura de Testes
- **Target**: > 90% cobertura de linha
- **Crítico**: 100% cobertura para funções críticas
- **Tolerância**: 80% mínimo para features novas

### Performance Targets
- **Bundle Size**: < 2MB inicial
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

### Code Quality Metrics
- **TypeScript**: 100% tipado (no implicit any)
- **ESLint**: 0 erros, < 10 warnings
- **Duplicação**: < 5% código duplicado
- **Complexidade Ciclomática**: < 10 por função

---

## 🔄 Review e Atualizações

### Code Review Checklist

#### Funcionalidade
- [ ] Código atende aos requisitos funcionais
- [ ] Edge cases foram considerados
- [ ] Tratamento de erro adequado
- [ ] Performance otimizada

#### Qualidade
- [ ] Tipagem TypeScript completa
- [ ] Testes unitários incluídos
- [ ] Documentação atualizada
- [ ] Padrões de código seguidos

#### Segurança
- [ ] Inputs validados/sanitizados
- [ ] Sem vazamento de dados sensíveis
- [ ] Princípio do menor privilégio
- [ ] Auditoria de dependências

### Processo de Atualização
- **Semanal**: Review de padrões de código
- **Mensal**: Auditoria de dependências
- **Trimestral**: Revisão de arquitetura
- **Semestral**: Atualização de guidelines

---

*Development.md v1.0*
*Última atualização: 11 de Agosto, 2025*
*Próxima revisão: 11 de Setembro, 2025*
*Owner: Development Team*