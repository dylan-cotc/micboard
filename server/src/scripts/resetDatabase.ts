import pool from '../db';

async function resetDatabase() {
  try {
    console.log('Dropping all tables...');

    // Drop all tables
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO PUBLIC');

    console.log('✓ All tables dropped successfully');
    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
