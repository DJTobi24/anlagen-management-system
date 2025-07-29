const fs = require('fs');
const path = require('path');
const { extendedImportService } = require('./dist/services/extendedImportService');

async function testExtendedImport() {
  console.log('Testing extended import with demo file...');
  
  const filePath = path.join(__dirname, 'demodaten', 'anlagenimport.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('Demo file not found:', filePath);
    return;
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await extendedImportService.importExtendedExcel(buffer);
    
    console.log('\n=== Import Results ===');
    console.log('Successfully imported:', result.success, 'Anlagen');
    console.log('Failed:', result.failed);
    console.log('Created Liegenschaften:', result.createdLiegenschaften);
    console.log('Created Gebäude:', result.createdGebaeude);
    
    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach(error => {
        console.log(`Row ${error.row}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the test
testExtendedImport();