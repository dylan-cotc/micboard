import pool from './src/db';

async function clearLocations() {
  try {
    const result = await pool.query('DELETE FROM locations');
    console.log(`Deleted ${result.rowCount} locations`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

clearLocations();
