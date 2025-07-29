const ExcelJS = require('exceljs');
const path = require('path');

async function checkAksCodes() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'demodaten/anlagenimport.xlsx'));
  
  const worksheet = workbook.getWorksheet(1);
  const aksCodes = new Set();
  
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
      
      const aks = getValue(row.getCell(9));
      if (aks) aksCodes.add(aks);
    }
  });
  
  console.log('Unique AKS codes found:', aksCodes.size);
  console.log('\nAll AKS codes:');
  Array.from(aksCodes).sort().forEach(code => {
    console.log('-', code);
  });
}

checkAksCodes();