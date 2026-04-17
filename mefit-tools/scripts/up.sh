#!/bin/bash
# ========================================
# MeFit Tools - Up Single Project
# ========================================
# Starts a specific MeFit project.
#
# Usage:
#   ./scripts/up.sh <project> [service]
#
# Arguments:
#   project   - Project name (backend, voice-api, scraping, analysis-resume, interview-analysis-report)
#   service   - Optional: specific service to start
#
# Examples:
#   ./scripts/up.sh backend
#   ./scripts/up.sh backend webapp
#   ./scripts/up.sh voice-api

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

# Valid projects
VALID_PROJECTS=(
    "backend"
    "voice-api"
    "scraping"
    "analysis-resume"
    "interview-analysis-report"
)

# Check if project is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project is required${NC}"
    echo ""
    echo "Usage: ./scripts/up.sh <project> [service]"
    echo ""
    echo "Available projects:"
    for p in "${VALID_PROJECTS[@]}"; do
        echo "  - $p"
    done
    exit 1
fi

PROJECT="$1"
SERVICE="${2:-}"

# Validate project
VALID=false
for p in "${VALID_PROJECTS[@]}"; do
    if [ "$p" = "$PROJECT" ]; then
        VALID=true
        break
    fi
done

if [ "$VALID" = false ]; then
    echo -e "${RED}Error: Invalid project '$PROJECT'${NC}"
    echo ""
    echo "Available projects:"
    for p in "${VALID_PROJECTS[@]}"; do
        echo "  - $p"
    done
    exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_ROOT/$PROJECT" ]; then
    echo -e "${RED}Error: Project directory '$PROJECT' not found${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "$PROJECT_ROOT/$PROJECT/docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found in '$PROJECT'${NC}"
    exit 1
fi

# Create network if needed
echo -e "${GREEN}Ensuring mefit-local network exists...${NC}"
docker network create mefit-local 2>/dev/null || true
echo ""

# Start the project
echo -e "${GREEN}Starting $PROJECT${NC}${SERVICE:+, service: $SERVICE}${NC}..."
cd "$PROJECT_ROOT/$PROJECT" && docker-compose up -d $SERVICE
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}$PROJECT started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Show status
"$SCRIPT_DIR/status.sh" "$PROJECT"
