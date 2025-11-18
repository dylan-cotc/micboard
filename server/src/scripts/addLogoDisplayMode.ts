import pool from '../db';

async function addLogoDisplayMode() {
  try {
    await pool.query(`
      INSERT INTO global_settings (key, value, created_at, updated_at)
      VALUES ('logo_display_mode', 'both', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('✓ Logo display mode setting added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add setting:', error);
    process.exit(1);
  }
}

addLogoDisplayMode();
