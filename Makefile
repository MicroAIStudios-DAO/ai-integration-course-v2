.PHONY: help backend web seed firebase-build firebase-deploy ingest

help:
	@echo "Targets:"
	@echo "  backend         Run FastAPI locally (requires .env)"
	@echo "  web             Run Next.js locally"
	@echo "  ingest          Ingest YouTube IDs: IDS=abc,def API=http://localhost:8000"
	@echo "  seed            Seed lessons to Firestore (premium only by default)"
	@echo "  firebase-build  Build Firebase functions"
	@echo "  firebase-deploy Deploy Firebase functions"

backend:
	@export $$(cat .env | xargs) && uvicorn allie.backend.app:app --host 0.0.0.0 --port 8000 --reload

web:
	@cd web && npm install && npm run dev

ingest:
	@API=$${API:-http://localhost:8000}; \
	python allie/tools/ingest_youtube.py --api $$API --ids $${IDS}

seed:
	python allie/tools/seed_lessons_firestore.py

firebase-build:
	@npm --prefix firebase/functions install && npm --prefix firebase/functions run build

firebase-deploy:
	@npm --prefix firebase/functions install && npm --prefix firebase/functions run build && firebase deploy --only functions

