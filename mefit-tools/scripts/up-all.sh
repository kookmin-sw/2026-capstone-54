#!/bin/bash
# ========================================
# MeFit Tools - Up All Services
# ========================================
# Starts all MeFit platform services.
#
# Usage:
#   ./scripts/up-all.sh

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
echo -e "${BLUE}  MeFit Tools - Starting All Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create network first
echo -e "${GREEN}Creating mefit-local network...${NC}"
docker network create mefit-local 2>/dev/null || echo "Network 'mefit-local' already exists"
echo ""

# Start backend first (includes postgres, redis, celery)
echo -e "${YELLOW}1. Starting backend (webapp, postgres, redis, celery-worker, celery-beat, s3mock, flower)...${NC}"
cd "$PROJECT_ROOT/backend" && docker-compose up -d
echo ""

# Wait for postgres and redis to be healthy
echo -e "${YELLOW}Waiting for backend services to be ready...${NC}"
sleep 5

# Start other services
echo -e "${YELLOW}2. Starting voice-api...${NC}"
cd "$PROJECT_ROOT/voice-api" && docker-compose up -d
echo ""

echo -e "${YELLOW}3. Starting scraping worker...${NC}"
cd "$PROJECT_ROOT/scraping" && docker-compose up -d
echo ""

echo -e "${YELLOW}4. Starting analysis-resume worker...${NC}"
cd "$PROJECT_ROOT/analysis-resume" && docker-compose up -d
echo ""

echo -e "${YELLOW}5. Starting interview-analysis-report worker...${NC}"
cd "$PROJECT_ROOT/interview-analysis-report" && docker-compose up -d
echo ""

echo -e "${YELLOW}6. Starting analysis-video (LocalStack)...${NC}"
cd "$PROJECT_ROOT/analysis-video/local" && docker-compose up -d
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Access points:"
echo "  - Backend API:     http://localhost:8000"
echo "  - Flower (Celery): http://localhost:5555/admin/flower"
echo "  - S3 Mock:         http://localhost:9090"
echo "  - Voice API:       http://localhost:8001"
echo "  - LocalStack:      http://localhost:4566"
echo -e "${GREEN}========================================${NC}"
echo ""

# Show status
"$SCRIPT_DIR/status.sh"
