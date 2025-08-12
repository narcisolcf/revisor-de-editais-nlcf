# LicitaReview Cloud Functions

## 🚀 CORE DIFERENCIAL: Sistema de Parâmetros Personalizados

Este projeto implementa as Cloud Functions para o **LicitaReview**, com foco no diferencial competitivo principal: **análise personalizada por organização**.

## 📁 Estrutura do Projeto

```
functions/
├── src/
│   ├── api/                    # API Endpoints
│   │   ├── documents.ts        # Document CRUD operations
│   │   ├── analysis-config.ts  # 🚀 CORE: Configuration management
│   │   ├── health.ts          # Health checks
│   │   ├── analytics.ts       # Usage analytics
│   │   ├── notifications.ts   # Notification processor
│   │   └── audit.ts          # Audit logging
│   ├── triggers/              # Event Triggers
│   │   ├── document-upload.ts # Storage trigger for uploads
│   │   └── analysis-complete.ts # Firestore trigger for analysis
│   ├── types/                 # TypeScript Type Definitions
│   │   ├── document.types.ts  # Document models
│   │   ├── analysis.types.ts  # Analysis models
│   │   ├── config.types.ts    # 🚀 CORE: Configuration models
│   │   └── index.ts          # Common types
│   ├── middleware/            # Express Middleware
│   │   ├── auth.ts           # Authentication & authorization
│   │   ├── error.ts          # Error handling
│   │   └── index.ts          # Middleware utilities
│   ├── utils/                 # Utility Functions
│   │   ├── validation.ts      # Zod validation utilities
│   │   └── index.ts          # General utilities
│   ├── config/               # Configuration
│   │   ├── firebase.ts       # Firebase Admin setup
│   │   └── index.ts          # Environment config
│   ├── tests/                # Unit Tests
│   │   ├── documents.test.ts
│   │   ├── analysis-config.test.ts
│   │   └── setup.ts
│   └── index.ts              # Main exports
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Test configuration
└── README.md                # This file
```

## 🎯 Principais Funcionalidades

### 1. 🚀 Gerenciamento de Configurações (CORE DIFERENCIAL)

**API:** `analysis-config.ts`

Permite que cada organização configure pesos personalizados para análise:

```typescript
// Exemplo: Tribunal de Contas (foco jurídico)
const rigorousWeights = {
  structural: 15.0,  // Menos foco em estrutura
  legal: 60.0,       // FOCO PRINCIPAL em conformidade
  clarity: 20.0,     // Clareza importante
  abnt: 5.0          // ABNT menos relevante
}; // Total sempre = 100%

// Exemplo: Prefeitura Técnica (foco técnico)
const technicalWeights = {
  structural: 35.0,  // Foco em estrutura
  legal: 25.0,       // Conformidade padrão
  clarity: 15.0,     // Clareza básica
  abnt: 25.0         // FOCO em especificações ABNT
};
```

**Endpoints principais:**
- `GET /configs/current` - Configuração ativa da organização
- `POST /configs` - Criar nova configuração
- `PUT /configs/:id` - Atualizar configuração
- `POST /configs/:id/clone` - Clonar configuração
- `POST /validate-weights` - Validar pesos (devem somar 100%)
- `POST /test-rule` - Testar regras personalizadas

### 2. 📄 Gerenciamento de Documentos

**API:** `documents.ts`

CRUD completo para documentos licitatórios:

```typescript
// Tipos suportados
enum DocumentType {
  EDITAL = "EDITAL",
  TERMO_REFERENCIA = "TERMO_REFERENCIA", 
  ETP = "ETP",
  MAPA_RISCOS = "MAPA_RISCOS",
  MINUTA_CONTRATO = "MINUTA_CONTRATO"
  // ... outros tipos
}

// Status do documento
enum DocumentStatus {
  DRAFT = "DRAFT",
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING", 
  PROCESSED = "PROCESSED",
  ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
  ERROR = "ERROR"
}
```

### 3. 🔧 Triggers Automáticos

**Upload de Documentos:** `document-upload.ts`
- Detecta uploads no Cloud Storage
- Valida tipo e tamanho do arquivo
- Atualiza status do documento
- Inicia processamento automático

**Análise Completa:** `analysis-complete.ts`
- Processa resultados de análise
- Gera sumário executivo
- Envia notificações
- Atualiza métricas organizacionais

### 4. 🔐 Autenticação e Autorização

**Middleware:** `auth.ts`

Sistema completo de controle de acesso:
- Verificação de tokens Firebase
- Controle por roles e permissions
- Validação de acesso organizacional
- Auditoria de ações

```typescript
// Exemplo de uso
app.get('/documents', 
  authenticateUser,
  requireOrganization,
  requirePermissions(['documents:read']),
  // ... handler
);
```

## 🛠️ Configuração e Deploy

### 1. Instalação

```bash
cd functions
npm install
```

### 2. Configuração do Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Configurar projeto
firebase use --add your-project-id
```

### 3. Variáveis de Ambiente

```bash
# .env (desenvolvimento)
GCLOUD_PROJECT=your-project-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
CORS_ORIGIN=*
MAX_DOCUMENT_SIZE=52428800
RATE_LIMIT_MAX=100
NODE_ENV=development
```

### 4. Build e Deploy

```bash
# Build do TypeScript
npm run build

# Deploy das functions
npm run deploy

# Deploy específica
firebase deploy --only functions:documentsApi
```

### 5. Desenvolvimento Local

```bash
# Emulador local
npm run serve

# Watch mode (auto-rebuild)
npm run watch

# Testes
npm test

# Coverage
npm run test -- --coverage
```

## 📊 APIs Disponíveis

### Documentos
- `GET /documents` - Listar documentos
- `GET /documents/:id` - Buscar documento
- `POST /documents` - Criar documento
- `PUT /documents/:id` - Atualizar documento
- `DELETE /documents/:id` - Arquivar documento
- `PATCH /documents/:id/status` - Alterar status

### Configurações (CORE)
- `GET /configs/current` - Config atual
- `GET /configs/:id` - Config específica
- `POST /configs` - Criar config
- `PUT /configs/:id` - Atualizar config
- `POST /configs/:id/clone` - Clonar config
- `GET /presets` - Presets disponíveis
- `POST /validate-weights` - Validar pesos
- `POST /test-rule` - Testar regra

### Sistema
- `GET /health` - Status básico
- `GET /health/detailed` - Status detalhado
- `GET /analytics/usage` - Métricas de uso
- `GET /audit/logs` - Logs de auditoria

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes específicos
npm test -- documents.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Estrutura de Testes

```typescript
describe("Documents API", () => {
  it("should list documents for authenticated user", async () => {
    const response = await request(documentsApi)
      .get("/")
      .set("Authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 🔒 Segurança

### Autenticação
- JWT tokens via Firebase Auth
- Verificação de usuário ativa
- Custom claims para roles/permissions

### Autorização
- Control por organização
- Permissions granulares
- Rate limiting por IP

### Validação
- Zod schemas para todas as requests
- Sanitização de inputs
- Validação de tipos de arquivo

## 📈 Monitoramento

### Logs Estruturados
```typescript
logger.info("Document processed", {
  requestId: req.requestId,
  documentId: doc.id,
  organizationId: org.id,
  duration: `${duration}ms`
});
```

### Métricas
- Tempo de execução
- Uso de memória
- Taxa de erro
- Throughput por organização

### Alertas
- Falhas críticas
- Performance degradada
- Quota limits

## 🚀 Diferencial Competitivo

### Sistema de Parâmetros Personalizados

1. **Pesos Adaptativos**
   - Cada organização define importância das categorias
   - Mesmo documento = scores diferentes por contexto
   - Validação automática (soma = 100%)

2. **Regras Personalizadas**
   - Patterns regex específicos
   - Validações customizadas
   - Mensagens e sugestões direcionadas

3. **Templates Organizacionais**
   - Estruturas esperadas por tipo de documento
   - Validação de seções obrigatórias
   - Presets otimizados por tipo de órgão

### Exemplo de Uso Real

```typescript
// Mesmo documento, análises diferentes
const document = "Edital de Pregão nº 123/2025";

// Tribunal de Contas (peso jurídico = 60%)
// Score final: 75.5% (penalizado pelo baixo score jurídico)

// Prefeitura Técnica (peso ABNT = 25%) 
// Score final: 80.8% (beneficiado pelo alto score ABNT)

// Órgão Padrão (pesos balanceados = 25% cada)
// Score final: 81.2% (média equilibrada)
```

## 📝 Contribuição

### Padrões de Código
- TypeScript strict mode
- ESLint + Prettier
- Jest para testes
- Conventional commits

### Pull Requests
1. Criar branch feature
2. Implementar funcionalidade
3. Adicionar testes
4. Documentar APIs
5. Solicitar review

---

**🎯 CORE DIFERENCIAL IMPLEMENTADO COM SUCESSO!**

Este sistema de parâmetros personalizados torna o LicitaReview único no mercado, permitindo que cada organização tenha sua própria "receita" de análise adaptada às suas necessidades específicas.