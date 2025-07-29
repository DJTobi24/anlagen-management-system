const fs = require('fs').promises;
const path = require('path');
const { ExtendedImportService } = require('./dist/services/extendedImportService');

async function testLargeImport() {
  console.log('===== Testing Large Import =====');
  console.log('File: demodaten/anlagenimport.xlsx');
  console.log('Expected: 2248 Anlagen, 1 Liegenschaft, 10 Gebäude\n');
  
  const startTime = Date.now();
  
  try {
    // Read the file
    const filePath = path.join(__dirname, 'demodaten', 'anlagenimport.xlsx');
    const buffer = await fs.readFile(filePath);
    
    console.log('File loaded, size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('Starting import...\n');
    
    // Use a test mandant ID and user ID
    const mandantId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000001';
    
    // Perform import
    const result = await ExtendedImportService.importAnlagenFromExcel(
      buffer,
      mandantId,
      userId
    );
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('===== Import Results =====');
    console.log('Duration:', duration.toFixed(2), 'seconds');
    console.log('Successfully imported:', result.success, 'Anlagen');
    console.log('Failed:', result.failed);
    console.log('Created Liegenschaften:', result.createdLiegenschaften);
    console.log('Created Gebäude:', result.createdGebaeude);
    console.log('Processing rate:', (result.success / duration).toFixed(0), 'Anlagen/second');
    
    if (result.errors.length > 0) {
      console.log('\n===== First 10 Errors =====');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`Row ${error.row}: ${error.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`... and ${result.errors.length - 10} more errors`);
      }
    }
    
    // Performance analysis
    console.log('\n===== Performance Analysis =====');
    console.log('Total entities created:', result.success + result.createdLiegenschaften + result.createdGebaeude);
    console.log('Average time per Anlage:', ((duration * 1000) / result.success).toFixed(2), 'ms');
    
    if (result.success === 2248) {
      console.log('\n✅ SUCCESS: All 2248 Anlagen imported successfully!');
    } else {
      console.log('\n⚠️  WARNING: Not all Anlagen were imported successfully');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR during import:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLargeImport();