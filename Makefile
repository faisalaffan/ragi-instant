.PHONY: dev deploy build up down logs restart ps sync shell ssh-db install run lint format typecheck eval eval-ragas test test-cov help

VPS := ubuntu@vps
VPS_DIR := ~/ragi-instant

help: ## Tampilkan semua command
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ─── VPS — Development (no rebuild, volume mount) ───

dev: sync ## Deploy dev mode ke VPS (kode di-mount, hot reload, detik)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose -f docker-compose.dev.yml up -d"

dev-build: sync ## Build + deploy dev mode (pertama kali / deps berubah)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose -f docker-compose.dev.yml up -d --build"

# ─── VPS — Production (build image) ──────────────────

deploy: sync ## Build + deploy production ke VPS (menit, rebuild image)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose up -d --build"

up: ## Start production containers (tanpa rebuild)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose up -d"

down: ## Stop production containers
	ssh $(VPS) "cd $(VPS_DIR) && docker compose down"

restart: ## Restart ragi-instant di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose restart ragi-instant"

logs: ## Tail logs dari VPS (pakai dev compose)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose -f docker-compose.dev.yml logs -f --tail=100 ragi-instant"

ps: ## Status containers di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose ps"

sync: ## Sync project ke VPS (exclude .git)
	rsync -avz --exclude '.git' --exclude '__pycache__' --exclude '.venv' --exclude '.env' --exclude '*.egg-info' --exclude '.pytest_cache' ./ $(VPS):$(VPS_DIR)/

shell: ## SSH ke container ragi-instant
	ssh $(VPS) "cd $(VPS_DIR) && docker compose exec ragi-instant bash"

ssh-db: ## Port-forward PostgreSQL dari VPS ke local 5433
	ssh -L 5433:localhost:5432 $(VPS)

# ─── Local ─────────────────────────────────────────

install: ## Install dependencies local
	cd backend && pip install -e ".[dev]"

run: ## Run FastAPI local
	cd backend && .venv/bin/python -m uvicorn app.main:app --reload --port 8000

lint: ## Lint backend
	cd backend && ruff check app/

format: ## Format backend
	cd backend && ruff format app/

typecheck: ## Type check backend
	cd backend && mypy app/

eval: ## Run RAGAS eval
	cd backend && python -m app.eval.evaluate --dataset app/eval/dataset.json

eval-ragas: ## Compute RAGAS metrics from eval results
	cd backend && python -m app.eval.ragas_eval --results app/eval/results.json

test: ## Run backend tests
	cd backend && python -m pytest tests/ -v

test-cov: ## Run backend tests with coverage
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=term-missing
