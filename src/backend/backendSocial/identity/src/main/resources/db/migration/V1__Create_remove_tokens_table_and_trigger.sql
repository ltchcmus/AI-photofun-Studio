-- Create remove_tokens table if not exists
CREATE TABLE IF NOT EXISTS remove_tokens (
    token VARCHAR(500) PRIMARY KEY,
    remove_at TIMESTAMP NOT NULL
);

-- Create index on remove_at for better performance
CREATE INDEX IF NOT EXISTS idx_remove_tokens_remove_at ON remove_tokens(remove_at);

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trg_cleanup_expired_tokens ON remove_tokens;
DROP FUNCTION IF EXISTS cleanup_expired_tokens();

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all tokens that have expired (removeAt < current timestamp)
    DELETE FROM remove_tokens
    WHERE remove_at < NOW();

    -- Return NEW for INSERT trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs AFTER INSERT
-- This will clean up expired tokens whenever a new token is added
CREATE TRIGGER trg_cleanup_expired_tokens
    AFTER INSERT ON remove_tokens
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_expired_tokens();

-- Optional: Create a scheduled job comment for manual cleanup
COMMENT ON TABLE remove_tokens IS 'Table stores revoked tokens. Expired tokens are automatically cleaned up on each insert via trigger.';

