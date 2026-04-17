#!/bin/bash
# ========================================
# MeFit Tools - Show Status
# ========================================
# Shows status of all or specific MeFit services.
#
# Usage:
#   ./scripts/status.sh [project]
#
# Arguments:
#   project   - Project name (optional, shows all if not specified)
#
# Examples:
#   ./scripts/status.sh
#   ./scripts/status.sh backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

PROJECT="${1:-}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MeFit Services Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get project description (Bash 3.2 compatible - no associative arrays)
get_project_desc() {
    case "$1" in
        backend) echo "Django Backend" ;;
        voice-api) echo "Voice API (FastAPI)" ;;
        scraping) echo "Scraping Worker" ;;
        analysis-resume) echo "Resume Analysis Worker" ;;
        interview-analysis-report) echo "Interview Analysis Worker" ;;
        *) echo "$1" ;;
    esac
}

if [ -z "$PROJECT" ]; then
    # Show status for all projects
    for proj in backend voice-api scraping analysis-resume interview-analysis-report; do
        echo -e "${YELLOW}$(get_project_desc $proj):${NC}"
        if [ -f "$PROJECT_ROOT/$proj/docker-compose.yml" ]; then
            cd "$PROJECT_ROOT/$proj" && docker-compose ps 2>/dev/null || echo -e "  ${RED}Not running${NC}"
        else
            echo -e "  ${RED}docker-compose.yml not found${NC}"
        fi
        echo ""
    done
else
    # Show status for specific project
    if [ -f "$PROJECT_ROOT/$PROJECT/docker-compose.yml" ]; then
        echo -e "${YELLOW}$(get_project_desc $PROJECT):${NC}"
        cd "$PROJECT_ROOT/$PROJECT" && docker-compose ps 2>/dev/null || echo -e "  ${RED}Not running${NC}"
    else
        echo -e "${RED}Project '$PROJECT' not found or no docker-compose.yml${NC}"
    fi
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo ""
echo "Access points:"
echo -e "  ${CYAN}Backend API:${NC}     http://localhost:8000"
echo -e "  ${CYAN}Flower (Celery):${NC} http://localhost:5555/admin/flower"
echo -e "  ${CYAN}S3 Mock:${NC}         http://localhost:9090"
echo -e "  ${CYAN}Voice API:${NC}       http://localhost:8001"
echo ""
echo -e "${BLUE}========================================${NC}"
