# DESIGN_SYSTEM.md - Sistema de Design

## 🎨 Visão Geral

### Filosofia de Design
**"Clareza, Confiabilidade e Eficiência"**

Nosso sistema de design prioriza:
- **Clareza**: Interfaces intuitivas que facilitam a tomada de decisão
- **Confiabilidade**: Consistência visual que transmite confiança profissional  
- **Eficiência**: Componentes otimizados para workflows ágeis

### Princípios Fundamentais
1. **Consistência**: Padrões visuais uniformes em toda a aplicação
2. **Acessibilidade**: WCAG 2.1 AA compliance em todos os componentes
3. **Escalabilidade**: Design tokens e componentes reutilizáveis
4. **Performance**: Otimização para carregamento rápido
5. **Responsividade**: Mobile-first approach

---

## 🎯 Design Tokens

### Cores

#### Primary Palette
```css
/* Brand Colors */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Primary */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;
```

#### Semantic Colors
```css
/* Status Colors */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-600: #16a34a;

--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;

--info-50: #f0f9ff;
--info-500: #06b6d4;
--info-600: #0891b2;
```

#### Neutral Palette
```css
/* Gray Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
--gray-950: #030712;
```

#### Severity Colors (Análise)
```css
/* Análise de Documentos */
--severity-critical: #dc2626;  /* Vermelho */
--severity-high: #ea580c;      /* Laranja */
--severity-medium: #d97706;    /* Amarelo */
--severity-low: #65a30d;       /* Verde claro */
--severity-info: #2563eb;      /* Azul */
```

### Typography

#### Font Families
```css
/* Primary Font */
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace Font */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### Font Scales
```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing

#### Spacing Scale
```css
/* Spacing System (8px base) */
--space-px: 1px;
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```css
/* Border Radius */
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-base: 0.25rem;   /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-full: 9999px;
```

### Shadows
```css
/* Box Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## 🧩 Componentes Base

### Button

#### Variants
```typescript
type ButtonVariant = 
  | 'default'    // Primary action
  | 'destructive' // Dangerous actions
  | 'outline'    // Secondary action
  | 'secondary'  // Tertiary action
  | 'ghost'      // Minimal action
  | 'link';      // Link styling

type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';
```

#### Usage Examples
```tsx
// Primary action
<Button variant="default" size="default">
  Analisar Documento
</Button>

// Dangerous action
<Button variant="destructive" size="sm">
  Excluir
</Button>

// Secondary action
<Button variant="outline" size="lg">
  Cancelar
</Button>
```

#### States
- **Default**: Normal interactive state
- **Hover**: Slight elevation and color change
- **Active**: Pressed state with inset shadow
- **Loading**: Spinner with disabled state
- **Disabled**: Reduced opacity, non-interactive

### Input

#### Types
```typescript
type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'file' 
  | 'search';

type InputState = 'default' | 'error' | 'success' | 'disabled';
```

#### Anatomy
```tsx
<div className="input-group">
  <Label htmlFor="document-title">
    Título do Documento
    <Required />
  </Label>
  <Input 
    id="document-title"
    type="text"
    placeholder="Digite o título..."
    state="default"
  />
  <HelperText>
    Título deve ter entre 5 e 100 caracteres
  </HelperText>
</div>
```

### Card

#### Variants
```typescript
type CardVariant = 
  | 'default'    // Standard content card
  | 'interactive' // Clickable/hoverable
  | 'status'     // With status indicator
  | 'ghost';     // Minimal styling
```

#### Document Analysis Card
```tsx
<Card variant="interactive" className="document-card">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Edital_Licitacao_001.pdf</CardTitle>
      <Badge variant={getStatusVariant(status)}>
        {status}
      </Badge>
    </div>
    <CardDescription>
      Processo Licitatório • 15 páginas • Modalidade: Pregão
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-4">
      <ProgressBar value={85} label="Score de Conformidade" />
      <ProblemSummary problems={problems} />
    </div>
  </CardContent>
  
  <CardFooter>
    <Button variant="outline" size="sm">
      Ver Detalhes
    </Button>
    <Button size="sm">
      Baixar Relatório
    </Button>
  </CardFooter>
</Card>
```

### Badge

#### Severity Mapping
```tsx
const severityConfig = {
  critica: { variant: 'destructive', icon: AlertTriangle },
  alta: { variant: 'warning', icon: AlertCircle },
  media: { variant: 'secondary', icon: Info },
  baixa: { variant: 'success', icon: CheckCircle },
} as const;
```

### Progress Bar

#### Analysis Progress Component
```tsx
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

<ProgressBar 
  value={conformityScore}
  label="Score de Conformidade"
  variant={getScoreVariant(conformityScore)}
  showPercentage
/>
```

---

## 📱 Layout System

### Grid System
```css
/* 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--space-6);
}

.col-span-1 { grid-column: span 1 / span 1; }
.col-span-2 { grid-column: span 2 / span 2; }
/* ... */
.col-span-12 { grid-column: span 12 / span 12; }
```

### Container Sizes
```css
/* Container max-widths */
.container-sm { max-width: 640px; }   /* Mobile landscape */
.container-md { max-width: 768px; }   /* Tablet */
.container-lg { max-width: 1024px; }  /* Desktop */
.container-xl { max-width: 1280px; }  /* Large desktop */
.container-2xl { max-width: 1536px; } /* Extra large */
```

### Page Layouts

#### Main Application Layout
```tsx
<div className="min-h-screen bg-background">
  <Header />
  <div className="flex">
    <Sidebar className="hidden md:block" />
    <main className="flex-1 container mx-auto px-6 py-8">
      <PageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
      <div className="space-y-6">
        {children}
      </div>
    </main>
  </div>
  <Toaster />
</div>
```

#### Document Review Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Document Content */}
  <div className="lg:col-span-2">
    <DocumentViewer document={document} />
  </div>
  
  {/* Analysis Panel */}
  <div className="space-y-6">
    <ConformityScore score={analysis.score} />
    <ProblemsList problems={analysis.problems} />
    <ActionButtons />
  </div>
</div>
```

---

## 🎭 Component Patterns

### Analysis Components

#### Problem Item
```tsx
interface ProblemItemProps {
  problem: Problem;
  onResolve?: (problemId: string) => void;
  onIgnore?: (problemId: string) => void;
}

<div className="problem-item">
  <div className="flex items-start space-x-3">
    <Badge variant={severityConfig[problem.severity].variant}>
      {problem.severity.toUpperCase()}
    </Badge>
    <div className="flex-1 space-y-2">
      <p className="text-sm font-medium text-foreground">
        {problem.description}
      </p>
      <p className="text-xs text-muted-foreground">
        {problem.suggestion}
      </p>
      {problem.location && (
        <Button variant="ghost" size="sm">
          Ver no documento ↗
        </Button>
      )}
    </div>
  </div>
</div>
```

#### Conformity Score Gauge
```tsx
interface ConformityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

<div className="conformity-score">
  <div className="relative">
    <CircularProgress 
      value={score} 
      size={size}
      strokeColor={getScoreColor(score)}
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-2xl font-bold">
        {score}%
      </span>
    </div>
  </div>
  
  {showDetails && (
    <div className="mt-4 space-y-2">
      <ScoreBreakdown score={score} />
      <ScoreInterpretation score={score} />
    </div>
  )}
</div>
```

### Form Patterns

#### Document Upload Form
```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField name="title">
      <FormLabel>Título do Documento</FormLabel>
      <FormControl>
        <Input placeholder="Digite o título..." />
      </FormControl>
      <FormMessage />
    </FormField>
    
    <FormField name="type">
      <FormLabel>Tipo de Documento</FormLabel>
      <FormControl>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="edital">Edital</SelectItem>
            <SelectItem value="termo_referencia">Termo de Referência</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormField>
  </div>
  
  <FormField name="document">
    <FormLabel>Arquivo</FormLabel>
    <FormControl>
      <FileDropzone 
        accept=".pdf,.doc,.docx"
        maxSize={10 * 1024 * 1024} // 10MB
        onDrop={handleFileUpload}
      />
    </FormControl>
    <FormDescription>
      PDF, DOC ou DOCX até 10MB
    </FormDescription>
    <FormMessage />
  </FormField>
</form>
```

---

## 🎨 Visual Principles

### Information Hierarchy

#### Document Analysis Hierarchy
```
1. Page Title (text-3xl, font-bold)
   ├── Document Name
   └── Analysis Status

2. Section Headers (text-xl, font-semibold)
   ├── Conformity Score
   ├── Problems Summary
   └── Detailed Analysis

3. Subsection Headers (text-lg, font-medium)
   ├── Critical Issues
   ├── High Priority
   └── Medium Priority

4. Content (text-base, font-normal)
   ├── Problem Descriptions
   ├── Suggestions
   └── Context Information
```

### Color Usage Guidelines

#### Status Communication
- **Green**: Success, approved, conformity
- **Yellow/Orange**: Warning, attention needed
- **Red**: Error, critical issues, rejection
- **Blue**: Information, in progress, neutral

#### Semantic Mapping
```tsx
const statusColors = {
  // Document Status
  'pending': 'yellow',
  'analyzing': 'blue', 
  'completed': 'green',
  'error': 'red',
  
  // Problem Severity
  'critica': 'red',
  'alta': 'orange',
  'media': 'yellow',
  'baixa': 'green',
  
  // Analysis Categories
  'juridico': 'purple',
  'tecnico': 'blue',
  'orcamentario': 'teal',
  'formal': 'gray',
} as const;
```

### Motion & Animation

#### Micro-interactions
```css
/* Hover transitions */
.interactive {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Progress animations */
@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### Page Transitions
- **Enter**: Fade in + slide up (300ms)
- **Exit**: Fade out (200ms)
- **Loading**: Skeleton screens
- **Error**: Shake animation for invalid inputs

---

## 🔧 Implementation Guidelines

### CSS Architecture

#### Utility-First with Component Abstraction
```css
/* Base utilities */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Component layer */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring;
    @apply disabled:pointer-events-none disabled:opacity-50;
  }
  
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }
}
```

### Component Development

#### Component Structure
```
components/
├── ui/                 # Base components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
├── forms/             # Form components
│   ├── FormField.tsx
│   └── FileDropzone.tsx
├── analysis/          # Domain-specific components
│   ├── ConformityScore.tsx
│   ├── ProblemsList.tsx
│   └── DocumentViewer.tsx
└── layout/            # Layout components
    ├── Header.tsx
    ├── Sidebar.tsx
    └── PageHeader.tsx
```

#### Component API Design
```typescript
// Good: Explicit, typed props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Bad: Generic, unclear props  
interface ButtonProps {
  type?: string;
  style?: any;
  icon?: any;
}
```

### Responsive Design

#### Breakpoint Strategy
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
} as const;
```

#### Mobile-First Implementation
```tsx
// Progressive enhancement
<div className="
  grid 
  grid-cols-1 
  gap-4
  md:grid-cols-2 
  md:gap-6
  lg:grid-cols-3
  xl:gap-8
">
  {documents.map(doc => (
    <DocumentCard key={doc.id} document={doc} />
  ))}
</div>
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI components**: 3:1 minimum

#### Keyboard Navigation
```tsx
// Proper focus management
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Analysis</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Document Analysis</DialogTitle>
    </DialogHeader>
    {/* Focus trapped within dialog */}
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Screen Reader Support
```tsx
// Semantic HTML + ARIA
<section aria-labelledby="problems-heading">
  <h2 id="problems-heading">
    Problemas Identificados
  </h2>
  <div role="list" aria-label="Lista de problemas">
    {problems.map(problem => (
      <div 
        key={problem.id}
        role="listitem"
        aria-describedby={`problem-${problem.id}-description`}
      >
        <Badge 
          aria-label={`Severidade: ${problem.severity}`}
          variant={severityConfig[problem.severity].variant}
        >
          {problem.severity}
        </Badge>
        <p id={`problem-${problem.id}-description`}>
          {problem.description}
        </p>
      </div>
    ))}
  </div>
</section>
```

---

## 🧪 Testing & Quality

### Visual Testing
```bash
# Chromatic for visual regression
npm run chromatic

# Storybook for component development
npm run storybook
```

### Component Testing
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with correct variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-destructive');
  });
  
  it('should be accessible', async () => {
    const { container } = render(<Button>Click me</Button>);
    
    // axe-core accessibility testing
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Design Token Testing
```typescript
// Ensure design tokens are correctly applied
describe('Design Tokens', () => {
  it('should use semantic colors correctly', () => {
    const criticalBadge = render(
      <Badge variant="destructive">Critical</Badge>
    );
    
    expect(criticalBadge.container.firstChild).toHaveStyle({
      backgroundColor: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
    });
  });
});
```

---

## 📚 Resources & Tools

### Design Tools
- **Figma**: Design system source of truth
- **Storybook**: Component documentation
- **Chromatic**: Visual testing
- **axe DevTools**: Accessibility testing

### Development Tools
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component primitives
- **Radix UI**: Accessible component foundation
- **Lucide React**: Icon system

### Documentation
- **Component API**: Auto-generated from TypeScript
- **Usage Examples**: Live in Storybook
- **Design Guidelines**: This document + Figma
- **Accessibility Checklist**: WCAG compliance guide

---

## 🔄 Maintenance & Evolution

### Versioning Strategy
```
Design System follows semantic versioning:
- MAJOR: Breaking changes to component APIs
- MINOR: New components or non-breaking enhancements  
- PATCH: Bug fixes and small improvements
```

### Update Process
1. **RFC**: Propose changes via RFC document
2. **Design**: Create designs in Figma
3. **Review**: Team review and feedback
4. **Implementation**: Code + tests + docs
5. **Release**: Version bump + changelog

### Deprecation Policy
- **6 months notice** for component deprecation
- **Migration guides** provided
- **Codemods** for automated updates when possible

---

*Design System v1.0*
*Última atualização: 11 de Agosto, 2025*
*Próxima revisão: 11 de Novembro, 2025*
*Owner: Design System Team*