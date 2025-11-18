import pool from '../db';
import bcrypt from 'bcrypt';

async function createDefaultAdmin() {
  try {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin';

    console.log(`Creating admin user: ${username}`);

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the admin user
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );

    console.log('\n✓ Admin user created successfully!');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('\nError: Username already exists');
    } else {
      console.error('\nError creating admin user:', error);
    }
    process.exit(1);
  }
}

createDefaultAdmin();
