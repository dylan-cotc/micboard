import pool from '../db';

async function addTimezoneToLocations() {
  try {
    // Add timezone column to locations table
    await pool.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(255) DEFAULT 'America/New_York'
    `);

    console.log('✓ Timezone column added to locations table successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add timezone column:', error);
    process.exit(1);
  }
}

addTimezoneToLocations();
