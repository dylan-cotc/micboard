import pool from '../db';
import fs from 'fs';
import path from 'path';

async function runLocationMigration() {
  try {
    console.log('Running locations migration...');

    // Read and execute the locations migration
    const migrationPath = path.join(__dirname, '../migrations/005_add_locations.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSql);
    console.log('✓ Locations table created successfully');

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runLocationMigration();
