import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function restoreDatabase(backupFile: string) {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  console.log('Restoring database from backup...');
  console.log(`Backup file: ${backupFile}`);

  try {
    // Restore the backup
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD="${process.env.POSTGRES_PASSWORD || 'postgres'}" psql -h localhost -U ${process.env.POSTGRES_USER || 'postgres'} -d micboard -f ${backupFile}`
    );

    if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
      console.error('Restore stderr:', stderr);
    }

    console.log('✓ Database restored successfully');
    return true;
  } catch (error: any) {
    console.error('Restore failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error('Usage: npm run restore-db <backup-file>');
    process.exit(1);
  }

  restoreDatabase(backupFile)
    .then(() => {
      console.log('\nRestore complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nRestore failed!');
      process.exit(1);
    });
}

export default restoreDatabase;