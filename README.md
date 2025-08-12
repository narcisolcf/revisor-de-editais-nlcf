# LicitaReview 🚀

> Sistema inteligente de análise de documentos licitatórios com parâmetros personalizáveis por organização

[![CI/CD](https://github.com/costaefeitosa/revisor-de-editais/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/costaefeitosa/revisor-de-editais/actions)
[![Coverage](https://codecov.io/gh/costaefeitosa/revisor-de-editais/branch/main/graph/badge.svg)](https://codecov.io/gh/costaefeitosa/revisor-de-editais)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

## 🎯 **Diferencial Competitivo**

**Parâmetros Personalizados por Organização**: Cada órgão pode configurar pesos e regras específicas para seus processos licitatórios, proporcionando análises adaptadas às suas necessidades.

### 🚀 **Como funciona:**
```
Mesmo documento = Scores diferentes por organização

📊 Exemplo:
• Tribunal de Contas:    75.5% (foco jurídico 60%)
• Prefeitura Técnica:    80.8% (foco ABNT 25%)  
• Órgão Padrão:         81.2% (análise balanceada)
```

## 📋 **Funcionalidades**

### ✅ **Implementado (v1.0)**
- 🎨 **Frontend React moderno** com shadcn/ui
- 📄 **Upload e classificação** de documentos
- 🛡️ **Sistema robusto de erros** com ErrorBoundary
- 🎭 **Landing page responsiva** seguindo padrões GOV.BR
- 🚀 **Estrutura Cloud Functions** completa

### 🔄 **Em desenvolvimento**
- 🚀 **Sistema de parâmetros personalizados** (CORE)
- 🤖 **Integração IA** (Vision API, OpenAI)
- 📊 **Dashboard completo** com métricas
- ⚙️ **Motor de análise adaptativo**

## 🏗️ **Arquitetura (Monorepo)**

```
licitareview/
├── 📱 apps/
│   └── web/                    # Frontend React + Vite
├── 🚀 services/
│   ├── api/                    # Cloud Functions (Node.js/TS)
│   └── analyzer/               # Document Analyzer (Python)
├── 📚 packages/
│   ├── types/                  # Tipos compartilhados
│   ├── ui/                     # Componentes UI
│   └── utils/                  # Utilitários
└── 🔧 tools/                   # Ferramentas e config
```

### **Stack Tecnológico**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloud Functions + Cloud Run + Firestore
- **UI**: shadcn/ui + Radix UI + Lucide Icons
- **IA/ML**: Google Cloud Vision + Vertex AI + OpenAI
- **Deploy**: Google Cloud Platform + GitHub Actions
- **Monorepo**: Turborepo + npm workspaces

## 🚀 **Quick Start**

### **Pré-requisitos**
- Node.js 18+ e npm 8+
- Python 3.11+ (para o analyzer)
- Google Cloud SDK
- Firebase CLI

### **Instalação**
```bash
# 1. Clone o repositório
git clone https://github.com/costaefeitosa/revisor-de-editais.git
cd revisor-de-editais

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local

# 4. Inicie o desenvolvimento
npm run dev
```

### **Comandos Principais**
```bash
# Desenvolvimento
npm run dev                  # Inicia todos os serviços
npm run web:dev             # Apenas frontend
npm run api:dev             # Apenas Cloud Functions

# Build e Deploy  
npm run build               # Build completo
npm run deploy:staging      # Deploy staging
npm run deploy:prod         # Deploy produção

# Testes
npm run test                # Todos os testes
npm run test:coverage       # Coverage completo
npm run test:e2e           # Testes E2E

# Qualidade
npm run lint                # Lint e fix
npm run type-check          # Verificação de tipos
npm run format              # Formatação código
```

## 🎛️ **Sistema de Configuração (CORE DIFERENCIAL)**

### **Interface de Configuração**
```typescript
// Pesos personalizados (devem somar 100%)
const customWeights: AnalysisWeights = {
  structural: 30.0,  // Estrutura do documento
  legal: 50.0,       // Conformidade jurídica  
  clarity: 15.0,     // Clareza e linguagem
  abnt: 5.0          // Padrões ABNT
};

// Regras personalizadas com regex
const customRule: CustomRule = {
  name: "Verificar Lei 14.133/2021",
  pattern: /lei\s+14\.133/gi,
  severity: "CRITICA",
  message: "Referência à Lei 14.133/2021 não encontrada"
};
```

### **Presets Disponíveis**
- 🏛️ **Rigoroso**: Foco em conformidade legal (60% jurídico)
- ⚖️ **Padrão**: Análise balanceada (25% cada categoria)
- 🔧 **Técnico**: Foco em especificações (35% estrutural)
- ⚡ **Rápido**: Análise essencial otimizada
- 🎨 **Personalizado**: 100% customizável

## 📊 **Roadmap 2025**

### **Fase 1: Foundation Backend** (Semanas 1-4)
- [x] Estrutura Cloud Functions
- [x] Modelos Python completos  
- [ ] Integração OCR básica
- [ ] APIs funcionais

### **Fase 2: Parâmetros Personalizados** (Semanas 5-8) 🚀 **CORE**
- [x] Interface de configuração
- [x] Modelos de dados
- [ ] Motor adaptativo
- [ ] Templates organizacionais

### **Fase 3: IA e Features Avançadas** (Semanas 9-12)
- [ ] Integração Vision API
- [ ] Dashboard completo
- [ ] Editor inteligente
- [ ] Classificação automática

### **Fase 4: Production Ready** (Semanas 13-16)
- [ ] Testes automatizados (90%+ coverage)
- [ ] Performance otimizada
- [ ] Deploy automatizado
- [ ] Documentação completa

## 🧪 **Testes**

### **Estrutura de Testes**
```
tests/
├── unit/           # Testes unitários por componente
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end (Playwright)  
└── performance/   # Testes de performance
```

### **Coverage Atual**
- **Frontend**: 75%+ (meta: 90%+)
- **Backend API**: 80%+ (meta: 90%+) 
- **Python Analyzer**: 70%+ (meta: 85%+)
- **E2E**: Cenários críticos cobertos

## 🚀 **Deploy**

### **Ambientes**
- **Development**: Local development
- **Staging**: https://staging.licitareview.com
- **Production**: https://licitareview.com

### **CI/CD Pipeline**
1. **Lint & Type Check** → **Tests** → **Build**
2. **Security Audit** → **E2E Tests**
3. **Deploy Staging** → **Smoke Tests**
4. **Deploy Production** → **Monitoring**

## 📚 **Documentação**

- 📖 [**Documentação Técnica**](docs/README.md)
- 🏗️ [**Arquitetura**](docs/architecture/README.md)
- 🚀 [**API Reference**](docs/api/README.md)
- 🎨 [**Design System**](docs/design-system.md)
- 🐳 [**Deploy Guide**](docs/deployment/README.md)

## 🤝 **Contribuição**

### **Padrões de Desenvolvimento**
- **Commits**: [Conventional Commits](https://conventionalcommits.org/)
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`
- **Pull Requests**: Template obrigatório + review
- **Testes**: Cobertura mínima 90%

### **Como Contribuir**
1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está licenciado sob a [MIT License](LICENSE).

## 🚀 **Status do Projeto**

- ✅ **Frontend**: Completo e funcional
- 🔄 **Backend**: Em desenvolvimento (Cloud Functions prontas)
- 🚀 **Core Diferencial**: Modelos implementados, interface em desenvolvimento
- 📊 **Roadmap**: 25% implementado, seguindo cronograma

---

<div align="center">

**🎯 LicitaReview - Tornando licitações mais eficientes através de análise inteligente personalizada**

[Website](https://licitareview.com) • [Documentação](docs/) • [Roadmap](licitareview-roadmap.md) • [Issues](https://github.com/costaefeitosa/revisor-de-editais/issues)

</div>