import { faker } from '@faker-js/faker/locale/de';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// AKS-Codes aus der Dokumentation
const aksCodes = [
  { code: '110', bezeichnung: 'Allgemeine elektrische Anlagen', kategorie: 'Elektro' },
  { code: '111', bezeichnung: 'Niederspannungsanlagen', kategorie: 'Elektro' },
  { code: '112', bezeichnung: 'Mittelspannungsanlagen', kategorie: 'Elektro' },
  { code: '113', bezeichnung: 'Hochspannungsanlagen', kategorie: 'Elektro' },
  { code: '120', bezeichnung: 'Beleuchtungsanlagen', kategorie: 'Elektro' },
  { code: '121', bezeichnung: 'Innenbeleuchtung', kategorie: 'Elektro' },
  { code: '122', bezeichnung: 'Außenbeleuchtung', kategorie: 'Elektro' },
  { code: '123', bezeichnung: 'Notbeleuchtung', kategorie: 'Elektro' },
  { code: '130', bezeichnung: 'Kommunikationsanlagen', kategorie: 'IT' },
  { code: '131', bezeichnung: 'Telefonanlagen', kategorie: 'IT' },
  { code: '132', bezeichnung: 'Netzwerkinfrastruktur', kategorie: 'IT' },
  { code: '133', bezeichnung: 'Serveranlagen', kategorie: 'IT' },
  { code: '210', bezeichnung: 'Heizungsanlagen', kategorie: 'HVAC' },
  { code: '211', bezeichnung: 'Gasheizung', kategorie: 'HVAC' },
  { code: '212', bezeichnung: 'Ölheizung', kategorie: 'HVAC' },
  { code: '213', bezeichnung: 'Wärmepumpen', kategorie: 'HVAC' },
  { code: '220', bezeichnung: 'Lüftungsanlagen', kategorie: 'HVAC' },
  { code: '221', bezeichnung: 'Zentrale Lüftung', kategorie: 'HVAC' },
  { code: '222', bezeichnung: 'Dezentrale Lüftung', kategorie: 'HVAC' },
  { code: '230', bezeichnung: 'Klimaanlagen', kategorie: 'HVAC' },
  { code: '231', bezeichnung: 'Split-Klimaanlagen', kategorie: 'HVAC' },
  { code: '232', bezeichnung: 'VRF-Systeme', kategorie: 'HVAC' },
  { code: '310', bezeichnung: 'Wasserversorgung', kategorie: 'Sanitär' },
  { code: '311', bezeichnung: 'Trinkwasseranlagen', kategorie: 'Sanitär' },
  { code: '312', bezeichnung: 'Warmwasserbereitung', kategorie: 'Sanitär' },
  { code: '320', bezeichnung: 'Abwasseranlagen', kategorie: 'Sanitär' },
  { code: '321', bezeichnung: 'Schmutzwasser', kategorie: 'Sanitär' },
  { code: '322', bezeichnung: 'Regenwasser', kategorie: 'Sanitär' },
  { code: '410', bezeichnung: 'Aufzugsanlagen', kategorie: 'Transport' },
  { code: '411', bezeichnung: 'Personenaufzüge', kategorie: 'Transport' },
  { code: '412', bezeichnung: 'Lastenaufzüge', kategorie: 'Transport' },
  { code: '420', bezeichnung: 'Fahrtreppen', kategorie: 'Transport' },
  { code: '510', bezeichnung: 'Brandmeldeanlagen', kategorie: 'Sicherheit' },
  { code: '511', bezeichnung: 'Rauchmelder', kategorie: 'Sicherheit' },
  { code: '512', bezeichnung: 'Sprinkleranlagen', kategorie: 'Sicherheit' },
  { code: '520', bezeichnung: 'Sicherheitsanlagen', kategorie: 'Sicherheit' },
  { code: '521', bezeichnung: 'Einbruchmeldeanlagen', kategorie: 'Sicherheit' },
  { code: '522', bezeichnung: 'Videoüberwachung', kategorie: 'Sicherheit' },
  { code: '523', bezeichnung: 'Zugangskontrolle', kategorie: 'Sicherheit' }
];

interface Mandant {
  id: string;
  name: string;
  code: string;
  beschreibung: string;
  aktiv: boolean;
}

interface User {
  id: string;
  email: string;
  passwort: string;
  name: string;
  rolle: string;
  mandant_id: string;
  aktiv: boolean;
}

interface Anlage {
  id: string;
  anlagen_nummer: string;
  bezeichnung: string;
  liegenschaft: string;
  objekt: string;
  aks_code: string;
  hersteller: string;
  modell: string;
  seriennummer: string;
  baujahr: number;
  letzte_wartung: string;
  naechste_wartung: string;
  status: string;
  mandant_id: string;
  wartungsintervall_monate: number;
  anschaffungswert: number;
  standort: string;
  verantwortlicher: string;
  bemerkungen: string;
}

// Generiere Test-Daten
function generateTestData() {
  const mandanten: Mandant[] = [
    {
      id: '1',
      name: 'Stadtwerke München',
      code: 'SWM',
      beschreibung: 'Kommunaler Energieversorger und Infrastrukturdienstleister',
      aktiv: true
    },
    {
      id: '2',
      name: 'Immobilien Berlin GmbH',
      code: 'IBG',
      beschreibung: 'Verwaltung städtischer Immobilien in Berlin',
      aktiv: true
    },
    {
      id: '3',
      name: 'Klinikum Frankfurt',
      code: 'KLF',
      beschreibung: 'Universitätsklinikum mit mehreren Standorten',
      aktiv: true
    }
  ];

  // Generiere Benutzer
  const users: User[] = [];
  const rollen = ['admin', 'manager', 'techniker', 'viewer'];
  
  mandanten.forEach((mandant, idx) => {
    // Admin pro Mandant
    users.push({
      id: `${idx * 10 + 1}`,
      email: `admin@${mandant.code.toLowerCase()}.de`,
      passwort: bcrypt.hashSync('Admin123!', 10),
      name: `Admin ${mandant.name}`,
      rolle: 'admin',
      mandant_id: mandant.id,
      aktiv: true
    });

    // Weitere Benutzer
    for (let i = 0; i < 5; i++) {
      users.push({
        id: `${idx * 10 + i + 2}`,
        email: faker.internet.email({ provider: `${mandant.code.toLowerCase()}.de` }),
        passwort: bcrypt.hashSync('User123!', 10),
        name: faker.person.fullName(),
        rolle: rollen[Math.floor(Math.random() * rollen.length)],
        mandant_id: mandant.id,
        aktiv: Math.random() > 0.1
      });
    }
  });

  // Generiere Anlagen
  const anlagen: Anlage[] = [];
  const hersteller = ['Siemens', 'Bosch', 'Schneider Electric', 'ABB', 'Vaillant', 'Viessmann', 'Daikin', 'Mitsubishi'];
  const status = ['aktiv', 'wartung', 'störung', 'außer Betrieb'];
  const liegenschaften = {
    '1': ['Hauptverwaltung', 'Kraftwerk Nord', 'Umspannwerk Süd', 'Wasserwerk Ost'],
    '2': ['Bürogebäude A', 'Wohnanlage Mitte', 'Gewerbezentrum West', 'Parkhaus Nord'],
    '3': ['Hauptgebäude', 'Chirurgie', 'Innere Medizin', 'Psychiatrie', 'Verwaltung']
  };

  let anlagenCounter = 1;
  
  mandanten.forEach(mandant => {
    const mandantLiegenschaften = liegenschaften[mandant.id];
    
    // Pro Liegenschaft verschiedene Anlagen
    mandantLiegenschaften.forEach(liegenschaft => {
      // Zufällige Anzahl von Anlagen pro Liegenschaft (10-20)
      const anlagenProLiegenschaft = 10 + Math.floor(Math.random() * 11);
      
      for (let i = 0; i < anlagenProLiegenschaft; i++) {
        const aksCode = aksCodes[Math.floor(Math.random() * aksCodes.length)];
        const baujahr = 2000 + Math.floor(Math.random() * 24);
        const wartungsintervall = [3, 6, 12, 24][Math.floor(Math.random() * 4)];
        const letzteWartung = faker.date.between({ from: '2023-01-01', to: '2024-12-31' });
        const naechsteWartung = new Date(letzteWartung);
        naechsteWartung.setMonth(naechsteWartung.getMonth() + wartungsintervall);
        
        anlagen.push({
          id: anlagenCounter.toString(),
          anlagen_nummer: `${mandant.code}-${String(anlagenCounter).padStart(5, '0')}`,
          bezeichnung: `${aksCode.bezeichnung} ${faker.company.buzzNoun()}`,
          liegenschaft: liegenschaft,
          objekt: `${faker.company.buzzAdjective()} ${faker.number.int({ min: 1, max: 5 })}`,
          aks_code: aksCode.code,
          hersteller: hersteller[Math.floor(Math.random() * hersteller.length)],
          modell: faker.vehicle.model(),
          seriennummer: faker.string.alphanumeric(10).toUpperCase(),
          baujahr: baujahr,
          letzte_wartung: letzteWartung.toISOString().split('T')[0],
          naechste_wartung: naechsteWartung.toISOString().split('T')[0],
          status: status[Math.floor(Math.random() * status.length)],
          mandant_id: mandant.id,
          wartungsintervall_monate: wartungsintervall,
          anschaffungswert: faker.number.int({ min: 1000, max: 150000 }),
          standort: `${faker.location.buildingNumber()}.${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 1, max: 20 })}`,
          verantwortlicher: faker.person.fullName(),
          bemerkungen: Math.random() > 0.7 ? faker.lorem.sentence() : ''
        });
        
        anlagenCounter++;
      }
    });
  });

  return { mandanten, users, anlagen, aksCodes };
}

// SQL-Dateien generieren
function generateSQL(data: ReturnType<typeof generateTestData>) {
  const { mandanten, users, anlagen, aksCodes } = data;
  
  let sql = `-- Test-Daten für Anlagen-Management-System
-- Generiert am: ${new Date().toISOString()}

-- Lösche vorhandene Daten
TRUNCATE TABLE anlagen, users, mandanten, aks_codes RESTART IDENTITY CASCADE;

-- AKS-Codes einfügen
INSERT INTO aks_codes (code, bezeichnung, kategorie, aktiv) VALUES
`;
  
  sql += aksCodes.map(aks => 
    `('${aks.code}', '${aks.bezeichnung}', '${aks.kategorie}', true)`
  ).join(',\n') + ';\n\n';

  // Mandanten
  sql += `-- Mandanten einfügen
INSERT INTO mandanten (name, code, beschreibung, aktiv) VALUES
`;
  
  sql += mandanten.map(m => 
    `('${m.name}', '${m.code}', '${m.beschreibung}', ${m.aktiv})`
  ).join(',\n') + ';\n\n';

  // Users
  sql += `-- Benutzer einfügen
INSERT INTO users (email, passwort, name, rolle, mandant_id, aktiv) VALUES
`;
  
  sql += users.map(u => 
    `('${u.email}', '${u.passwort}', '${u.name}', '${u.rolle}', ${u.mandant_id}, ${u.aktiv})`
  ).join(',\n') + ';\n\n';

  // Anlagen
  sql += `-- Anlagen einfügen
INSERT INTO anlagen (
  anlagen_nummer, bezeichnung, liegenschaft, objekt, aks_code, 
  hersteller, modell, seriennummer, baujahr, letzte_wartung, 
  naechste_wartung, status, mandant_id, wartungsintervall_monate,
  anschaffungswert, standort, verantwortlicher, bemerkungen
) VALUES
`;
  
  sql += anlagen.map(a => 
    `('${a.anlagen_nummer}', '${a.bezeichnung}', '${a.liegenschaft}', '${a.objekt}', '${a.aks_code}',
     '${a.hersteller}', '${a.modell}', '${a.seriennummer}', ${a.baujahr}, '${a.letzte_wartung}',
     '${a.naechste_wartung}', '${a.status}', ${a.mandant_id}, ${a.wartungsintervall_monate},
     ${a.anschaffungswert}, '${a.standort}', '${a.verantwortlicher}', '${a.bemerkungen}')`
  ).join(',\n') + ';\n';

  return sql;
}

// Excel-Import-Datei generieren
function generateExcelImport(anlagen: Anlage[]) {
  const wb = XLSX.utils.book_new();
  
  // Anlagen-Sheet
  const anlagenData = anlagen.slice(0, 50).map(a => ({
    'Anlagen-Nr': a.anlagen_nummer,
    'Bezeichnung': a.bezeichnung,
    'Liegenschaft': a.liegenschaft,
    'Objekt': a.objekt,
    'AKS-Code': a.aks_code,
    'Hersteller': a.hersteller,
    'Modell': a.modell,
    'Seriennummer': a.seriennummer,
    'Baujahr': a.baujahr,
    'Letzte Wartung': a.letzte_wartung,
    'Nächste Wartung': a.naechste_wartung,
    'Status': a.status,
    'Wartungsintervall (Monate)': a.wartungsintervall_monate,
    'Anschaffungswert': a.anschaffungswert,
    'Standort': a.standort,
    'Verantwortlicher': a.verantwortlicher,
    'Bemerkungen': a.bemerkungen
  }));
  
  const ws = XLSX.utils.json_to_sheet(anlagenData);
  XLSX.utils.book_append_sheet(wb, ws, 'Anlagen');
  
  // AKS-Codes Sheet
  const aksData = aksCodes.map(aks => ({
    'Code': aks.code,
    'Bezeichnung': aks.bezeichnung,
    'Kategorie': aks.kategorie
  }));
  
  const aksWs = XLSX.utils.json_to_sheet(aksData);
  XLSX.utils.book_append_sheet(wb, aksWs, 'AKS-Codes');
  
  return wb;
}

// Hauptfunktion
async function main() {
  console.log('Generiere Test-Daten...');
  
  const data = generateTestData();
  console.log(`✓ ${data.mandanten.length} Mandanten generiert`);
  console.log(`✓ ${data.users.length} Benutzer generiert`);
  console.log(`✓ ${data.anlagen.length} Anlagen generiert`);
  
  // SQL-Datei
  const sql = generateSQL(data);
  const sqlPath = path.join(__dirname, '../src/migrations/005_test_data.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`✓ SQL-Datei geschrieben: ${sqlPath}`);
  
  // Excel-Import-Datei
  const wb = generateExcelImport(data.anlagen);
  const excelPath = path.join(__dirname, '../demo-data/demo-import.xlsx');
  XLSX.writeFile(wb, excelPath);
  console.log(`✓ Excel-Import-Datei geschrieben: ${excelPath}`);
  
  // Benutzer-Übersicht
  const userOverview = path.join(__dirname, '../demo-data/test-users.txt');
  const userText = `Test-Benutzer für Anlagen-Management-System
==========================================

Mandant: Stadtwerke München (SWM)
---------------------------------
Admin: admin@swm.de / Admin123!
Weitere Benutzer: User123!

Mandant: Immobilien Berlin GmbH (IBG)
-------------------------------------
Admin: admin@ibg.de / Admin123!
Weitere Benutzer: User123!

Mandant: Klinikum Frankfurt (KLF)
---------------------------------
Admin: admin@klf.de / Admin123!
Weitere Benutzer: User123!

Alle weiteren Benutzer verwenden das Passwort: User123!
`;
  
  fs.writeFileSync(userOverview, userText);
  console.log(`✓ Benutzer-Übersicht geschrieben: ${userOverview}`);
  
  console.log('\nTest-Daten erfolgreich generiert!');
}

// Ausführen
main().catch(console.error);