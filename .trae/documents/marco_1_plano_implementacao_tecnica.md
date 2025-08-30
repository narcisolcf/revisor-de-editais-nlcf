# Marco 1: Plano de Implementação Técnica

## 1. Arquitetura da Solução

### 1.1 Visão Geral
O Marco 1 aproveitará 70% da estrutura existente do dashboard, focando em melhorias incrementais que entreguem valor imediato seguindo os princípios Lean.

### 1.2 Componentes Principais
```
📁 apps/web/src/
├── 📁 components/dashboard/
│   ├── 📄 MetricsCards.tsx (90% aproveitável)
│   ├── 📄 TrendsChart.tsx (85% aproveitável)
│   ├── 📄 DocumentsTable.tsx (80% aproveitável)
│   ├── 📄 DashboardRefresh.tsx (novo)
│   └── 📄 DashboardFilters.tsx (novo)
├── 📁 hooks/
│   ├── 📄 useDashboardData.ts (novo)
│   ├── 📄 useAutoRefresh.ts (novo)
│   └── 📄 useDashboardFilters.ts (novo)
├── 📁 pages/
│   └── 📄 DashboardPage.tsx (70% aproveitável)
└── 📁 types/
    └── 📄 dashboard.ts (melhorar)
```

## 2. Implementação por Ondas

### 2.1 Onda 1: MVP Core (Dias 1-3)

#### 2.1.1 Refinamento MetricsCards (4 horas)

**Melhorias Necessárias:**
```typescript
// Adicionar props para maior flexibilidade
interface MetricsCardsProps {
  data: OverviewData;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  variant?: 'compact' | 'detailed';
  showTrends?: boolean;
}

// Adicionar estado de loading
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, value, loading, refreshing, ...props 
}) => {
  if (loading) {
    return <MetricCardSkeleton />;
  }
  
  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${
      refreshing ? 'opacity-75' : ''
    }`}>
      {/* Conteúdo existente */}
    </Card>
  );
};
```

**Tarefas:**
- [ ] Adicionar estados de loading e refreshing
- [ ] Implementar skeleton loading
- [ ] Melhorar animações de transição
- [ ] Adicionar tooltips informativos

#### 2.1.2 Melhoria TrendsChart (6 horas)

**Adicionar Interatividade:**
```typescript
interface TrendsChartProps {
  data: any[];
  title: string;
  type: 'documents' | 'processing' | 'distribution' | 'scores';
  interactive?: boolean;
  onDataPointClick?: (data: any) => void;
  timeRange?: '7d' | '30d' | '90d';
  loading?: boolean;
}

// Adicionar controles de tempo
const TimeRangeSelector: React.FC<{
  value: string;
  onChange: (range: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-2">
      {['7d', '30d', '90d'].map(range => (
        <Button
          key={range}
          variant={value === range ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(range)}
        >
          {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
        </Button>
      ))}
    </div>
  );
};
```

**Tarefas:**
- [ ] Adicionar seletor de período temporal
- [ ] Implementar zoom e pan nos gráficos
- [ ] Adicionar tooltips detalhados
- [ ] Melhorar responsividade

#### 2.1.3 Otimização DocumentsTable (4 horas)

**Melhorias de Performance:**
```typescript
// Implementar virtualização para grandes listas
import { FixedSizeList as List } from 'react-window';

const VirtualizedDocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  height = 400
}) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <DocumentRow document={documents[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={documents.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
};
```

**Tarefas:**
- [ ] Implementar virtualização para listas grandes
- [ ] Adicionar paginação inteligente
- [ ] Melhorar estados de loading
- [ ] Otimizar re-renders

#### 2.1.4 Integração e Layout (4 horas)

**Reorganização do DashboardPage:**
```typescript
const DashboardPage: React.FC = () => {
  const { data, loading, error, refresh } = useDashboardData();
  const { autoRefresh, setAutoRefresh } = useAutoRefresh(refresh, 30000);
  
  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <DashboardHeader 
        lastUpdated={data?.lastUpdated}
        onRefresh={refresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />
      
      {/* Grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4">
          <MetricsCards data={data?.metrics} loading={loading} />
        </div>
        
        <div className="lg:col-span-2">
          <TrendsChart 
            data={data?.trends} 
            title="Tendências de Documentos"
            type="documents"
            loading={loading}
          />
        </div>
        
        <div className="lg:col-span-2">
          <TrendsChart 
            data={data?.processing} 
            title="Performance de Processamento"
            type="processing"
            loading={loading}
          />
        </div>
        
        <div className="lg:col-span-4">
          <DocumentsTable 
            documents={data?.recentDocuments || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
```

### 2.2 Onda 2: Melhorias UX (Dias 4-5)

#### 2.2.1 Sistema de Filtros (3 horas)

**Implementação do DashboardFilters:**
```typescript
interface FilterState {
  dateRange: [Date, Date];
  status: string[];
  documentType: string[];
  scoreRange: [number, number];
}

const DashboardFilters: React.FC<{
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}> = ({ filters, onFiltersChange }) => {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DateRangePicker 
          value={filters.dateRange}
          onChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
        />
        
        <MultiSelect
          label="Status"
          options={statusOptions}
          value={filters.status}
          onChange={(status) => onFiltersChange({ ...filters, status })}
        />
        
        <MultiSelect
          label="Tipo de Documento"
          options={documentTypeOptions}
          value={filters.documentType}
          onChange={(documentType) => onFiltersChange({ ...filters, documentType })}
        />
        
        <RangeSlider
          label="Score"
          min={0}
          max={100}
          value={filters.scoreRange}
          onChange={(scoreRange) => onFiltersChange({ ...filters, scoreRange })}
        />
      </div>
    </Card>
  );
};
```

#### 2.2.2 Busca e Ordenação (3 horas)

**Hook para Filtros:**
```typescript
const useDashboardFilters = (initialData: Document[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const filteredData = useMemo(() => {
    return initialData
      .filter(item => {
        // Aplicar filtros de busca
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Aplicar filtros de data
        const matchesDate = isWithinInterval(item.createdAt, {
          start: filters.dateRange[0],
          end: filters.dateRange[1]
        });
        
        // Aplicar outros filtros
        const matchesStatus = filters.status.length === 0 || filters.status.includes(item.status);
        const matchesType = filters.documentType.length === 0 || filters.documentType.includes(item.type);
        const matchesScore = item.score >= filters.scoreRange[0] && item.score <= filters.scoreRange[1];
        
        return matchesSearch && matchesDate && matchesStatus && matchesType && matchesScore;
      })
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [initialData, searchQuery, filters, sortBy, sortOrder]);
  
  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredData
  };
};
```

#### 2.2.3 Refresh Manual (2 horas)

**Componente DashboardRefresh:**
```typescript
const DashboardRefresh: React.FC<{
  lastUpdated: Date;
  onRefresh: () => void;
  refreshing: boolean;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
}> = ({ lastUpdated, onRefresh, refreshing, autoRefresh, onAutoRefreshChange }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-600">
        Última atualização: {format(lastUpdated, 'HH:mm:ss', { locale: ptBR })}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center space-x-2"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span>Atualizar</span>
      </Button>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={autoRefresh}
          onCheckedChange={onAutoRefreshChange}
        />
        <span className="text-sm">Auto-refresh</span>
      </div>
    </div>
  );
};
```

### 2.3 Onda 3: Polimento (Dias 6-7)

#### 2.3.1 Animações e Transições (2 horas)

**Configuração de Animações:**
```typescript
// Configurar framer-motion para animações suaves
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Aplicar em componentes
const AnimatedMetricsCards: React.FC = ({ children }) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={fadeInUp}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
```

#### 2.3.2 Estados de Loading (1 hora)

**Skeleton Components:**
```typescript
const MetricCardSkeleton: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    </Card>
  );
};

const ChartSkeleton: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
};
```

#### 2.3.3 Tratamento de Erros (1 hora)

**Error Boundary para Dashboard:**
```typescript
const DashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao carregar o dashboard. Tente novamente.
          </p>
          <Button onClick={resetError}>Tentar Novamente</Button>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## 3. Hooks Customizados

### 3.1 useDashboardData
```typescript
const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular chamada à API
      const response = await dashboardAPI.getData();
      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, lastUpdated, refresh };
};
```

### 3.2 useAutoRefresh
```typescript
const useAutoRefresh = (callback: () => void, interval: number = 30000) => {
  const [enabled, setEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (enabled) {
      intervalRef.current = setInterval(callback, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, callback, interval]);
  
  return { autoRefresh: enabled, setAutoRefresh: setEnabled };
};
```

## 4. Testes

### 4.1 Testes Unitários
```typescript
// MetricsCards.test.tsx
describe('MetricsCards', () => {
  it('should render all metric cards', () => {
    const mockData = {
      totalDocuments: 100,
      averageScore: 85.5,
      averageProcessingTime: 2.3,
      successRate: 94.2
    };
    
    render(<MetricsCards data={mockData} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('2.3s')).toBeInTheDocument();
    expect(screen.getByText('94.2%')).toBeInTheDocument();
  });
  
  it('should show loading state', () => {
    render(<MetricsCards data={null} loading={true} />);
    expect(screen.getAllByTestId('metric-skeleton')).toHaveLength(4);
  });
});
```

### 4.2 Testes de Integração
```typescript
// DashboardPage.test.tsx
describe('DashboardPage Integration', () => {
  it('should load and display dashboard data', async () => {
    const mockData = createMockDashboardData();
    jest.spyOn(dashboardAPI, 'getData').mockResolvedValue(mockData);
    
    render(<DashboardPage />);
    
    // Verificar loading state
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    
    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });
    
    // Verificar dados carregados
    expect(screen.getByText(mockData.metrics.totalDocuments.toString())).toBeInTheDocument();
  });
});
```

## 5. Performance

### 5.1 Otimizações
- **Memoização**: Usar `React.memo` em componentes pesados
- **Lazy Loading**: Carregar gráficos sob demanda
- **Virtualização**: Para listas grandes de documentos
- **Debounce**: Para filtros e busca
- **Cache**: Implementar cache de dados com TTL

### 5.2 Métricas de Performance
```typescript
// Performance monitoring
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Medir tempo de carregamento inicial
    const startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'dashboard-loaded') {
          const loadTime = entry.startTime - startTime;
          analytics.track('dashboard_load_time', { duration: loadTime });
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

## 6. Deployment

### 6.1 Build Process
```bash
# Scripts de build otimizado
npm run build:dashboard
npm run test:dashboard
npm run lint:dashboard
npm run type-check:dashboard
```

### 6.2 Feature Flags
```typescript
// Usar feature flags para rollout gradual
const DashboardPage: React.FC = () => {
  const { isEnabled } = useFeatureFlag('dashboard-v2');
  
  if (!isEnabled) {
    return <LegacyDashboard />;
  }
  
  return <NewDashboard />;
};
```

## 7. Monitoramento

### 7.1 Métricas de Uso
```typescript
// Analytics tracking
const trackDashboardUsage = () => {
  analytics.track('dashboard_viewed');
  analytics.track('dashboard_interaction', {
    component: 'metrics_cards',
    action: 'view'
  });
};
```

### 7.2 Error Tracking
```typescript
// Error monitoring
const reportDashboardError = (error: Error, context: any) => {
  errorTracking.captureException(error, {
    tags: { component: 'dashboard' },
    extra: context
  });
};
```

---

**Documento Técnico - Marco 1**  
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Responsável**: Equipe de Desenvolvimento  
**Status**: Pronto para Implementação