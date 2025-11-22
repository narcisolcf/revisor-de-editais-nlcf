#!/bin/bash

# Deploy LicitaReview Analyzer Service with Vertex AI RAG
# Version: 2.0.0

set -e

echo "🚀 Starting deployment of Analyzer Service v2.0.0 with RAG..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-licitareview-prod}"
REGION="${GCP_LOCATION:-us-central1}"
SERVICE_NAME="analyzer-rag"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required GCP APIs...${NC}"
gcloud services enable \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    firestore.googleapis.com \
    --project="$PROJECT_ID"

# Create service account if it doesn't exist
echo -e "${YELLOW}👤 Checking service account...${NC}"
SERVICE_ACCOUNT="analyzer-rag@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" &>/dev/null; then
    echo "Creating service account..."
    gcloud iam service-accounts create analyzer-rag \
        --display-name="Analyzer RAG Service Account" \
        --project="$PROJECT_ID"

    # Grant necessary permissions
    echo "Granting permissions..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/aiplatform.user"

    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/storage.objectAdmin"

    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/datastore.user"
else
    echo -e "${GREEN}✓ Service account already exists${NC}"
fi

# Create GCS bucket for RAG corpus
echo -e "${YELLOW}🪣 Checking GCS bucket...${NC}"
BUCKET_NAME="${PROJECT_ID}-rag-corpus"

if ! gsutil ls "gs://$BUCKET_NAME" &>/dev/null; then
    echo "Creating GCS bucket..."
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME"

    # Set lifecycle policy to delete old files after 90 days
    cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
    gsutil lifecycle set /tmp/lifecycle.json "gs://$BUCKET_NAME"
    rm /tmp/lifecycle.json
else
    echo -e "${GREEN}✓ GCS bucket already exists${NC}"
fi

# Submit build to Cloud Build
echo -e "${YELLOW}🏗️  Building and deploying to Cloud Run...${NC}"
gcloud builds submit \
    --config=services/analyzer/cloudbuild.yaml \
    --project="$PROJECT_ID" \
    ../..

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to stabilize...${NC}"
sleep 10

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
if curl -sf "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Service is healthy!${NC}"
else
    echo -e "${RED}⚠️  Warning: Health check failed${NC}"
fi

# Display deployment info
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 Deployment Successful! 🎉                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Service Information:${NC}"
echo "  📍 URL: $SERVICE_URL"
echo "  🆔 Service: $SERVICE_NAME"
echo "  🌍 Region: $REGION"
echo "  📦 Version: v2.0.0"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test the service:"
echo "     curl ${SERVICE_URL}/health"
echo ""
echo "  2. View logs:"
echo "     gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME"
echo ""
echo "  3. Monitor the service:"
echo "     https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
