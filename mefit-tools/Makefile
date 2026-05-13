#!/bin/bash
# ========================================
# MeFit Tools - Docker Compose Integration
# ========================================
#
# Local development convenience tool for managing
# all MeFit platform services via docker-compose.
#
# Usage:
#   make help          Show this help message
#   make up-all        Start all services
#   make down-all      Stop all services
#   make restart-all   Restart all services
#   make status        Show status of all services
#   make logs          Show logs (use LOGS_PROJECT and LOGS_SERVICE)
#   make up            Start specific project
#   make down          Stop specific project
#
# Examples:
#   make up-all                           # Start everything
#   make up PROJECT=backend               # Start only backend
#   make up PROJECT=voice-api SERVICE=voice-api
#   make logs PROJECT=backend SERVICE=webapp
#   make logs PROJECT=scraping SERVICE=scraper-worker -f
#
# Available Projects:
#   backend, voice-api, scraping, analysis-resume, interview-analysis-report, frontend
#
# ========================================

# Project root directory (parent of mefit-tools)
PROJECT_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)
TOOLS_DIR := $(PROJECT_ROOT)/mefit-tools
SCRIPTS_DIR := $(TOOLS_DIR)/scripts
FRONTEND_LOG_FILE := $(TOOLS_DIR)/frontend-dev.log

# Default values
PROJECT ?=
SERVICE ?=
LOGS_SERVICE ?=
DOCKER_COMPOSE := docker-compose
DOCKER := docker

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# ========================================
# Help
# ========================================

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)  MeFit Tools - Docker Compose Integration$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo ""
	@echo "Usage: $(GREEN)make <target> [PROJECT=<project>] [SERVICE=<service>]$(NC)"
	@echo ""
	@echo "$(YELLOW)Global Targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | grep -v "help:" | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  $(GREEN)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Available Projects:$(NC)"
	@echo "  - backend                   Django backend (webapp, postgres, redis, celery, etc.)"
	@echo "  - voice-api                 FastAPI voice service"
	@echo "  - scraping                  Scraping Celery worker"
	@echo "  - analysis-resume           Resume analysis Celery worker"
	@echo "  - interview-analysis-report Interview analysis Celery worker"
	@echo "  - frontend                  React frontend (Vite, bun run dev)"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make up-all                                    # Start all services"
	@echo "  make up PROJECT=backend                        # Start backend only"
	@echo "  make logs PROJECT=backend SERVICE=webapp       # View webapp logs"
	@echo "  make status PROJECT=voice-api                  # Check voice-api status"
	@echo "  make gui                                      # Start GUI dashboard (http://localhost:8501)"
	@echo "  make gui-local                                # Run GUI locally with Python"
	@echo ""
	@echo "$(BLUE)========================================$(NC)"
	@echo ""

# ========================================
# Network Management
# ========================================

.PHONY: network-create
network-create: ## Create the mefit-local network
	@echo "$(GREEN)Creating mefit-local network...$(NC)"
	@$(DOCKER) network create mefit-local 2>/dev/null || echo "Network 'mefit-local' already exists"

# ========================================
# Frontend (Local)
# ========================================

.PHONY: up-frontend
up-frontend: ## Start frontend (Vite dev server)
	@echo "$(YELLOW)Starting frontend (Vite dev server)...$(NC)"
	@echo "$(BLUE)Access: http://localhost:5173$(NC)"
	@mkdir -p $(TOOLS_DIR)
	@if [ ! -d "$(PROJECT_ROOT)/frontend/node_modules" ]; then \
		echo "$(YELLOW)frontend/node_modules not found. Running bun install...$(NC)"; \
		cd $(PROJECT_ROOT)/frontend && bun install; \
	fi
	@cd $(PROJECT_ROOT)/frontend && nohup bun run dev >> "$(FRONTEND_LOG_FILE)" 2>&1 &
	@echo "$(GREEN)Frontend started!$(NC)"
	@sleep 2
	@lsof -i TCP:5173 -sTCP:LISTEN >/dev/null 2>&1 && echo "Frontend is running on http://localhost:5173" || echo "$(RED)Warning: Frontend may not have started properly. Check logs with 'make logs-frontend'$(NC)"

.PHONY: down-frontend
down-frontend: ## Stop frontend
	@echo "$(YELLOW)Stopping frontend...$(NC)"
	@pkill -f "vite" 2>/dev/null || true
	@pkill -f "bun run dev" 2>/dev/null || true
	@echo "$(GREEN)Frontend stopped!$(NC)"

.PHONY: restart-frontend
restart-frontend: down-frontend up-frontend ## Restart frontend

.PHONY: status-frontend
status-frontend: ## Check frontend status
	@lsof -i TCP:5173 -sTCP:LISTEN >/dev/null 2>&1 && \
		echo "$(GREEN)Frontend is running on http://localhost:5173$(NC)" || \
		echo "$(YELLOW)Frontend is not running$(NC)"

.PHONY: logs-frontend
logs-frontend: ## Show frontend local dev logs
	@if [ -f "$(FRONTEND_LOG_FILE)" ]; then \
		tail -n 100 -f "$(FRONTEND_LOG_FILE)"; \
	else \
		echo "$(YELLOW)No frontend log file found: $(FRONTEND_LOG_FILE)$(NC)"; \
		echo "Run 'make up-frontend' first."; \
	fi

# ========================================
# All Services
# ========================================

.PHONY: up-all
up-all: network-create up-frontend ## Start all services
	@echo "$(GREEN)Starting all MeFit services...$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Starting backend (webapp, postgres, redis, celery-worker, celery-beat, s3mock, flower)...$(NC)"
	@cd $(PROJECT_ROOT)/backend && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)2. Starting voice-api...$(NC)"
	@cd $(PROJECT_ROOT)/voice-api && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)3. Starting scraping worker...$(NC)"
	@cd $(PROJECT_ROOT)/scraping && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)4. Starting analysis-resume worker...$(NC)"
	@cd $(PROJECT_ROOT)/analysis-resume && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)5. Starting interview-analysis-report worker...$(NC)"
	@cd $(PROJECT_ROOT)/interview-analysis-report && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)6. Starting analysis-video (LocalStack)...$(NC)"
	@cd $(PROJECT_ROOT)/analysis-video/local && $(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)All services started!$(NC)"
	@echo ""
	@echo "Access points:"
	@echo "  - Frontend:        http://localhost:5173"
	@echo "  - Backend API:     http://localhost:8000"
	@echo "  - Flower (Celery): http://localhost:5555/admin/flower"
	@echo "  - S3 Mock:         http://localhost:9090"
	@echo "  - Voice API:       http://localhost:8001"
	@echo "  - LocalStack:      http://localhost:4566"
	@echo "$(GREEN)========================================$(NC)"
	@make status

.PHONY: down-all
down-all: down-frontend ## Stop all services
	@echo "$(YELLOW)Stopping all MeFit services...$(NC)"
	@echo "$(YELLOW)1. Stopping analysis-video (LocalStack)...$(NC)"
	@cd $(PROJECT_ROOT)/analysis-video/local && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo "$(YELLOW)2. Stopping interview-analysis-report...$(NC)"
	@cd $(PROJECT_ROOT)/interview-analysis-report && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo "$(YELLOW)3. Stopping analysis-resume...$(NC)"
	@cd $(PROJECT_ROOT)/analysis-resume && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo "$(YELLOW)4. Stopping scraping...$(NC)"
	@cd $(PROJECT_ROOT)/scraping && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo "$(YELLOW)5. Stopping voice-api...$(NC)"
	@cd $(PROJECT_ROOT)/voice-api && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo "$(YELLOW)6. Stopping backend...$(NC)"
	@cd $(PROJECT_ROOT)/backend && $(DOCKER_COMPOSE) down 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)All services stopped!$(NC)"

.PHONY: restart-all
restart-all: down-all up-all ## Restart all services

.PHONY: clean-all
clean-all: down-all ## Stop and remove all containers, networks, and volumes
	@echo "$(YELLOW)Cleaning up all containers, networks, and volumes...$(NC)"
	@echo "$(YELLOW)Note: This will remove all persistent data (database, etc.)$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd $(PROJECT_ROOT)/backend && $(DOCKER_COMPOSE) down -v --remove-orphans; \
		cd $(PROJECT_ROOT)/voice-api && $(DOCKER_COMPOSE) down --remove-orphans 2>/dev/null || true; \
		cd $(PROJECT_ROOT)/scraping && $(DOCKER_COMPOSE) down --remove-orphans 2>/dev/null || true; \
		cd $(PROJECT_ROOT)/analysis-resume && $(DOCKER_COMPOSE) down --remove-orphans 2>/dev/null || true; \
		cd $(PROJECT_ROOT)/interview-analysis-report && $(DOCKER_COMPOSE) down --remove-orphans 2>/dev/null || true; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	else \
		echo "Cleanup cancelled."; \
	fi

# ========================================
# Individual Project Control
# ========================================

.PHONY: up
up: network-create ## Start a specific project (use PROJECT=<name>)
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(RED)Error: PROJECT is required.$(NC)"; \
		echo "Usage: make up PROJECT=backend"; \
		echo "Available projects: backend, voice-api, scraping, analysis-resume, interview-analysis-report, frontend"; \
		exit 1; \
	fi
	@if [ "$(PROJECT)" = "frontend" ]; then \
		$(MAKE) up-frontend; \
	else \
		cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) up -d $(SERVICE); \
		make status PROJECT=$(PROJECT); \
	fi

.PHONY: down
down: ## Stop a specific project (use PROJECT=<name>)
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(RED)Error: PROJECT is required.$(NC)"; \
		echo "Usage: make down PROJECT=backend"; \
		echo "Available projects: backend, voice-api, scraping, analysis-resume, interview-analysis-report, frontend"; \
		exit 1; \
	fi
	@if [ "$(PROJECT)" = "frontend" ]; then \
		$(MAKE) down-frontend; \
	else \
		cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) down $(SERVICE); \
		echo "$(GREEN)$(PROJECT) stopped.$(NC)"; \
	fi

.PHONY: restart
restart: ## Restart a specific project (use PROJECT=<name>)
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(RED)Error: PROJECT is required.$(NC)"; \
		echo "Usage: make restart PROJECT=backend"; \
		exit 1; \
	fi
	@cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) restart $(SERVICE)
	@echo "$(GREEN)$(PROJECT) restarted.$(NC)"

# ========================================
# Status and Logs
# ========================================

.PHONY: status
status: ## Show status of all or specific project (use PROJECT=<name>)
	@echo ""
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)  MeFit Services Status$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo ""
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(YELLOW)Backend:$(NC)"; \
		cd $(PROJECT_ROOT)/backend && $(DOCKER_COMPOSE) ps 2>/dev/null || echo "  Not running"; \
		echo ""; \
		echo "$(YELLOW)Voice API:$(NC)"; \
		cd $(PROJECT_ROOT)/voice-api && $(DOCKER_COMPOSE) ps 2>/dev/null || echo "  Not running"; \
		echo ""; \
		echo "$(YELLOW)Scraping:$(NC)"; \
		cd $(PROJECT_ROOT)/scraping && $(DOCKER_COMPOSE) ps 2>/dev/null || echo "  Not running"; \
		echo ""; \
		echo "$(YELLOW)Analysis Resume:$(NC)"; \
		cd $(PROJECT_ROOT)/analysis-resume && $(DOCKER_COMPOSE) ps 2>/dev/null || echo "  Not running"; \
		echo ""; \
		echo "$(YELLOW)Interview Analysis Report:$(NC)"; \
		cd $(PROJECT_ROOT)/interview-analysis-report && $(DOCKER_COMPOSE) ps 2>/dev/null || echo "  Not running"; \
		echo ""; \
		echo "$(YELLOW)Frontend:$(NC)"; \
		ps aux | grep -v grep | grep "vite" > /dev/null && echo "  Running on http://localhost:5173" || echo "  Not running"; \
	else \
		if [ "$(PROJECT)" = "frontend" ]; then \
			$(MAKE) status-frontend; \
		else \
			cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) ps $(SERVICE); \
		fi; \
	fi
	@echo ""
	@echo "$(BLUE)========================================$(NC)"

.PHONY: logs
logs: ## Show logs (use PROJECT=<name> and SERVICE=<service>)
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(RED)Error: PROJECT is required.$(NC)"; \
		echo "Usage: make logs PROJECT=backend SERVICE=webapp"; \
		exit 1; \
	fi
	@if [ "$(PROJECT)" = "frontend" ]; then \
		$(MAKE) logs-frontend; \
	else \
		cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) logs $(SERVICE) --tail=100 -f; \
	fi

.PHONY: ps
ps: status ## Alias for status

# ========================================
# Utility Commands
# ========================================

.PHONY: build
build: ## Build images for a project (use PROJECT=<name>)
	@if [ -z "$(PROJECT)" ]; then \
		echo "$(RED)Error: PROJECT is required.$(NC)"; \
		echo "Usage: make build PROJECT=backend"; \
		exit 1; \
	fi
	@cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) build

.PHONY: shell
shell: ## Open shell in a container (use PROJECT=<name> SERVICE=<service>)
	@if [ -z "$(PROJECT)" ] || [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: PROJECT and SERVICE are required.$(NC)"; \
		echo "Usage: make shell PROJECT=backend SERVICE=webapp"; \
		exit 1; \
	fi
	@cd $(PROJECT_ROOT)/$(PROJECT) && $(DOCKER_COMPOSE) exec $(SERVICE) /bin/sh

.PHONY: network-prune
network-prune: ## Remove the mefit-local network
	@echo "$(YELLOW)Removing mefit-local network...$(NC)"
	@$(DOCKER) network rm mefit-local 2>/dev/null || echo "Network 'mefit-local' does not exist or is in use"

# ========================================
# GUI Commands
# ========================================

.PHONY: gui-up
gui-up: network-create ## Start the GUI dashboard (Streamlit)
	@echo "$(GREEN)Starting MeFit GUI Dashboard...$(NC)"
	@echo "$(BLUE)Access: http://localhost:8501$(NC)"
	@cd $(TOOLS_DIR)/gui && HOST_PROJECT_ROOT=$(PROJECT_ROOT) $(DOCKER_COMPOSE) -f docker-compose.gui.yml up -d

.PHONY: gui-down
gui-down: ## Stop the GUI dashboard
	@echo "$(YELLOW)Stopping MeFit GUI Dashboard...$(NC)"
	@cd $(TOOLS_DIR)/gui && HOST_PROJECT_ROOT=$(PROJECT_ROOT) $(DOCKER_COMPOSE) -f docker-compose.gui.yml down 2>/dev/null || true

.PHONY: gui-logs
gui-logs: ## Show GUI logs
	@cd $(TOOLS_DIR)/gui && HOST_PROJECT_ROOT=$(PROJECT_ROOT) $(DOCKER_COMPOSE) -f docker-compose.gui.yml logs -f

.PHONY: gui-status
gui-status: ## Check GUI status
	@cd $(TOOLS_DIR)/gui && HOST_PROJECT_ROOT=$(PROJECT_ROOT) $(DOCKER_COMPOSE) -f docker-compose.gui.yml ps

.PHONY: gui-local
gui-local: ## Run GUI locally (requires Python + pip)
	@echo "$(GREEN)Starting MeFit GUI Dashboard (local)...$(NC)"
	@echo "$(BLUE)Access: http://localhost:8501$(NC)"
	@cd $(TOOLS_DIR)/gui && pip install -r requirements.txt && streamlit run app.py

.PHONY: gui
gui: gui-up ## Alias for gui-up
