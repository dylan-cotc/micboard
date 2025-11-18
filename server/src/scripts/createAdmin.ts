import pool from '../db';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdmin() {
  try {
    console.log('Create Admin User\n');

    const username = await question('Enter username: ');
    const password = await question('Enter password: ');

    if (!username || !password) {
      console.error('Username and password are required');
      process.exit(1);
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the admin user
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );

    console.log('\n✓ Admin user created successfully!');
    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('\nError: Username already exists');
    } else {
      console.error('\nError creating admin user:', error);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
