-- Add locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  pc_location_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  pc_service_type_id VARCHAR(255),
  service_type_name VARCHAR(255),
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_pc_location_id ON locations(pc_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_sync_enabled ON locations(sync_enabled);
