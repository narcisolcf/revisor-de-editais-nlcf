# Guia de Integração Cloud Functions ↔ Cloud Run

## Visão Geral

Este documento descreve a integração completa entre Cloud Functions e Cloud Run implementada no sistema de revisão de editais, incluindo autenticação segura, comunicação bidirecional e sistema de parâmetros inteligente.

## Arquitetura da Integração

### Componentes Principais

1. **Cloud Functions (API)**
   - Gerencia requisições HTTP
   - Autentica usuários
   - Orquestra análises de documentos
   - Persiste dados no Firestore

2. **Cloud Run (Analyzer)**
   - Processa análises de documentos
   - Executa algoritmos de IA/ML
   - Retorna resultados estruturados

3. **ParameterEngine**
   - Gerencia parâmetros de análise personalizados
   - Aplica otimizações adaptativas
   - Mantém cache de configurações

4. **Firestore Database**
   - Armazena dados persistentes
   - Gerencia configurações organizacionais
   - Mantém histórico de análises

## Fluxo de Dados

### 1. Requisição de Análise

```
Cliente → Cloud Functions → ParameterEngine → Cloud Run → Firestore
```

1. Cliente envia documento para análise
2. Cloud Functions autentica e valida requisição
3. AnalysisOrchestrator coordena o processo
4. ParameterEngine gera parâmetros otimizados
5. CloudRunClient envia requisição autenticada
6. Cloud Run processa análise
7. Resultados são salvos no Firestore
8. Cliente recebe resposta

### 2. Autenticação Segura

#### CloudRunClient
- **Service Account Authentication**: Usa credenciais de service account
- **OAuth2 Tokens**: Gera tokens JWT para autenticação
- **Token Refresh**: Renovação automática de tokens (55 min)
- **IAP Support**: Suporte para Identity-Aware Proxy

```typescript
// Configuração de autenticação
const authConfig: AuthConfig = {
  projectId: 'seu-projeto',
  serviceAccountEmail: 'service@projeto.iam.gserviceaccount.com',
  serviceAccountKeyFile: '/path/to/key.json', // opcional
  audience: 'https://cloud-run-url', // para IAP
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
};
```

#### Circuit Breaker
- **Failure Threshold**: 5 falhas consecutivas
- **Reset Timeout**: 60 segundos
- **Monitoring Period**: 10 segundos

#### Retry Logic
- **Max Retries**: 3 tentativas
- **Initial Delay**: 1 segundo
- **Max Delay**: 10 segundos
- **Backoff Multiplier**: 2x

### 3. Sistema de Parâmetros Inteligente

#### ParameterEngine Features
- **Adaptive Weights**: Ajusta pesos baseado no histórico
- **Learning Mode**: Aprende com análises anteriores
- **Custom Rules**: Regras personalizadas por organização
- **Performance Cache**: Cache inteligente de configurações

```typescript
// Configuração do ParameterEngine
const parameterEngine = new ParameterEngine({
  enableAdaptiveWeights: true,
  enableLearningMode: true,
  adaptationThreshold: 10, // mínimo de análises para adaptação
  maxWeightAdjustment: 0.15, // máximo 15% de ajuste
  cacheTimeout: 3600000 // 1 hora
});
```

## Schema do Firestore

### Coleções Principais

#### 1. organizations
```typescript
interface Organization {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    analysisPreset: AnalysisPreset;
    customWeights?: AnalysisWeights;
    enableAdaptiveWeights: boolean;
  };
  created_at: Date;
  updated_at: Date;
}
```

#### 2. documents
```typescript
interface Document {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  type: DocumentType;
  status: DocumentStatus;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
```

#### 3. analyses
```typescript
interface Analysis {
  id: string;
  document_id: string;
  organization_id: string;
  status: AnalysisStatus;
  parameters: AnalysisParameters;
  results?: AnalysisResults;
  created_at: Date;
  completed_at?: Date;
  error_message?: string;
}
```

#### 4. custom_params
```typescript
interface CustomParameters {
  id: string;
  organization_id: string;
  category: string;
  weights: AnalysisWeights;
  rules: CustomRule[];
  preset: AnalysisPreset;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Índices Otimizados

```json
{
  "indexes": [
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "completed_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## APIs Principais

### AnalysisOrchestrator

```typescript
// Iniciar análise
const result = await orchestrator.startAnalysis({
  documentId: 'doc-123',
  organizationId: 'org-456',
  options: {
    priority: 'high',
    customRules: [...]
  }
});

// Obter progresso
const progress = await orchestrator.getProgress('analysis-789');

// Cancelar análise
const cancelled = await orchestrator.cancelAnalysis('analysis-789');
```

### ParameterEngine

```typescript
// Gerar parâmetros otimizados
const params = await parameterEngine.generateParameters('org-456');

// Limpar cache
await parameterEngine.clearCache('org-456');

// Obter estatísticas
const stats = parameterEngine.getEngineStats();
```

### CloudRunClient

```typescript
// Analisar documento
const response = await cloudRunClient.analyzeDocument({
  document_content: content,
  document_type: 'edital',
  organization_config: orgConfig,
  analysis_options: analysisOptions,
  parameter_engine_config: parameterConfig
});

// Verificar saúde
const health = await cloudRunClient.healthCheck();

// Validar autenticação
const authStatus = await cloudRunClient.validateAuth();
```

## Configuração de Deployment

### Variáveis de Ambiente

```bash
# Cloud Run
CLOUD_RUN_SERVICE_URL=https://analyzer-service-url
CLOUD_RUN_PROJECT_ID=seu-projeto-id

# Service Account
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
SERVICE_ACCOUNT_EMAIL=service@projeto.iam.gserviceaccount.com

# Firestore
FIRESTORE_PROJECT_ID=seu-projeto-id
FIRESTORE_DATABASE_ID=(default)

# ParameterEngine
PARAMETER_ENGINE_CACHE_TIMEOUT=3600000
PARAMETER_ENGINE_ADAPTIVE_WEIGHTS=true
PARAMETER_ENGINE_LEARNING_MODE=true
```

### Cloud Functions Deployment

```bash
# Deploy todas as functions
npm run deploy

# Deploy function específica
npm run deploy:analysis
```

### Cloud Run Deployment

```bash
# Build e deploy
gcloud run deploy analyzer-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated=false
```

## Monitoramento e Logs

### Métricas Importantes

1. **Latência de Análise**
   - Tempo total de processamento
   - Tempo de comunicação Cloud Functions ↔ Cloud Run
   - Tempo de geração de parâmetros

2. **Taxa de Sucesso**
   - Análises completadas com sucesso
   - Falhas de autenticação
   - Timeouts de rede

3. **Performance do ParameterEngine**
   - Cache hit rate
   - Tempo de geração de parâmetros
   - Eficácia das otimizações adaptativas

### Logs Estruturados

```typescript
// Exemplo de log estruturado
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  component: 'AnalysisOrchestrator',
  action: 'startAnalysis',
  organizationId: 'org-456',
  documentId: 'doc-123',
  analysisId: 'analysis-789',
  duration: 1250,
  success: true
}));
```

## Troubleshooting

### Problemas Comuns

1. **Falhas de Autenticação**
   - Verificar service account permissions
   - Validar tokens JWT
   - Confirmar configuração IAP

2. **Timeouts de Rede**
   - Ajustar timeouts do CloudRunClient
   - Verificar configuração do Circuit Breaker
   - Monitorar latência da rede

3. **Problemas de Cache**
   - Limpar cache do ParameterEngine
   - Verificar configurações de timeout
   - Monitorar uso de memória

### Comandos de Diagnóstico

```bash
# Verificar logs das Cloud Functions
gcloud functions logs read analysis-orchestrator --limit 50

# Verificar logs do Cloud Run
gcloud run services logs read analyzer-service --limit 50

# Testar conectividade
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://cloud-run-url/health
```

## Próximos Passos

1. **Implementar Métricas Avançadas**
   - Dashboard de monitoramento
   - Alertas automáticos
   - Análise de performance

2. **Otimizações de Performance**
   - Cache distribuído
   - Processamento paralelo
   - Otimização de queries

3. **Recursos Adicionais**
   - Análise em lote
   - Webhooks para notificações
   - API de métricas públicas

## Conclusão

A integração Cloud Functions ↔ Cloud Run foi implementada com sucesso, fornecendo:

- ✅ Autenticação segura e robusta
- ✅ Comunicação bidirecional confiável
- ✅ Sistema de parâmetros inteligente e adaptativo
- ✅ Schema de dados otimizado
- ✅ Monitoramento e observabilidade
- ✅ Tratamento de erros e retry automático

O sistema está pronto para produção e pode ser facilmente escalado conforme necessário.