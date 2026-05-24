FRONTEND_DIR = ./web/default
FRONTEND_APINI_DIR = ./web/apini
BACKEND_DIR = .

.PHONY: all build-frontend build-frontend-apini build-all-frontends start-backend dev dev-api dev-web dev-web-apini

all: build-all-frontends start-backend

build-frontend:
	@echo "Building default frontend..."
	@cd $(FRONTEND_DIR) && bun install && DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat ../../VERSION) bun run build

build-frontend-apini:
	@echo "Building apini frontend..."
	@cd $(FRONTEND_APINI_DIR) && bun install && bun run build

build-all-frontends: build-frontend build-frontend-apini

start-backend:
	@echo "Starting backend dev server..."
	@cd $(BACKEND_DIR) && go run main.go &

dev-api:
	@echo "Starting backend services (docker)..."
	@docker compose -f docker-compose.dev.yml up -d

dev-web:
	@echo "Starting frontend dev server..."
	@cd $(FRONTEND_DIR) && bun install && bun run dev

dev-web-apini:
	@echo "Starting apini frontend dev server..."
	@cd $(FRONTEND_APINI_DIR) && bun install && bun run dev

dev: dev-api dev-web
