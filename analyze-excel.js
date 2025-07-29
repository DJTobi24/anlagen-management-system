const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'demodaten/anlagenimport.xlsx'));
  
  const worksheet = workbook.getWorksheet(1);
  let dataRows = 0;
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      const hasData = row.values.some(value => value !== null && value !== undefined && value !== '');
      if (hasData) dataRows++;
    }
  });
  
  console.log('===== Excel File Analysis =====');
  console.log('Total rows in file:', worksheet.rowCount);
  console.log('Total data rows (excluding header):', dataRows);
  console.log('\nFirst 10 data rows preview:');
  console.log('-------------------------------');
  
  for (let i = 2; i <= Math.min(12, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i);
    const getValue = (cell) => {
      const val = cell.value;
      if (val && typeof val === 'object' && val.richText) {
        return val.richText.map(t => t.text).join('');
      } else if (val && typeof val === 'object' && val.text) {
        return val.text;
      } else if (val && typeof val === 'object' && val.result) {
        return val.result;
      }
      return val ? val.toString() : '';
    };
    
    const tNummer = getValue(row.getCell(2));
    const name = getValue(row.getCell(4));
    const liegenschaft = getValue(row.getCell(7));
    const gebaeude = getValue(row.getCell(8));
    const aks = getValue(row.getCell(9));
    
    console.log(`Row ${i}: T-Nr: ${tNummer}, Name: ${name}, Lieg: ${liegenschaft}, Geb: ${gebaeude}, AKS: ${aks}`);
  }
  
  // Check unique Liegenschaften and Gebäude
  const liegenschaften = new Set();
  const gebaeude = new Set();
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const getValue = (cell) => {
        const val = cell.value;
        if (val && typeof val === 'object' && val.richText) {
          return val.richText.map(t => t.text).join('');
        } else if (val && typeof val === 'object' && val.text) {
          return val.text;
        } else if (val && typeof val === 'object' && val.result) {
          return val.result;
        }
        return val ? val.toString() : '';
      };
      
      const lieg = getValue(row.getCell(7));
      const geb = getValue(row.getCell(8));
      if (lieg) liegenschaften.add(lieg);
      if (geb) gebaeude.add(geb);
    }
  });
  
  console.log('\n===== Summary =====');
  console.log('Unique Liegenschaften:', liegenschaften.size);
  console.log('Unique Gebäude:', gebaeude.size);
  console.log('Expected entities to create:');
  console.log('- Max Liegenschaften:', liegenschaften.size);
  console.log('- Max Gebäude:', gebaeude.size);
  console.log('- Anlagen:', dataRows);
}

analyzeExcel().catch(console.error);