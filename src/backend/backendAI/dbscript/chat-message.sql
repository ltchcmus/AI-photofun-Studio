CREATE TABLE chat_chatmessage (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_chatsession (id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,
    original_prompt TEXT NOT NULL,
    refined_prompt TEXT,
    detected_intent VARCHAR(50),
    intent_confidence DOUBLE PRECISION,
    response_text TEXT,
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processing_time DOUBLE PRECISION,
    generated_image VARCHAR(255),
    result_files JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatmessage_session ON chat_chatmessage (session_id);

CREATE INDEX idx_chatmessage_created ON chat_chatmessage (created_at);