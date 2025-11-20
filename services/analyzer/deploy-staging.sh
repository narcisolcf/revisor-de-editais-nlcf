#!/bin/bash

# Deploy LicitaReview Analyzer Service to STAGING
# Version: 1.1.0

set -e

echo "🚀 Starting STAGING deployment of Analyzer Service v1.1.0..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-licitareview-staging}"
REGION="${GCP_LOCATION:-us-central1}"
SERVICE_NAME="analyzer-rag-staging"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       STAGING DEPLOYMENT CONFIGURATION        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}Environment:${NC} Staging"
echo -e "${YELLOW}Project ID:${NC} $PROJECT_ID"
echo -e "${YELLOW}Region:${NC} $REGION"
echo -e "${YELLOW}Service Name:${NC} $SERVICE_NAME"
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
SERVICE_ACCOUNT="analyzer-rag-staging@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" &>/dev/null; then
    echo "Creating staging service account..."
    gcloud iam service-accounts create analyzer-rag-staging \
        --display-name="Analyzer RAG Staging Service Account" \
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

# Create GCS bucket for staging
echo -e "${YELLOW}🪣 Checking GCS bucket for staging...${NC}"
BUCKET_NAME="${PROJECT_ID}-rag-corpus"

if ! gsutil ls "gs://$BUCKET_NAME" &>/dev/null; then
    echo "Creating staging GCS bucket..."
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME"

    # Set lifecycle policy
    cat > /tmp/lifecycle-staging.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
    gsutil lifecycle set /tmp/lifecycle-staging.json "gs://$BUCKET_NAME"
    rm /tmp/lifecycle-staging.json
else
    echo -e "${GREEN}✓ GCS bucket already exists${NC}"
fi

# Submit build to Cloud Build
echo -e "${YELLOW}🏗️  Building and deploying to Cloud Run (Staging)...${NC}"
gcloud builds submit \
    --config=services/analyzer/cloudbuild.staging.yaml \
    --project="$PROJECT_ID" \
    ../..

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to stabilize...${NC}"
sleep 5

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
sleep 3
if curl -sf "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Service is healthy!${NC}"

    # Get health response
    HEALTH_RESPONSE=$(curl -s "${SERVICE_URL}/health")
    echo -e "${GREEN}Response: ${HEALTH_RESPONSE}${NC}"
else
    echo -e "${RED}⚠️  Warning: Health check failed${NC}"
    echo "Check logs: gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME"
fi

# Display deployment info
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 STAGING Deployment Successful! 🎉               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Service Information:${NC}"
echo -e "  📍 URL: ${BLUE}$SERVICE_URL${NC}"
echo -e "  🆔 Service: ${SERVICE_NAME}"
echo -e "  🌍 Region: ${REGION}"
echo -e "  📦 Version: v1.1.0"
echo -e "  🏷️  Environment: ${BLUE}STAGING${NC}"
echo ""
echo -e "${YELLOW}Resource Limits (Staging):${NC}"
echo -e "  💾 Memory: 2Gi"
echo -e "  🖥️  CPU: 1 vCPU"
echo -e "  📊 Max Instances: 5"
echo -e "  ⏱️  Timeout: 180s"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Run integration tests:"
echo -e "     ${BLUE}curl ${SERVICE_URL}/health${NC}"
echo -e "     ${BLUE}curl -X POST ${SERVICE_URL}/api/v1/analyze${NC}"
echo ""
echo -e "  2. View logs:"
echo -e "     ${BLUE}gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME${NC}"
echo ""
echo -e "  3. Monitor the service:"
echo -e "     ${BLUE}https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}${NC}"
echo ""
echo -e "  4. Test RAG functionality:"
echo -e "     ${BLUE}# Create a test document and run analysis${NC}"
echo ""
echo -e "${GREEN}✅ Staging deployment complete!${NC}"
echo -e "${YELLOW}⚠️  Remember: This is STAGING. Do not use production data.${NC}"
