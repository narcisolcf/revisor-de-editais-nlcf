# Script de Setup GCP para Vertex AI RAG
# Execute este script após autenticar no gcloud

set -e

echo "🚀 Configurando Google Cloud Platform para Vertex AI RAG..."

# 1. Habilitar APIs necessárias
echo "📦 Habilitando APIs do GCP..."
gcloud services enable aiplatform.googleapis.com --project=licitareview-prod
gcloud services enable storage-component.googleapis.com --project=licitareview-prod
gcloud services enable firestore.googleapis.com --project=licitareview-prod

# 2. Criar bucket GCS para RAG corpus
echo "☁️ Criando bucket GCS..."
gsutil mb -p licitareview-prod -l us-central1 gs://licitareview-rag-corpus || echo "Bucket já existe"

# 3. Configurar permissões
echo "🔐 Configurando permissões..."
gcloud projects add-iam-policy-binding licitareview-prod \
    --member="serviceAccount:licitareview-rag-sa@licitareview-prod.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user" || echo "Service account já configurada"

echo "✅ Setup GCP concluído!"
echo ""
echo "Próximos passos:"
echo "1. export GOOGLE_APPLICATION_CREDENTIALS='credentials/licitareview-prod-b6b067fdd7e4.json'"
echo "2. cd services/analyzer && pip install -r requirements.txt"
