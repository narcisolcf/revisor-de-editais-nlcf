#!/bin/bash

# Run End-to-End Integration Tests
# Version: 1.1.0

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   End-to-End Integration Tests Runner     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if rich is installed
if ! python -c "import rich" 2>/dev/null; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    pip install rich requests --quiet
fi

# Parse arguments
ENV="${1:-local}"
URL="${2:-}"

echo -e "${YELLOW}Environment:${NC} $ENV"

# Run tests based on environment
case $ENV in
    local)
        echo -e "${YELLOW}Testing against local server${NC}"
        echo -e "${YELLOW}Make sure server is running: uvicorn src.main:app --port 8080${NC}"
        echo ""
        python tests/integration_test_e2e.py --env local
        ;;

    staging)
        echo -e "${YELLOW}Testing against STAGING environment${NC}"

        if [ -z "$URL" ]; then
            # Get staging URL from gcloud
            echo -e "${YELLOW}Fetching staging URL...${NC}"
            URL=$(gcloud run services describe analyzer-rag-staging \
                --region=us-central1 \
                --format="value(status.url)" 2>/dev/null || echo "")

            if [ -z "$URL" ]; then
                echo -e "${RED}❌ Could not get staging URL. Provide URL as second argument.${NC}"
                echo "Usage: $0 staging <URL>"
                exit 1
            fi
        fi

        echo -e "${YELLOW}Staging URL:${NC} $URL"
        echo ""
        python tests/integration_test_e2e.py --env staging --url "$URL"
        ;;

    production)
        echo -e "${RED}⚠️  Testing against PRODUCTION${NC}"
        echo -e "${YELLOW}Are you sure? (y/N)${NC}"
        read -r response

        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi

        if [ -z "$URL" ]; then
            # Get production URL from gcloud
            echo -e "${YELLOW}Fetching production URL...${NC}"
            URL=$(gcloud run services describe analyzer-rag \
                --region=us-central1 \
                --format="value(status.url)" 2>/dev/null || echo "")

            if [ -z "$URL" ]; then
                echo -e "${RED}❌ Could not get production URL. Provide URL as second argument.${NC}"
                echo "Usage: $0 production <URL>"
                exit 1
            fi
        fi

        echo -e "${YELLOW}Production URL:${NC} $URL"
        echo ""
        python tests/integration_test_e2e.py --env production --url "$URL"
        ;;

    *)
        echo -e "${RED}Invalid environment: $ENV${NC}"
        echo "Usage: $0 {local|staging|production} [URL]"
        exit 1
        ;;
esac

# Exit with test result code
exit $?
