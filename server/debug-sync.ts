import planningCenterService from './src/services/planningCenter';

async function debugSync() {
  try {
    await planningCenterService.initialize();

    const [folders, serviceTypes] = await Promise.all([
      planningCenterService.getAllFolders(),
      planningCenterService.getAllServiceTypes()
    ]);

    console.log('=== FOLDERS ===');
    console.log('Total folders:', folders.length);
    folders.forEach(f => console.log(`  ${f.id}: ${f.attributes.name}`));

    console.log('\n=== SERVICE TYPES ===');
    console.log('Total service types:', serviceTypes.length);
    serviceTypes.forEach(st => {
      const parentType = st.relationships?.parent?.data?.type;
      const parentId = st.relationships?.parent?.data?.id;
      console.log(`  ${st.id}: ${st.attributes.name} (parent: ${parentType} ${parentId})`);
    });

    // Build folder map
    const foldersMap = new Map();
    for (const folder of folders) {
      foldersMap.set(folder.id, {
        name: folder.attributes.name,
        hasServiceTypes: false
      });
    }

    // Mark folders that have service types
    console.log('\n=== MATCHING SERVICE TYPES TO FOLDERS ===');
    for (const serviceType of serviceTypes) {
      if (serviceType.relationships?.parent?.data?.type === 'Folder') {
        const folderId = serviceType.relationships.parent.data.id;
        const folderInfo = foldersMap.get(folderId);
        if (folderInfo) {
          console.log(`✓ Service type "${serviceType.attributes.name}" → Folder ${folderId} "${folderInfo.name}"`);
          folderInfo.hasServiceTypes = true;
        } else {
          console.log(`✗ Service type "${serviceType.attributes.name}" → Folder ${folderId} (NOT FOUND IN FOLDERS LIST)`);
        }
      }
    }

    const validFolders = Array.from(foldersMap.entries())
      .filter(([_, folderInfo]) => folderInfo.hasServiceTypes);

    console.log('\n=== VALID FOLDERS (WITH SERVICE TYPES) ===');
    console.log('Count:', validFolders.length);
    validFolders.forEach(([folderId, folderInfo]) => {
      console.log(`  ${folderId}: ${folderInfo.name}`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

debugSync();
