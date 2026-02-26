# Clinical Trial Documentation - Makefile per comandi rapidi
# Uso: make [comando]

.PHONY: help start stop restart logs build clean test db-shell backend-shell frontend-shell

help: ## Mostra questo help
	@echo "Clinical Trial Documentation - Comandi Disponibili:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Avvia tutti i servizi (PostgreSQL + Backend + Frontend)
	docker-compose up -d --build

stop: ## Ferma tutti i servizi
	docker-compose stop

restart: ## Riavvia tutti i servizi
	docker-compose restart

logs: ## Mostra logs di tutti i servizi
	docker-compose logs -f

logs-backend: ## Mostra solo logs backend
	docker-compose logs -f backend

logs-frontend: ## Mostra solo logs frontend
	docker-compose logs -f frontend

logs-db: ## Mostra solo logs database
	docker-compose logs -f postgres

build: ## Rebuild tutti i servizi (dopo modifiche al codice)
	docker-compose up -d --build

build-backend: ## Rebuild solo backend
	docker-compose up -d --build backend

build-frontend: ## Rebuild solo frontend
	docker-compose up -d --build frontend

clean: ## Ferma e rimuove container + volumi (ATTENZIONE: cancella dati DB!)
	docker-compose down -v

status: ## Stato dei container
	docker-compose ps

test-register: ## Test registrazione utente
	curl -X POST http://localhost:8080/api/auth/register \
	  -H "Content-Type: application/json" \
	  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"SPONSOR"}'

test-login: ## Test login
	curl -X POST http://localhost:8080/api/auth/login \
	  -H "Content-Type: application/json" \
	  -d '{"email":"test@example.com","password":"password123"}'

db-shell: ## Apri shell PostgreSQL
	docker exec -it ctd_postgres psql -U ctd_user -d ctd_db

backend-shell: ## Apri shell nel container backend
	docker exec -it ctd_backend sh

frontend-shell: ## Apri shell nel container frontend
	docker exec -it ctd_frontend sh

health: ## Health check tutti i servizi
	@echo "Frontend health:"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend non raggiungibile"
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8080/actuator/health | grep -o '"status":"[^"]*"' || echo "Backend non raggiungibile"
	@echo ""
	@echo "Database status:"
	@docker exec ctd_postgres pg_isready -U ctd_user -d ctd_db

dev: start logs ## Avvia tutti i servizi e mostra logs (modalità sviluppo)

open: ## Apri l'applicazione nel browser
	@echo "Aprendo http://localhost:3000 ..."
	@start http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || echo "Apri manualmente: http://localhost:3000"
