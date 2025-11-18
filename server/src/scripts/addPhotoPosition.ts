import pool from '../db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', '004_add_photo_position.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    await pool.query(sql);

    console.log('✓ Photo position migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();
