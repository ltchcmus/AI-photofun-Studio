-- ============================================================================
-- Video Gallery Database Schema
-- PostgreSQL / Supabase
-- ============================================================================

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS video_gallery CASCADE;

-- Create video_gallery table
CREATE TABLE video_gallery (
    -- Primary Key: UUID assigned before upload
    video_id UUID PRIMARY KEY,

    -- User Information
    user_id VARCHAR(255) NOT NULL,

    -- Video Data
    video_url VARCHAR(1024),
    prompt TEXT,
    intent VARCHAR(100),
    model VARCHAR(100),
    task_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'PROCESSING',

    -- Metadata (JSON for flexible storage)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_video_gallery_user_created
ON video_gallery (user_id, created_at DESC);

CREATE INDEX idx_video_gallery_user_deleted
ON video_gallery (user_id, deleted_at);

CREATE INDEX idx_video_gallery_deleted_at
ON video_gallery (deleted_at);

CREATE INDEX idx_video_gallery_task_id
ON video_gallery (task_id);

-- ============================================================================
-- Triggers for Auto-Update Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_video_gallery_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_gallery_updated_at
    BEFORE UPDATE ON video_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_video_gallery_updated_at_column();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE video_gallery IS 'Stores user-generated videos with metadata from AI PhotoFun Studio';

COMMENT ON COLUMN video_gallery.video_id IS 'UUID assigned before video upload (primary key)';
COMMENT ON COLUMN video_gallery.user_id IS 'User identifier (references user system)';
COMMENT ON COLUMN video_gallery.video_url IS 'Uploaded video URL from file service';
COMMENT ON COLUMN video_gallery.prompt IS 'Prompt used for video generation';
COMMENT ON COLUMN video_gallery.intent IS 'Generation intent (prompt_to_video, image_to_video)';
COMMENT ON COLUMN video_gallery.model IS 'Video generation model name';
COMMENT ON COLUMN video_gallery.task_id IS 'Model Studio task identifier';
COMMENT ON COLUMN video_gallery.status IS 'Task status (PROCESSING, SUCCEEDED, FAILED, etc.)';
COMMENT ON COLUMN video_gallery.metadata IS 'Flexible JSON storage for extra attributes (duration, input_image_url, raw_video_url, etc.)';
COMMENT ON COLUMN video_gallery.created_at IS 'Timestamp when video record was created';
COMMENT ON COLUMN video_gallery.updated_at IS 'Timestamp of last update (auto-updated)';
COMMENT ON COLUMN video_gallery.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';
