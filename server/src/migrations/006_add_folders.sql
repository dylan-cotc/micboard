-- Add folders table for Planning Center folder hierarchy (campuses)
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  pc_folder_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add folder reference to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS pc_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS folder_name VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_pc_folder_id ON locations(pc_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_pc_folder_id ON folders(pc_folder_id);
