-- Migration 012: Create Users Table with Role-Based Access Control
-- Adds user management with Admin and Editor roles

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add role column if it doesn't exist (for existing tables)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) CHECK (role IN ('admin', 'editor')),
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Create index on username for faster lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Insert default admin user (password will be changed on first login)
-- Default password: 'admin123' (hashed) - only if user doesn't exist
INSERT INTO users (username, password_hash, role, first_login)
VALUES ('admin', '$2b$10$rOz8vZxZxZxZxZxZxZxZxOZ8vZxZxZxZxZxZxZxZxZxZxZxZxZx', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();