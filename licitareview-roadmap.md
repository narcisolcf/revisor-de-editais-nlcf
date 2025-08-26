# 🚀 LicitaReview - Roadmap de Implementação Completo

## 📊 Resumo Executivo da Auditoria
- **✅ 25% Implementado:** Frontend base sólido com React + TypeScript
- **❌ 75% Ausente:** Backend completo e funcionalidades core 
- **🚨 0% Crítico:** Sistema de parâmetros personalizados (diferencial do produto)

---

# 📅 FASE 1: FOUNDATION BACKEND (Semanas 1-4)

## 🎯 Objetivo: Criar infraestrutura backend essencial para o sistema funcionar

### **ETAPA 1.1: Estrutura Cloud Run Services**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 1.1A - Serviço Principal de Análise:**
```
Crie um serviço Cloud Run em Python/Flask para análise de documentos do LicitaReview seguindo esta estrutura:

/cloud-run-services/document-analyzer/
├── main.py                     # Flask app principal
├── requirements.txt            # Dependências
├── Dockerfile                 # Container setup
├── services/
│   ├── __init__.py
│   ├── ocr_service.py         # Google Vision API integration
│   ├── classification_service.py # ML classification
│   ├── analysis_engine.py     # Core analysis logic
│   └── conformity_checker.py  # Compliance validation
├── models/
│   ├── __init__.py
│   ├── document_models.py     # Data structures
│   └── analysis_models.py     # Analysis results
├── config/
│   ├── __init__.py
│   └── analysis_rules.py      # Default rules configuration
└── utils/
    ├── __init__.py
    ├── text_processor.py      # Text processing utilities
    └── validators.py          # Input validation

Requisitos:
- Flask app com endpoints /analyze e /classify
- Integração preparada para Vision API (sem keys ainda)
- Estrutura para receber parâmetros customizados
- Docker multi-stage build para otimização
- Logging estruturado com Python logging
- Error handling robusto
- Health check endpoint
- Documentação API com Swagger/OpenAPI
```

**Prompt 1.1B - Modelos de Dados:**
```
Implemente os modelos de dados Python para o LicitaReview seguindo o schema previsto:

Crie classes Pydantic em models/ para:

1. DocumentModels:
   - Document (id, type, content, metadata)
   - DocumentType (edital, termo_referencia, etp, mapa_riscos, minuta)
   - DocumentClassification (hierarchy from frontend)

2. AnalysisModels:
   - AnalysisRequest (doc_id, org_config, custom_params)
   - AnalysisResult (score, findings, recommendations)
   - AnalysisFinding (category, severity, description, suggestion)
   - ConformityScore (structural, legal, clarity, abnt, overall)

3. ConfigModels:
   - OrganizationConfig (weights, custom_rules, templates)
   - AnalysisWeights (structural, legal, clarity, abnt percentages)
   - CustomRule (name, pattern, severity, message)

Inclua:
- Validação de dados com Pydantic
- Serialização JSON
- Type hints completos
- Docstrings detalhadas
- Métodos de conversão entre modelos
```

### **ETAPA 1.2: Cloud Functions Structure**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 1.2A - Functions Core:**
```
Crie a estrutura completa de Cloud Functions para o LicitaReview:

/functions/src/
├── index.ts                    # Export all functions
├── config/
│   └── firebase.ts            # Firebase admin config
├── triggers/
│   ├── document-upload.ts     # Storage trigger
│   └── analysis-complete.ts   # Firestore trigger
├── api/
│   ├── documents.ts           # Document CRUD
│   ├── analysis-config.ts     # Config management
│   └── templates.ts           # Template management
├── services/
│   ├── document-service.ts    # Business logic
│   ├── analysis-service.ts    # Analysis orchestration
│   └── notification-service.ts # Notifications
├── utils/
│   ├── validation.ts          # Input validation
│   ├── errors.ts              # Error handling
│   └── helpers.ts             # Common utilities
└── types/
    ├── document.types.ts      # Document interfaces
    ├── analysis.types.ts      # Analysis interfaces
    └── config.types.ts        # Configuration interfaces

Implemente:
- onDocumentUpload trigger completo
- API endpoints tipados com Zod validation
- Error handling padronizado
- CORS configuration
- Authentication middleware
- Rate limiting básico
- TypeScript strict mode
- Testes unitários estrutura
```

**Prompt 1.2B - Integração Cloud Run:**
```
Implemente a integração entre Cloud Functions e Cloud Run service:

Em functions/src/services/analysis-service.ts, crie:

1. AnalysisOrchestrator class que:
   - Recebe documento e configurações da organização
   - Chama Cloud Run service para análise pesada  
   - Gerencia retry logic e timeouts
   - Salva resultados no Firestore
   - Envia notificações de conclusão

2. CloudRunClient que:
   - Autentica com Cloud Run usando service account
   - Faz HTTP requests para endpoints de análise
   - Trata erros e timeouts
   - Implementa circuit breaker pattern

3. Task Queue integration para:
   - Enfileirar análises pesadas
   - Processar em background
   - Retry failed analyses
   - Monitor queue health

Inclua tratamento para:
- Documentos grandes (>10MB)
- Timeouts longos (análise IA pode demorar)
- Fallbacks quando Cloud Run está indisponível
- Logs detalhados para debugging
```

### **ETAPA 1.3: Firestore Schema Organizacional**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 1.3A - Database Schema:**
```
Implemente a estrutura completa Firestore para configurações organizacionais do LicitaReview:

1. Crie em functions/src/db/ os seguintes schemas:

/organizations/{orgId}/
├── profile/                   # Organization profile
├── templates/{templateId}     # Custom templates  
├── analysis_rules/{ruleId}    # Custom analysis rules
├── custom_params/{configId}   # Analysis parameters
└── users/{userId}             # Organization users

/documents/{docId}/
├── metadata                   # Basic document info
├── analyses/{analysisId}      # Analysis results
├── versions/{versionId}       # Document versions  
└── comments/{commentId}       # Review comments

2. Interfaces TypeScript para cada collection:
   - OrganizationProfile
   - DocumentTemplate  
   - AnalysisRule
   - CustomParameters
   - DocumentMetadata
   - AnalysisResult

3. Repository patterns:
   - OrganizationRepository
   - DocumentRepository
   - AnalysisRepository
   - TemplateRepository

4. Migration scripts para popular dados iniciais:
   - Default analysis rules por tipo documento
   - Templates GOV.BR oficiais
   - Organizações exemplo

Inclua validação Firestore rules e indexes necessários.
```

### **❌ ETAPAS QUE NÃO PODEM SER EXECUTADAS PELO CLAUDE CODE:**

**🔴 ETAPA 1.4 - Configurações Externas (Manual):**
- Ativar APIs no Google Cloud Console (Vision, Firestore, Cloud Run)
- Criar Service Accounts e chaves de API  
- Configurar Cloud Build para deploy
- Setup de domínios e SSL certificates
- Configurar IAM roles e permissions

---

# 📅 FASE 2: SISTEMA DE PARÂMETROS PERSONALIZADOS (Semanas 5-8)

## 🎯 Objetivo: Implementar o core diferencial do produto

### **ETAPA 2.1: Interface de Configuração**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 2.1A - Página de Configuração Principal:**
```
Implemente a ConfigurationPage completa para o LicitaReview seguindo padrões GOV.BR:

/src/pages/ConfigurationPage.tsx - Página principal com:
- Sidebar para navegação entre seções
- Breadcrumb navigation
- Progress indicator para configurações incompletas
- Save/Cancel actions com confirmação

/src/components/configuration/ - Componentes especializados:
├── DocumentTypeSelector.tsx    # Seletor de tipo documento
├── ParameterWeights.tsx       # Sliders para configurar pesos  
├── CustomRulesEditor.tsx      # Editor de regras personalizadas
├── TemplateManager.tsx        # Gerenciar templates da org
├── ValidationPreview.tsx      # Preview das validações
├── ConfigurationSidebar.tsx   # Navegação lateral
└── ParameterPresets.tsx       # Presets comuns (Rigoroso, Padrão, Flexível)

Funcionalidades:
- Drag & drop para reordenar regras
- Real-time preview das configurações
- Import/export de configurações
- Validação em tempo real
- Undo/redo functionality
- Auto-save com debounce
- Responsive design mobile-first
- Accessibility compliance (WCAG 2.1)
- Integration com React Hook Form + Zod
```

**Prompt 2.1B - Editor de Pesos Avançado:**
```
Crie um editor visual avançado para configurar pesos de análise:

Component: ParameterWeights.tsx

Features:
1. Sliders interativos com:
   - Range 0-100 para cada categoria
   - Auto-balanceamento (total sempre 100%)
   - Visual feedback com cores
   - Tooltips explicativos

2. Categorias de peso:
   - Estrutural (seções obrigatórias, formatação)
   - Legal (conformidade jurídica, riscos)  
   - Clareza (ambiguidade, legibilidade)
   - ABNT (normas técnicas, padrões)

3. Presets configuráveis:
   - Rigoroso: Legal 50%, Estrutural 30%, Clareza 15%, ABNT 5%
   - Padrão: Equilibrado 25% cada
   - Técnico: Estrutural 40%, ABNT 30%, Legal 20%, Clareza 10%
   - Personalizado: definido pelo usuário

4. Visualizações:
   - Pizza chart dos pesos atuais
   - Comparação com presets
   - Impacto simulado em score exemplo
   - Histórico de mudanças

5. Integração:
   - Salvamento automático
   - Validação de soma = 100%
   - Reset para defaults
   - Export/import configurações
```

### **ETAPA 2.2: Motor de Análise Adaptativo**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 2.2A - Analysis Engine Personalizado:**
```
Implemente o motor de análise adaptativo que aplica parâmetros personalizados:

No backend Python (cloud-run-services/), crie:

1. services/adaptive_analyzer.py:
   ```python
   class AdaptiveAnalyzer:
       def __init__(self, doc_type: str, org_config: dict):
           self.doc_type = doc_type
           self.weights = org_config['weights']
           self.custom_rules = org_config['custom_rules']
           self.templates = org_config['templates']
       
       def analyze_with_custom_params(self, document: Document) -> AnalysisResult:
           # Aplicar análise personalizada
           
       def calculate_weighted_score(self, base_scores: dict) -> float:
           # Calcular score ponderado
           
       def apply_custom_validations(self, content: str) -> List[Finding]:
           # Aplicar regras personalizadas da organização
   ```

2. Implementar análise por categoria:
   - StructuralAnalyzer (seções, formatação)
   - LegalAnalyzer (conformidade, riscos)
   - ClarityAnalyzer (ambiguidade, legibilidade)  
   - ABNTAnalyzer (normas técnicas)

3. Sistema de cache inteligente:
   - Cache análises similares
   - Invalidação por mudança de parâmetros
   - Otimização de performance

4. Fallback system:
   - Análise básica quando customizada falha
   - Logging detalhado de erros
   - Graceful degradation
```

**Prompt 2.2B - Frontend Integration:**
```
Crie os hooks e serviços frontend para integrar com análise personalizada:

1. src/hooks/useAnalysisConfig.ts:
   - Gerenciar configurações da organização
   - CRUD operations para parâmetros
   - Cache local com React Query
   - Sync com backend

2. src/services/AnalysisConfigService.ts:
   - API client para configurações
   - Validação client-side
   - Batch operations
   - Error handling robusto

3. src/hooks/useAdaptiveAnalysis.ts:
   - Trigger análise com parâmetros personalizados
   - Real-time status updates
   - Progress tracking
   - Result caching

4. src/components/analysis/AdaptiveAnalysisResults.tsx:
   - Visualizar resultados personalizados
   - Breakdown do score por categoria
   - Comparação com baseline
   - Drill-down em findings específicos

5. Integration points:
   - Auto-aplicar config da org no upload
   - Preview de impacto das mudanças
   - A/B testing de configurações
   - Analytics de performance por config
```

### **ETAPA 2.3: Sistema de Templates**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 2.3A - Template Manager:**
```
Implemente sistema completo de templates organizacionais:

1. src/components/configuration/TemplateManager.tsx:
   - Lista de templates da organização
   - Upload de novos templates
   - Editor de template metadata
   - Preview de templates
   - Versioning system

2. Template features:
   - Import from PDF/DOCX
   - Extract sections automatically
   - Define required fields
   - Set validation rules per section
   - Configure scoring weights per template

3. Template categories:
   - Editais (por modalidade)
   - Termos de Referência (por área)
   - ETPs (por tipo de contratação)
   - Mapas de Risco (por categoria)
   - Minutas (por tipo de contrato)

4. Backend support (Python):
   ```python
   class TemplateService:
       def extract_template_structure(self, file_content: bytes) -> TemplateStructure
       def compare_document_to_template(self, doc: Document, template: Template) -> ComparisonResult
       def suggest_template_improvements(self, usage_analytics: dict) -> List[Suggestion]
   ```

5. Advanced features:
   - Template inheritance (base + specific)
   - AI-powered template optimization
   - Usage analytics per template
   - Collaborative template editing
   - Template marketplace (futuro)
```

### **❌ ETAPAS QUE NÃO PODEM SER EXECUTADAS PELO CLAUDE CODE:**

**🔴 ETAPA 2.4 - Treinamento de Modelos (Manual):**
- Coleta de datasets de documentos licitatórios
- Treinamento de modelos ML personalizados
- Fine-tuning de modelos de linguagem para domínio jurídico
- Validação de accuracy dos modelos
- Deploy de modelos no Vertex AI

---

# 📅 FASE 3: INTEGRAÇÕES IA E FEATURES AVANÇADAS (Semanas 9-12)

## 🎯 Objetivo: Adicionar capacidades de IA e funcionalidades avançadas

### **ETAPA 3.1: Integração Vision API (OCR)**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 3.1A - OCR Service Robusto:**
```
Implemente integração completa com Google Cloud Vision API:

1. services/ocr_service.py no Cloud Run:
   ```python
   class OCRService:
       def __init__(self):
           self.client = vision.ImageAnnotatorClient()
           
       def extract_text_with_structure(self, pdf_bytes: bytes) -> StructuredDocument:
           # Extrair texto mantendo estrutura (títulos, parágrafos, listas)
           
       def extract_tables_and_forms(self, pdf_bytes: bytes) -> List[TableData]:
           # Identificar e extrair tabelas/formulários
           
       def detect_document_layout(self, pdf_bytes: bytes) -> DocumentLayout:
           # Identificar seções, cabeçalhos, rodapés
   ```

2. Features avançadas:
   - Multi-page PDF processing
   - Table extraction with structure preservation
   - Handwriting recognition
   - Image quality assessment
   - Text confidence scoring
   - Language detection

3. Error handling:
   - Retry logic para falhas de API
   - Fallback para OCR alternativo
   - Quality validation
   - Cost optimization (avoid unnecessary calls)

4. Performance:
   - Batch processing
   - Async processing
   - Parallel page processing
   - Smart caching
   - Progress tracking
```

### **ETAPA 3.2: Classificação Automática Avançada**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 3.2A - Auto-Classification System:**
```
Implemente sistema de classificação automática inteligente:

1. services/classification_service.py:
   - ML model para detectar tipo de documento
   - NLP para extrair características
   - Pattern matching avançado
   - Confidence scoring

2. Frontend integration:
   - Auto-sugestão de tipo no upload
   - Confidence indicator visual
   - Manual override option
   - Learning from corrections

3. src/hooks/useSmartClassification.ts:
   ```typescript
   const useSmartClassification = () => {
     const classifyDocument = async (file: File) => {
       // 1. Extract preview text
       // 2. Send to classification API
       // 3. Return predictions with confidence
       // 4. Auto-apply highest confidence if > 90%
     }
   }
   ```

4. Machine learning pipeline:
   - Feature extraction (keywords, structure, format)
   - Multi-class classification
   - Continuous learning from user feedback
   - A/B testing of models
   - Performance metrics tracking
```

### **ETAPA 3.3: Dashboard e Analytics**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 3.3A - Dashboard Completo:**
```
Crie dashboard completo com métricas e analytics:

1. src/pages/DashboardPage.tsx:
   - Overview cards (documentos processados, score médio, tempo médio)
   - Charts de tendências (Recharts)
   - Tabela de documentos recentes
   - Quick actions (novo upload, ver relatórios)

2. Métricas implementar:
   - Volume de documentos por período
   - Score de conformidade médio
   - Distribuição por tipo de documento
   - Tempo médio de processamento
   - Top issues encontrados
   - Trend de melhoria ao longo do tempo

3. src/components/dashboard/:
   ├── MetricsCards.tsx         # Cards de métricas principais
   ├── TrendsChart.tsx         # Gráfico de tendências
   ├── DocumentsTable.tsx      # Tabela documentos recentes
   ├── IssuesBreakdown.tsx     # Breakdown dos problemas
   ├── PerformanceMetrics.tsx  # Performance do sistema
   └── QuickActions.tsx        # Ações rápidas

4. Real-time updates:
   - WebSocket connection para updates
   - Real-time metrics
   - Notifications
   - Auto-refresh data
```

### **ETAPA 3.4: Editor Inteligente**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 3.4A - Smart Document Editor:**
```
Implemente editor inteligente com correções contextuais:

1. src/components/editor/SmartEditor.tsx:
   - Monaco Editor integration
   - Syntax highlighting para documentos jurídicos
   - Real-time spell checking
   - Grammar suggestions
   - Legal term validation

2. Smart features:
   - Auto-completion baseada no tipo documento
   - Sugestões de melhorias contextuais
   - Detecção de inconsistências
   - Links para referências legais
   - Template snippet insertion

3. src/hooks/useSmartEditing.ts:
   ```typescript
   const useSmartEditing = (documentType: string) => {
     const getSuggestions = (text: string, position: number) => {
       // Retornar sugestões contextuais
     }
     
     const validateContent = (content: string) => {
       // Validar conteúdo em tempo real
     }
   }
   ```

4. Advanced editing:
   - Track changes system
   - Comments and annotations
   - Collaborative editing (futuro)
   - Version comparison
   - Export to multiple formats
```

### **❌ ETAPAS QUE NÃO PODEM SER EXECUTADAS PELO CLAUDE CODE:**

**🔴 ETAPA 3.5 - Configurações de Produção (Manual):**
- Setup de ambiente de produção no Google Cloud
- Configuração de load balancers
- Setup de monitoring (Stackdriver)
- Configuração de backup automatizado
- Setup de alertas e SLA monitoring

---

# 📅 FASE 4: PRODUCTION READY (Semanas 13-16)

## 🎯 Objetivo: Preparar sistema para produção

### **ETAPA 4.1: Testes Automatizados**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 4.1A - Test Suite Completo:**
```
Implemente suite completa de testes automatizados:

1. Frontend Tests (src/__tests__/):
   ├── components/           # Component tests
   ├── pages/               # Page tests  
   ├── hooks/               # Hook tests
   ├── services/            # Service tests
   ├── utils/               # Utility tests
   └── integration/         # Integration tests

2. Test utilities:
   - Mock Firebase services
   - Mock file uploads
   - Mock API responses
   - Test data factories
   - Custom render functions

3. Coverage targets:
   - Components: 90%+
   - Business logic: 95%+
   - Critical paths: 100%
   - Overall: 85%+

4. Backend Tests (Cloud Run):
   ```python
   # tests/
   ├── unit/               # Unit tests
   ├── integration/        # Integration tests
   ├── e2e/               # End-to-end tests
   └── performance/        # Performance tests
   ```

5. Test types:
   - Unit tests (Jest/pytest)
   - Integration tests
   - E2E tests (Playwright)
   - Performance tests
   - Security tests
   - Accessibility tests
```

### **ETAPA 4.2: Performance e Otimização**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 4.2A - Performance Optimization:**
```
Implemente otimizações de performance completas:

1. Frontend optimizations:
   - Code splitting por rota
   - Lazy loading de componentes
   - Image optimization
   - Bundle analysis
   - Service Worker para cache
   - Preloading estratégico

2. src/utils/performance/:
   ├── lazyLoading.ts       # Lazy loading utilities
   ├── imageOptimization.ts # Image optimization
   ├── caching.ts          # Cache strategies
   └── bundleAnalysis.ts   # Bundle analysis tools

3. Backend optimizations:
   - Connection pooling
   - Query optimization
   - Caching strategies
   - Background job processing
   - Resource monitoring

4. Monitoring:
   - Core Web Vitals tracking
   - API response time monitoring
   - Error rate tracking
   - User experience metrics
   - Resource usage monitoring

5. Caching strategy:
   - Browser cache
   - CDN cache
   - Application cache
   - Database query cache
   - API response cache
```

### **ETAPA 4.3: Documentação Técnica**
**⚡ EXECUTÁVEL PELO CLAUDE CODE**

**Prompt 4.3A - Documentação Completa:**
```
Crie documentação técnica completa do projeto:

1. Root documentation:
   ├── README.md                 # Visão geral do projeto
   ├── CONTRIBUTING.md          # Guia de contribuição
   ├── DEPLOYMENT.md            # Guia de deployment
   ├── ARCHITECTURE.md          # Documentação da arquitetura
   └── API.md                   # Documentação das APIs

2. Technical docs (docs/):
   ├── setup/                   # Setup e instalação
   ├── development/             # Guias de desenvolvimento
   ├── deployment/              # Guias de deploy
   ├── api/                     # Documentação APIs
   └── troubleshooting/         # Resolução de problemas

3. Code documentation:
   - JSDoc para todas as funções públicas
   - Python docstrings
   - Type definitions completas
   - README por módulo
   - Examples e usage guides

4. User documentation:
   - User manual
   - Admin guide
   - Configuration guide
   - Best practices
   - FAQ

5. Developer experience:
   - Development setup guide
   - Debug guides
   - Performance optimization guide
   - Security guide
   - Contribution guidelines
```

### **❌ ETAPAS QUE NÃO PODEM SER EXECUTADAS PELO CLAUDE CODE:**

**🔴 ETAPA 4.4 - Deployment e DevOps (Manual):**
- Configuração de CI/CD pipelines
- Setup de ambientes (dev, staging, prod)
- Configuração de secrets e variáveis de ambiente
- Setup de monitoramento em produção
- Configuração de backup e disaster recovery
- Security audit e penetration testing
- Load testing com ferramentas externas
- DNS e certificados SSL
- CDN configuration

---

# 📋 RESUMO EXECUTIVO DE EXECUÇÃO

## ✅ **O que o Claude Code PODE executar (80% do projeto):**

### **Código Puro:**
- ✅ Toda estrutura backend (Python/Flask)
- ✅ Todas as Cloud Functions (TypeScript)
- ✅ Todos os componentes Frontend (React/TS)
- ✅ Modelos de dados e interfaces
- ✅ Testes automatizados
- ✅ Documentação técnica
- ✅ Scripts de setup e migração

### **Integração Preparada:**
- ✅ APIs preparadas para integração externa
- ✅ Configurações de ambiente (templates)
- ✅ Dockerfile e configs de deploy
- ✅ Schemas de banco de dados
- ✅ Validações e error handling

## ❌ **O que NÃO PODE ser executado automaticamente (20% do projeto):**

### **Configurações Externas:**
- 🔴 Google Cloud Console configurations
- 🔴 Service Account creation e permissions
- 🔴 API key generation e management
- 🔴 Domain setup e SSL certificates
- 🔴 Production deployment
- 🔴 Environment secrets setup

### **Treinamento e Dados:**
- 🔴 Machine Learning model training
- 🔴 Dataset collection e preparation
- 🔴 Model deployment no Vertex AI
- 🔴 Performance tuning em produção

### **Operações:**
- 🔴 Load testing real
- 🔴 Security auditing
- 🔴 Production monitoring setup
- 🔴 Backup configuration
- 🔴 CI/CD pipeline configuration

---

# 🎯 ESTRATÉGIA DE EXECUÇÃO RECOMENDADA

## **Semana 1-2:** Execute Prompts Fase 1 (Foundation)
- Use Claude Code para toda estrutura backend
- Configure desenvolvimento local
- Manualmente: ative APIs no Google Cloud

## **Semana 3-4:** Execute Prompts Fase 2 (Core Features)
- Implemente sistema de parâmetros personalizados
- Teste localmente com Firebase Emulators
- Manualmente: configure service accounts

## **Semana 5-6:** Execute Prompts Fase 3 (Advanced Features)
- Adicione integrações IA
- Implemente dashboard
- Manualmente: deploy em staging

## **Semana 7-8:** Execute Prompts Fase 4 (Production Ready)
- Testes completos
- Otimizações
- Manualmente: deploy em produção

**🚀 Com esta estratégia, o Claude Code pode implementar 80% do projeto automaticamente, deixando apenas configurações externas e operações para execução manual!**