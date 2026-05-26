.PHONY: deploy build up down logs shell sync-env ssh-db help

VPS := ubuntu@vps
VPS_DIR := ~/ragi-instant

help: ## Tampilkan semua command
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ─── VPS ───────────────────────────────────────────

deploy: sync ## Build + run di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose up -d --build"

up: ## Start containers di VPS (tanpa rebuild)
	ssh $(VPS) "cd $(VPS_DIR) && docker compose up -d"

down: ## Stop containers di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose down"

restart: ## Restart ragi-instant di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose restart ragi-instant"

logs: ## Tail logs dari VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose logs -f --tail=100 ragi-instant"

ps: ## Status containers di VPS
	ssh $(VPS) "cd $(VPS_DIR) && docker compose ps"

sync: ## Sync project ke VPS (exclude .git)
	rsync -avz --exclude '.git' --exclude '__pycache__' --exclude '.env' ./ $(VPS):$(VPS_DIR)/

shell: ## SSH ke container ragi-instant
	ssh $(VPS) "cd $(VPS_DIR) && docker compose exec ragi-instant bash"

ssh-db: ## Port-forward PostgreSQL dari VPS ke local 5433
	ssh -L 5433:localhost:5432 $(VPS)

# ─── Local ─────────────────────────────────────────

install: ## Install dependencies local
	cd backend && pip install -e ".[dev]"

run: ## Run FastAPI local (butuh ssh-db dulu)
	cd backend && uvicorn app.main:app --reload --port 8000

lint: ## Lint backend
	cd backend && ruff check app/

format: ## Format backend
	cd backend && ruff format app/

typecheck: ## Type check backend
	cd backend && mypy app/

eval: ## Run RAGAS eval (butuh ssh-db + OPENAI_API_KEY)
	cd backend && python -m app.eval.evaluate --dataset app/eval/dataset.json

eval-ragas: ## Compute RAGAS metrics from eval results
	cd backend && python -m app.eval.ragas_eval --results app/eval/results.json
