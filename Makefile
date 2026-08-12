PYTHON ?= python3

.PHONY: install-backend install-frontend backend-dev frontend-dev validate-scenario backend-test frontend-test test backend-lint frontend-lint lint backend-format frontend-format format

install-backend:
	$(PYTHON) -m pip install -r backend/requirements.txt

install-frontend:
	npm --prefix frontend ci

backend-dev:
	cd backend && $(PYTHON) -m uvicorn incident_bridge.app:app --reload --host 127.0.0.1 --port 8000

frontend-dev:
	npm --prefix frontend run dev

validate-scenario:
	$(PYTHON) scripts/validate_scenario.py

backend-test:
	$(PYTHON) -m pytest backend/tests

frontend-test:
	npm --prefix frontend test -- --run

test: validate-scenario backend-test frontend-test

backend-lint:
	$(PYTHON) -m ruff check backend scripts

frontend-lint:
	npm --prefix frontend run lint

lint: backend-lint frontend-lint

backend-format:
	$(PYTHON) -m ruff format backend scripts

frontend-format:
	npm --prefix frontend run format

format: backend-format frontend-format
