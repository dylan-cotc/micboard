import planningCenterService from './src/services/planningCenter';

async function test() {
  try {
    await planningCenterService.initialize();

    console.log('Testing /folders endpoint...');
    try {
      const folders = await planningCenterService.getAllFolders();
      console.log('✓ Folders found:', folders.length);
      if (folders.length > 0) {
        console.log('First folder:', JSON.stringify(folders[0], null, 2));
      }
    } catch (e: any) {
      console.log('✗ Error fetching folders:', e.message);
      if (e.response) {
        console.log('  Status:', e.response.status);
        console.log('  Data:', e.response.data);
      }
    }

    console.log('\nTesting /service_types endpoint...');
    const serviceTypes = await planningCenterService.getAllServiceTypes();
    console.log('✓ Service types found:', serviceTypes.length);
    if (serviceTypes.length > 0) {
      console.log('First service type:', JSON.stringify(serviceTypes[0], null, 2));
    }

    process.exit(0);
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
}

test();
