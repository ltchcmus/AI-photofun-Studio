CREATE TABLE chat_chatsession (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user (id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_chatsession_updated_at ON chat_chatsession (updated_at DESC);