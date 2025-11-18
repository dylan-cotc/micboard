import pool from '../db';
import fs from 'fs';
import path from 'path';

async function runFolderMigration() {
  try {
    console.log('Running folders migration...');

    // Read and execute the folders migration
    const migrationPath = path.join(__dirname, '../migrations/006_add_folders.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSql);
    console.log('✓ Folders table and location folder columns created successfully');

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runFolderMigration();
