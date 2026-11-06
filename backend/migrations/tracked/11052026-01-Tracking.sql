CREATE TABLE IF NOT EXISTS entry_types (
    name TEXT PRIMARY KEY NOT NULL
);

INSERT OR IGNORE INTO entry_types (name) VALUES ('mood'), ('meal'), ('drink');

CREATE TABLE IF NOT EXISTS tracking_entries (
    id TEXT PRIMARY KEY NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    log_date TEXT NOT NULL,
    entry_type TEXT NOT NULL REFERENCES entry_types(name),
    occurred_at TEXT,
    data TEXT NOT NULL CHECK (json_valid(data) AND json_type(data) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_tracking_entries_user_date_time
    ON tracking_entries (user_id, log_date, occurred_at);