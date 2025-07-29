'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // 1. Mandanten erstellen
    const mandanten = [
      {
        id: uuidv4(),
        name: 'TechnoFacility Management GmbH',
        kurzbezeichnung: 'TFM',
        adresse: JSON.stringify({
          strasse: 'Industriestraße',
          hausnummer: '42',
          plz: '10117',
          ort: 'Berlin',
          land: 'Deutschland'
        }),
        kontakt: JSON.stringify({
          email: 'info@technofacility.de',
          telefon: '+49 30 123456789',
          ansprechpartner: 'Thomas Müller'
        }),
        einstellungen: JSON.stringify({
          maxAnlagen: 5000,
          maxBenutzer: 100,
          features: ['excel_import', 'qr_scanner', 'bulk_operations', 'audit_log']
        }),
        aktiv: true,
        erstelltAm: now,
        aktualisiertAm: now
      },
      {
        id: uuidv4(),
        name: 'Stadtwerke Musterstadt AG',
        kurzbezeichnung: 'SWM',
        adresse: JSON.stringify({
          strasse: 'Energieweg',
          hausnummer: '15',
          plz: '80331',
          ort: 'München',
          land: 'Deutschland'
        }),
        kontakt: JSON.stringify({
          email: 'service@stadtwerke-musterstadt.de',
          telefon: '+49 89 987654321',
          ansprechpartner: 'Maria Schmidt'
        }),
        einstellungen: JSON.stringify({
          maxAnlagen: 10000,
          maxBenutzer: 200,
          features: ['excel_import', 'qr_scanner', 'bulk_operations', 'audit_log', 'advanced_reporting']
        }),
        aktiv: true,
        erstelltAm: now,
        aktualisiertAm: now
      },
      {
        id: uuidv4(),
        name: 'Immobilien Service Nord GmbH',
        kurzbezeichnung: 'ISN',
        adresse: JSON.stringify({
          strasse: 'Hafenstraße',
          hausnummer: '88',
          plz: '20457',
          ort: 'Hamburg',
          land: 'Deutschland'
        }),
        kontakt: JSON.stringify({
          email: 'kontakt@immo-service-nord.de',
          telefon: '+49 40 555666777',
          ansprechpartner: 'Dr. Andreas Weber'
        }),
        einstellungen: JSON.stringify({
          maxAnlagen: 2000,
          maxBenutzer: 50,
          features: ['excel_import', 'qr_scanner', 'audit_log']
        }),
        aktiv: true,
        erstelltAm: now,
        aktualisiertAm: now
      }
    ];

    await queryInterface.bulkInsert('Mandanten', mandanten);

    // 2. AKS-Codes erstellen
    const aksCodes = [
      // Heizungsanlagen
      {
        id: uuidv4(),
        code: 'HZ001',
        bezeichnung: 'Gasheizkessel',
        kategorie: 'Heizung',
        beschreibung: 'Zentrale Gasheizungsanlage mit Brennwertkessel',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'leistung', 'brennstoff']),
        optionaleFelder: JSON.stringify(['seriennummer', 'wartungsvertrag', 'effizienzklasse']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1980, max: 2030, message: 'Baujahr muss zwischen 1980 und 2030 liegen' },
          leistung: { type: 'number', min: 5, max: 2000, message: 'Leistung muss zwischen 5 und 2000 kW liegen' },
          brennstoff: { type: 'enum', values: ['erdgas', 'propan', 'biogas'], message: 'Ungültiger Brennstofftyp' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },
      {
        id: uuidv4(),
        code: 'HZ002',
        bezeichnung: 'Ölheizkessel',
        kategorie: 'Heizung',
        beschreibung: 'Zentrale Ölheizungsanlage',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'leistung', 'tankvolumen']),
        optionaleFelder: JSON.stringify(['seriennummer', 'wartungsvertrag', 'letzteWartung']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1980, max: 2030 },
          leistung: { type: 'number', min: 5, max: 2000 },
          tankvolumen: { type: 'number', min: 500, max: 50000, message: 'Tankvolumen muss zwischen 500 und 50000 Liter liegen' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },
      {
        id: uuidv4(),
        code: 'HZ003',
        bezeichnung: 'Wärmepumpe',
        kategorie: 'Heizung',
        beschreibung: 'Luft- oder Erdwärmepumpe',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'waermequelle', 'cop_wert']),
        optionaleFelder: JSON.stringify(['seriennummer', 'kuehlmittel', 'schallpegel']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 2000, max: 2030 },
          waermequelle: { type: 'enum', values: ['luft', 'erdreich', 'grundwasser'], message: 'Ungültige Wärmequelle' },
          cop_wert: { type: 'number', min: 2.0, max: 6.0, message: 'COP-Wert muss zwischen 2.0 und 6.0 liegen' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },

      // Lüftungsanlagen
      {
        id: uuidv4(),
        code: 'LU001',
        bezeichnung: 'Zentrale Lüftungsanlage',
        kategorie: 'Lüftung',
        beschreibung: 'Zentrale raumlufttechnische Anlage mit Wärmerückgewinnung',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'volumenstrom', 'filterklasse']),
        optionaleFelder: JSON.stringify(['waermerueckgewinnung', 'schallpegel', 'energieeffizienz']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1990, max: 2030 },
          volumenstrom: { type: 'number', min: 100, max: 100000, message: 'Volumenstrom muss zwischen 100 und 100000 m³/h liegen' },
          filterklasse: { type: 'enum', values: ['G1', 'G2', 'G3', 'G4', 'M5', 'M6', 'F7', 'F8', 'F9', 'H10', 'H11', 'H12'] }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },
      {
        id: uuidv4(),
        code: 'LU002',
        bezeichnung: 'Dezentrale Lüftungsanlage',
        kategorie: 'Lüftung',
        beschreibung: 'Dezentrale Einzelraumlüftung',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'raumvolumen']),
        optionaleFelder: JSON.stringify(['schallpegel', 'energieeffizienz', 'fernbedienung']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 2000, max: 2030 },
          raumvolumen: { type: 'number', min: 10, max: 1000, message: 'Raumvolumen muss zwischen 10 und 1000 m³ liegen' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },

      // Elektroanlagen
      {
        id: uuidv4(),
        code: 'EL001',
        bezeichnung: 'Hauptverteilung',
        kategorie: 'Elektro',
        beschreibung: 'Hauptstromverteilung des Gebäudes',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'bemessungsstrom', 'spannungsebene']),
        optionaleFelder: JSON.stringify(['schutzart', 'fehlerstromschutz', 'ueberspannungsschutz']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1970, max: 2030 },
          bemessungsstrom: { type: 'number', min: 16, max: 4000, message: 'Bemessungsstrom muss zwischen 16 und 4000 A liegen' },
          spannungsebene: { type: 'enum', values: ['230V', '400V', '10kV', '20kV'], message: 'Ungültige Spannungsebene' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },

      // Sanitäranlagen
      {
        id: uuidv4(),
        code: 'SA001',
        bezeichnung: 'Trinkwasserversorgung',
        kategorie: 'Sanitär',
        beschreibung: 'Zentrale Trinkwasserversorgungsanlage',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'nennweite', 'werkstoff']),
        optionaleFelder: JSON.stringify(['isolierung', 'druckhaltung', 'zirkulation']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1960, max: 2030 },
          nennweite: { type: 'enum', values: ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN65', 'DN80', 'DN100'] },
          werkstoff: { type: 'enum', values: ['kupfer', 'edelstahl', 'kunststoff', 'verbundrohr'] }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      },

      // Aufzugsanlagen
      {
        id: uuidv4(),
        code: 'AU001',
        bezeichnung: 'Personenaufzug',
        kategorie: 'Aufzug',
        beschreibung: 'Elektrischer Personenaufzug',
        pflichtfelder: JSON.stringify(['hersteller', 'typ', 'baujahr', 'tragkraft', 'geschwindigkeit']),
        optionaleFelder: JSON.stringify(['haltestellen', 'antriebsart', 'steuerung']),
        validierungsregeln: JSON.stringify({
          baujahr: { type: 'number', min: 1950, max: 2030 },
          tragkraft: { type: 'number', min: 300, max: 5000, message: 'Tragkraft muss zwischen 300 und 5000 kg liegen' },
          geschwindigkeit: { type: 'number', min: 0.5, max: 3.0, message: 'Geschwindigkeit muss zwischen 0.5 und 3.0 m/s liegen' }
        }),
        mandantId: mandanten[0].id,
        erstelltAm: now,
        aktualisiertAm: now
      }
    ];

    // AKS-Codes für alle Mandanten duplizieren
    const allAksCodes = [];
    mandanten.forEach(mandant => {
      aksCodes.forEach(aks => {
        allAksCodes.push({
          ...aks,
          id: uuidv4(),
          mandantId: mandant.id
        });
      });
    });

    await queryInterface.bulkInsert('AksCodes', allAksCodes);

    // 3. Liegenschaften erstellen
    const liegenschaften = [];
    mandanten.forEach((mandant, mandantIndex) => {
      const liegenschaftCount = [5, 8, 3][mandantIndex]; // Verschiedene Anzahl pro Mandant
      
      for (let i = 0; i < liegenschaftCount; i++) {
        liegenschaften.push({
          id: uuidv4(),
          name: `Liegenschaft ${i + 1} - ${mandant.kurzbezeichnung}`,
          adresse: JSON.stringify({
            strasse: `Musterstraße ${i + 1}`,
            hausnummer: `${(i + 1) * 10}`,
            plz: ['10115', '80331', '20457'][mandantIndex],
            ort: ['Berlin', 'München', 'Hamburg'][mandantIndex],
            land: 'Deutschland'
          }),
          flaeche: Math.floor(Math.random() * 5000) + 1000,
          baujahr: Math.floor(Math.random() * 50) + 1970,
          gebaeudetyp: ['büro', 'wohnen', 'industrie', 'bildung', 'gesundheit'][Math.floor(Math.random() * 5)],
          mandantId: mandant.id,
          erstelltAm: now,
          aktualisiertAm: now
        });
      }
    });

    await queryInterface.bulkInsert('Liegenschaften', liegenschaften);

    // 4. Objekte erstellen
    const objekte = [];
    liegenschaften.forEach(liegenschaft => {
      const objektCount = Math.floor(Math.random() * 4) + 2; // 2-5 Objekte pro Liegenschaft
      
      for (let i = 0; i < objektCount; i++) {
        objekte.push({
          id: uuidv4(),
          name: `Gebäude ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
          etage: Math.floor(Math.random() * 10) - 2, // -2 bis 7
          raum: `${Math.floor(Math.random() * 50) + 100}`, // Raumnummer 100-149
          flaeche: Math.floor(Math.random() * 200) + 20,
          liegenschaftId: liegenschaft.id,
          mandantId: liegenschaft.mandantId,
          erstelltAm: now,
          aktualisiertAm: now
        });
      }
    });

    await queryInterface.bulkInsert('Objekte', objekte);

    // 5. Benutzer erstellen
    const saltRounds = 10;
    const users = [];
    
    // Admin-Benutzer für jeden Mandanten
    for (let i = 0; i < mandanten.length; i++) {
      users.push({
        id: uuidv4(),
        email: `admin@${mandanten[i].kurzbezeichnung.toLowerCase()}.com`,
        passwort: await bcrypt.hash('admin123', saltRounds),
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        aktiv: true,
        mandantId: mandanten[i].id,
        letzterLogin: now,
        erstelltAm: now,
        aktualisiertAm: now
      });
    }

    // Techniker und Aufnehmer
    const rollen = ['techniker', 'aufnehmer'];
    const vornamen = ['Max', 'Anna', 'Peter', 'Lisa', 'Tom', 'Sarah', 'Michael', 'Nina', 'David', 'Maria'];
    const nachnamen = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'];
    
    mandanten.forEach((mandant, index) => {
      for (let i = 0; i < 10; i++) { // 10 Benutzer pro Mandant
        const vorname = vornamen[Math.floor(Math.random() * vornamen.length)];
        const nachname = nachnamen[Math.floor(Math.random() * nachnamen.length)];
        const rolle = rollen[Math.floor(Math.random() * rollen.length)];
        
        users.push({
          id: uuidv4(),
          email: `${vorname.toLowerCase()}.${nachname.toLowerCase()}@${mandant.kurzbezeichnung.toLowerCase()}.com`,
          passwort: await bcrypt.hash('password123', saltRounds),
          firstName: vorname,
          lastName: nachname,
          role: rolle,
          aktiv: Math.random() > 0.1, // 90% aktiv
          mandantId: mandant.id,
          letzterLogin: Math.random() > 0.3 ? new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          erstelltAm: now,
          aktualisiertAm: now
        });
      }
    });

    await queryInterface.bulkInsert('Users', users);

    // 6. Anlagen erstellen (200 Stück)
    const anlagen = [];
    const statusOptions = ['aktiv', 'inaktiv', 'wartung', 'defekt'];
    const herstellerOptions = ['Viessmann', 'Buderus', 'Junkers', 'Vaillant', 'Wolf', 'Bosch', 'Siemens', 'ABB', 'Schneider', 'Kone'];
    
    // Gleichmäßige Verteilung auf Mandanten
    const anlagenProMandant = Math.floor(200 / mandanten.length);
    
    mandanten.forEach((mandant, mandantIndex) => {
      const mandantObjekte = objekte.filter(obj => obj.mandantId === mandant.id);
      const mandantAksCodes = allAksCodes.filter(aks => aks.mandantId === mandant.id);
      
      for (let i = 0; i < anlagenProMandant; i++) {
        const randomObjekt = mandantObjekte[Math.floor(Math.random() * mandantObjekte.length)];
        const randomAks = mandantAksCodes[Math.floor(Math.random() * mandantAksCodes.length)];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        const hersteller = herstellerOptions[Math.floor(Math.random() * herstellerOptions.length)];
        
        // QR-Code generieren
        const qrCode = `QR${mandant.kurzbezeichnung}${String(i + 1).padStart(4, '0')}`;
        
        // Dynamische Felder basierend auf AKS-Code
        const dynamicFields = generateDynamicFields(randomAks, hersteller);
        
        anlagen.push({
          id: uuidv4(),
          qrCode: qrCode,
          bezeichnung: `${randomAks.bezeichnung} ${i + 1}`,
          beschreibung: `${randomAks.bezeichnung} im ${randomObjekt.name}, Raum ${randomObjekt.raum}`,
          aksCode: randomAks.code,
          status: status,
          zustandsBewertung: Math.floor(Math.random() * 5) + 1, // 1-5
          standort: JSON.stringify({
            gebaeude: randomObjekt.name,
            etage: randomObjekt.etage,
            raum: randomObjekt.raum
          }),
          technischeDaten: JSON.stringify(dynamicFields),
          wartungsintervall: Math.floor(Math.random() * 12) + 1, // 1-12 Monate
          letzteWartung: Math.random() > 0.3 ? new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
          naechsteWartung: new Date(now + Math.random() * 180 * 24 * 60 * 60 * 1000),
          objektId: randomObjekt.id,
          mandantId: mandant.id,
          erstelltAm: new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000), // Verschiedene Erstelldaten
          aktualisiertAm: now
        });
      }
    });
    
    // Restliche Anlagen verteilen
    const remainingAnlagen = 200 - (anlagenProMandant * mandanten.length);
    for (let i = 0; i < remainingAnlagen; i++) {
      const randomMandant = mandanten[Math.floor(Math.random() * mandanten.length)];
      const mandantObjekte = objekte.filter(obj => obj.mandantId === randomMandant.id);
      const mandantAksCodes = allAksCodes.filter(aks => aks.mandantId === randomMandant.id);
      
      const randomObjekt = mandantObjekte[Math.floor(Math.random() * mandantObjekte.length)];
      const randomAks = mandantAksCodes[Math.floor(Math.random() * mandantAksCodes.length)];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const hersteller = herstellerOptions[Math.floor(Math.random() * herstellerOptions.length)];
      
      const qrCode = `QR${randomMandant.kurzbezeichnung}${String(anlagenProMandant + i + 1).padStart(4, '0')}`;
      const dynamicFields = generateDynamicFields(randomAks, hersteller);
      
      anlagen.push({
        id: uuidv4(),
        qrCode: qrCode,
        bezeichnung: `${randomAks.bezeichnung} ${anlagenProMandant + i + 1}`,
        beschreibung: `${randomAks.bezeichnung} im ${randomObjekt.name}, Raum ${randomObjekt.raum}`,
        aksCode: randomAks.code,
        status: status,
        zustandsBewertung: Math.floor(Math.random() * 5) + 1,
        standort: JSON.stringify({
          gebaeude: randomObjekt.name,
          etage: randomObjekt.etage,
          raum: randomObjekt.raum
        }),
        technischeDaten: JSON.stringify(dynamicFields),
        wartungsintervall: Math.floor(Math.random() * 12) + 1,
        letzteWartung: Math.random() > 0.3 ? new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
        naechsteWartung: new Date(now + Math.random() * 180 * 24 * 60 * 60 * 1000),
        objektId: randomObjekt.id,
        mandantId: randomMandant.id,
        erstelltAm: new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000),
        aktualisiertAm: now
      });
    }

    await queryInterface.bulkInsert('Anlagen', anlagen);

    // 7. Import-Jobs erstellen (Beispiel-Historie)
    const importJobs = [];
    mandanten.forEach(mandant => {
      for (let i = 0; i < 5; i++) {
        const status = ['completed', 'failed', 'completed', 'completed', 'processing'][i];
        const recordsCount = Math.floor(Math.random() * 100) + 10;
        const errorsCount = status === 'failed' ? Math.floor(Math.random() * 10) + 1 : 0;
        
        importJobs.push({
          id: uuidv4(),
          filename: `import_${mandant.kurzbezeichnung.toLowerCase()}_${i + 1}.xlsx`,
          originalname: `Anlagen_Export_${mandant.kurzbezeichnung}_${new Date(now - (i * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}.xlsx`,
          status: status,
          progress: status === 'completed' ? 100 : (status === 'processing' ? Math.floor(Math.random() * 80) + 10 : 0),
          totalRecords: recordsCount,
          processedRecords: status === 'completed' ? recordsCount : Math.floor(recordsCount * 0.7),
          successfulRecords: status === 'completed' ? recordsCount - errorsCount : Math.floor(recordsCount * 0.6),
          errorRecords: errorsCount,
          errors: errorsCount > 0 ? JSON.stringify([
            { row: 5, field: 'baujahr', message: 'Baujahr liegt außerhalb des gültigen Bereichs' },
            { row: 12, field: 'aksCode', message: 'AKS-Code nicht gefunden' }
          ]) : null,
          startedAt: new Date(now - (i * 7 * 24 * 60 * 60 * 1000)),
          completedAt: status === 'completed' ? new Date(now - (i * 7 * 24 * 60 * 60 * 1000) + Math.random() * 60 * 60 * 1000) : null,
          mandantId: mandant.id,
          erstelltAm: new Date(now - (i * 7 * 24 * 60 * 60 * 1000)),
          aktualisiertAm: now
        });
      }
    });

    await queryInterface.bulkInsert('ImportJobs', importJobs);

    console.log('✅ Demo-Daten erfolgreich erstellt:');
    console.log(`   - ${mandanten.length} Mandanten`);
    console.log(`   - ${allAksCodes.length} AKS-Codes`);
    console.log(`   - ${liegenschaften.length} Liegenschaften`);
    console.log(`   - ${objekte.length} Objekte`);
    console.log(`   - ${users.length} Benutzer`);
    console.log(`   - ${anlagen.length} Anlagen`);
    console.log(`   - ${importJobs.length} Import-Jobs`);
  },

  async down(queryInterface, Sequelize) {
    // Lösche Daten in umgekehrter Reihenfolge der Abhängigkeiten
    await queryInterface.bulkDelete('ImportJobs', null, {});
    await queryInterface.bulkDelete('Anlagen', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Objekte', null, {});
    await queryInterface.bulkDelete('Liegenschaften', null, {});
    await queryInterface.bulkDelete('AksCodes', null, {});
    await queryInterface.bulkDelete('Mandanten', null, {});
  }
};

// Hilfsfunktion für dynamische Felder
function generateDynamicFields(aksCode, hersteller) {
  const baseData = {
    hersteller: hersteller,
    seriennummer: `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    baujahr: Math.floor(Math.random() * 30) + 1995
  };

  switch (aksCode.kategorie) {
    case 'Heizung':
      return {
        ...baseData,
        typ: `${hersteller} ${['Vitola', 'Logano', 'Vitodens', 'Logamax'][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 500) + 100}`,
        leistung: Math.floor(Math.random() * 200) + 20,
        brennstoff: ['erdgas', 'heizoel', 'pellets'][Math.floor(Math.random() * 3)],
        effizienzklasse: ['A+++', 'A++', 'A+', 'A'][Math.floor(Math.random() * 4)],
        wartungsvertrag: Math.random() > 0.5
      };
      
    case 'Lüftung':
      return {
        ...baseData,
        typ: `${hersteller} Ventilator ${Math.floor(Math.random() * 1000) + 100}`,
        volumenstrom: Math.floor(Math.random() * 5000) + 500,
        filterklasse: ['G4', 'M5', 'M6', 'F7', 'F8'][Math.floor(Math.random() * 5)],
        schallpegel: Math.floor(Math.random() * 20) + 30,
        waermerueckgewinnung: Math.random() > 0.3
      };
      
    case 'Elektro':
      return {
        ...baseData,
        typ: `${hersteller} Schaltschrank ${Math.floor(Math.random() * 100) + 10}`,
        bemessungsstrom: [16, 25, 35, 50, 63, 80, 100, 125, 160, 200][Math.floor(Math.random() * 10)],
        spannungsebene: ['230V', '400V'][Math.floor(Math.random() * 2)],
        schutzart: ['IP20', 'IP40', 'IP54', 'IP65'][Math.floor(Math.random() * 4)],
        fehlerstromschutz: Math.random() > 0.2
      };
      
    case 'Sanitär':
      return {
        ...baseData,
        typ: `${hersteller} Rohrsystem DN${[15, 20, 25, 32, 40, 50][Math.floor(Math.random() * 6)]}`,
        nennweite: `DN${[15, 20, 25, 32, 40, 50][Math.floor(Math.random() * 6)]}`,
        werkstoff: ['kupfer', 'edelstahl', 'kunststoff'][Math.floor(Math.random() * 3)],
        isolierung: Math.random() > 0.3,
        druckhaltung: Math.random() > 0.4
      };
      
    case 'Aufzug':
      return {
        ...baseData,
        typ: `${hersteller} Personenaufzug ${Math.floor(Math.random() * 100) + 1}`,
        tragkraft: [320, 480, 630, 800, 1000, 1275, 1600][Math.floor(Math.random() * 7)],
        geschwindigkeit: [0.63, 1.0, 1.6, 2.5][Math.floor(Math.random() * 4)],
        haltestellen: Math.floor(Math.random() * 20) + 2,
        antriebsart: ['seilzug', 'hydraulisch', 'maschinenraumlos'][Math.floor(Math.random() * 3)]
      };
      
    default:
      return baseData;
  }
}