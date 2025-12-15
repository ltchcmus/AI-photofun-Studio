-- ============================================================================
-- Image Gallery Database Schema
-- PostgreSQL / Supabase
-- ============================================================================

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS image_gallery CASCADE;

-- Create image_gallery table
CREATE TABLE image_gallery (
    -- Primary Key: UUID extracted from Cloudinary URL
    image_id UUID PRIMARY KEY,
    
    -- User Information
    user_id VARCHAR(255) NOT NULL,
    
    -- Image Data
    image_url VARCHAR(1024) NOT NULL,
    refined_prompt TEXT,
    intent VARCHAR(100),
    
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

-- Index for user queries (list user images sorted by creation date)
CREATE INDEX idx_image_gallery_user_created 
ON image_gallery (user_id, created_at DESC);

-- Index for soft delete queries (list deleted images by user)
CREATE INDEX idx_image_gallery_user_deleted 
ON image_gallery (user_id, deleted_at);

-- Index for deleted_at lookups (filter deleted vs active images)
CREATE INDEX idx_image_gallery_deleted_at 
ON image_gallery (deleted_at);

-- Index for created_at (general sorting)
CREATE INDEX idx_image_gallery_created_at 
ON image_gallery (created_at DESC);

-- ============================================================================
-- Triggers for Auto-Update Timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_image_gallery_updated_at
    BEFORE UPDATE ON image_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE image_gallery IS 'Stores user-generated images with metadata from AI PhotoFun Studio';

COMMENT ON COLUMN image_gallery.image_id IS 'UUID extracted from Cloudinary image URL (primary key)';
COMMENT ON COLUMN image_gallery.user_id IS 'User identifier (references user system)';
COMMENT ON COLUMN image_gallery.image_url IS 'Full Cloudinary URL of the generated image';
COMMENT ON COLUMN image_gallery.refined_prompt IS 'AI-refined prompt used for image generation';
COMMENT ON COLUMN image_gallery.intent IS 'Generation intent (generate, edit, enhance, etc.)';
COMMENT ON COLUMN image_gallery.metadata IS 'Flexible JSON storage for additional attributes (model, style, size, etc.)';
COMMENT ON COLUMN image_gallery.created_at IS 'Timestamp when image record was created';
COMMENT ON COLUMN image_gallery.updated_at IS 'Timestamp of last update (auto-updated)';
COMMENT ON COLUMN image_gallery.deleted_at IS 'Soft delete timestamp (NULL if not deleted)';

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO image_gallery (
    image_id,
    user_id,
    image_url,
    refined_prompt,
    intent,
    metadata
) VALUES 
(
    '8d76bd3a-053e-4bb5-a2ab-ce147e53f40c',
    'user123',
    'https://res.cloudinary.com/demo/image/upload/8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg',
    'Create a vibrant sunset landscape with mountains and reflective lake',
    'generate',
    '{"model": "gemini-pro", "style": "realistic", "generation_time": 3.5}'::jsonb
),
(
    '9e87ce4b-164f-4cc6-b3bc-df258f64e51d',
    'user123',
    'https://res.cloudinary.com/demo/image/upload/9e87ce4b-164f-4cc6-b3bc-df258f64e51d.jpg',
    'Portrait of a smiling person with professional lighting',
    'enhance',
    '{"model": "gemini-pro", "style": "portrait", "generation_time": 2.8}'::jsonb
);
*/

-- ============================================================================
-- Useful Queries
-- ============================================================================

-- Query: Get all active (non-deleted) images for a user
/*
SELECT 
    image_id,
    image_url,
    refined_prompt,
    intent,
    created_at
FROM image_gallery
WHERE user_id = 'user123'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
*/

-- Query: Get deleted images for a user
/*
SELECT 
    image_id,
    image_url,
    refined_prompt,
    deleted_at
FROM image_gallery
WHERE user_id = 'user123'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
*/

-- Query: Soft delete an image
/*
UPDATE image_gallery
SET deleted_at = CURRENT_TIMESTAMP
WHERE image_id = '8d76bd3a-053e-4bb5-a2ab-ce147e53f40c';
*/

-- Query: Restore a soft-deleted image
/*
UPDATE image_gallery
SET deleted_at = NULL
WHERE image_id = '8d76bd3a-053e-4bb5-a2ab-ce147e53f40c';
*/

-- Query: Permanently delete an image
/*
DELETE FROM image_gallery
WHERE image_id = '8d76bd3a-053e-4bb5-a2ab-ce147e53f40c';
*/

-- Query: Count images by user
/*
SELECT 
    user_id,
    COUNT(*) as total_images,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_images,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_images
FROM image_gallery
GROUP BY user_id;
*/

-- Query: Get images with specific intent
/*
SELECT 
    image_id,
    user_id,
    refined_prompt,
    intent,
    created_at
FROM image_gallery
WHERE intent = 'generate'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
*/

-- Query: Search images by prompt content
/*
SELECT 
    image_id,
    user_id,
    refined_prompt,
    created_at
FROM image_gallery
WHERE refined_prompt ILIKE '%sunset%'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
*/

-- Query: Get images created in last 7 days
/*
SELECT 
    image_id,
    user_id,
    refined_prompt,
    created_at
FROM image_gallery
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
*/

-- ============================================================================
-- Maintenance Queries
-- ============================================================================

-- Query: Permanently delete soft-deleted images older than 30 days
/*
DELETE FROM image_gallery
WHERE deleted_at IS NOT NULL
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
*/

-- Query: Get table statistics
/*
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_records,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM image_gallery;
*/

-- Query: Analyze table for query optimization
/*
ANALYZE image_gallery;
*/

-- ============================================================================
-- Row Level Security (RLS) - Optional for Supabase
-- ============================================================================

-- Enable RLS (uncomment if using Supabase with authentication)
/*
ALTER TABLE image_gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own images
CREATE POLICY "Users can view own images"
ON image_gallery
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own images
CREATE POLICY "Users can insert own images"
ON image_gallery
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON image_gallery
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON image_gallery
FOR DELETE
USING (auth.uid()::text = user_id);
*/

-- ============================================================================
-- End of Schema
-- ============================================================================
