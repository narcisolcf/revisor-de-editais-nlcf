# 🚀 Guia de Deploy - LicitaReview v2.0.0

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Arquitetura de Deploy](#arquitetura-de-deploy)
3. [Ambientes](#ambientes)
4. [Deploy do Backend (Python Analyzer)](#deploy-do-backend-python-analyzer)
5. [Deploy do Frontend](#deploy-do-frontend)
6. [Deploy das Cloud Functions](#deploy-das-cloud-functions)
7. [Configuração de Secrets](#configuração-de-secrets)
8. [Verificação Pós-Deploy](#verificação-pós-deploy)
9. [Rollback](#rollback)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Ferramentas Necessárias

```bash
# Google Cloud SDK
gcloud version

# Firebase CLI
firebase --version

# Node.js 20+
node --version

# Python 3.11+
python3 --version

# Docker (opcional, para testes locais)
docker --version
```

### Permissões GCP Necessárias

- **roles/run.admin** - Cloud Run deployment
- **roles/cloudbuild.builds.editor** - Cloud Build
- **roles/iam.serviceAccountUser** - Service Account usage
- **roles/storage.admin** - GCS buckets
- **roles/aiplatform.user** - Vertex AI
- **roles/datastore.owner** - Firestore

### Configuração Inicial

```bash
# Autenticar no GCP
gcloud auth login
gcloud auth application-default login

# Autenticar no Firebase
firebase login

# Configurar projeto padrão
gcloud config set project YOUR_PROJECT_ID
firebase use YOUR_PROJECT_ID
```

---

## 🏗️ Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD PLATFORM                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Firebase   │    │  Cloud Run   │    │  Vertex AI   │  │
│  │   Hosting    │───▶│   Analyzer   │───▶│   RAG API    │  │
│  │   (Frontend) │    │   (Python)   │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                     │                     │         │
│         │                     │                     │         │
│         ▼                     ▼                     ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Firebase   │    │   Firestore  │    │     GCS      │  │
│  │  Functions   │    │  (Database)  │    │  (Storage)   │  │
│  │    (API)     │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌍 Ambientes

| Ambiente | Descrição | Branch | URL |
|----------|-----------|--------|-----|
| **Development** | Ambiente local | `develop` | `localhost:3000` |
| **Staging** | Testes pré-produção | `staging` | `staging.licitareview.app` |
| **Production** | Produção | `main` | `licitareview.app` |

### Variáveis por Ambiente

#### Production
```bash
export GCP_PROJECT_ID="licitareview-prod"
export GCP_LOCATION="us-central1"
export ENVIRONMENT="production"
```

#### Staging
```bash
export GCP_PROJECT_ID="licitareview-staging"
export GCP_LOCATION="us-central1"
export ENVIRONMENT="staging"
```

---

## 🐍 Deploy do Backend (Python Analyzer)

### Método 1: Deploy Automático (Recomendado)

```bash
cd services/analyzer

# Production
./deploy.sh

# Staging
./deploy-staging.sh
```

### Método 2: Deploy Manual via Cloud Build

```bash
# Build e deploy via Cloud Build
gcloud builds submit \
  --config=services/analyzer/cloudbuild.yaml \
  --project=YOUR_PROJECT_ID
```

### Método 3: Deploy Direto

```bash
# Build Docker image localmente
cd services/analyzer
docker build -t gcr.io/YOUR_PROJECT_ID/analyzer-rag:v2.0.0 .

# Push para Container Registry
docker push gcr.io/YOUR_PROJECT_ID/analyzer-rag:v2.0.0

# Deploy no Cloud Run
gcloud run deploy analyzer-rag \
  --image=gcr.io/YOUR_PROJECT_ID/analyzer-rag:v2.0.0 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=4Gi \
  --cpu=2 \
  --max-instances=20 \
  --min-instances=1
```

### Configuração de Variáveis de Ambiente

As variáveis são configuradas automaticamente pelo `cloudbuild.yaml`:

```yaml
GCP_PROJECT_ID: ${PROJECT_ID}
GCP_LOCATION: us-central1
GCS_RAG_BUCKET: ${PROJECT_ID}-rag-corpus
RAG_CHUNK_SIZE: 512
RAG_CHUNK_OVERLAP: 100
RAG_EMBEDDING_MODEL: text-embedding-004
RAG_DEFAULT_MODEL: gemini-2.0-flash-001
RAG_DEFAULT_TEMPERATURE: 0.3
RAG_DEFAULT_TOP_K: 10
REDIS_ENABLED: true
CACHE_TTL_SECONDS: 3600
PYTHONPATH: /app/src
```

### Verificar Deploy

```bash
# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe analyzer-rag \
  --region=us-central1 \
  --format="value(status.url)")

# Testar health check
curl -X GET "${SERVICE_URL}/health"

# Testar análise (exemplo)
curl -X POST "${SERVICE_URL}/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test-001",
    "organization_id": "org-123",
    "content": "Teste de análise"
  }'
```

---

## 🎨 Deploy do Frontend

### Via Firebase Hosting

```bash
# Build do frontend
npm run build

# Deploy para Firebase
firebase deploy --only hosting

# Deploy específico para produção
firebase deploy --only hosting --project=licitareview-prod

# Deploy para staging
firebase deploy --only hosting --project=licitareview-staging
```

### Configuração do Build

O frontend é buildado para o diretório `apps/web/dist` conforme especificado no `firebase.json`:

```json
{
  "hosting": {
    "public": "apps/web/dist",
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## ⚡ Deploy das Cloud Functions

```bash
# Deploy todas as functions
firebase deploy --only functions

# Deploy function específica
firebase deploy --only functions:api

# Deploy para staging
firebase deploy --only functions --project=licitareview-staging
```

### Configuração das Functions

Localização: `services/api/`
Runtime: Node.js 18
Region: us-central1

---

## 🔐 Configuração de Secrets

### Google Secret Manager

```bash
# Criar secret para API key
echo -n "YOUR_API_KEY" | gcloud secrets create openai-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --project=YOUR_PROJECT_ID

# Conceder acesso ao service account
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:analyzer-rag@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID

# Listar secrets
gcloud secrets list --project=YOUR_PROJECT_ID
```

### Secrets Necessários

- `openai-api-key` - API key da OpenAI (se usar)
- `firebase-admin-key` - Service account key do Firebase
- `database-url` - URL de conexão do banco de dados (se aplicável)

---

## ✅ Verificação Pós-Deploy

### Checklist de Verificação

```bash
# 1. Health check do backend
curl https://analyzer-rag-HASH-uc.a.run.app/health

# 2. Frontend carregando
curl https://licitareview.app

# 3. Cloud Functions respondendo
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/health

# 4. Logs do Cloud Run
gcloud logs tail --project=YOUR_PROJECT_ID --service=analyzer-rag --limit=50

# 5. Métricas no Console
# Acessar: https://console.cloud.google.com/run/detail/us-central1/analyzer-rag

# 6. Testes E2E (opcional)
npm run test:e2e:prod
```

### Smoke Tests

```bash
# Executar suite de smoke tests
./scripts/smoke-tests.sh production
```

---

## 🔄 Rollback

### Rollback do Cloud Run

```bash
# Listar revisões
gcloud run revisions list \
  --service=analyzer-rag \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID

# Fazer rollback para revisão anterior
gcloud run services update-traffic analyzer-rag \
  --to-revisions=analyzer-rag-00042-xyx=100 \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID
```

### Rollback do Frontend

```bash
# Ver releases do Firebase Hosting
firebase hosting:releases:list --project=YOUR_PROJECT_ID

# Rollback para release anterior
firebase hosting:rollback --project=YOUR_PROJECT_ID
```

### Rollback das Cloud Functions

```bash
# Functions não têm rollback automático, redeploye a versão anterior do código
git checkout PREVIOUS_TAG
firebase deploy --only functions --project=YOUR_PROJECT_ID
```

---

## 🔍 Troubleshooting

### Backend não responde

```bash
# Verificar logs
gcloud logs tail --project=YOUR_PROJECT_ID --service=analyzer-rag --limit=100

# Verificar status do serviço
gcloud run services describe analyzer-rag \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID

# Testar localmente
docker run -p 8080:8080 gcr.io/YOUR_PROJECT_ID/analyzer-rag:v2.0.0
curl http://localhost:8080/health
```

### Build falha

```bash
# Ver logs do Cloud Build
gcloud builds list --project=YOUR_PROJECT_ID --limit=5

# Ver detalhes de um build específico
gcloud builds log BUILD_ID --project=YOUR_PROJECT_ID

# Testar build localmente
cd services/analyzer
docker build -t analyzer-test .
```

### Problemas de permissão

```bash
# Verificar permissões do service account
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:analyzer-rag@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Adicionar permissão faltante
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:analyzer-rag@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/ROLE_NAME"
```

### Custos elevados

```bash
# Monitorar uso
gcloud run services describe analyzer-rag \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID \
  --format="get(status.trafficUpdatedTime)"

# Ajustar configuração de escalabilidade
gcloud run services update analyzer-rag \
  --max-instances=10 \
  --min-instances=0 \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID
```

---

## 📊 Monitoramento

### Cloud Monitoring

- **Latência**: P50, P95, P99
- **Erros**: Taxa de erro 4xx/5xx
- **Throughput**: Requests/segundo
- **Recursos**: CPU, Memory, Network

### Alertas Recomendados

1. **Error rate > 5%** nos últimos 5 minutos
2. **Latency P95 > 2s** nos últimos 10 minutos
3. **Disponibilidade < 99.5%** no período de 1 hora
4. **Cold starts > 10** no período de 5 minutos

---

## 🔗 Links Úteis

- [Cloud Run Dashboard](https://console.cloud.google.com/run)
- [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
- [Firebase Console](https://console.firebase.google.com)
- [Vertex AI Dashboard](https://console.cloud.google.com/vertex-ai)
- [Cloud Monitoring](https://console.cloud.google.com/monitoring)

---

## 📝 Notas de Versão

### v2.0.0 (21/11/2025)
- ✅ Testes Python: 100% pass rate (14/14)
- ✅ Coverage: 16% (críticos 60-83%)
- ✅ E2E tests: 50+ prontos
- ✅ CI/CD: GitHub Actions
- ✅ Documentação completa
- ✅ RAG integration com Vertex AI
- ✅ Multi-environment support

---

**Última atualização**: 21/11/2025
**Versão do documento**: 1.0.0
**Mantido por**: DevOps Team
