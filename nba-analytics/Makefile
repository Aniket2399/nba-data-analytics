.PHONY: install ingest transform export frontend-install frontend-dev frontend-build pipeline help clean

help:
	@echo "🏀 NBA Analytics Platform"
	@echo ""
	@echo "Available commands:"
	@echo "  make install         - Install all dependencies"
	@echo "  make ingest          - Run data ingestion"
	@echo "  make transform       - Run dbt transformations"
	@echo "  make export          - Export data to CSV"
	@echo "  make pipeline        - Run full pipeline (ingest + transform + export)"
	@echo "  make frontend-install - Install Node dependencies"
	@echo "  make frontend-dev    - Start frontend dev server"
	@echo "  make frontend-build  - Build frontend for production"
	@echo "  make dev             - Run pipeline and start frontend"
	@echo "  make clean           - Clean up generated files"

install: frontend-install
	pip install -r requirements.txt

ingest:
	python ingestion/ingest.py

transform:
	cd transform && dbt build --profiles-dir . && cd ..

export:
	python tableau/export_marts.py

pipeline: ingest transform export

frontend-install:
	cd frontend && npm install && cd ..

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build && cd ..

dev: export frontend-dev

clean:
	rm -f nba.duckdb
	rm -f nba.duckdb-shm
	rm -f nba.duckdb-wal
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf transform/target
	rm -rf transform/logs
	rm -rf transform/dbt_packages
