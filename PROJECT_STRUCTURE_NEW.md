# LicitaReview - Nova Estrutura do Projeto

## 🏗️ Estrutura Refatorada (Monorepo Organizado)

```
licitareview/                           # Root do projeto
├── 📱 apps/                            # Applications
│   ├── web/                           # Frontend React
│   │   ├── src/
│   │   │   ├── app/                   # App configuration
│   │   │   ├── components/            # UI Components
│   │   │   │   ├── ui/               # shadcn/ui base components
│   │   │   │   ├── features/         # Feature-specific components
│   │   │   │   │   ├── analysis/     # Analysis components
│   │   │   │   │   ├── config/       # 🚀 Configuration components (CORE)
│   │   │   │   │   ├── documents/    # Document components
│   │   │   │   │   └── dashboard/    # Dashboard components
│   │   │   │   └── shared/           # Shared/common components
│   │   │   ├── pages/                # Route pages
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── services/             # API services
│   │   │   ├── lib/                  # Utilities and config
│   │   │   └── types/                # TypeScript types
│   │   ├── public/
│   │   └── package.json
│   └── admin/                         # Admin dashboard (future)
├── 🚀 services/                       # Backend Services
│   ├── api/                          # Cloud Functions (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── functions/            # Individual functions
│   │   │   │   ├── documents/        # Document operations
│   │   │   │   ├── analysis/         # Analysis operations
│   │   │   │   ├── config/           # 🚀 Configuration API (CORE)
│   │   │   │   └── notifications/    # Notification system
│   │   │   ├── shared/               # Shared utilities
│   │   │   ├── types/                # TypeScript types
│   │   │   └── tests/                # Unit tests
│   │   └── package.json
│   ├── analyzer/                     # Document Analyzer (Python)
│   │   ├── src/
│   │   │   ├── api/                  # Flask API endpoints
│   │   │   ├── core/                 # Core analysis engine
│   │   │   │   ├── adaptive/         # 🚀 Adaptive analyzer (CORE)
│   │   │   │   ├── ocr/              # OCR processing
│   │   │   │   └── rules/            # Analysis rules
│   │   │   ├── models/               # Pydantic models
│   │   │   ├── services/             # Business logic
│   │   │   └── tests/                # Unit tests
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── shared/                       # Shared types and utilities
├── 📚 packages/                       # Shared Packages
│   ├── types/                        # Shared TypeScript types
│   ├── ui/                           # Shared UI components
│   └── utils/                        # Shared utilities
├── 🔧 tools/                         # Development Tools
│   ├── scripts/                      # Build and deployment scripts
│   ├── config/                       # Shared configurations
│   └── docker/                       # Docker configurations
├── 📖 docs/                          # Documentation
│   ├── api/                          # API documentation
│   ├── architecture/                 # Architecture docs
│   ├── deployment/                   # Deployment guides
│   └── user/                         # User documentation
├── 🧪 tests/                         # E2E and integration tests
│   ├── e2e/                          # End-to-end tests
│   └── integration/                  # Integration tests
├── 🚀 deployment/                    # Deployment configurations
│   ├── gcp/                          # Google Cloud Platform
│   ├── docker/                       # Docker compose files
│   └── k8s/                          # Kubernetes configs (future)
├── .github/                          # GitHub configurations
│   └── workflows/                    # CI/CD workflows
├── package.json                      # Root package.json
├── turbo.json                        # Turborepo configuration
└── README.md                         # Main project README
```

## 🎯 Principais Melhorias

### 1. **Monorepo com Turborepo**
- Builds otimizados e cache inteligente
- Dependências compartilhadas
- Pipelines de CI/CD paralelos

### 2. **Separação Clara de Responsabilidades**
- **apps/**: Applications (web, admin)
- **services/**: Backend services (API, analyzer)
- **packages/**: Código compartilhado
- **tools/**: Ferramentas de desenvolvimento

### 3. **Organização por Features**
- Componentes agrupados por funcionalidade
- Código relacionado próximo
- Fácil manutenção e escalabilidade

### 4. **🚀 CORE DIFERENCIAL Organizado**
- `apps/web/src/components/features/config/`: Interface de configuração
- `services/api/src/functions/config/`: API de configuração
- `services/analyzer/src/core/adaptive/`: Motor adaptativo

### 5. **Testes Estruturados**
- Unit tests em cada serviço
- Integration tests centralizados
- E2E tests com Playwright

### 6. **DevOps Profissional**
- Docker containers otimizados
- CI/CD com GitHub Actions
- Deployment automatizado GCP

## 🔄 Plano de Migração

### Fase 1: Estrutura Base
1. Criar nova estrutura de pastas
2. Configurar Turborepo
3. Migrar configurações básicas

### Fase 2: Frontend
1. Refatorar componentes React
2. Organizar por features
3. Implementar design system

### Fase 3: Backend
1. Reorganizar Cloud Functions
2. Refatorar Python services
3. Padronizar APIs

### Fase 4: DevOps
1. Configurar CI/CD
2. Setup Docker containers
3. Deployment automatizado