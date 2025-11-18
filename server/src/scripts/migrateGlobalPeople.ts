import pool from '../db';

async function migrateToGlobalPeople() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Step 1: Creating person_locations junction table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS person_locations (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        UNIQUE(person_id, location_id)
      )
    `);

    console.log('Step 2: Removing location_id from people table...');
    // First, populate person_locations with existing data
    await client.query(`
      INSERT INTO person_locations (person_id, location_id)
      SELECT id, location_id FROM people
      WHERE location_id IS NOT NULL
      ON CONFLICT (person_id, location_id) DO NOTHING
    `);

    // Drop the foreign key constraint and location_id column
    await client.query(`
      ALTER TABLE people DROP CONSTRAINT IF EXISTS people_location_id_fkey
    `);

    await client.query(`
      ALTER TABLE people DROP COLUMN IF EXISTS location_id
    `);

    console.log('Step 3: Making pc_person_id unique globally...');
    // Remove old constraint if exists
    await client.query(`
      ALTER TABLE people DROP CONSTRAINT IF EXISTS people_pc_person_id_location_id_key
    `);

    // Add new unique constraint on pc_person_id only
    await client.query(`
      ALTER TABLE people ADD CONSTRAINT people_pc_person_id_unique UNIQUE (pc_person_id)
    `);

    console.log('Step 4: Consolidating duplicate people across locations...');
    // Find and merge duplicate pc_person_id entries
    const duplicates = await client.query(`
      SELECT pc_person_id, array_agg(id ORDER BY created_at) as person_ids
      FROM people
      WHERE pc_person_id IS NOT NULL
      GROUP BY pc_person_id
      HAVING COUNT(*) > 1
    `);

    for (const dup of duplicates.rows) {
      const personIds = dup.person_ids;
      const keepId = personIds[0]; // Keep the oldest record
      const mergeIds = personIds.slice(1);

      console.log(`  Merging duplicate ${dup.pc_person_id}: keeping ${keepId}, merging ${mergeIds.join(', ')}`);

      // Update person_locations to point to the kept record
      for (const mergeId of mergeIds) {
        await client.query(`
          UPDATE person_locations
          SET person_id = $1
          WHERE person_id = $2
          ON CONFLICT (person_id, location_id) DO NOTHING
        `, [keepId, mergeId]);
      }

      // Delete the duplicate records
      await client.query(`
        DELETE FROM people WHERE id = ANY($1)
      `, [mergeIds]);
    }

    console.log('Step 5: Creating global_settings table for logo...');
    // Create a new global_settings table for settings not tied to a location
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add logo settings to global_settings
    await client.query(`
      INSERT INTO global_settings (key, value, created_at, updated_at)
      VALUES ('logo_path', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);

    await client.query(`
      INSERT INTO global_settings (key, value, created_at, updated_at)
      VALUES ('logo_position', 'left', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key)
    `);

    await client.query('COMMIT');
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrateToGlobalPeople()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
