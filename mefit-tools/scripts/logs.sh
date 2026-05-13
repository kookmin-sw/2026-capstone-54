#!/bin/bash
# ========================================
# MeFit Tools - Show Logs
# ========================================
# Shows logs for a specific service.
#
# Usage:
#   ./scripts/logs.sh <project> [service] [flags]
#
# Arguments:
#   project   - Project name (backend, voice-api, scraping, analysis-resume, interview-analysis-report)
#   service   - Service name (optional, shows all if not specified)
#   flags     - Additional docker-compose logs flags (e.g., -f, --tail=50)
#
# Examples:
#   ./scripts/logs.sh backend
#   ./scripts/logs.sh backend webapp
#   ./scripts/logs.sh backend webapp -f
#   ./scripts/logs.sh scraping scraper-worker --tail=50 -f

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
    echo "Usage: ./scripts/logs.sh <project> [service] [flags]"
    echo ""
    echo "Available projects:"
    for p in "${VALID_PROJECTS[@]}"; do
        echo "  - $p"
    done
    exit 1
fi

PROJECT="$1"
SERVICE="$2"
FLAGS="${@:3}"

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

# Show logs
echo -e "${BLUE}Showing logs for $PROJECT${SERVICE:+, service: $SERVICE}${NC}..."
echo ""

cd "$PROJECT_ROOT/$PROJECT" && docker-compose logs $SERVICE $FLAGS
