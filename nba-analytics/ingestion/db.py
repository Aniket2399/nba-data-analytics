"""
DuckDB connection and helper functions
"""
import duckdb
import os
from settings import DB_PATH, SCHEMA_RAW, SCHEMA_STAGING

def get_connection():
    """Get or create DuckDB connection"""
    return duckdb.connect(DB_PATH, read_only=False)

def create_schemas(conn):
    """Create raw and staging schemas if they don't exist"""
    conn.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_RAW}")
    conn.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_STAGING}")
    print(f"✅ Schemas created")

def land_data(conn, table_name, data, schema=SCHEMA_RAW):
    """
    Land data into DuckDB (append-only)
    
    Args:
        conn: DuckDB connection
        table_name: Name of table (without schema)
        data: Pandas DataFrame
        schema: Schema name (default: raw)
    """
    full_table = f"{schema}.{table_name}"
    try:
        # Drop table if exists
        conn.execute(f"DROP TABLE IF EXISTS {full_table}")
    except:
        pass
    
    # Use to_table() method instead of create()
    conn.from_df(data).to_table(full_table)
    row_count = len(data)
    print(f"✅ {full_table}: {row_count} rows")
    return row_count

def row_counts(conn, schema=SCHEMA_RAW):
    """Get row counts for all tables in schema"""
    query = f"""
    SELECT table_name, COUNT(*) as rows
    FROM {schema}.information_schema.tables t
    JOIN duckdb_databases d ON 1=1
    WHERE table_schema = '{schema}'
    GROUP BY table_name
    ORDER BY table_name
    """
    try:
        result = conn.execute(query).fetch_all()
        if result:
            for table, count in result:
                print(f"  {table}: {count:,}")
    except:
        pass

if __name__ == '__main__':
    conn = get_connection()
    create_schemas(conn)
    row_counts(conn)
    conn.close()
