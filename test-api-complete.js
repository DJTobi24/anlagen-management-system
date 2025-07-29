#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const FormData = require('form-data');

// Konfiguration
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'admin@swm.de',
  password: 'Admin123!'
};

// Test-Daten
let authToken = '';
let refreshToken = '';
let testMandantId = '';
let testLiegenschaftId = '';
let testObjektId = '';
let testAnlageId = '';
let testUserId = '';
let testJobId = '';

// Axios-Instanz
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request/Response Interceptor für besseres Logging
api.interceptors.request.use(request => {
  console.log(`${colors.blue('→')} ${request.method.toUpperCase()} ${request.url}`);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log(`${colors.green('✓')} Status: ${response.status}`);
    return response;
  },
  error => {
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    console.log(`${colors.red('✗')} Error: ${error.response?.status} - ${errorMsg}`);
    return Promise.reject(error);
  }
);

// Test-Runner
class APITester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    console.log(`\n${colors.yellow('Testing:')} ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`${colors.green('✓ PASSED')}`);
    } catch (error) {
      this.results.failed++;
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      this.results.errors.push({ test: name, error: errorMsg });
      console.log(`${colors.red('✗ FAILED:')} ${errorMsg}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log(colors.bold('TEST SUMMARY'));
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`${colors.green('Passed:')} ${this.results.passed}`);
    console.log(`${colors.red('Failed:')} ${this.results.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n' + colors.red('Failed Tests:'));
      this.results.errors.forEach(err => {
        console.log(`  - ${err.test}: ${err.error}`);
      });
    }
  }
}

const tester = new APITester();

// Test-Funktionen
async function testHealthCheck() {
  const response = await api.get('/health');
  if (response.data.status !== 'OK') {
    throw new Error('Health check failed');
  }
}

async function testLogin() {
  const response = await api.post('/auth/login', TEST_USER);
  authToken = response.data.data.accessToken;
  refreshToken = response.data.data.refreshToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  
  if (!authToken || !refreshToken) {
    throw new Error('No auth tokens received');
  }
  
  console.log(colors.gray(`  → Access Token: ${authToken.substring(0, 20)}...`));
}

async function testGetCurrentUser() {
  const response = await api.get('/auth/me');
  const user = response.data.data || response.data;
  testMandantId = user.mandant_id || user.mandantId;
  console.log(colors.gray(`  → Current User: ${user.email} (Mandant: ${testMandantId})`));
}

async function testGetUsers() {
  const response = await api.get('/users');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of users');
  }
  console.log(colors.gray(`  → Found ${data.length} users`));
}

async function testGetLiegenschaften() {
  const response = await api.get('/liegenschaften');
  const data = response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of liegenschaften');
  }
  if (data.length > 0) {
    testLiegenschaftId = data[0].id;
  }
  console.log(colors.gray(`  → Found ${data.length} liegenschaften`));
}

async function testCreateLiegenschaft() {
  const newLiegenschaft = {
    name: `Test Liegenschaft ${Date.now()}`,
    address: 'Teststraße 123, 80331 München',
    description: 'Test Liegenschaft für API Tests'
  };
  
  const response = await api.post('/liegenschaften', newLiegenschaft);
  const data = response.data;
  testLiegenschaftId = data.id;
  
  if (!testLiegenschaftId) {
    throw new Error('No liegenschaft ID received');
  }
  console.log(colors.gray(`  → Created Liegenschaft: ${data.name} (ID: ${testLiegenschaftId})`));
}

async function testUpdateLiegenschaft() {
  if (!testLiegenschaftId) {
    throw new Error('No test liegenschaft ID available');
  }
  
  const updateData = {
    name: 'Updated Test Liegenschaft',
    description: 'Updated description'
  };
  
  const response = await api.put(`/liegenschaften/${testLiegenschaftId}`, updateData);
  console.log(colors.gray(`  → Updated Liegenschaft: ${response.data.name}`));
}

async function testGetObjekte() {
  const response = await api.get('/objekte');
  const data = response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of objekte');
  }
  if (data.length > 0) {
    testObjektId = data[0].id;
  }
  console.log(colors.gray(`  → Found ${data.length} objekte`));
}

async function testCreateObjekt() {
  if (!testLiegenschaftId) {
    // Get or create a liegenschaft first
    await testCreateLiegenschaft();
  }
  
  const newObjekt = {
    liegenschaft_id: testLiegenschaftId,
    name: `Test Objekt ${Date.now()}`,
    description: 'Test Gebäude für API Tests',
    adresse: 'Teststraße 123',
    baujahr: 2020
  };
  
  const response = await api.post('/objekte', newObjekt);
  const data = response.data;
  testObjektId = data.id;
  
  if (!testObjektId) {
    throw new Error('No objekt ID received');
  }
  console.log(colors.gray(`  → Created Objekt: ${data.name} (ID: ${testObjektId})`));
}

async function testUpdateObjekt() {
  if (!testObjektId) {
    throw new Error('No test objekt ID available');
  }
  
  const updateData = {
    name: 'Updated Test Objekt',
    description: 'Updated description'
  };
  
  const response = await api.put(`/objekte/${testObjektId}`, updateData);
  console.log(colors.gray(`  → Updated Objekt: ${response.data.name}`));
}

async function testGetAnlagen() {
  const response = await api.get('/anlagen');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of anlagen');
  }
  console.log(colors.gray(`  → Found ${data.length} anlagen`));
}

async function testSearchAnlagen() {
  const response = await api.get('/anlagen/search', {
    params: { search: 'Test' }
  });
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → Search returned ${data.length} results`));
}

async function testGetAnlagenStatistics() {
  const response = await api.get('/anlagen/statistics');
  const data = response.data.data || response.data;
  if (data.total_anlagen === undefined) {
    throw new Error('Expected statistics data with total_anlagen');
  }
  console.log(colors.gray(`  → Statistics: ${data.total_anlagen} total, ${data.aktive_anlagen} active`));
}

async function testCreateAnlage() {
  if (!testObjektId) {
    // Create objekt first
    await testCreateObjekt();
  }
  
  const newAnlage = {
    objektId: testObjektId,
    tNummer: `T-${Date.now()}`,
    aksCode: '110', // Allgemeine elektrische Anlagen
    name: 'Test Anlage',
    description: 'Test Beschreibung',
    status: 'aktiv',
    zustandsBewertung: 3
  };
  
  const response = await api.post('/anlagen', newAnlage);
  const data = response.data.data || response.data;
  testAnlageId = data.id;
  console.log(colors.gray(`  → Created Anlage: ${data.name} (ID: ${testAnlageId})`));
}

async function testGetAnlageById() {
  if (!testAnlageId) {
    throw new Error('No test anlage ID available');
  }
  
  const response = await api.get(`/anlagen/${testAnlageId}`);
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → Retrieved Anlage: ${data.name}`));
}

async function testUpdateAnlage() {
  if (!testAnlageId) {
    throw new Error('No test anlage ID available');
  }
  
  const updateData = {
    name: 'Updated Test Anlage',
    status: 'wartung',
    zustandsBewertung: 4
  };
  
  const response = await api.put(`/anlagen/${testAnlageId}`, updateData);
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → Updated Anlage: ${data.name} (Status: ${data.status})`));
}

async function testGetAksTree() {
  const response = await api.get('/aks/tree');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected AKS tree structure');
  }
  console.log(colors.gray(`  → AKS tree has ${data.length} root categories`));
}

async function testGetImportJobs() {
  const response = await api.get('/import/jobs');
  const data = response.data;
  // Import jobs might return an object with jobs array
  const jobs = data.jobs || data;
  console.log(colors.gray(`  → Found ${Array.isArray(jobs) ? jobs.length : 0} import jobs`));
}

async function testGetFmLiegenschaften() {
  const response = await api.get('/fm-data/liegenschaften');
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → FM Liegenschaften: ${data.length} found`));
}

async function testGetFmBuildings() {
  if (!testLiegenschaftId) {
    console.log(colors.gray('  → Skipping - no liegenschaft available'));
    return;
  }
  
  const response = await api.get(`/fm-data/liegenschaften/${testLiegenschaftId}/buildings`);
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → FM Buildings: ${data.length} found`));
}

async function testGetFmAksTree() {
  if (!testObjektId) {
    console.log(colors.gray('  → Skipping - no objekt available'));
    return;
  }
  
  const response = await api.get(`/fm-data/buildings/${testObjektId}/aks-tree`);
  const data = response.data.data || response.data;
  console.log(colors.gray(`  → FM AKS Tree retrieved`));
}

async function testQrCodeScan() {
  try {
    await api.get('/fm-data/scan/TEST-QR-CODE');
  } catch (err) {
    // 404 is expected for non-existent QR code
    if (err.response?.status === 404) {
      console.log(colors.gray('  → QR code not found (expected)'));
      return;
    }
    throw err;
  }
}

// Cleanup functions
async function testDeleteAnlage() {
  if (!testAnlageId) {
    console.log(colors.gray('  → Skipping - no test anlage to delete'));
    return;
  }
  
  await api.delete(`/anlagen/${testAnlageId}`);
  console.log(colors.gray(`  → Deleted Anlage: ${testAnlageId}`));
}

async function testDeleteObjekt() {
  if (!testObjektId) {
    console.log(colors.gray('  → Skipping - no test objekt to delete'));
    return;
  }
  
  // First delete all anlagen in this objekt
  const anlagen = await api.get('/anlagen', {
    params: { objektId: testObjektId }
  });
  
  await api.delete(`/objekte/${testObjektId}`);
  console.log(colors.gray(`  → Deleted Objekt: ${testObjektId}`));
}

async function testDeleteLiegenschaft() {
  if (!testLiegenschaftId) {
    console.log(colors.gray('  → Skipping - no test liegenschaft to delete'));
    return;
  }
  
  await api.delete(`/liegenschaften/${testLiegenschaftId}`);
  console.log(colors.gray(`  → Deleted Liegenschaft: ${testLiegenschaftId}`));
}

async function testLogout() {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  await api.post('/auth/logout', { refreshToken });
  console.log(colors.gray('  → Logged out successfully'));
}

// Hauptfunktion
async function runAllTests() {
  console.log(colors.bold.cyan('\n🚀 Anlagen-Management-System API Test Suite\n'));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('='.repeat(80));

  // Auth & Setup
  await tester.runTest('Health Check', testHealthCheck);
  await tester.runTest('Login', testLogin);
  await tester.runTest('Get Current User', testGetCurrentUser);
  
  // Benutzerverwaltung
  await tester.runTest('Get Users', testGetUsers);
  
  // Liegenschaften
  await tester.runTest('Get Liegenschaften', testGetLiegenschaften);
  await tester.runTest('Create Liegenschaft', testCreateLiegenschaft);
  await tester.runTest('Update Liegenschaft', testUpdateLiegenschaft);
  
  // Objekte
  await tester.runTest('Get Objekte', testGetObjekte);
  await tester.runTest('Create Objekt', testCreateObjekt);
  await tester.runTest('Update Objekt', testUpdateObjekt);
  
  // Anlagen
  await tester.runTest('Get Anlagen', testGetAnlagen);
  await tester.runTest('Search Anlagen', testSearchAnlagen);
  await tester.runTest('Get Anlagen Statistics', testGetAnlagenStatistics);
  await tester.runTest('Create Anlage', testCreateAnlage);
  await tester.runTest('Get Anlage by ID', testGetAnlageById);
  await tester.runTest('Update Anlage', testUpdateAnlage);
  
  // AKS
  await tester.runTest('Get AKS Tree', testGetAksTree);
  
  // Import
  await tester.runTest('Get Import Jobs', testGetImportJobs);
  
  // FM-Datenaufnahme
  await tester.runTest('Get FM Liegenschaften', testGetFmLiegenschaften);
  await tester.runTest('Get FM Buildings', testGetFmBuildings);
  await tester.runTest('Get FM AKS Tree', testGetFmAksTree);
  await tester.runTest('QR Code Scan', testQrCodeScan);
  
  // Cleanup (in reverse order)
  await tester.runTest('Delete Anlage', testDeleteAnlage);
  await tester.runTest('Delete Objekt', testDeleteObjekt);
  await tester.runTest('Delete Liegenschaft', testDeleteLiegenschaft);
  
  // Logout
  await tester.runTest('Logout', testLogout);
  
  // Zusammenfassung
  tester.printSummary();
  
  // Exit code basierend auf Ergebnissen
  process.exit(tester.results.failed > 0 ? 1 : 0);
}

// Fehlerbehandlung
process.on('unhandledRejection', (err) => {
  console.error(colors.red('\n❌ Unhandled rejection:'), err);
  process.exit(1);
});

// Tests ausführen
runAllTests().catch(err => {
  console.error(colors.red('\n❌ Fatal error:'), err);
  process.exit(1);
});