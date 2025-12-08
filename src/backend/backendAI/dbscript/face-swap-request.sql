CREATE TABLE face_swap_faceswaprequest ( id SERIAL PRIMARY KEY,

-- User FK (nullable)
user_id INTEGER REFERENCES auth_user (id) ON DELETE CASCADE,

-- Image fields
source_image VARCHAR(255) NOT NULL,
target_image VARCHAR(255) NOT NULL,
result_image VARCHAR(255),

-- Status
status VARCHAR(20) NOT NULL DEFAULT 'pending',
error_message TEXT,

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
processing_time DOUBLE PRECISION,

-- AI model parameters
blend_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    use_gpu BOOLEAN NOT NULL DEFAULT TRUE
);

-- Ordering index (created_at DESC)
CREATE INDEX idx_faceswap_created_at ON face_swap_faceswaprequest (created_at DESC);