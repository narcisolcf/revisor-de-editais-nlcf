# CONTEXT.md - Contexto do Sistema

## 📋 Visão Geral

### Nome do Projeto
**Sistema de Análise de Documentos Jurídicos**

### Descrição
Aplicação web desenvolvida em React/TypeScript para análise automatizada de documentos jurídicos (editais, termos de referência, contratos) com foco em conformidade regulatória e detecção de problemas.

### Problema Resolvido
- **Análise manual demorada** de documentos jurídicos complexos
- **Inconsistências** na avaliação de conformidade
- **Falta de padronização** nos critérios de análise
- **Ausência de rastreabilidade** dos problemas identificados

### Proposta de Valor
- ⚡ **Análise automatizada** com regras configuráveis
- 🎯 **Detecção precisa** de problemas de conformidade
- 📊 **Relatórios estruturados** com classificação de severidade
- 🔄 **Workflow padronizado** para revisão de documentos

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
```
Frontend: React 18 + TypeScript + Vite
UI Library: shadcn/ui + Tailwind CSS
State Management: React Query + Context API
Routing: React Router v6
Forms: React Hook Form + Zod validation
Testing: Vitest + Testing Library
Build: Vite + ESBuild
Deployment: Lovable Platform
```

### Estrutura de Pastas
```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base do design system
│   ├── forms/           # Componentes de formulário
│   ├── layout/          # Layout e navegação
│   ├── error/           # Sistema de tratamento de erros
│   └── analysis/        # Componentes específicos de análise
├── pages/               # Páginas da aplicação
├── services/            # Serviços e APIs
├── hooks/               # Custom hooks
├── types/               # Definições de tipos TypeScript
├── data/                # Configurações e dados estáticos
├── utils/               # Utilitários e helpers
└── __tests__/           # Testes unitários e integração
```

---

## 🎯 Domínio de Negócio

### Entidades Principais

#### Documento
```typescript
interface Document {
  id: string;
  name: string;
  type: 'edital' | 'termo_referencia' | 'contrato';
  modalidade: DocumentModalidade;
  content: string;
  classification: DocumentClassification;
  status: 'pending' | 'analyzed' | 'reviewed' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Análise
```typescript
interface Analysis {
  id: string;
  documentId: string;
  problems: Problem[];
  conformityScore: number;
  status: AnalysisStatus;
  executedAt: Date;
  rules: AnalysisRule[];
}
```

#### Problema
```typescript
interface Problem {
  id: string;
  type: ProblemType;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'juridico' | 'tecnico' | 'orcamentario' | 'formal';
  description: string;
  suggestion: string;
  location?: string;
}
```

### Regras de Negócio

#### Classificação de Documentos
1. **Por Tipo**: Edital, Termo de Referência, Contrato
2. **Por Modalidade**: Processo Licitatório, Pregão, Concorrência
3. **Por Complexidade**: Simples, Média, Complexa

#### Análise de Conformidade
1. **Regras Obrigatórias**: Palavras-chave que devem estar presentes
2. **Regras Opcionais**: Pelo menos uma palavra de um conjunto deve estar presente
3. **Regras de Padrão**: Validação via regex para formatos específicos

#### Sistema de Pontuação
- **Score Base**: 100 pontos
- **Penalidades por Severidade**:
  - Crítica: -20 pontos
  - Alta: -10 pontos
  - Média: -5 pontos
  - Baixa: -2 pontos

---

## 👥 Stakeholders

### Usuários Primários
- **Analistas Jurídicos**: Revisam documentos e análises
- **Gestores de Contratos**: Supervisionam processos licitatórios
- **Auditores**: Verificam conformidade regulatória

### Usuários Secundários
- **Administradores do Sistema**: Configuram regras e usuários
- **Desenvolvedores**: Mantêm e evoluem o sistema

### Usuários Terciários
- **Fornecedores**: Visualizam resultados de análises (futuro)
- **Órgãos de Controle**: Acessam relatórios consolidados (futuro)

---

## 🎯 Objetivos e KPIs

### Objetivos de Negócio
1. **Reduzir tempo de análise** de documentos em 80%
2. **Aumentar precisão** na detecção de problemas em 90%
3. **Padronizar processo** de revisão documentos
4. **Melhorar rastreabilidade** de decisões e alterações

### KPIs Principais
- **Tempo médio de análise** por documento
- **Taxa de problemas detectados** vs. problemas reais
- **Score médio de conformidade** por tipo de documento
- **Número de documentos processados** por período

### Métricas de Qualidade
- **Disponibilidade do sistema**: > 99%
- **Tempo de resposta**: < 3s para análises
- **Taxa de erro**: < 1%
- **Satisfação do usuário**: > 8/10

---

## 🔒 Requisitos Não-Funcionais

### Performance
- **Análise de documento**: < 30 segundos para 100 páginas
- **Carregamento inicial**: < 2 segundos
- **Operações CRUD**: < 500ms

### Segurança
- **Autenticação**: OAuth 2.0 / JWT
- **Autorização**: RBAC (Role-Based Access Control)
- **Dados sensíveis**: Criptografia AES-256
- **Audit Log**: Registro de todas as operações

### Escalabilidade
- **Usuários simultâneos**: Até 100
- **Documentos por hora**: Até 1000
- **Armazenamento**: Escalável via cloud

### Usabilidade
- **Interface responsiva**: Mobile-first design
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Idiomas**: Português brasileiro
- **Offline**: Cache básico para análises

---

## 🌍 Contexto Técnico

### Integrações
- **Supabase**: Backend-as-a-Service (futuro)
- **OpenAI API**: Análise de texto com IA (futuro)
- **Sistema de Protocolos**: Integração com SIPAC/SEI (futuro)

### Dependências Externas
- **Lovable Platform**: Hospedagem e CI/CD
- **GitHub**: Controle de versão e colaboração
- **npm/pnpm**: Gerenciamento de dependências

### Constraints Técnicas
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS 14+, Android 10+
- **Bundle Size**: < 2MB inicial
- **Lighthouse Score**: > 90 em todas as métricas

---

## 🚀 Roadmap Estratégico (2025)

### 📊 Status Atual (Janeiro 2025)
- ✅ **25% Implementado:** Frontend React completo e funcional
- ❌ **75% Ausente:** Backend completo e funcionalidades core
- 🚨 **0% Crítico:** Sistema de parâmetros personalizados (diferencial do produto)

### Fase 1: Foundation Backend (Semanas 1-4)
- 🔄 Cloud Run services para análise
- 🔄 Cloud Functions para APIs
- 🔄 Estrutura Firestore organizacional
- 🔄 Integração OCR básica

### Fase 2: Sistema de Parâmetros (Semanas 5-8) - **CORE DIFERENCIAL**
- 🔮 Interface de configuração por organização
- 🔮 Motor de análise adaptativo
- 🔮 Sistema de templates personalizáveis
- 🔮 Cálculo de score ponderado

### Fase 3: IA e Features Avançadas (Semanas 9-12)
- 🔮 Classificação automática com ML
- 🔮 Dashboard completo com métricas
- 🔮 Editor inteligente com sugestões
- 🔮 Análise semântica avançada

### Fase 4: Production Ready (Semanas 13-16)
- 🔮 Testes automatizados (90%+ coverage)
- 🔮 Performance otimizada
- 🔮 Documentação completa
- 🔮 Deploy em produção

---

## 📚 Referências

### Documentação Técnica
- [Plan.md v3.0](./plan.md) - Plano detalhado de desenvolvimento
- [Design System](./DESIGN_SYSTEM.md) - Guia visual e componentes
- [API Documentation](./API_DOCUMENTATION.md) - Especificação de APIs
- [Development Guide](./Development.md) - Normas de desenvolvimento

### Documentação de Negócio
- [PRDs](./prds/) - Product Requirement Documents
- [User Stories](./user-stories/) - Histórias de usuário
- [ADRs](./adrs/) - Architecture Decision Records
- [RFCs](./rfcs/) - Request for Comments

### Compliance e Regulamentação
- **Lei 8.666/93**: Licitações públicas
- **Lei 14.133/21**: Nova Lei de Licitações
- **TCU**: Orientações do Tribunal de Contas
- **LGPD**: Lei Geral de Proteção de Dados

---

*Documento vivo - Atualizado em: $(date)*
*Versão: 1.0*
*Próxima revisão: $(date +30 days)*