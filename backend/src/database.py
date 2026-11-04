import sqlite3
from os import listdir
from contextlib import closing

import logging

logger = logging.getLogger("uvicorn.error")

database = "/data/database.db"
migrations_path = "/migrations"
tracked_path = "/tracked"
untracked_path = "/untracked"

def get_connection():
    return sqlite3.connect(database)

def execute_query(query, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    conn.close()

def fetch_all(query, params=()):
    with closing(get_connection()) as conn:
        return conn.execute(query, params).fetchall()

def fetch_one(query, params=()):
    with closing(get_connection()) as conn:
        return conn.execute(query, params).fetchone()

def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
        """
    )

    # Apply tracked migrations
    for migration in listdir(migrations_path + tracked_path):
        is_applied = cursor.execute(
            "SELECT 1 FROM migrations WHERE name = ?",
            (migration,)
        ).fetchone()
        if is_applied:
            continue
        with open(migrations_path + tracked_path + "/" + migration, "r") as f:
            cursor.executescript(f.read())
            logger.info(f"Applied tracked migration: {migration}")
        cursor.execute(
            "INSERT INTO migrations (name) VALUES (?)",
            (migration,)
        )

    # Apply untracked migrations (always apply)
    for migration in listdir(migrations_path + untracked_path):
        with open(migrations_path + untracked_path + "/" + migration, "r") as f:
            cursor.executescript(f.read())
            logger.info(f"Applied untracked migration: {migration}")
    
    conn.commit()
    conn.close()
