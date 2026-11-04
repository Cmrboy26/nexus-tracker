CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    auth0_id TEXT NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    birthday DATE
);