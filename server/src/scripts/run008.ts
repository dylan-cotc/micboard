import pool from '../db';
import fs from 'fs';
import path from 'path';

async function runMigration008() {
  try {
    console.log('Running migration 008...');
    
    const migrationPath = path.join(__dirname, '../migrations/008_fix_multi_tenant_issues.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSql);
    
    console.log('✓ Migration 008 completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration 008:', error);
    process.exit(1);
  }
}

runMigration008();
