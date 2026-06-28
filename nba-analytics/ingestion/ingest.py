"""
NBA Analytics Ingestion Orchestrator
Pulls data from Kaggle SQLite + stats.nba.com API into DuckDB
"""
import os
import sys
import sqlite3
import pandas as pd
from pathlib import Path

from settings import DB_PATH, KAGGLE_SQLITE, SEASONS, SCHEMA_RAW
from db import get_connection, create_schemas, land_data, row_counts

def load_kaggle_data(conn):
    """Load Kaggle SQLite data into DuckDB raw schema"""
    print("\n📊 Loading Kaggle Data...")
    
    if not os.path.exists(KAGGLE_SQLITE):
        print(f"⚠️  {KAGGLE_SQLITE} not found. Skipping Kaggle data.")
        print(f"   Download from: https://www.kaggle.com/datasets/wyattowalsh/basketball")
        return
    
    try:
        # Connect to Kaggle SQLite
        kaggle_conn = sqlite3.connect(KAGGLE_SQLITE)
        
        # Get all table names from SQLite
        cursor = kaggle_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"   Found tables: {', '.join(tables)}")
        
        if not tables:
            print("   ⚠️  No tables found in SQLite file")
            kaggle_conn.close()
            return
        
        # Load each table
        for table_name in tables:
            try:
                df = pd.read_sql(f"SELECT * FROM {table_name}", kaggle_conn)
                
                # Map to our naming convention
                raw_table = f"kaggle_{table_name.rstrip('s')}"
                land_data(conn, raw_table, df, SCHEMA_RAW)
            except Exception as e:
                print(f"   ⚠️  Failed to load {table_name}: {e}")
        
        kaggle_conn.close()
        print("   ✅ Kaggle data loaded successfully")
    
    except Exception as e:
        print(f"   ⚠️  Error loading Kaggle data: {e}")

def create_synthetic_data(conn):
    """Create synthetic data for demo/testing (no API needed)"""
    print("\n🎲 Creating Synthetic Demo Data...")
    
    # Synthetic teams
    teams_data = {
        'team_id': [1610612738, 1610612739, 1610612740],
        'team_abbr': ['BOS', 'LAC', 'LAL'],
        'team_name': ['Boston Celtics', 'LA Clippers', 'LA Lakers'],
        'conference': ['E', 'W', 'W']
    }
    land_data(conn, 'kaggle_team', pd.DataFrame(teams_data), SCHEMA_RAW)
    
    # Synthetic players
    players_data = {
        'player_id': [2544, 201142, 201939],
        'player_name': ['Jayson Tatum', 'Kevin Durant', 'LeBron James'],
        'team_id': [1610612738, 1610612739, 1610612740]
    }
    land_data(conn, 'kaggle_player', pd.DataFrame(players_data), SCHEMA_RAW)
    
    # Synthetic games
    games_data = {
        'game_id': [21900001, 21900002, 21900003],
        'game_date': ['2023-10-01', '2023-10-02', '2023-10-03'],
        'home_team_id': [1610612738, 1610612739, 1610612740],
        'away_team_id': [1610612740, 1610612738, 1610612739],
        'home_pts': [120, 115, 112],
        'away_pts': [108, 110, 105]
    }
    land_data(conn, 'kaggle_game', pd.DataFrame(games_data), SCHEMA_RAW)

def main():
    """Main ingestion orchestrator"""
    print("=" * 60)
    print("🏀 NBA Analytics - Data Ingestion Pipeline")
    print("=" * 60)
    
    # Get connection and create schemas
    conn = get_connection()
    create_schemas(conn)
    
    # Load data
    load_kaggle_data(conn)
    
    # Check if we have any data, if not create synthetic
    has_data = False
    try:
        result = conn.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'raw'").fetchone()
        table_count = result[0] if result else 0
        has_data = table_count > 0
    except:
        has_data = False
    
    if not has_data:
        print("\n⚠️  No Kaggle data found. Creating synthetic data for demo...")
        create_synthetic_data(conn)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 Ingestion Complete!")
    print("=" * 60)
    print("\nRaw Data Summary:")
    row_counts(conn, SCHEMA_RAW)
    
    print(f"\n✅ Database: {DB_PATH}")
    print("📝 Next: Run 'cd transform && dbt build --profiles-dir .'")
    
    conn.close()

if __name__ == '__main__':
    main()
