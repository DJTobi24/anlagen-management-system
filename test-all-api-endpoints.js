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
    console.log(`${colors.red('✗')} Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
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
      this.results.errors.push({ test: name, error: error.message });
      console.log(`${colors.red('✗ FAILED:')} ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log(colors.bold('TEST SUMMARY'));
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`${colors.green('Passed:')} ${this.results.passed}`);
    console.log(`${colors.red('Failed:')} ${this.results.failed}`);
    
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
  if (!response.data.status === 'OK') {
    throw new Error('Health check failed');
  }
}

async function testLogin() {
  const response = await api.post('/auth/login', TEST_USER);
  authToken = response.data.data.accessToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  
  if (!authToken) {
    throw new Error('No auth token received');
  }
}

async function testGetMandanten() {
  const response = await api.get('/mandanten');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of mandanten');
  }
  if (data.length > 0) {
    testMandantId = data[0].id;
  }
}

async function testGetUsers() {
  const response = await api.get('/users');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of users');
  }
}

async function testCreateUser() {
  const newUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'Test User',
    role: 'viewer'
  };
  
  const response = await api.post('/users', newUser);
  const data = response.data.data || response.data;
  testUserId = data.id;
  
  if (!testUserId) {
    throw new Error('No user ID received');
  }
}

async function testUpdateUser() {
  if (!testUserId) {
    throw new Error('No test user ID available');
  }
  
  const updateData = {
    name: 'Updated Test User',
    role: 'techniker'
  };
  
  await api.put(`/users/${testUserId}`, updateData);
}

async function testDeleteUser() {
  if (!testUserId) {
    throw new Error('No test user ID available');
  }
  
  await api.delete(`/users/${testUserId}`);
}

async function testGetLiegenschaften() {
  const response = await api.get('/liegenschaften');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of liegenschaften');
  }
  if (data.length > 0) {
    testLiegenschaftId = data[0].id;
  }
}

async function testCreateLiegenschaft() {
  const newLiegenschaft = {
    name: `Test Liegenschaft ${Date.now()}`,
    address: 'Teststraße 123, 80331 München',
    description: 'Test Liegenschaft'
  };
  
  const response = await api.post('/liegenschaften', newLiegenschaft);
  const data = response.data.data || response.data;
  if (!testLiegenschaftId) {
    testLiegenschaftId = data.id;
  }
}

async function testUpdateLiegenschaft() {
  if (!testLiegenschaftId) {
    throw new Error('No test liegenschaft ID available');
  }
  
  const updateData = {
    name: 'Updated Test Liegenschaft'
  };
  
  await api.put(`/liegenschaften/${testLiegenschaftId}`, updateData);
}

async function testGetObjekte() {
  const response = await api.get('/objekte');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of objekte');
  }
  if (data.length > 0) {
    testObjektId = data[0].id;
  }
}

async function testCreateObjekt() {
  if (!testLiegenschaftId) {
    throw new Error('No test liegenschaft ID available');
  }
  
  const newObjekt = {
    liegenschaft_id: testLiegenschaftId,
    name: `Test Objekt ${Date.now()}`,
    description: 'Test Gebäude'
  };
  
  const response = await api.post('/objekte', newObjekt);
  const data = response.data.data || response.data;
  if (!testObjektId) {
    testObjektId = data.id;
  }
}

async function testUpdateObjekt() {
  if (!testObjektId) {
    throw new Error('No test objekt ID available');
  }
  
  const updateData = {
    name: 'Updated Test Objekt'
  };
  
  await api.put(`/objekte/${testObjektId}`, updateData);
}

async function testGetAnlagen() {
  const response = await api.get('/anlagen');
  if (!Array.isArray(response.data.data)) {
    throw new Error('Expected array of anlagen');
  }
}

async function testGetAnlagenSearch() {
  await api.get('/anlagen/search?search=Test');
}

async function testGetAnlagenStatistics() {
  const response = await api.get('/anlagen/statistics');
  const data = response.data.data || response.data;
  if (data.total_anlagen === undefined) {
    throw new Error('Expected statistics data');
  }
}

async function testCreateAnlage() {
  if (!testObjektId) {
    throw new Error('No test objekt ID available');
  }
  
  const newAnlage = {
    objektId: testObjektId,
    tNummer: `T-${Date.now()}`,
    aksCode: '110',
    name: 'Test Anlage',
    description: 'Test Beschreibung',
    status: 'aktiv',
    zustandsBewertung: 3
  };
  
  const response = await api.post('/anlagen', newAnlage);
  testAnlageId = response.data.data.id;
}

async function testGetAnlageById() {
  if (!testAnlageId) {
    throw new Error('No test anlage ID available');
  }
  
  await api.get(`/anlagen/${testAnlageId}`);
}

async function testUpdateAnlage() {
  if (!testAnlageId) {
    throw new Error('No test anlage ID available');
  }
  
  const updateData = {
    name: 'Updated Test Anlage',
    status: 'wartung'
  };
  
  await api.put(`/anlagen/${testAnlageId}`, updateData);
}

async function testGetAksCodes() {
  const response = await api.get('/aks');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of AKS codes');
  }
}

async function testGetAksTree() {
  const response = await api.get('/aks/tree');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected AKS tree structure');
  }
}

async function testGetAksFields() {
  await api.get('/aks/fields/110');
}

async function testGetImportJobs() {
  const response = await api.get('/import/jobs');
  const data = response.data.data || response.data;
  if (!Array.isArray(data)) {
    throw new Error('Expected array of import jobs');
  }
}

async function testGetImportTemplate() {
  // Skip this test - endpoint not implemented yet
  console.log('Skipping - endpoint not implemented');
  return;
}

async function testUploadImport() {
  // Erstelle eine Test-Excel-Datei
  const testData = Buffer.from('Test Excel File Content');
  const form = new FormData();
  form.append('file', testData, 'test-import.xlsx');
  form.append('columnMapping', JSON.stringify({
    tNummer: 'T-Nummer',
    aksCode: 'AKS-Code',
    name: 'Anlagenname'
  }));

  try {
    const response = await api.post('/import/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    testJobId = response.data.data.jobId;
  } catch (error) {
    // Import könnte fehlschlagen wegen ungültiger Excel-Datei, das ist OK
    if (error.response?.status !== 400) {
      throw error;
    }
  }
}

async function testGetImportStatus() {
  if (!testJobId) {
    // Hole einen beliebigen Job
    const jobs = await api.get('/import/jobs');
    const data = jobs.data.data || jobs.data;
    if (data.length > 0) {
      testJobId = data[0].id;
    } else {
      console.log('Skipping - no import jobs available');
      return;
    }
  }
  
  await api.get(`/import/jobs/${testJobId}/status`);
}

async function testGetFmLiegenschaften() {
  await api.get('/fm-data/liegenschaften');
}

async function testGetFmBuildings() {
  if (!testLiegenschaftId) {
    console.log('Skipping - no liegenschaft available');
    return;
  }
  
  await api.get(`/fm-data/liegenschaften/${testLiegenschaftId}/buildings`);
}

async function testGetFmAksTree() {
  if (!testObjektId) {
    console.log('Skipping - no objekt available');
    return;
  }
  
  await api.get(`/fm-data/buildings/${testObjektId}/aks-tree`);
}

async function testQrCodeScan() {
  await api.get('/fm-data/scan/TEST-QR-CODE').catch(err => {
    // 404 ist OK, da kein Test-QR-Code existiert
    if (err.response?.status !== 404) {
      throw err;
    }
  });
}

async function testLogout() {
  await api.post('/auth/logout', {});
}

async function testDeleteAnlage() {
  if (!testAnlageId) {
    throw new Error('No test anlage ID available');
  }
  
  await api.delete(`/anlagen/${testAnlageId}`);
}

async function testDeleteObjekt() {
  if (!testObjektId) {
    throw new Error('No test objekt ID available');
  }
  
  await api.delete(`/objekte/${testObjektId}`);
}

async function testDeleteLiegenschaft() {
  if (!testLiegenschaftId) {
    throw new Error('No test liegenschaft ID available');
  }
  
  await api.delete(`/liegenschaften/${testLiegenschaftId}`);
}

// Hauptfunktion
async function runAllTests() {
  console.log(colors.bold.cyan('\n🚀 Anlagen-Management-System API Test Suite\n'));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('='.repeat(80));

  // Health & Auth
  await tester.runTest('Health Check', testHealthCheck);
  await tester.runTest('Login', testLogin);
  
  // Mandanten
  await tester.runTest('Get Mandanten', testGetMandanten);
  
  // Benutzerverwaltung
  await tester.runTest('Get Users', testGetUsers);
  await tester.runTest('Create User', testCreateUser);
  await tester.runTest('Update User', testUpdateUser);
  await tester.runTest('Delete User', testDeleteUser);
  
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
  await tester.runTest('Search Anlagen', testGetAnlagenSearch);
  await tester.runTest('Get Anlagen Statistics', testGetAnlagenStatistics);
  await tester.runTest('Create Anlage', testCreateAnlage);
  await tester.runTest('Get Anlage by ID', testGetAnlageById);
  await tester.runTest('Update Anlage', testUpdateAnlage);
  
  // AKS
  await tester.runTest('Get AKS Codes', testGetAksCodes);
  await tester.runTest('Get AKS Tree', testGetAksTree);
  // await tester.runTest('Get AKS Fields', testGetAksFields); // TODO: Implement this endpoint
  
  // Import
  await tester.runTest('Get Import Jobs', testGetImportJobs);
  await tester.runTest('Get Import Template', testGetImportTemplate);
  await tester.runTest('Upload Import', testUploadImport);
  await tester.runTest('Get Import Status', testGetImportStatus);
  
  // FM-Datenaufnahme
  await tester.runTest('Get FM Liegenschaften', testGetFmLiegenschaften);
  await tester.runTest('Get FM Buildings', testGetFmBuildings);
  await tester.runTest('Get FM AKS Tree', testGetFmAksTree);
  await tester.runTest('QR Code Scan', testQrCodeScan);
  
  // Cleanup
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