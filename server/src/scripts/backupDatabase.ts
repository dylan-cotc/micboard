import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function backupDatabase() {
  const backupDir = process.env.BACKUP_DIR || '/app/uploads/backups';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `micboard-backup-${timestamp}.sql`);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('Creating database backup...');
  console.log(`Backup file: ${backupFile}`);

  try {
    // Use pg_dump to create a complete backup
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD="${process.env.POSTGRES_PASSWORD || 'postgres'}" pg_dump -h localhost -U ${process.env.POSTGRES_USER || 'postgres'} -d micboard -F p -f ${backupFile}`
    );

    if (stderr && !stderr.includes('WARNING')) {
      console.error('Backup stderr:', stderr);
    }

    console.log('✓ Database backup created successfully');
    console.log(`  Location: ${backupFile}`);
    console.log(`  Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    return backupFile;
  } catch (error: any) {
    console.error('Backup failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase()
    .then((file) => {
      console.log('\nBackup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nBackup failed!');
      process.exit(1);
    });
}

export default backupDatabase;