# Product Intelligence Platform
# Makefile for common development tasks

.PHONY: up down build logs backend frontend worker test migrate

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Rebuild all containers
build:
	docker-compose build

# View logs
logs:
	docker-compose logs -f

# Backend shell
backend-shell:
	docker-compose exec backend bash

# Run backend tests
test:
	cd backend && pytest -v

# Database migrations
migrate:
	cd backend && alembic upgrade head

makemigrations:
	cd backend && alembic revision --autogenerate -m "$(msg)"

# Frontend dev server
frontend-dev:
	cd frontend && npm run dev

# Install frontend deps
frontend-install:
	cd frontend && npm install

# Format code
format:
	cd backend && black app/ && isort app/
	cd frontend && npm run lint

# Seed sample data
seed:
	cd backend && python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"
