-- Add photo positioning and zoom to people table
ALTER TABLE people
ADD COLUMN IF NOT EXISTS photo_position_x FLOAT DEFAULT 50,
ADD COLUMN IF NOT EXISTS photo_position_y FLOAT DEFAULT 50,
ADD COLUMN IF NOT EXISTS photo_zoom FLOAT DEFAULT 1;
