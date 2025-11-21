-- Migration 013: Add OAuth Tokens Storage
-- Stores Planning Center OAuth access and refresh tokens

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'planning_center',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP,
    scope TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
    BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update settings table to store OAuth client credentials
-- These are different from the access tokens - these are the app credentials
ALTER TABLE settings ADD COLUMN IF NOT EXISTS is_oauth BOOLEAN DEFAULT false;

-- Add comment to clarify the difference
COMMENT ON TABLE oauth_tokens IS 'Stores OAuth access and refresh tokens obtained through OAuth flow';
COMMENT ON COLUMN settings.pc_oauth_client_id IS 'OAuth Client ID for Planning Center app (not the access token)';
COMMENT ON COLUMN settings.pc_oauth_client_secret IS 'OAuth Client Secret for Planning Center app (not the access token)';