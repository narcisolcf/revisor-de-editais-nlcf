# 🚀 Deployment Guide - Analyzer Service v1.1.0 with RAG

## Pre-requisites

1. **GCP Project Setup**
   - Project ID: `licitareview-prod` (or your project)
   - Billing enabled
   - Owner or Editor permissions

2. **Local Tools**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash

   # Authenticate
   gcloud auth login
   gcloud auth application-default login

   # Set project
   gcloud config set project licitareview-prod
   ```

3. **Environment Variables**
   ```bash
   export GCP_PROJECT_ID=licitareview-prod
   export GCP_LOCATION=us-central1
   ```

## Quick Deploy

### Option 1: Automated Deployment (Recommended)

```bash
cd services/analyzer
./deploy.sh
```

This script will:
- ✅ Enable required GCP APIs
- ✅ Create service account with proper permissions
- ✅ Create GCS bucket for RAG corpus
- ✅ Build Docker image
- ✅ Deploy to Cloud Run
- ✅ Test health endpoint

### Option 2: Manual Deployment

#### Step 1: Setup GCP

```bash
# Enable APIs
gcloud services enable \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com

# Create service account
gcloud iam service-accounts create analyzer-rag \
    --display-name="Analyzer RAG Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding licitareview-prod \
    --member="serviceAccount:analyzer-rag@licitareview-prod.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding licitareview-prod \
    --member="serviceAccount:analyzer-rag@licitareview-prod.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create GCS bucket
gsutil mb -p licitareview-prod -l us-central1 gs://licitareview-prod-rag-corpus
```

#### Step 2: Build and Deploy

```bash
# From project root
gcloud builds submit \
    --config=services/analyzer/cloudbuild.yaml \
    --project=licitareview-prod
```

#### Step 3: Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe analyzer-rag \
    --region=us-central1 \
    --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health

# Expected response:
# {"status":"healthy","service":"analyzer","version":"1.1.0"}
```

## Post-Deployment

### 1. Create Knowledge Bases

```python
from src.services.knowledge_base_manager import KnowledgeBaseManager

kb_manager = KnowledgeBaseManager()

# Create org knowledge base
kb = await kb_manager.create_organization_kb(
    org_id="your-org-id",
    org_config=your_org_config
)
```

### 2. Sync Documents

```python
# Upload documents to GCS
# They will be automatically imported to RAG corpus
result = await kb_manager.sync_organization_documents("your-org-id")
print(f"Synced {result.documents_added} documents")
```

### 3. Test RAG Queries

```bash
curl -X POST $SERVICE_URL/api/v1/intelligent-query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais são os requisitos de habilitação?",
    "organizationId": "your-org-id",
    "contextType": "private"
  }'
```

## Monitoring

### View Logs

```bash
# Real-time logs
gcloud logs tail --project=licitareview-prod --service=analyzer-rag

# Filter by severity
gcloud logs read --project=licitareview-prod \
    --filter="resource.labels.service_name=analyzer-rag AND severity>=ERROR" \
    --limit=50
```

### Cloud Console

- **Cloud Run**: https://console.cloud.google.com/run/detail/us-central1/analyzer-rag
- **Vertex AI**: https://console.cloud.google.com/vertex-ai/generative/rag
- **Logs**: https://console.cloud.google.com/logs

### Metrics to Monitor

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Latency P95 | <2s | Scale up instances |
| Error Rate | <1% | Check logs |
| Memory Usage | <80% | Increase memory |
| Cache Hit Rate | >60% | Adjust TTL |

## Scaling

### Horizontal Scaling

```bash
gcloud run services update analyzer-rag \
    --region=us-central1 \
    --min-instances=2 \
    --max-instances=50
```

### Vertical Scaling

```bash
gcloud run services update analyzer-rag \
    --region=us-central1 \
    --memory=8Gi \
    --cpu=4
```

## Cost Optimization

### Current Configuration (v1.1.0)

- **Memory**: 4Gi
- **CPU**: 2 vCPU
- **Min Instances**: 1
- **Max Instances**: 20

### Expected Costs

**For 100 Organizations, 10K Documents:**

| Component | Monthly Cost |
|-----------|-------------|
| Cloud Run | ~$50 |
| Vertex AI RAG | ~$8 |
| Cloud Storage | ~$2 |
| **Total** | **~$60/month** |

## Rollback

```bash
# List revisions
gcloud run revisions list --service=analyzer-rag --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic analyzer-rag \
    --region=us-central1 \
    --to-revisions=REVISION_NAME=100
```

## Troubleshooting

### Issue: Service not starting

**Check logs:**
```bash
gcloud logs read --service=analyzer-rag --limit=100
```

**Common causes:**
- Missing environment variables
- Service account permissions
- Insufficient memory

### Issue: RAG queries failing

**Check Vertex AI status:**
```bash
gcloud ai operations list --region=us-central1
```

**Verify corpus exists:**
```python
from src.services.rag_service import RAGService
rag = RAGService()
corpus = await rag.get_corpus("your-corpus-id")
```

### Issue: High latency

**Enable caching:**
```bash
gcloud run services update analyzer-rag \
    --region=us-central1 \
    --set-env-vars="REDIS_ENABLED=true"
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'services/analyzer/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: licitareview-prod

      - name: Deploy
        run: |
          cd services/analyzer
          ./deploy.sh
```

## Support

- 📧 Email: dev@revisor-de-editais.com
- 📚 Docs: See README_RAG.md
- 🐛 Issues: GitHub Issues

---

**Version**: 1.1.0
**Last Updated**: 2025-11-20
**Status**: ✅ Production Ready
