#!/bin/bash

# Rollback script for LicitaReview Analyzer Service
# Version: 2.0.0

set -e

echo "🔄 Starting rollback of Analyzer Service..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-licitareview-prod}"
REGION="${GCP_LOCATION:-us-central1}"
SERVICE_NAME="analyzer-rag"

# Parse arguments
REVISION=""
if [ -n "$1" ]; then
    REVISION="$1"
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"

# List revisions if no revision specified
if [ -z "$REVISION" ]; then
    echo -e "${YELLOW}📋 Available revisions:${NC}"
    gcloud run revisions list \
        --service="$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="table(REVISION,ACTIVE,SERVICE,DEPLOYED)"

    echo ""
    echo -e "${YELLOW}Please specify a revision to rollback to:${NC}"
    echo "Usage: $0 <revision-name>"
    echo "Example: $0 analyzer-rag-00042-xyz"
    exit 0
fi

# Confirm rollback
echo -e "${YELLOW}⚠️  WARNING: You are about to rollback to revision: ${REVISION}${NC}"
read -p "Are you sure? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${RED}Rollback cancelled${NC}"
    exit 1
fi

# Perform rollback
echo -e "${YELLOW}🔄 Rolling back to revision ${REVISION}...${NC}"
gcloud run services update-traffic "$SERVICE_NAME" \
    --to-revisions="${REVISION}=100" \
    --region="$REGION" \
    --project="$PROJECT_ID"

# Wait for traffic to shift
echo -e "${YELLOW}⏳ Waiting for traffic to shift...${NC}"
sleep 5

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
if curl -sf "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Service is healthy after rollback!${NC}"
else
    echo -e "${RED}⚠️  Warning: Health check failed after rollback${NC}"
    echo "Please check logs: gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME"
    exit 1
fi

# Display rollback info
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             🎉 Rollback Successful! 🎉                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Rollback Information:${NC}"
echo "  📍 URL: $SERVICE_URL"
echo "  🔄 Active Revision: $REVISION"
echo "  🌍 Region: $REGION"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Monitor the service for any issues"
echo "  2. Check logs: gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME"
echo "  3. Investigate the issue with the previous deployment"
echo ""
echo -e "${GREEN}✅ Rollback complete!${NC}"
