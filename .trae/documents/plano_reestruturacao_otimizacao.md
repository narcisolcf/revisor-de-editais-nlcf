# Plano de Reestruturação e Otimização - LicitaReview

## 1. Visão Geral

**Objetivo:** Reestruturar e otimizar completamente o projeto LicitaReview para garantir arquitetura limpa, código mantenível, boas práticas de desenvolvimento e performance otimizada.

**Escopo:** Refatoração completa preservando funcionalidades existentes

**Metodologia:** Migração gradual em fases com testes contínuos

## 2. Análise da Arquitetura Atual

### 2.1 Estrutura Atual
```
revisor-de-editais-nlcf/
├── apps/web/                    # Frontend React + Vite
├── services/api/                # Backend Cloud Functions
├── services/analyzer/           # Serviço Python de análise
├── packages/                    # Monorepo packages
│   ├── types/                   # Tipos TypeScript compartilhados
│   ├── ui/                      # Componentes UI
│   └── utils/                   # Utilitários compartilhados
├── cloud-run-services/          # Serviços Cloud Run
└── tests/                       # Testes E2E
```

### 2.2 Pontos de Melhoria Identificados

#### **Frontend (apps/web)**
- ❌ Componentes com responsabilidades múltiplas
- ❌ Hooks customizados sem otimização
- ❌ Falta de lazy loading e code splitting
- ❌ Estado global não otimizado
- ❌ Ausência de memoização estratégica

#### **Backend (services/api)**
- ❌ Funções com múltiplas responsabilidades
- ❌ Falta de camada de abstração para repositórios
- ❌ Validação de dados inconsistente
- ❌ Error handling não padronizado
- ❌ Logs e monitoramento insuficientes

#### **Packages**
- ❌ Tipos não organizados por domínio
- ❌ Componentes UI sem design system consistente
- ❌ Utilitários sem testes unitários

## 3. Arquitetura Proposta

### 3.1 Princípios Arquiteturais

#### **Clean Architecture**
- **Entities:** Regras de negócio fundamentais
- **Use Cases:** Lógica de aplicação específica
- **Interface Adapters:** Controllers, presenters, gateways
- **Frameworks & Drivers:** UI, DB, external services

#### **Domain-Driven Design (DDD)**
- **Bounded Contexts:** Análise, Documentos, Usuários, Organizações
- **Aggregates:** Entidades relacionadas agrupadas
- **Value Objects:** Objetos imutáveis sem identidade
- **Domain Services:** Lógica que não pertence a entidades

### 3.2 Nova Estrutura de Diretórios

```
revisor-de-editais-nlcf/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/                     # Configuração da aplicação
│       │   ├── shared/                  # Código compartilhado
│       │   │   ├── components/          # Componentes reutilizáveis
│       │   │   ├── hooks/               # Hooks customizados
│       │   │   ├── services/            # Serviços de infraestrutura
│       │   │   ├── utils/               # Utilitários
│       │   │   └── types/               # Tipos compartilhados
│       │   ├── features/                # Features por domínio
│       │   │   ├── analysis/
│       │   │   │   ├── components/
│       │   │   │   ├── hooks/
│       │   │   │   ├── services/
│       │   │   │   ├── types/
│       │   │   │   └── pages/
│       │   │   ├── documents/
│       │   │   ├── organizations/
│       │   │   └── users/
│       │   └── pages/                   # Páginas principais
├── services/
│   ├── api/
│   │   ├── src/
│   │   │   ├── domain/                  # Camada de domínio
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   ├── repositories/        # Interfaces
│   │   │   │   └── services/
│   │   │   ├── application/             # Casos de uso
│   │   │   │   ├── use-cases/
│   │   │   │   ├── dto/
│   │   │   │   └── services/
│   │   │   ├── infrastructure/          # Implementações
│   │   │   │   ├── repositories/
│   │   │   │   ├── services/
│   │   │   │   ├── database/
│   │   │   │   └── external/
│   │   │   ├── presentation/            # Controllers e rotas
│   │   │   │   ├── controllers/
│   │   │   │   ├── middleware/
│   │   │   │   ├── validators/
│   │   │   │   └── routes/
│   │   │   └── shared/                  # Código compartilhado
│   │   │       ├── errors/
│   │   │       ├── utils/
│   │   │       └── types/
├── packages/
│   ├── domain/                          # Domínio compartilhado
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── types/
│   ├── design-system/                   # Sistema de design
│   │   ├── tokens/
│   │   ├── components/
│   │   └── themes/
│   └── shared/                          # Utilitários compartilhados
│       ├── utils/
│       ├── constants/
│       └── validators/
```

## 4. Plano de Refatoração

### 4.1 Fase 1: Fundação (Semanas 1-2)

#### **4.1.1 Reestruturação de Packages**

**Objetivo:** Criar base sólida para código compartilhado

**Ações:**
- Criar `packages/domain` com entidades e tipos de domínio
- Migrar `packages/types` para estrutura baseada em domínio
- Implementar `packages/design-system` com tokens DSGov
- Criar `packages/shared` com utilitários validados

**Entregáveis:**
```typescript
// packages/domain/entities/Document.ts
export class Document {
  constructor(
    private readonly id: DocumentId,
    private readonly name: string,
    private readonly content: string,
    private readonly uploadedAt: Date,
    private readonly organizationId: OrganizationId
  ) {}

  public analyze(parameters: AnalysisParameters): Analysis {
    // Lógica de domínio para análise
  }
}

// packages/domain/value-objects/DocumentId.ts
export class DocumentId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid document ID');
    }
  }

  private isValid(value: string): boolean {
    return /^[a-zA-Z0-9-_]{8,}$/.test(value);
  }

  public toString(): string {
    return this.value;
  }
}
```

#### **4.1.2 Design System Consolidado**

**Objetivo:** Implementar sistema de design consistente

**Ações:**
- Consolidar tokens de design DSGov
- Criar componentes base otimizados
- Implementar tema dark/light
- Documentar padrões de uso

### 4.2 Fase 2: Backend Refactoring (Semanas 3-4)

#### **4.2.1 Clean Architecture Implementation**

**Objetivo:** Implementar arquitetura limpa no backend

**Ações:**
- Criar camada de domínio com entidades e regras de negócio
- Implementar casos de uso na camada de aplicação
- Refatorar repositórios com interfaces bem definidas
- Criar controllers focados em responsabilidade única

**Exemplo de Implementação:**
```typescript
// domain/entities/Analysis.ts
export class Analysis {
  constructor(
    private readonly id: AnalysisId,
    private readonly documentId: DocumentId,
    private readonly parameters: AnalysisParameters,
    private status: AnalysisStatus,
    private results: AnalysisResult[]
  ) {}

  public process(processor: AnalysisProcessor): void {
    this.status = AnalysisStatus.PROCESSING;
    this.results = processor.analyze(this.parameters);
    this.status = AnalysisStatus.COMPLETED;
  }
}

// application/use-cases/ProcessAnalysisUseCase.ts
export class ProcessAnalysisUseCase {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly analysisProcessor: AnalysisProcessor
  ) {}

  public async execute(request: ProcessAnalysisRequest): Promise<ProcessAnalysisResponse> {
    const document = await this.documentRepository.findById(request.documentId);
    if (!document) {
      throw new DocumentNotFoundError(request.documentId);
    }

    const analysis = new Analysis(
      AnalysisId.generate(),
      request.documentId,
      request.parameters,
      AnalysisStatus.PENDING,
      []
    );

    analysis.process(this.analysisProcessor);
    await this.analysisRepository.save(analysis);

    return new ProcessAnalysisResponse(analysis.getId(), analysis.getStatus());
  }
}

// presentation/controllers/AnalysisController.ts
export class AnalysisController {
  constructor(
    private readonly processAnalysisUseCase: ProcessAnalysisUseCase
  ) {}

  public async processAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const request = ProcessAnalysisRequestValidator.validate(req.body);
      const response = await this.processAnalysisUseCase.execute(request);
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
```

#### **4.2.2 Error Handling Padronizado**

**Objetivo:** Implementar tratamento de erros consistente

**Ações:**
- Criar hierarquia de erros de domínio
- Implementar middleware de error handling
- Padronizar respostas de erro
- Adicionar logging estruturado

```typescript
// shared/errors/DomainError.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DocumentNotFoundError extends DomainError {
  readonly code = 'DOCUMENT_NOT_FOUND';
  readonly statusCode = 404;
}

export class InvalidAnalysisParametersError extends DomainError {
  readonly code = 'INVALID_ANALYSIS_PARAMETERS';
  readonly statusCode = 400;
}

// presentation/middleware/ErrorHandler.ts
export class ErrorHandler {
  public static handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          context: error.context
        }
      });
    } else {
      Logger.error('Unexpected error', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }
}
```

### 4.3 Fase 3: Frontend Optimization (Semanas 5-6)

#### **4.3.1 Component Architecture**

**Objetivo:** Implementar arquitetura de componentes otimizada

**Ações:**
- Refatorar componentes para responsabilidade única
- Implementar composição ao invés de herança
- Criar hooks customizados otimizados
- Implementar memoização estratégica

**Exemplo de Implementação:**
```typescript
// features/analysis/components/AnalysisCard/AnalysisCard.tsx
import React, { memo } from 'react';
import { Card, Badge, Button } from '@/shared/components';
import { useAnalysisActions } from '../hooks/useAnalysisActions';
import { Analysis } from '@/shared/types';

interface AnalysisCardProps {
  analysis: Analysis;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export const AnalysisCard = memo<AnalysisCardProps>(({ 
  analysis, 
  onView, 
  onDownload 
}) => {
  const { isLoading, handleView, handleDownload } = useAnalysisActions({
    analysisId: analysis.id,
    onView,
    onDownload
  });

  return (
    <Card className="analysis-card">
      <Card.Header>
        <Card.Title>{analysis.documentName}</Card.Title>
        <Badge variant={getStatusVariant(analysis.status)}>
          {analysis.status}
        </Badge>
      </Card.Header>
      
      <Card.Content>
        <AnalysisMetrics metrics={analysis.metrics} />
        <AnalysisProblems problems={analysis.problems} />
      </Card.Content>
      
      <Card.Footer>
        <Button 
          variant="outline" 
          onClick={handleView}
          disabled={isLoading}
        >
          Visualizar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleDownload}
          disabled={isLoading}
        >
          Download
        </Button>
      </Card.Footer>
    </Card>
  );
});

// features/analysis/hooks/useAnalysisActions.ts
import { useCallback, useState } from 'react';
import { useAnalysisService } from '@/shared/services';
import { useToast } from '@/shared/hooks';

interface UseAnalysisActionsProps {
  analysisId: string;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export const useAnalysisActions = ({ 
  analysisId, 
  onView, 
  onDownload 
}: UseAnalysisActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const analysisService = useAnalysisService();
  const toast = useToast();

  const handleView = useCallback(async () => {
    try {
      setIsLoading(true);
      await analysisService.markAsViewed(analysisId);
      onView?.(analysisId);
    } catch (error) {
      toast.error('Erro ao visualizar análise');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, analysisService, onView, toast]);

  const handleDownload = useCallback(async () => {
    try {
      setIsLoading(true);
      const blob = await analysisService.downloadReport(analysisId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onDownload?.(analysisId);
    } catch (error) {
      toast.error('Erro ao baixar relatório');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, analysisService, onDownload, toast]);

  return {
    isLoading,
    handleView,
    handleDownload
  };
};
```

#### **4.3.2 Performance Optimization**

**Objetivo:** Implementar otimizações de performance

**Ações:**
- Implementar lazy loading de rotas
- Adicionar code splitting por feature
- Implementar virtualização para listas grandes
- Otimizar re-renders com React.memo e useMemo

```typescript
// app/router/LazyRoutes.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/shared/components';

// Lazy loading de páginas
const AnalysisPage = lazy(() => import('@/features/analysis/pages/AnalysisPage'));
const DocumentsPage = lazy(() => import('@/features/documents/pages/DocumentsPage'));
const OrganizationsPage = lazy(() => import('@/features/organizations/pages/OrganizationsPage'));

const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export const routes = [
  {
    path: '/analysis',
    element: <LazyRoute><AnalysisPage /></LazyRoute>
  },
  {
    path: '/documents',
    element: <LazyRoute><DocumentsPage /></LazyRoute>
  },
  {
    path: '/organizations',
    element: <LazyRoute><OrganizationsPage /></LazyRoute>
  }
];

// shared/components/VirtualizedList/VirtualizedList.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export const VirtualizedList = <T,>({
  items,
  itemHeight,
  height,
  renderItem
}: VirtualizedListProps<T>) => {
  const Row = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        {renderItem(items[index], index)}
      </div>
    );
  }, [items, renderItem]);

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 4.4 Fase 4: Testing & Quality (Semanas 7-8)

#### **4.4.1 Estrutura de Testes**

**Objetivo:** Implementar cobertura de testes robusta

**Ações:**
- Testes unitários para domínio e casos de uso
- Testes de integração para APIs
- Testes de componentes React
- Testes E2E para fluxos críticos

```typescript
// services/api/src/domain/entities/__tests__/Analysis.test.ts
import { Analysis, AnalysisId, DocumentId, AnalysisParameters, AnalysisStatus } from '../Analysis';
import { MockAnalysisProcessor } from '../../__mocks__/MockAnalysisProcessor';

describe('Analysis Entity', () => {
  let analysis: Analysis;
  let mockProcessor: MockAnalysisProcessor;

  beforeEach(() => {
    mockProcessor = new MockAnalysisProcessor();
    analysis = new Analysis(
      new AnalysisId('analysis-123'),
      new DocumentId('doc-456'),
      new AnalysisParameters({ strictMode: true }),
      AnalysisStatus.PENDING,
      []
    );
  });

  describe('process', () => {
    it('should change status to PROCESSING then COMPLETED', () => {
      analysis.process(mockProcessor);
      
      expect(analysis.getStatus()).toBe(AnalysisStatus.COMPLETED);
      expect(mockProcessor.analyze).toHaveBeenCalledWith(analysis.getParameters());
    });

    it('should store analysis results', () => {
      const expectedResults = [{ type: 'error', message: 'Test error' }];
      mockProcessor.analyze.mockReturnValue(expectedResults);
      
      analysis.process(mockProcessor);
      
      expect(analysis.getResults()).toEqual(expectedResults);
    });
  });
});

// apps/web/src/features/analysis/components/__tests__/AnalysisCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalysisCard } from '../AnalysisCard';
import { mockAnalysis } from '../../__mocks__/mockAnalysis';

describe('AnalysisCard', () => {
  const mockOnView = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render analysis information', () => {
    render(
      <AnalysisCard 
        analysis={mockAnalysis} 
        onView={mockOnView}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(mockAnalysis.documentName)).toBeInTheDocument();
    expect(screen.getByText(mockAnalysis.status)).toBeInTheDocument();
  });

  it('should call onView when view button is clicked', async () => {
    render(
      <AnalysisCard 
        analysis={mockAnalysis} 
        onView={mockOnView}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByText('Visualizar'));
    
    await waitFor(() => {
      expect(mockOnView).toHaveBeenCalledWith(mockAnalysis.id);
    });
  });
});
```

#### **4.4.2 Code Quality Tools**

**Objetivo:** Garantir qualidade e consistência do código

**Ações:**
- Configurar ESLint com regras rigorosas
- Implementar Prettier para formatação
- Adicionar Husky para pre-commit hooks
- Configurar SonarQube para análise de qualidade

```json
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  rules: {
    // Complexity
    'complexity': ['error', 10],
    'max-depth': ['error', 4],
    'max-lines-per-function': ['error', 50],
    
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    
    // React
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'error',
    
    // Import
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }]
  }
};

// package.json - scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## 5. Estratégias de Otimização de Performance

### 5.1 Frontend Performance

#### **5.1.1 Bundle Optimization**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

#### **5.1.2 State Management Optimization**
```typescript
// shared/store/useOptimizedStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // Analysis state
  analyses: Analysis[];
  selectedAnalysis: Analysis | null;
  
  // Documents state
  documents: Document[];
  selectedDocument: Document | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  // Analysis actions
  setAnalyses: (analyses: Analysis[]) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
  selectAnalysis: (analysis: Analysis | null) => void;
  
  // Documents actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  selectDocument: (document: Document | null) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState & AppActions>()()
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      analyses: [],
      selectedAnalysis: null,
      documents: [],
      selectedDocument: null,
      isLoading: false,
      error: null,
      
      // Actions
      setAnalyses: (analyses) => set((state) => {
        state.analyses = analyses;
      }),
      
      addAnalysis: (analysis) => set((state) => {
        state.analyses.push(analysis);
      }),
      
      updateAnalysis: (id, updates) => set((state) => {
        const index = state.analyses.findIndex(a => a.id === id);
        if (index !== -1) {
          Object.assign(state.analyses[index], updates);
        }
      }),
      
      selectAnalysis: (analysis) => set((state) => {
        state.selectedAnalysis = analysis;
      }),
      
      // ... outras actions
    }))
  )
);

// Seletores otimizados
export const useAnalyses = () => useAppStore(state => state.analyses);
export const useSelectedAnalysis = () => useAppStore(state => state.selectedAnalysis);
export const useDocuments = () => useAppStore(state => state.documents);
export const useIsLoading = () => useAppStore(state => state.isLoading);
```

### 5.2 Backend Performance

#### **5.2.1 Database Optimization**
```typescript
// infrastructure/repositories/OptimizedAnalysisRepository.ts
import { AnalysisRepository } from '../../domain/repositories/AnalysisRepository';
import { Analysis, AnalysisId } from '../../domain/entities/Analysis';
import { Firestore } from 'firebase-admin/firestore';

export class OptimizedAnalysisRepository implements AnalysisRepository {
  private readonly collection = 'analyses';
  private readonly cache = new Map<string, Analysis>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly firestore: Firestore) {}

  async findById(id: AnalysisId): Promise<Analysis | null> {
    const cacheKey = id.toString();
    
    // Verificar cache primeiro
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const doc = await this.firestore
      .collection(this.collection)
      .doc(cacheKey)
      .get();

    if (!doc.exists) {
      return null;
    }

    const analysis = this.mapToEntity(doc.data()!);
    
    // Adicionar ao cache
    this.cache.set(cacheKey, analysis);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
    
    return analysis;
  }

  async findByOrganization(
    organizationId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<Analysis[]> {
    const query = this.firestore
      .collection(this.collection)
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.mapToEntity(doc.data()));
  }

  async save(analysis: Analysis): Promise<void> {
    const data = this.mapToDocument(analysis);
    await this.firestore
      .collection(this.collection)
      .doc(analysis.getId().toString())
      .set(data, { merge: true });
    
    // Invalidar cache
    this.cache.delete(analysis.getId().toString());
  }

  private mapToEntity(data: any): Analysis {
    // Mapeamento otimizado
  }

  private mapToDocument(analysis: Analysis): any {
    // Mapeamento otimizado
  }
}
```

#### **5.2.2 Caching Strategy**
```typescript
// infrastructure/services/CacheService.ts
import { Redis } from 'ioredis';

export class CacheService {
  private readonly redis: Redis;
  private readonly defaultTTL = 3600; // 1 hora

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }
}

// application/use-cases/CachedProcessAnalysisUseCase.ts
export class CachedProcessAnalysisUseCase {
  constructor(
    private readonly baseUseCase: ProcessAnalysisUseCase,
    private readonly cacheService: CacheService
  ) {}

  async execute(request: ProcessAnalysisRequest): Promise<ProcessAnalysisResponse> {
    const cacheKey = `analysis:${request.documentId}:${this.hashParameters(request.parameters)}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.baseUseCase.execute(request),
      1800 // 30 minutos
    );
  }

  private hashParameters(parameters: AnalysisParameters): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(parameters))
      .digest('hex');
  }
}
```

## 6. Documentação e Padronização

### 6.1 Documentação de Código

#### **6.1.1 JSDoc Standards**
```typescript
/**
 * Processa uma análise de documento aplicando os parâmetros especificados.
 * 
 * @example
 * ```typescript
 * const useCase = new ProcessAnalysisUseCase(repo, processor);
 * const result = await useCase.execute({
 *   documentId: 'doc-123',
 *   parameters: { strictMode: true }
 * });
 * ```
 * 
 * @param request - Dados da requisição de análise
 * @param request.documentId - ID único do documento
 * @param request.parameters - Parâmetros de configuração da análise
 * 
 * @returns Promise que resolve com o resultado da análise
 * 
 * @throws {DocumentNotFoundError} Quando o documento não existe
 * @throws {InvalidParametersError} Quando os parâmetros são inválidos
 * 
 * @since 2.0.0
 * @author LicitaReview Team
 */
export class ProcessAnalysisUseCase {
  /**
   * Executa o processamento da análise.
   */
  public async execute(request: ProcessAnalysisRequest): Promise<ProcessAnalysisResponse> {
    // implementação
  }
}
```

#### **6.1.2 README Templates**
```markdown
# Feature: Analysis

## Visão Geral
Esta feature gerencia todo o ciclo de vida das análises de documentos, desde a criação até a geração de relatórios.

## Arquitetura
```
analysis/
├── components/          # Componentes React
├── hooks/              # Hooks customizados
├── services/           # Serviços de infraestrutura
├── types/              # Tipos TypeScript
└── pages/              # Páginas da feature
```

## Componentes Principais

### AnalysisCard
Componente para exibir informações resumidas de uma análise.

**Props:**
- `analysis: Analysis` - Dados da análise
- `onView?: (id: string) => void` - Callback para visualização
- `onDownload?: (id: string) => void` - Callback para download

**Exemplo:**
```tsx
<AnalysisCard 
  analysis={analysis} 
  onView={handleView}
  onDownload={handleDownload}
/>
```

## Hooks

### useAnalysisActions
Hook para gerenciar ações relacionadas a análises.

**Parâmetros:**
- `analysisId: string` - ID da análise
- `onView?: (id: string) => void` - Callback opcional
- `onDownload?: (id: string) => void` - Callback opcional

**Retorna:**
- `isLoading: boolean` - Estado de carregamento
- `handleView: () => void` - Função para visualizar
- `handleDownload: () => void` - Função para download

## Testes

```bash
# Executar testes da feature
npm test features/analysis

# Executar com coverage
npm run test:coverage features/analysis
```

## Contribuição

1. Siga os padrões de nomenclatura estabelecidos
2. Adicione testes para novos componentes
3. Documente props e hooks com JSDoc
4. Execute linting antes do commit
```

### 6.2 Style Guide

#### **6.2.1 Naming Conventions**
```typescript
// ✅ Boas práticas

// Componentes: PascalCase
export const AnalysisCard = () => {};
export const DocumentUploader = () => {};

// Hooks: camelCase com prefixo 'use'
export const useAnalysisActions = () => {};
export const useDocumentUpload = () => {};

// Tipos: PascalCase
export interface AnalysisRequest {}
export type DocumentStatus = 'pending' | 'processing' | 'completed';

// Constantes: SCREAMING_SNAKE_CASE
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const SUPPORTED_FORMATS = ['pdf', 'docx'] as const;

// Funções: camelCase
export const processDocument = () => {};
export const validateParameters = () => {};

// Arquivos: kebab-case
// analysis-card.component.tsx
// document-uploader.service.ts
// use-analysis-actions.hook.ts
```

#### **6.2.2 Code Organization**
```typescript
// ✅ Estrutura de arquivo recomendada

// 1. Imports externos
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Imports internos (shared)
import { Button, Card } from '@/shared/components';
import { useToast } from '@/shared/hooks';

// 3. Imports internos (feature)
import { useAnalysisService } from '../services';
import { AnalysisMetrics } from './AnalysisMetrics';

// 4. Tipos e interfaces
interface ComponentProps {
  // props
}

type LocalState = {
  // state types
};

// 5. Constantes
const DEFAULT_OPTIONS = {
  // constants
};

// 6. Componente principal
export const Component = () => {
  // 6.1 Hooks de estado
  const [state, setState] = useState();
  
  // 6.2 Hooks de serviços
  const service = useAnalysisService();
  const toast = useToast();
  
  // 6.3 Queries e mutations
  const { data, isLoading } = useQuery(...);
  
  // 6.4 Callbacks e handlers
  const handleAction = useCallback(() => {
    // implementation
  }, [dependencies]);
  
  // 6.5 Effects
  useEffect(() => {
    // effects
  }, [dependencies]);
  
  // 6.6 Render
  return (
    // JSX
  );
};
```

## 7. Plano de Migração Gradual

### 7.1 Estratégia de Migração

#### **7.1.1 Abordagem Incremental**

**Princípios:**
- Migração por feature, não por camada
- Manter funcionalidade existente durante migração
- Testes contínuos em cada etapa
- Rollback rápido em caso de problemas

**Cronograma:**
```
Semana 1-2: Fundação (packages, design system)
Semana 3-4: Backend (domain, use cases, repositories)
Semana 5-6: Frontend (components, hooks, optimization)
Semana 7-8: Testing & Quality (testes, documentação)
```

#### **7.1.2 Feature Flags**
```typescript
// shared/config/FeatureFlags.ts
export class FeatureFlags {
  private static flags = {
    NEW_ANALYSIS_ARCHITECTURE: process.env.FEATURE_NEW_ANALYSIS === 'true',
    OPTIMIZED_COMPONENTS: process.env.FEATURE_OPTIMIZED_COMPONENTS === 'true',
    ENHANCED_CACHING: process.env.FEATURE_ENHANCED_CACHING === 'true'
  };

  public static isEnabled(flag: keyof typeof FeatureFlags.flags): boolean {
    return FeatureFlags.flags[flag] ?? false;
  }
}

// Uso em componentes
export const AnalysisPage = () => {
  if (FeatureFlags.isEnabled('NEW_ANALYSIS_ARCHITECTURE')) {
    return <NewAnalysisPage />;
  }
  
  return <LegacyAnalysisPage />;
};
```

### 7.2 Validação e Rollback

#### **7.2.1 Health Checks**
```typescript
// infrastructure/health/HealthChecker.ts
export class HealthChecker {
  private checks: HealthCheck[] = [];

  public addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  public async runAll(): Promise<HealthReport> {
    const results = await Promise.allSettled(
      this.checks.map(check => check.execute())
    );

    const report: HealthReport = {
      status: 'healthy',
      checks: [],
      timestamp: new Date()
    };

    results.forEach((result, index) => {
      const check = this.checks[index];
      
      if (result.status === 'fulfilled') {
        report.checks.push({
          name: check.name,
          status: 'healthy',
          duration: result.value.duration
        });
      } else {
        report.status = 'unhealthy';
        report.checks.push({
          name: check.name,
          status: 'unhealthy',
          error: result.reason.message
        });
      }
    });

    return report;
  }
}

// Implementação de checks específicos
export class DatabaseHealthCheck implements HealthCheck {
  name = 'database';

  async execute(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      await this.firestore.collection('health').doc('test').get();
      return {
        status: 'healthy',
        duration: Date.now() - start
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
}
```

## 8. Métricas e Monitoramento

### 8.1 Performance Metrics

```typescript
// shared/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMeasurement(name: string): string {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    performance.mark(`${id}-start`);
    return id;
  }

  public endMeasurement(id: string): PerformanceMetric {
    performance.mark(`${id}-end`);
    performance.measure(id, `${id}-start`, `${id}-end`);
    
    const measure = performance.getEntriesByName(id)[0];
    const metric: PerformanceMetric = {
      name: id.split('-')[0],
      duration: measure.duration,
      timestamp: Date.now()
    };

    this.recordMetric(metric);
    return metric;
  }

  private recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metrics = this.metrics.get(metric.name)!;
    metrics.push(metric);
    
    // Manter apenas os últimos 100 registros
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  public getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }
}

// Hook para monitoramento
export const usePerformanceMonitoring = (operationName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureAsync = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    const id = monitor.startMeasurement(operationName);
    try {
      const result = await operation();
      monitor.endMeasurement(id);
      return result;
    } catch (error) {
      monitor.endMeasurement(id);
      throw error;
    }
  }, [monitor, operationName]);
  
  return { measureAsync };
};
```

### 8.2 Error Tracking

```typescript
// shared/monitoring/ErrorTracker.ts
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorReport[] = [];

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  public trackError(error: Error, context?: any): void {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(report);
    this.sendToService(report);
  }

  private async sendToService(report: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }
}

// Error Boundary otimizado
export class OptimizedErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorTracker = ErrorTracker.getInstance();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.errorTracker.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## 9. Conclusão

Este plano de reestruturação e otimização do projeto LicitaReview foi desenvolvido para:

### 9.1 Benefícios Esperados

- **Arquitetura Limpa:** Separação clara de responsabilidades e dependências
- **Manutenibilidade:** Código mais legível e fácil de modificar
- **Performance:** Otimizações que reduzem tempo de carregamento e uso de recursos
- **Qualidade:** Testes robustos e ferramentas de qualidade de código
- **Escalabilidade:** Estrutura preparada para crescimento futuro

### 9.2 Próximos Passos

1. **Aprovação do Plano:** Revisar e aprovar as propostas apresentadas
2. **Setup do Ambiente:** Configurar ferramentas e dependências necessárias
3. **Início da Fase 1:** Implementar fundação com packages e design system
4. **Monitoramento Contínuo:** Acompanhar métricas e ajustar conforme necessário

### 9.3 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Quebra de funcionalidade | Média | Alto | Feature flags + testes extensivos |
| Atraso no cronograma | Alta | Médio | Migração incremental + priorização |
| Resistência da equipe | Baixa | Médio | Treinamento + documentação clara |
| Performance degradada | Baixa | Alto | Monitoramento contínuo + rollback |

### 9.4 Métricas de Sucesso

- **Cobertura de Testes:** > 80%
- **Performance:** Redução de 30% no tempo de carregamento
- **Qualidade:** Score SonarQube > 8.0
- **Manutenibilidade:** Redução de 50% no tempo de implementação de features
- **Bugs:** Redução de 40% em bugs reportados

Este documento serve como guia completo para a transformação do projeto LicitaReview em uma aplicação moderna, eficiente e sustentável.