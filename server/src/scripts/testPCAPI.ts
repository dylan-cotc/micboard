import planningCenterService from '../services/planningCenter';

async function testAPI() {
  try {
    await planningCenterService.initialize();
    const serviceTypes = await planningCenterService.getAllServiceTypes();

    console.log('\n=== Service Type Data Structure ===\n');
    if (serviceTypes.length > 0) {
      console.log(JSON.stringify(serviceTypes[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();
