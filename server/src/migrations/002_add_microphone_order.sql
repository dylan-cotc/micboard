-- Add display_order to microphones table
ALTER TABLE microphones
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial display_order based on ID
UPDATE microphones
SET display_order = id
WHERE display_order = 0;
