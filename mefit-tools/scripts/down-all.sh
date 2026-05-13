#!/bin/bash
# ========================================
# MeFit Tools - Down All Services
# ========================================
# Stops all MeFit platform services.
#
# Usage:
#   ./scripts/down-all.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MeFit Tools - Stopping All Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop in reverse order of startup
echo -e "${YELLOW}1. Stopping analysis-video (LocalStack)...${NC}"
cd "$PROJECT_ROOT/analysis-video/local" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${YELLOW}2. Stopping interview-analysis-report...${NC}"
cd "$PROJECT_ROOT/interview-analysis-report" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${YELLOW}3. Stopping analysis-resume...${NC}"
cd "$PROJECT_ROOT/analysis-resume" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${YELLOW}4. Stopping scraping...${NC}"
cd "$PROJECT_ROOT/scraping" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${YELLOW}5. Stopping voice-api...${NC}"
cd "$PROJECT_ROOT/voice-api" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${YELLOW}6. Stopping backend...${NC}"
cd "$PROJECT_ROOT/backend" && docker-compose down 2>/dev/null || true
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services stopped!${NC}"
echo -e "${GREEN}========================================${NC}"
