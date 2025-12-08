CREATE TABLE background_removal_backgroundremovalrequest (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,

    original_image VARCHAR(100) NOT NULL,
    result_image VARCHAR(100),
    mask_image VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    processing_time DOUBLE PRECISION,

    return_mask BOOLEAN NOT NULL DEFAULT FALSE,
    background_color VARCHAR(20) NOT NULL DEFAULT 'transparent'
);

-- index for ordering
CREATE INDEX idx_bg_removal_created_at
    ON background_removal_backgroundremovalrequest (created_at DESC);
