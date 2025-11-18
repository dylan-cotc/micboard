import pool from '../db';

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT
        conname as constraint_name,
        contype as constraint_type
      FROM pg_constraint
      WHERE conrelid = 'positions'::regclass
      ORDER BY conname
    `);

    console.log('\n=== Constraints on positions table ===\n');
    result.rows.forEach(row => {
      const typeMap: {[key: string]: string} = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE',
        'c': 'CHECK'
      };
      console.log(`${row.constraint_name}: ${typeMap[row.constraint_type] || row.constraint_type}`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConstraints();
