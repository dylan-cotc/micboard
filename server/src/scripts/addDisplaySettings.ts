import pool from '../db';

async function addDisplaySettings() {
  try {
    // Add timezone setting
    await pool.query(`
      INSERT INTO global_settings (key, value, created_at, updated_at)
      VALUES ('timezone', 'America/New_York', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);

    // Add dark mode setting
    await pool.query(`
      INSERT INTO global_settings (key, value, created_at, updated_at)
      VALUES ('dark_mode', 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('✓ Display settings added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add settings:', error);
    process.exit(1);
  }
}

addDisplaySettings();
