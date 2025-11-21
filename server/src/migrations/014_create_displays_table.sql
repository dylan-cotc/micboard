-- Migration 014: Create Displays Table
-- Creates displays table with globally unique slugs
-- Displays are associated with locations and have service type associations

-- Create displays table FIRST
CREATE TABLE IF NOT EXISTS displays (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  pc_service_type_id VARCHAR(255),
  layout_config JSONB DEFAULT '{}',
  max_people INTEGER DEFAULT 20,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_displays_location_id ON displays(location_id);
CREATE INDEX IF NOT EXISTS idx_displays_slug ON displays(slug);
CREATE INDEX IF NOT EXISTS idx_displays_active ON displays(is_active);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_displays_updated_at ON displays;
CREATE TRIGGER update_displays_updated_at
    BEFORE UPDATE ON displays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing location data to displays
-- Create a default display for each existing location
INSERT INTO displays (location_id, name, slug, pc_service_type_id, is_primary, is_active)
SELECT
    id as location_id,
    'Main Display' as name,
    LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '[^a-zA-Z0-9\-]', '')) as slug,
    pc_service_type_id,
    is_primary,
    true as is_active
FROM locations
WHERE pc_service_type_id IS NOT NULL;

-- Handle slug conflicts by appending location-specific suffix
UPDATE displays
SET slug = CONCAT(slug, '-', location_id)
WHERE id IN (
    SELECT d.id
    FROM displays d
    WHERE EXISTS (
        SELECT 1 FROM displays d2
        WHERE d2.slug = d.slug AND d2.id != d.id
    )
);

-- Ensure all slugs are still unique after conflict resolution
UPDATE displays
SET slug = CONCAT(slug, '-', id)
WHERE id IN (
    SELECT d.id
    FROM displays d
    WHERE EXISTS (
        SELECT 1 FROM displays d2
        WHERE d2.slug = d.slug AND d2.id != d.id
    )
);

-- Add display_id column to microphones table AFTER displays table exists
ALTER TABLE microphones ADD COLUMN IF NOT EXISTS display_id INTEGER REFERENCES displays(id);

-- Update microphones to reference displays instead of locations
-- For now, assign all microphones to the primary display of each location
UPDATE microphones
SET display_id = (
    SELECT id FROM displays
    WHERE location_id = microphones.location_id
    AND is_primary = true
    LIMIT 1
)
WHERE display_id IS NULL;

-- For locations without primary displays, assign to first available display
UPDATE microphones
SET display_id = (
    SELECT id FROM displays
    WHERE location_id = microphones.location_id
    LIMIT 1
)
WHERE display_id IS NULL;

-- Make display_id NOT NULL after migration (only if there are displays)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM displays LIMIT 1) THEN
        ALTER TABLE microphones ALTER COLUMN display_id SET NOT NULL;
    END IF;
END $$;

-- Remove service type association from locations
ALTER TABLE locations DROP COLUMN IF EXISTS pc_service_type_id;
ALTER TABLE locations DROP COLUMN IF EXISTS service_type_name;
ALTER TABLE locations DROP COLUMN IF EXISTS pc_folder_id;
ALTER TABLE locations DROP COLUMN IF EXISTS folder_name;

-- Add comment
COMMENT ON TABLE displays IS 'Digital displays/screens associated with physical locations';
COMMENT ON COLUMN displays.slug IS 'Globally unique URL slug for public display access';
COMMENT ON COLUMN displays.layout_config IS 'JSON configuration for display layout (future layout builder)';