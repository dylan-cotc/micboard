-- Migration 008: Fix Multi-Tenant Issues
-- This migration addresses critical issues identified in the locations implementation

-- 1. Make settings table multi-tenant
-- Add location_id to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;

-- Create a temporary table to store existing settings
CREATE TEMP TABLE temp_settings AS
SELECT * FROM settings WHERE location_id IS NULL;

-- Assign existing settings to the first location
UPDATE settings
SET location_id = (SELECT id FROM locations ORDER BY id LIMIT 1)
WHERE location_id IS NULL;

-- Now backfill settings to all other locations
INSERT INTO settings (key, value, location_id, created_at, updated_at)
SELECT ts.key, ts.value, l.id, NOW(), NOW()
FROM temp_settings ts
CROSS JOIN locations l
WHERE l.id != (SELECT id FROM locations ORDER BY id LIMIT 1)
ON CONFLICT DO NOTHING;

-- Drop temp table
DROP TABLE temp_settings;

-- Make location_id required
ALTER TABLE settings
ALTER COLUMN location_id SET NOT NULL;

-- Drop old UNIQUE constraint on key only
ALTER TABLE settings
DROP CONSTRAINT IF EXISTS settings_key_key;

-- Add composite UNIQUE constraint on (key, location_id)
ALTER TABLE settings
ADD CONSTRAINT settings_key_location_unique UNIQUE (key, location_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_location_id ON settings(location_id);


-- 2. Fix positions table UNIQUE constraint
-- Drop old UNIQUE constraint on pc_position_id
ALTER TABLE positions
DROP CONSTRAINT IF EXISTS positions_pc_position_id_key;

-- Add composite UNIQUE constraint on (pc_position_id, location_id)
-- Only apply to non-null pc_position_id values
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_pc_position_location
ON positions (pc_position_id, location_id)
WHERE pc_position_id IS NOT NULL;


-- 3. Add people_microphones location validation
-- This ensures person and microphone belong to the same location
CREATE OR REPLACE FUNCTION check_people_microphones_location()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT p.location_id != m.location_id
    FROM people p, microphones m
    WHERE p.id = NEW.person_id AND m.id = NEW.microphone_id
  ) THEN
    RAISE EXCEPTION 'Person and microphone must belong to the same location';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS people_microphones_location_check ON people_microphones;

CREATE TRIGGER people_microphones_location_check
  BEFORE INSERT OR UPDATE ON people_microphones
  FOR EACH ROW
  EXECUTE FUNCTION check_people_microphones_location();


-- 4. Add NOT NULL constraints to locations table
UPDATE locations SET slug = 'location-' || id WHERE slug IS NULL;
UPDATE locations SET display_name = 'Location ' || id WHERE display_name IS NULL;

ALTER TABLE locations
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE locations
ALTER COLUMN display_name SET NOT NULL;


-- 5. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_microphones_person_id ON people_microphones(person_id);
CREATE INDEX IF NOT EXISTS idx_people_microphones_microphone_id ON people_microphones(microphone_id);
CREATE INDEX IF NOT EXISTS idx_people_location_id ON people(location_id);
CREATE INDEX IF NOT EXISTS idx_microphones_location_id ON microphones(location_id);
CREATE INDEX IF NOT EXISTS idx_positions_location_id ON positions(location_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_location_id ON service_plans(location_id);
