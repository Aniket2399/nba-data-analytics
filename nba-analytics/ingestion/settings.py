"""
NBA Analytics Ingestion Settings
"""

# Seasons to pull from API
SEASONS = ['2024-25', '2023-24', '2022-23', '2021-22']

# DuckDB paths
DB_PATH = 'nba.duckdb'

# Rate limiting
RATE_LIMIT_PER_SEC = 5  # stats.nba.com requests per second

# Kaggle file
KAGGLE_SQLITE = 'data/basketball.sqlite'

# Schema names
SCHEMA_RAW = 'raw'
SCHEMA_STAGING = 'staging'
SCHEMA_MARTS = 'marts'
