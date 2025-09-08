# Design System DSGov - Implementação Completa
## LicitaReview - Documentação Técnica

### 📋 Visão Geral

Este documento define a implementação completa do Design System DSGov (Design System do Governo Federal) no projeto LicitaReview, incluindo tokens de design, componentes UX avançados, diretrizes de acessibilidade WCAG 2.1 AA e otimizações de performance.

### 🎯 Objetivos

- Implementar o design system DSGov completo
- Criar componentes UX avançados com interações intuitivas
- Garantir conformidade WCAG 2.1 AA
- Otimizar performance e carregamento
- Estabelecer padrões de desenvolvimento sustentáveis

---

## 1. Tokens de Design DSGov

### 1.1 Paleta de Cores Governamental

#### Cores Primárias DSGov
```css
/* Azul Govbr - Cor principal do governo */
--govbr-blue-vivid-10: #0C326F;
--govbr-blue-vivid-20: #1351B4;
--govbr-blue-vivid-30: #2670E8;
--govbr-blue-vivid-40: #4B8BF5;
--govbr-blue-vivid-50: #81B1FA;
--govbr-blue-vivid-60: #B5D4FF;
--govbr-blue-vivid-70: #D4E7FF;
--govbr-blue-vivid-80: #E9F4FF;
--govbr-blue-vivid-90: #F5FAFF;

/* Verde Govbr - Sucesso e confirmação */
--govbr-green-cool-vivid-10: #0D4F2C;
--govbr-green-cool-vivid-20: #168821;
--govbr-green-cool-vivid-30: #1F8B24;
--govbr-green-cool-vivid-40: #2E8B57;
--govbr-green-cool-vivid-50: #4CBB17;
--govbr-green-cool-vivid-60: #70CC2A;
--govbr-green-cool-vivid-70: #94D83A;
--govbr-green-cool-vivid-80: #B8E986;
--govbr-green-cool-vivid-90: #E1F5FE;

/* Amarelo Govbr - Atenção e avisos */
--govbr-yellow-vivid-10: #7A4100;
--govbr-yellow-vivid-20: #B54708;
--govbr-yellow-vivid-30: #DC6803;
--govbr-yellow-vivid-40: #F59E0B;
--govbr-yellow-vivid-50: #FBBF24;
--govbr-yellow-vivid-60: #FCD34D;
--govbr-yellow-vivid-70: #FDE68A;
--govbr-yellow-vivid-80: #FEF3C7;
--govbr-yellow-vivid-90: #FFFBEB;

/* Vermelho Govbr - Erros e alertas críticos */
--govbr-red-vivid-10: #7F1D1D;
--govbr-red-vivid-20: #B91C1C;
--govbr-red-vivid-30: #DC2626;
--govbr-red-vivid-40: #EF4444;
--govbr-red-vivid-50: #F87171;
--govbr-red-vivid-60: #FCA5A5;
--govbr-red-vivid-70: #FECACA;
--govbr-red-vivid-80: #FEE2E2;
--govbr-red-vivid-90: #FEF2F2;
```

#### Cores Neutras DSGov
```css
/* Escala de cinzas governamental */
--govbr-gray-2: #F8F9FA;
--govbr-gray-5: #F1F3F4;
--govbr-gray-10: #E8EAED;
--govbr-gray-20: #DADCE0;
--govbr-gray-30: #BDC1C6;
--govbr-gray-40: #9AA0A6;
--govbr-gray-50: #80868B;
--govbr-gray-60: #5F6368;
--govbr-gray-70: #3C4043;
--govbr-gray-80: #202124;
--govbr-gray-90: #171717;
```

### 1.2 Tipografia Rawline

#### Família de Fontes
```css
/* Rawline - Fonte oficial do DSGov */
@import url('https://fonts.googleapis.com/css2?family=Rawline:wght@100;200;300;400;500;600;700;800;900&display=swap');

--font-family-base: 'Rawline', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### Escala Tipográfica DSGov
```css
/* Tamanhos de fonte governamentais */
--font-size-01: 0.75rem;   /* 12px - Legendas */
--font-size-02: 0.875rem;  /* 14px - Corpo pequeno */
--font-size-03: 1rem;      /* 16px - Corpo padrão */
--font-size-04: 1.125rem;  /* 18px - Corpo grande */
--font-size-05: 1.25rem;   /* 20px - Subtítulo */
--font-size-06: 1.5rem;    /* 24px - Título H3 */
--font-size-07: 1.875rem;  /* 30px - Título H2 */
--font-size-08: 2.25rem;   /* 36px - Título H1 */
--font-size-09: 3rem;      /* 48px - Display */
--font-size-10: 4rem;      /* 64px - Hero */

/* Pesos de fonte */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Altura de linha */
--line-height-tight: 1.25;
--line-height-default: 1.5;
--line-height-loose: 1.75;
```

### 1.3 Espaçamentos DSGov

#### Sistema de Espaçamento (Base 8px)
```css
/* Espaçamentos governamentais */
--spacing-01: 0.125rem;  /* 2px */
--spacing-02: 0.25rem;   /* 4px */
--spacing-03: 0.5rem;    /* 8px */
--spacing-04: 0.75rem;   /* 12px */
--spacing-05: 1rem;      /* 16px */
--spacing-06: 1.25rem;   /* 20px */
--spacing-07: 1.5rem;    /* 24px */
--spacing-08: 2rem;      /* 32px */
--spacing-09: 2.5rem;    /* 40px */
--spacing-10: 3rem;      /* 48px */
--spacing-11: 4rem;      /* 64px */
--spacing-12: 5rem;      /* 80px */
--spacing-13: 6rem;      /* 96px */
```

### 1.4 Elevação e Sombras

```css
/* Sombras DSGov */
--shadow-01: 0 1px 2px rgba(0, 0, 0, 0.1);
--shadow-02: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
--shadow-03: 0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12);
--shadow-04: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10);
--shadow-05: 0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);

/* Elevações específicas */
--elevation-surface: var(--shadow-01);
--elevation-card: var(--shadow-02);
--elevation-modal: var(--shadow-04);
--elevation-dropdown: var(--shadow-03);
```

---

## 2. Componentes UX Avançados

### 2.1 Sistema de Navegação Dinâmica

#### Breadcrumb Inteligente
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType;
  isActive?: boolean;
  metadata?: {
    documentType?: string;
    status?: 'pending' | 'analyzing' | 'completed' | 'error';
    progress?: number;
  };
}

interface SmartBreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  showProgress?: boolean;
  onNavigate?: (item: BreadcrumbItem) => void;
}
```

#### Menu de Contexto Adaptativo
```typescript
interface ContextualMenuProps {
  trigger: React.ReactNode;
  items: ContextMenuItem[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  adaptToViewport?: boolean;
  keyboardNavigation?: boolean;
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  submenu?: ContextMenuItem[];
  action: () => void | Promise<void>;
}
```

### 2.2 Feedback Visual Avançado

#### Sistema de Notificações Inteligentes
```typescript
interface SmartNotificationProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'progress';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  metadata?: {
    documentId?: string;
    analysisId?: string;
    timestamp?: Date;
  };
}

interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}
```

#### Indicadores de Status Contextuais
```typescript
interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
  tooltip?: string;
  progress?: number;
}
```

### 2.3 Interações Intuitivas

#### Drag & Drop Avançado
```typescript
interface AdvancedDropZoneProps {
  accept: string[];
  maxSize: number;
  maxFiles: number;
  onDrop: (files: File[]) => void;
  onReject?: (rejectedFiles: FileRejection[]) => void;
  preview?: boolean;
  validation?: {
    customValidator?: (file: File) => string | null;
    showErrors?: boolean;
  };
  accessibility?: {
    announcements?: DropZoneAnnouncements;
    keyboardNavigation?: boolean;
  };
}
```

#### Gestos Touch Responsivos
```typescript
interface TouchGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  threshold?: {
    swipe: number;
    pinch: number;
    longPress: number;
  };
}
```

---

## 3. Acessibilidade WCAG 2.1 AA

### 3.1 Diretrizes de Implementação

#### Contraste de Cores
```css
/* Ratios de contraste mínimos */
.text-normal {
  /* Mínimo 4.5:1 para texto normal */
  color: var(--govbr-gray-80);
  background: var(--govbr-gray-2);
}

.text-large {
  /* Mínimo 3:1 para texto grande (18px+ ou 14px+ bold) */
  color: var(--govbr-gray-70);
  background: var(--govbr-gray-2);
}

.interactive-element {
  /* Mínimo 3:1 para elementos interativos */
  border-color: var(--govbr-blue-vivid-20);
}
```

#### Navegação por Teclado
```typescript
interface KeyboardNavigationProps {
  focusManagement: {
    trapFocus?: boolean;
    restoreFocus?: boolean;
    initialFocus?: string;
  };
  shortcuts: {
    [key: string]: () => void;
  };
  announcements: {
    onFocus?: string;
    onActivate?: string;
    onError?: string;
  };
}
```

#### Screen Reader Support
```typescript
interface ScreenReaderProps {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  ariaDisabled?: boolean;
  liveRegion?: 'polite' | 'assertive' | 'off';
}
```

### 3.2 Componentes Acessíveis

#### Button Acessível
```typescript
interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ComponentType;
  rightIcon?: React.ComponentType;
  // Acessibilidade
  ariaLabel?: string;
  ariaDescribedBy?: string;
  announceOnClick?: string;
}
```

#### Form Field Acessível
```typescript
interface AccessibleFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  // Acessibilidade
  describedBy?: string[];
  announceErrors?: boolean;
  errorAnnouncement?: string;
}
```

---

## 4. Otimizações de Performance

### 4.1 Lazy Loading de Componentes

```typescript
// Lazy loading com Suspense
const DocumentAnalyzer = lazy(() => import('./DocumentAnalyzer'));
const DashboardCharts = lazy(() => import('./DashboardCharts'));
const AdvancedFilters = lazy(() => import('./AdvancedFilters'));

// HOC para lazy loading com fallback
function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={fallback ? <fallback /> : <ComponentSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
```

### 4.2 Virtualização de Listas

```typescript
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

// Implementação com react-window
function VirtualizedDocumentList({ documents }: { documents: Document[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <DocumentCard document={documents[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={documents.length}
      itemSize={120}
      overscanCount={5}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 4.3 Memoização Inteligente

```typescript
// Hook para memoização com dependências complexas
function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    maxAge?: number;
    serialize?: (deps: React.DependencyList) => string;
  }
): T {
  const cache = useRef(new Map<string, { value: T; timestamp: number }>());
  
  return useMemo(() => {
    const key = options?.serialize?.(deps) ?? JSON.stringify(deps);
    const cached = cache.current.get(key);
    const now = Date.now();
    
    if (cached && (!options?.maxAge || now - cached.timestamp < options.maxAge)) {
      return cached.value;
    }
    
    const value = factory();
    cache.current.set(key, { value, timestamp: now });
    
    // Limpeza de cache antigo
    if (cache.current.size > 100) {
      const entries = Array.from(cache.current.entries());
      entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, 50)
        .forEach(([key]) => cache.current.delete(key));
    }
    
    return value;
  }, deps);
}
```

### 4.4 Otimização de Bundle

```typescript
// Configuração Vite otimizada
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts', 'd3'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

---

## 5. Estrutura de Implementação

### 5.1 Fase 1: Fundação (Semana 1-2)

#### Tokens de Design
- [ ] Implementar variáveis CSS DSGov
- [ ] Configurar fonte Rawline
- [ ] Atualizar Tailwind config com tokens
- [ ] Criar utilitários de espaçamento

#### Componentes Base
- [ ] Button com variantes DSGov
- [ ] Input com estados acessíveis
- [ ] Card com elevações
- [ ] Badge com cores semânticas

### 5.2 Fase 2: Componentes Avançados (Semana 3-4)

#### Navegação
- [ ] Breadcrumb inteligente
- [ ] Menu contextual adaptativo
- [ ] Sidebar responsiva
- [ ] Tabs com keyboard navigation

#### Feedback
- [ ] Sistema de notificações
- [ ] Indicadores de status
- [ ] Progress bars animados
- [ ] Loading states

### 5.3 Fase 3: Interações UX (Semana 5-6)

#### Gestos e Interações
- [ ] Drag & drop avançado
- [ ] Touch gestures
- [ ] Keyboard shortcuts
- [ ] Focus management

#### Animações
- [ ] Micro-interações
- [ ] Transições de página
- [ ] Loading animations
- [ ] Hover effects

### 5.4 Fase 4: Acessibilidade (Semana 7)

#### WCAG 2.1 AA
- [ ] Auditoria de contraste
- [ ] Navegação por teclado
- [ ] Screen reader testing
- [ ] Focus indicators

#### Testes
- [ ] Automated a11y tests
- [ ] Manual testing
- [ ] User testing
- [ ] Documentation

### 5.5 Fase 5: Performance (Semana 8)

#### Otimizações
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Bundle analysis
- [ ] Performance monitoring

#### Métricas
- [ ] Core Web Vitals
- [ ] Lighthouse scores
- [ ] Bundle size tracking
- [ ] Runtime performance

---

## 6. Ferramentas e Configuração

### 6.1 Dependências Necessárias

```json
{
  "dependencies": {
    "@radix-ui/react-*": "^1.0.0",
    "framer-motion": "^10.0.0",
    "react-window": "^1.8.8",
    "react-intersection-observer": "^9.5.0",
    "focus-trap-react": "^10.2.0"
  },
  "devDependencies": {
    "@axe-core/react": "^4.8.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.5.0",
    "lighthouse": "^11.0.0",
    "webpack-bundle-analyzer": "^4.9.0"
  }
}
```

### 6.2 Scripts de Desenvolvimento

```json
{
  "scripts": {
    "dev:a11y": "vite dev --mode development && axe-core",
    "test:a11y": "jest --testPathPattern=a11y",
    "analyze:bundle": "npm run build && npx webpack-bundle-analyzer dist/stats.json",
    "lighthouse": "lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json",
    "perf:monitor": "node scripts/performance-monitor.js"
  }
}
```

### 6.3 Configuração de Testes

```typescript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.stories.{ts,tsx}',
    '!src/components/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## 7. Monitoramento e Métricas

### 7.1 Performance Metrics

```typescript
// Performance monitoring
interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

function trackPerformance() {
  // Web Vitals tracking
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

### 7.2 Accessibility Monitoring

```typescript
// A11y monitoring
function setupA11yMonitoring() {
  if (process.env.NODE_ENV === 'development') {
    import('@axe-core/react').then(axe => {
      axe.default(React, ReactDOM, 1000);
    });
  }
}
```

### 7.3 Bundle Size Tracking

```typescript
// Bundle analysis
function analyzeBundleSize() {
  const stats = require('./dist/stats.json');
  
  const analysis = {
    totalSize: stats.assets.reduce((sum, asset) => sum + asset.size, 0),
    chunkSizes: stats.chunks.map(chunk => ({
      name: chunk.names[0],
      size: chunk.size
    })),
    unusedCode: stats.modules.filter(module => !module.used)
  };
  
  console.table(analysis.chunkSizes);
  
  if (analysis.totalSize > 1024 * 1024) { // 1MB
    console.warn('Bundle size exceeds 1MB threshold');
  }
}
```

---

## 8. Conclusão

Esta documentação fornece um roadmap completo para implementar o Design System DSGov no projeto LicitaReview, garantindo:

- **Conformidade governamental** com tokens DSGov oficiais
- **Experiência de usuário superior** com componentes UX avançados
- **Acessibilidade total** seguindo WCAG 2.1 AA
- **Performance otimizada** para carregamento rápido
- **Manutenibilidade** através de padrões consistentes

A implementação deve seguir as fases propostas, com testes contínuos e monitoramento de métricas para garantir qualidade e performance ao longo do desenvolvimento.

### Próximos Passos

1. Revisar e aprovar esta documentação
2. Configurar ambiente de desenvolvimento
3. Iniciar Fase 1: Fundação
4. Estabelecer pipeline de CI/CD com testes de acessibilidade
5. Configurar monitoramento de performance

---

**Documento criado em:** Janeiro 2025  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento LicitaReview