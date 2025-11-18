import pool from '../db';

async function checkLocations() {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, display_name, is_primary, pc_service_type_id, service_type_name, sync_enabled
      FROM locations
      ORDER BY id
    `);

    console.log('\n=== Locations in Database ===\n');

    if (result.rows.length === 0) {
      console.log('No locations found in database.');
    } else {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`  Name: ${row.name}`);
        console.log(`  Slug: ${row.slug}`);
        console.log(`  Display Name: ${row.display_name}`);
        console.log(`  Is Primary: ${row.is_primary}`);
        console.log(`  Service Type ID: ${row.pc_service_type_id || 'NULL'}`);
        console.log(`  Service Type Name: ${row.service_type_name || 'NULL'}`);
        console.log(`  Sync Enabled: ${row.sync_enabled}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error querying locations:', error);
    process.exit(1);
  }
}

checkLocations();
