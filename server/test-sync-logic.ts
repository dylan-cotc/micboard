import planningCenterService from './src/services/planningCenter';

async function testSyncLogic() {
  try {
    await planningCenterService.initialize();

    const [folders, serviceTypes] = await Promise.all([
      planningCenterService.getAllFolders(),
      planningCenterService.getAllServiceTypes()
    ]);

    console.log('=== ALL FOLDERS ===');
    folders.forEach(f => {
      const parentType = f.relationships?.parent?.data?.type;
      const parentId = f.relationships?.parent?.data?.id;
      console.log(`  ${f.id}: ${f.attributes.name} (parent: ${parentType} ${parentId || 'NONE - ROOT FOLDER'})`);
    });

    // Build a map of ALL folders and a separate map for ROOT folders only
    const allFoldersMap = new Map<string, any>();
    const rootFoldersMap = new Map<string, { name: string; hasDescendantsWithServiceTypes: boolean }>();

    for (const folder of folders) {
      allFoldersMap.set(folder.id, folder);

      // Root folders are those without a parent folder
      if (!folder.relationships?.parent?.data) {
        rootFoldersMap.set(folder.id, {
          name: folder.attributes.name,
          hasDescendantsWithServiceTypes: false
        });
      }
    }

    console.log('\n=== ROOT FOLDERS (NO PARENT) ===');
    rootFoldersMap.forEach((folderInfo, folderId) => {
      console.log(`  ${folderId}: ${folderInfo.name}`);
    });

    // Helper function to find root folder for any folder ID
    const findRootFolder = (folderId: string): string | null => {
      const folder = allFoldersMap.get(folderId);
      if (!folder) return null;

      // If this folder has no parent, it's a root folder
      if (!folder.relationships?.parent?.data) {
        return folderId;
      }

      // Otherwise, recursively find the root
      return findRootFolder(folder.relationships.parent.data.id);
    };

    console.log('\n=== TRACING SERVICE TYPES TO ROOT FOLDERS ===');
    // Mark root folders that have service types (anywhere in their hierarchy)
    for (const serviceType of serviceTypes) {
      if (serviceType.relationships?.parent?.data?.type === 'Folder') {
        const immediateFolderId = serviceType.relationships.parent.data.id;
        const immediateFolder = allFoldersMap.get(immediateFolderId);
        const rootFolderId = findRootFolder(immediateFolderId);

        console.log(`  Service Type "${serviceType.attributes.name}"`);
        console.log(`    → Immediate folder: ${immediateFolderId} "${immediateFolder?.attributes.name}"`);
        console.log(`    → Root folder: ${rootFolderId} "${rootFolderId ? allFoldersMap.get(rootFolderId)?.attributes.name : 'NOT FOUND'}"`);

        if (rootFolderId && rootFoldersMap.has(rootFolderId)) {
          rootFoldersMap.get(rootFolderId)!.hasDescendantsWithServiceTypes = true;
        }
      }
    }

    // Get only root folders that have service types somewhere in their hierarchy
    const validFolderIds = Array.from(rootFoldersMap.entries())
      .filter(([_, folderInfo]) => folderInfo.hasDescendantsWithServiceTypes)
      .map(([folderId]) => folderId);

    console.log('\n=== FINAL RESULT: ROOT FOLDERS TO SYNC AS LOCATIONS ===');
    console.log('Count:', validFolderIds.length);
    validFolderIds.forEach(folderId => {
      const folderInfo = rootFoldersMap.get(folderId);
      console.log(`  ${folderId}: ${folderInfo?.name}`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

testSyncLogic();
