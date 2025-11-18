import pool from '../db';

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        array_agg(att.attname) AS columns
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
      WHERE rel.relname = 'positions'
        AND nsp.nspname = 'public'
      GROUP BY con.conname, con.contype
      ORDER BY con.conname
    `);

    console.log('\n=== Constraints on positions table ===\n');
    result.rows.forEach(row => {
      console.log(`Constraint: ${row.constraint_name}`);
      console.log(`  Type: ${row.constraint_type}`);
      console.log(`  Columns: ${row.columns.join(', ')}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking constraints:', error);
    process.exit(1);
  }
}

checkConstraints();
