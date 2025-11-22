#!/bin/bash

# K6 Load Testing Runner
# Version: 1.0.0

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8080}"
TEST_TYPE="${1:-smoke}"

echo -e "${YELLOW}🚀 K6 Load Testing Runner${NC}"
echo -e "${YELLOW}=========================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Test Type: $TEST_TYPE"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo ""
    echo "Install k6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
    echo "           echo \"deb https://dl.k6.io/deb stable main\" | sudo tee /etc/apt/sources.list.d/k6.list"
    echo "           sudo apt-get update"
    echo "           sudo apt-get install k6"
    echo "  Docker:  docker pull grafana/k6"
    exit 1
fi

# Create reports directory
mkdir -p reports

case "$TEST_TYPE" in
  smoke)
    echo -e "${GREEN}Running smoke test (minimal load)...${NC}"
    k6 run --env BASE_URL="$BASE_URL" smoke-test.js
    ;;

  load)
    echo -e "${GREEN}Running load test (normal load)...${NC}"
    k6 run --env BASE_URL="$BASE_URL" load-test.js
    ;;

  stress)
    echo -e "${YELLOW}Running stress test (finding limits)...${NC}"
    echo -e "${RED}⚠️  Warning: This test may impact service availability${NC}"
    read -p "Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Stress test cancelled"
        exit 0
    fi
    k6 run --env BASE_URL="$BASE_URL" stress-test.js
    ;;

  spike)
    echo -e "${YELLOW}Running spike test (sudden traffic bursts)...${NC}"
    k6 run --env BASE_URL="$BASE_URL" spike-test.js
    ;;

  all)
    echo -e "${GREEN}Running all tests sequentially...${NC}"
    echo ""

    echo "1/3: Smoke Test"
    k6 run --env BASE_URL="$BASE_URL" smoke-test.js
    sleep 5

    echo ""
    echo "2/3: Load Test"
    k6 run --env BASE_URL="$BASE_URL" load-test.js
    sleep 10

    echo ""
    echo "3/3: Stress Test"
    k6 run --env BASE_URL="$BASE_URL" stress-test.js
    ;;

  *)
    echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
    echo ""
    echo "Usage: $0 [smoke|load|stress|spike|all]"
    echo ""
    echo "Test Types:"
    echo "  smoke   - Minimal load (1 user)"
    echo "  load    - Normal load (10-20 users)"
    echo "  stress  - Find breaking point (up to 200 users)"
    echo "  spike   - Sudden traffic bursts"
    echo "  all     - Run all tests sequentially"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               ✅ Test Completed Successfully!                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Reports saved to: reports/"
echo ""
echo "Next steps:"
echo "  - Review test results in reports/ directory"
echo "  - Check for performance bottlenecks"
echo "  - Compare with baseline metrics"
echo "  - Optimize identified issues"
echo ""
