import sqlite3
from os import listdir
from contextlib import closing
from datetime import datetime

import logging

logger = logging.getLogger("uvicorn.error")

database = "/data/database.db"
migrations_path = "/migrations"
tracked_path = "/tracked"
untracked_path = "/untracked"

def get_connection():
    conn = sqlite3.connect(database)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

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
    for migration in sorted(
        listdir(migrations_path + tracked_path),
        key=lambda name: (datetime.strptime(name.split("-")[0], "%m%d%Y"), name),
    ):
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
