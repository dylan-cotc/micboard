-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for application configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions table from Planning Center
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  pc_position_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  sync_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People table synced from Planning Center
CREATE TABLE IF NOT EXISTS people (
  id SERIAL PRIMARY KEY,
  pc_person_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  photo_path VARCHAR(500),
  position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Microphones table
CREATE TABLE IF NOT EXISTS microphones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People-Microphones assignment table
CREATE TABLE IF NOT EXISTS people_microphones (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  microphone_id INTEGER REFERENCES microphones(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(person_id, microphone_id)
);

-- Service plans table to track synced plans
CREATE TABLE IF NOT EXISTS service_plans (
  id SERIAL PRIMARY KEY,
  pc_plan_id VARCHAR(255) UNIQUE NOT NULL,
  plan_date DATE NOT NULL,
  title VARCHAR(255),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_people_pc_person_id ON people(pc_person_id);
CREATE INDEX IF NOT EXISTS idx_positions_pc_position_id ON positions(pc_position_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_pc_plan_id ON service_plans(pc_plan_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_plan_date ON service_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
