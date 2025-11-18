-- Migration 007: Add Multi-Tenant Support
-- This migration transforms the application from single-tenant to multi-tenant
-- where each location has its own isolated data (people, positions, microphones, etc.)

-- Step 1: Add new columns to locations table for manual management
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Step 2: Add location_id foreign key to all data tables
ALTER TABLE positions ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;
ALTER TABLE people ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;
ALTER TABLE microphones ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;
ALTER TABLE service_plans ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_positions_location_id ON positions(location_id);
CREATE INDEX IF NOT EXISTS idx_people_location_id ON people(location_id);
CREATE INDEX IF NOT EXISTS idx_microphones_location_id ON microphones(location_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_location_id ON service_plans(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_is_primary ON locations(is_primary);

-- Step 4: Create a default location for existing data
-- This handles migration of existing single-tenant data to multi-tenant structure
INSERT INTO locations (name, slug, is_primary, display_name, sync_enabled)
VALUES ('Main Campus', 'main', true, 'Main Campus', true)
ON CONFLICT (pc_location_id) DO NOTHING;

-- Step 5: Backfill existing data to reference the default location
-- Only update rows that don't already have a location_id set
UPDATE positions SET location_id = (SELECT id FROM locations WHERE slug = 'main' LIMIT 1) WHERE location_id IS NULL;
UPDATE people SET location_id = (SELECT id FROM locations WHERE slug = 'main' LIMIT 1) WHERE location_id IS NULL;
UPDATE microphones SET location_id = (SELECT id FROM locations WHERE slug = 'main' LIMIT 1) WHERE location_id IS NULL;
UPDATE service_plans SET location_id = (SELECT id FROM locations WHERE slug = 'main' LIMIT 1) WHERE location_id IS NULL;

-- Step 6: Make location_id NOT NULL after backfilling data
-- This ensures data integrity going forward
ALTER TABLE positions ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE people ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE microphones ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE service_plans ALTER COLUMN location_id SET NOT NULL;

-- Step 7: Update locations table to ensure slug and display_name are set for default location
UPDATE locations
SET
  slug = COALESCE(slug, LOWER(REPLACE(name, ' ', '-'))),
  display_name = COALESCE(display_name, name)
WHERE slug IS NULL OR display_name IS NULL;
