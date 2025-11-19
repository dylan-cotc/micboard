-- Migration 009: Add Global Settings Table
-- This migration creates the global_settings table for application-wide settings
-- like logo configuration that are not tied to specific locations

CREATE TABLE IF NOT EXISTS global_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key);

-- Insert default logo settings
INSERT INTO global_settings (key, value, created_at, updated_at)
VALUES ('logo_path', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

INSERT INTO global_settings (key, value, created_at, updated_at)
VALUES ('logo_position', 'left', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

INSERT INTO global_settings (key, value, created_at, updated_at)
VALUES ('logo_display_mode', 'both', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

INSERT INTO global_settings (key, value, created_at, updated_at)
VALUES ('timezone', 'America/New_York', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

INSERT INTO global_settings (key, value, created_at, updated_at)
VALUES ('dark_mode', 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;