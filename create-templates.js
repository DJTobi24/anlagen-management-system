const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createAksTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('AKS Import');
  
  // Define columns
  worksheet.columns = [
    { header: 'AKS Code', key: 'code', width: 20 },
    { header: 'Name', key: 'name', width: 50 },
    { header: 'Beschreibung', key: 'description', width: 60 },
    { header: 'Wartungsintervall (Monate)', key: 'interval', width: 25 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add example data
  const exampleData = [
    { code: 'AKS.01.001.01', name: 'Aufzugsanlage - Personenaufzug', description: 'Personenaufzug mit Seilantrieb', interval: 12 },
    { code: 'AKS.01.001.02', name: 'Aufzugsanlage - Lastenaufzug', description: 'Lastenaufzug mit hydraulischem Antrieb', interval: 12 },
    { code: 'AKS.03.430.04.20', name: 'Klimaanlage - Splitgerät', description: 'Split-Klimagerät für einzelne Räume', interval: 6 },
    { code: 'AKS.03.440.01.06', name: 'Elektrische Anlage - Mittelspannung', description: 'Mittelspannungsschaltanlage', interval: 12 },
    { code: 'AKS.03.440.05.22', name: 'Batterieanlage - Zentral', description: 'Zentralbatterieanlage für Notstrom', interval: 6 }
  ];
  
  exampleData.forEach(data => {
    worksheet.addRow(data);
  });
  
  // Save file
  const templatePath = path.join(__dirname, 'templates', 'aks_import_template.xlsx');
  await fs.promises.mkdir(path.dirname(templatePath), { recursive: true });
  await workbook.xlsx.writeFile(templatePath);
  console.log('AKS Import Template created:', templatePath);
}

async function createAnlagenTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Anlagen Import');
  
  // Define all columns according to the extended import format
  const columns = [
    { header: 'Vertrag', key: 'vertrag', width: 15 },
    { header: 'T-Nummer', key: 'tnummer', width: 15 },
    { header: 'FM-Nummer/QR-Code', key: 'fmnummer', width: 20 },
    { header: 'Anlagenname', key: 'name', width: 50 },
    { header: 'Suchbegriff', key: 'suchbegriff', width: 20 },
    { header: 'Suchbegriff 1', key: 'suchbegriff1', width: 20 },
    { header: 'Liegenschaft', key: 'liegenschaft', width: 30 },
    { header: 'Gebäude', key: 'gebaeude', width: 30 },
    { header: 'AKS', key: 'aks', width: 15 },
    { header: 'AKS Name', key: 'aksname', width: 30 },
    { header: 'KD Wirtschaftseinheit', key: 'wirtschaftseinheit', width: 20 },
    { header: 'Anzahl', key: 'anzahl', width: 10 },
    { header: 'Einheit', key: 'einheit', width: 10 },
    { header: 'Prüfpflichtig', key: 'pruefpflichtig', width: 15 },
    { header: 'Archiviert', key: 'archiviert', width: 12 },
    { header: 'Vertragspositionen Beschreibung', key: 'vertragsbeschreibung', width: 40 },
    { header: 'Kunde Ansprechpartner', key: 'ansprechpartner', width: 25 },
    { header: 'Attributsatz', key: 'attributsatz', width: 20 },
    { header: 'Code', key: 'code', width: 15 },
    { header: 'AKS COBA ID', key: 'cobaid', width: 15 },
    { header: 'AKS DL Alt', key: 'dlalt', width: 15 }
  ];
  
  worksheet.columns = columns;
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  
  // Add example data
  const exampleData = [
    {
      vertrag: 'V-2024-001',
      tnummer: 'T-0000001',
      fmnummer: 'FM-001',
      name: 'Aufzug Hauptgebäude',
      suchbegriff: 'Aufzug',
      suchbegriff1: 'Haupteingang',
      liegenschaft: 'Hauptstandort München',
      gebaeude: 'Verwaltungsgebäude A',
      aks: 'AKS.01.001.01',
      aksname: 'Personenaufzug',
      wirtschaftseinheit: 'WE-100',
      anzahl: 1,
      einheit: 'Stk',
      pruefpflichtig: 'Ja',
      archiviert: 'Nein',
      vertragsbeschreibung: 'Wartung und Instandhaltung',
      ansprechpartner: 'Max Mustermann',
      attributsatz: 'Standard',
      code: 'C-001',
      cobaid: 'COBA-001',
      dlalt: 'DL-001'
    },
    {
      vertrag: 'V-2024-001',
      tnummer: 'T-0000002',
      fmnummer: 'FM-002',
      name: 'Klimaanlage Serverraum',
      suchbegriff: 'Klima',
      suchbegriff1: 'Server',
      liegenschaft: 'Hauptstandort München',
      gebaeude: 'IT-Gebäude',
      aks: 'AKS.03.430.04.20',
      aksname: 'Split-Klimagerät',
      wirtschaftseinheit: 'WE-200',
      anzahl: 2,
      einheit: 'Stk',
      pruefpflichtig: 'Ja',
      archiviert: 'Nein',
      vertragsbeschreibung: 'Wartung Klimatechnik',
      ansprechpartner: 'Maria Schmidt',
      attributsatz: 'Kritisch',
      code: 'C-002',
      cobaid: 'COBA-002',
      dlalt: 'DL-002'
    }
  ];
  
  exampleData.forEach(data => {
    worksheet.addRow(data);
  });
  
  // Add notes
  const notesRow = worksheet.addRow([]);
  notesRow.height = 30;
  
  const noteCell = worksheet.getCell(`A${worksheet.rowCount + 1}`);
  noteCell.value = 'Hinweis: Liegenschaft und Gebäude werden automatisch erstellt, falls sie noch nicht existieren.';
  noteCell.font = { italic: true, color: { argb: 'FF808080' } };
  worksheet.mergeCells(`A${worksheet.rowCount}:U${worksheet.rowCount}`);
  
  // Save file
  const templatePath = path.join(__dirname, 'templates', 'anlagen_import_template.xlsx');
  await workbook.xlsx.writeFile(templatePath);
  console.log('Anlagen Import Template created:', templatePath);
}

async function createTemplates() {
  console.log('Creating import templates...\n');
  
  try {
    await createAksTemplate();
    await createAnlagenTemplate();
    
    console.log('\n✅ Both templates created successfully!');
    console.log('Templates are located in:', path.join(__dirname, 'templates'));
  } catch (error) {
    console.error('Error creating templates:', error);
  }
}

createTemplates();