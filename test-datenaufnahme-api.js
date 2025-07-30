const axios = require('axios');
const fs = require('fs');

// Konfiguration
const API_BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let testAuftragId = '';
let testUserId = '';

// API-Client erstellen
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token aus Datei lesen
try {
  authToken = fs.readFileSync('token.txt', 'utf8').trim();
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
} catch (error) {
  console.error('❌ Fehler: token.txt nicht gefunden. Bitte erst test-api-complete.js ausführen.');
  process.exit(1);
}

// Hilfsfunktionen
function logTest(name, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
}

// Test-Suite
async function runTests() {
  console.log('\n🧪 Teste Datenaufnahme API...\n');

  try {
    // 1. Verfügbare Mitarbeiter abrufen
    console.log('1️⃣ Teste Mitarbeiter-Abruf...');
    try {
      const usersResponse = await api.get('/users');
      const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
      const mitarbeiter = users.filter(u => u.role === 'mitarbeiter');
      if (mitarbeiter.length > 0) {
        testUserId = mitarbeiter[0].id;
        logTest('Mitarbeiter abrufen', true, `${mitarbeiter.length} Mitarbeiter gefunden`);
      } else {
        // Admin als Fallback
        testUserId = users[0].id;
        logTest('Mitarbeiter abrufen', true, 'Verwende Admin als Test-Mitarbeiter');
      }
    } catch (error) {
      logTest('Mitarbeiter abrufen', false, error.response?.data?.message || error.message);
    }

    // 2. Liegenschaften für Test abrufen
    console.log('\n2️⃣ Teste Liegenschaften-Abruf...');
    let testLiegenschaftId = '';
    try {
      const liegenschaftResponse = await api.get('/liegenschaften');
      if (liegenschaftResponse.data.length > 0) {
        testLiegenschaftId = liegenschaftResponse.data[0].id;
        logTest('Liegenschaften abrufen', true, `${liegenschaftResponse.data.length} Liegenschaften gefunden`);
      }
    } catch (error) {
      logTest('Liegenschaften abrufen', false, error.response?.data?.message || error.message);
    }

    // 3. Neue Datenaufnahme erstellen
    console.log('\n3️⃣ Teste Datenaufnahme erstellen...');
    try {
      const createData = {
        titel: 'Test-Datenaufnahme ' + new Date().toISOString(),
        beschreibung: 'Automatisch generierte Test-Datenaufnahme',
        zugewiesen_an: testUserId,
        start_datum: new Date().toISOString().split('T')[0],
        end_datum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        liegenschaft_ids: testLiegenschaftId ? [testLiegenschaftId] : []
      };

      const createResponse = await api.post('/datenaufnahme', createData);
      testAuftragId = createResponse.data.data.id;
      logTest('Datenaufnahme erstellen', true, `ID: ${testAuftragId}`);
    } catch (error) {
      logTest('Datenaufnahme erstellen', false, error.response?.data?.message || error.message);
    }

    // 4. Alle Datenaufnahmen abrufen
    console.log('\n4️⃣ Teste Datenaufnahmen abrufen...');
    try {
      const listResponse = await api.get('/datenaufnahme');
      logTest('Datenaufnahmen abrufen', true, `${listResponse.data.length} Aufträge gefunden`);
    } catch (error) {
      logTest('Datenaufnahmen abrufen', false, error.response?.data?.message || error.message);
    }

    // 5. Einzelne Datenaufnahme abrufen
    if (testAuftragId) {
      console.log('\n5️⃣ Teste einzelne Datenaufnahme abrufen...');
      try {
        const detailResponse = await api.get(`/datenaufnahme/${testAuftragId}`);
        const details = detailResponse.data;
        logTest('Einzelne Datenaufnahme', true, 
          `Statistik: ${details.statistik?.gesamt_anlagen || 0} Anlagen`);
      } catch (error) {
        logTest('Einzelne Datenaufnahme', false, error.response?.data?.message || error.message);
      }
    }

    // 6. Datenaufnahme aktualisieren
    if (testAuftragId) {
      console.log('\n6️⃣ Teste Datenaufnahme aktualisieren...');
      try {
        const updateData = {
          status: 'in_bearbeitung',
          beschreibung: 'Aktualisierte Beschreibung'
        };
        await api.put(`/datenaufnahme/${testAuftragId}`, updateData);
        logTest('Datenaufnahme aktualisieren', true);
      } catch (error) {
        logTest('Datenaufnahme aktualisieren', false, error.response?.data?.message || error.message);
      }
    }

    // 7. Fortschritt abrufen
    if (testAuftragId) {
      console.log('\n7️⃣ Teste Fortschritt abrufen...');
      try {
        const fortschrittResponse = await api.get(`/datenaufnahme/${testAuftragId}/fortschritt`);
        logTest('Fortschritt abrufen', true, `${fortschrittResponse.data.length} Einträge`);
      } catch (error) {
        logTest('Fortschritt abrufen', false, error.response?.data?.message || error.message);
      }
    }

    // 8. Filter testen
    console.log('\n8️⃣ Teste Filter-Funktionen...');
    try {
      // Nach Status filtern
      const statusResponse = await api.get('/datenaufnahme?status=in_bearbeitung');
      logTest('Filter nach Status', true, `${statusResponse.data.length} Aufträge in Bearbeitung`);
      
      // Nach Mitarbeiter filtern
      const mitarbeiterResponse = await api.get(`/datenaufnahme?zugewiesen_an=${testUserId}`);
      logTest('Filter nach Mitarbeiter', true, `${mitarbeiterResponse.data.length} Aufträge zugewiesen`);
    } catch (error) {
      logTest('Filter-Funktionen', false, error.response?.data?.message || error.message);
    }

    // 9. Datenaufnahme löschen (Aufräumen)
    if (testAuftragId) {
      console.log('\n9️⃣ Teste Datenaufnahme löschen...');
      try {
        await api.delete(`/datenaufnahme/${testAuftragId}`);
        logTest('Datenaufnahme löschen', true);
      } catch (error) {
        logTest('Datenaufnahme löschen', false, error.response?.data?.message || error.message);
      }
    }

    console.log('\n✅ Datenaufnahme API-Tests abgeschlossen!\n');

  } catch (error) {
    console.error('\n❌ Fehler bei Tests:', error.message);
  }
}

// Tests ausführen
runTests();