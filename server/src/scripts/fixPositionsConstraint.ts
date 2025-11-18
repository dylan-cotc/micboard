import pool from '../db';

async function fixConstraint() {
  try {
    console.log('Dropping old constraint if exists...');
    await pool.query('ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_pc_position_id_key');

    console.log('Adding composite unique constraint...');
    await pool.query('ALTER TABLE positions ADD CONSTRAINT positions_pc_position_id_location_id_unique UNIQUE (pc_position_id, location_id)');

    console.log('✓ Constraint created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixConstraint();
