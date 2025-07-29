const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');
const { sequelize } = require('../src/config/database');
const { Mandant, User, Anlage, AksCode, ImportJob } = require('../src/models');

describe('Import Worker', () => {
  let testMandant;
  let testUser;
  let testAksCode;
  let testExcelFile;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test mandant
    testMandant = await Mandant.create({
      name: 'Test Mandant',
      kurzbezeichnung: 'TEST',
      adresse: {
        strasse: 'Teststraße',
        hausnummer: '123',
        plz: '12345',
        ort: 'Teststadt',
        land: 'Deutschland'
      },
      kontakt: {
        email: 'test@mandant.de',
        telefon: '+49 123 456789',
        ansprechpartner: 'Test User'
      },
      einstellungen: {
        maxAnlagen: 1000,
        maxBenutzer: 50,
        features: ['excel_import']
      },
      aktiv: true
    });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      mandantId: testMandant.id,
      aktiv: true
    });

    // Create test AKS code
    testAksCode = await AksCode.create({
      code: 'HZ001',
      bezeichnung: 'Heizungsanlage',
      kategorie: 'Heizung',
      pflichtfelder: ['hersteller', 'typ', 'baujahr'],
      validierungsregeln: {
        baujahr: { min: 1990, max: 2030 },
        leistung: { min: 1, max: 1000 }
      },
      mandantId: testMandant.id
    });

    // Create test Excel file
    await createTestExcelFile();
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testExcelFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear anlagen and import jobs before each test
    await Anlage.destroy({ where: { mandantId: testMandant.id } });
    await ImportJob.destroy({ where: { mandantId: testMandant.id } });
  });

  async function createTestExcelFile() {
    const testData = [
      {
        'QR-Code': 'QR001',
        'Objekt-ID': 'OBJ001',
        'Raum': 'Keller',
        'AKS-Code': 'HZ001',
        'Bezeichnung': 'Heizung Keller',
        'Hersteller': 'Viessmann',
        'Typ': 'Vitola 200',
        'Seriennummer': 'V123456',
        'Baujahr': 2015,
        'Leistung': 25.5,
        'Status': 'aktiv'
      },
      {
        'QR-Code': 'QR002',
        'Objekt-ID': 'OBJ002',
        'Raum': 'Dachboden',
        'AKS-Code': 'HZ001',
        'Bezeichnung': 'Heizung Dachboden',
        'Hersteller': 'Buderus',
        'Typ': 'Logano G124',
        'Seriennummer': 'B789012',
        'Baujahr': 2018,
        'Leistung': 30.0,
        'Status': 'aktiv'
      },
      {
        'QR-Code': 'QR003',
        'Objekt-ID': 'OBJ003',
        'Raum': 'Garage',
        'AKS-Code': 'HZ001',
        'Bezeichnung': 'Heizung Garage',
        'Hersteller': 'Wolf',
        'Typ': 'CGB-2',
        'Seriennummer': 'W345678',
        'Baujahr': 2020,
        'Leistung': 20.0,
        'Status': 'wartung'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Anlagen');

    testExcelFile = path.join(__dirname, 'test-import.xlsx');
    XLSX.writeFile(workbook, testExcelFile);
  }

  async function runImportWorker(jobData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, '../src/workers/importWorker.js'), {
        workerData: jobData
      });

      let result = null;
      let error = null;

      worker.on('message', (data) => {
        if (data.type === 'progress') {
          // Handle progress updates
          console.log(`Import progress: ${data.progress}%`);
        } else if (data.type === 'result') {
          result = data;
        } else if (data.type === 'error') {
          error = new Error(data.message);
        }
      });

      worker.on('error', (err) => {
        error = err;
      });

      worker.on('exit', (code) => {
        if (code !== 0 && !error) {
          error = new Error(`Worker stopped with exit code ${code}`);
        }
        
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  describe('Excel File Processing', () => {
    it('should successfully process valid Excel file', async () => {
      const importJob = await ImportJob.create({
        filename: 'test-import.xlsx',
        originalName: 'test-import.xlsx',
        filePath: testExcelFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Anlagen',
          startRow: 2,
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'seriennummer': 'Seriennummer',
            'baujahr': 'Baujahr',
            'leistung': 'Leistung',
            'status': 'Status'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.type).toBe('result');
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(3);
      expect(result.data.imported).toBe(3);
      expect(result.data.errors).toBe(0);

      // Verify data was imported
      const importedAnlagen = await Anlage.findAll({ 
        where: { mandantId: testMandant.id } 
      });
      expect(importedAnlagen).toHaveLength(3);
      
      const anlage1 = importedAnlagen.find(a => a.qrCode === 'QR001');
      expect(anlage1).toBeTruthy();
      expect(anlage1.hersteller).toBe('Viessmann');
      expect(anlage1.baujahr).toBe(2015);
      expect(anlage1.leistung).toBe(25.5);

      // Verify job status was updated
      await importJob.reload();
      expect(importJob.status).toBe('completed');
      expect(importJob.ergebnis.imported).toBe(3);
    });

    it('should handle missing Excel file', async () => {
      const importJob = await ImportJob.create({
        filename: 'nonexistent.xlsx',
        originalName: 'nonexistent.xlsx',
        filePath: '/path/to/nonexistent.xlsx',
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {}
      });

      await expect(runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      })).rejects.toThrow();

      // Verify job status was updated
      await importJob.reload();
      expect(importJob.status).toBe('failed');
    });

    it('should handle corrupted Excel file', async () => {
      // Create corrupted file
      const corruptedFile = path.join(__dirname, 'corrupted.xlsx');
      await fs.writeFile(corruptedFile, 'This is not an Excel file');

      const importJob = await ImportJob.create({
        filename: 'corrupted.xlsx',
        originalName: 'corrupted.xlsx',
        filePath: corruptedFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {}
      });

      await expect(runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      })).rejects.toThrow();

      // Clean up
      await fs.unlink(corruptedFile);
    });

    it('should handle empty Excel file', async () => {
      // Create empty Excel file
      const emptyWorksheet = XLSX.utils.aoa_to_sheet([]);
      const emptyWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(emptyWorkbook, emptyWorksheet, 'Empty');

      const emptyFile = path.join(__dirname, 'empty.xlsx');
      XLSX.writeFile(emptyWorkbook, emptyFile);

      const importJob = await ImportJob.create({
        filename: 'empty.xlsx',
        originalName: 'empty.xlsx',
        filePath: emptyFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Empty'
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(0);
      expect(result.data.imported).toBe(0);

      // Clean up
      await fs.unlink(emptyFile);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      // Create Excel with missing required fields
      const invalidData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'HZ001',
          // Missing required 'Hersteller'
          'Typ': 'Vitola 200',
          'Baujahr': 2015
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(invalidData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid');

      const invalidFile = path.join(__dirname, 'invalid.xlsx');
      XLSX.writeFile(workbook, invalidFile);

      const importJob = await ImportJob.create({
        filename: 'invalid.xlsx',
        originalName: 'invalid.xlsx',
        filePath: invalidFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Invalid',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(1);
      expect(result.data.imported).toBe(0);
      expect(result.data.errors).toBe(1);
      expect(result.data.errorDetails).toHaveLength(1);
      expect(result.data.errorDetails[0].error).toContain('hersteller');

      // Clean up
      await fs.unlink(invalidFile);
    });

    it('should validate data types and ranges', async () => {
      // Create Excel with invalid data types
      const invalidData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Test Heizung',
          'Hersteller': 'Viessmann',
          'Typ': 'Vitola 200',
          'Baujahr': 1850, // Invalid year (too old)
          'Leistung': -5 // Invalid negative value
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(invalidData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid');

      const invalidFile = path.join(__dirname, 'invalid-ranges.xlsx');
      XLSX.writeFile(workbook, invalidFile);

      const importJob = await ImportJob.create({
        filename: 'invalid-ranges.xlsx',
        originalName: 'invalid-ranges.xlsx',
        filePath: invalidFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Invalid',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr',
            'leistung': 'Leistung'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(1);
      expect(result.data.imported).toBe(0);
      expect(result.data.errors).toBe(1);
      expect(result.data.errorDetails[0].error).toContain('validation');

      // Clean up
      await fs.unlink(invalidFile);
    });

    it('should validate AKS code exists', async () => {
      const invalidData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'NONEXISTENT', // Invalid AKS code
          'Bezeichnung': 'Test Anlage',
          'Hersteller': 'Test Hersteller',
          'Typ': 'Test Typ',
          'Baujahr': 2020
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(invalidData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid');

      const invalidFile = path.join(__dirname, 'invalid-aks.xlsx');
      XLSX.writeFile(workbook, invalidFile);

      const importJob = await ImportJob.create({
        filename: 'invalid-aks.xlsx',
        originalName: 'invalid-aks.xlsx',
        filePath: invalidFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Invalid',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.data.errors).toBe(1);
      expect(result.data.errorDetails[0].error).toContain('AKS');

      // Clean up
      await fs.unlink(invalidFile);
    });
  });

  describe('Batch Processing', () => {
    it('should process large files in batches', async () => {
      // Create large Excel file (100 rows)
      const largeData = [];
      for (let i = 1; i <= 100; i++) {
        largeData.push({
          'QR-Code': `QR${i.toString().padStart(3, '0')}`,
          'Objekt-ID': `OBJ${i}`,
          'Raum': `Raum ${i}`,
          'AKS-Code': 'HZ001',
          'Bezeichnung': `Heizung ${i}`,
          'Hersteller': 'Viessmann',
          'Typ': 'Vitola 200',
          'Seriennummer': `S${i}`,
          'Baujahr': 2015,
          'Leistung': 25.0,
          'Status': 'aktiv'
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(largeData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Large');

      const largeFile = path.join(__dirname, 'large.xlsx');
      XLSX.writeFile(workbook, largeFile);

      const importJob = await ImportJob.create({
        filename: 'large.xlsx',
        originalName: 'large.xlsx',
        filePath: largeFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Large',
          batchSize: 10,
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'seriennummer': 'Seriennummer',
            'baujahr': 'Baujahr',
            'leistung': 'Leistung',
            'status': 'Status'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(100);
      expect(result.data.imported).toBe(100);

      // Verify all data was imported
      const importedAnlagen = await Anlage.findAll({ 
        where: { mandantId: testMandant.id } 
      });
      expect(importedAnlagen).toHaveLength(100);

      // Clean up
      await fs.unlink(largeFile);
    }, 30000); // Increase timeout for large file processing
  });

  describe('Duplicate Handling', () => {
    it('should handle duplicate QR codes within import', async () => {
      const duplicateData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Heizung 1',
          'Hersteller': 'Viessmann',
          'Typ': 'Vitola 200',
          'Baujahr': 2015
        },
        {
          'QR-Code': 'QR001', // Duplicate
          'Objekt-ID': 'OBJ002',
          'Raum': 'Dachboden',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Heizung 2',
          'Hersteller': 'Buderus',
          'Typ': 'Logano',
          'Baujahr': 2018
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(duplicateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Duplicates');

      const duplicateFile = path.join(__dirname, 'duplicates.xlsx');
      XLSX.writeFile(workbook, duplicateFile);

      const importJob = await ImportJob.create({
        filename: 'duplicates.xlsx',
        originalName: 'duplicates.xlsx',
        filePath: duplicateFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Duplicates',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.data.processed).toBe(2);
      expect(result.data.imported).toBe(1); // Only first one imported
      expect(result.data.errors).toBe(1); // Second one rejected

      // Clean up
      await fs.unlink(duplicateFile);
    });

    it('should handle updates to existing records', async () => {
      // First, create an existing record
      await Anlage.create({
        qrCode: 'QR001',
        objektId: 'OBJ001',
        raum: 'Keller',
        aksCode: 'HZ001',
        bezeichnung: 'Original Heizung',
        hersteller: 'Original Hersteller',
        typ: 'Original Typ',
        baujahr: 2010,
        mandantId: testMandant.id
      });

      // Now import with update mode
      const updateData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Updated Heizung',
          'Hersteller': 'Updated Hersteller',
          'Typ': 'Updated Typ',
          'Baujahr': 2020
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(updateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Updates');

      const updateFile = path.join(__dirname, 'updates.xlsx');
      XLSX.writeFile(workbook, updateFile);

      const importJob = await ImportJob.create({
        filename: 'updates.xlsx',
        originalName: 'updates.xlsx',
        filePath: updateFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Updates',
          updateMode: true,
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(1);
      expect(result.data.updated).toBe(1);

      // Verify the record was updated
      const updatedAnlage = await Anlage.findOne({ 
        where: { qrCode: 'QR001', mandantId: testMandant.id } 
      });
      expect(updatedAnlage.bezeichnung).toBe('Updated Heizung');
      expect(updatedAnlage.baujahr).toBe(2020);

      // Clean up
      await fs.unlink(updateFile);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during import', async () => {
      const importJob = await ImportJob.create({
        filename: 'test-import.xlsx',
        originalName: 'test-import.xlsx',
        filePath: testExcelFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Anlagen',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const progressUpdates = [];

      const worker = new Worker(path.join(__dirname, '../src/workers/importWorker.js'), {
        workerData: {
          jobId: importJob.id,
          mandantId: testMandant.id,
          userId: testUser.id
        }
      });

      worker.on('message', (data) => {
        if (data.type === 'progress') {
          progressUpdates.push(data.progress);
        }
      });

      await new Promise((resolve, reject) => {
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Worker exited with code ${code}`));
        });
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });

  describe('Error Recovery', () => {
    it('should continue processing after individual record errors', async () => {
      const mixedData = [
        {
          'QR-Code': 'QR001',
          'Objekt-ID': 'OBJ001',
          'Raum': 'Keller',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Valid Heizung',
          'Hersteller': 'Viessmann',
          'Typ': 'Vitola 200',
          'Baujahr': 2015
        },
        {
          'QR-Code': 'QR002',
          'Objekt-ID': 'OBJ002',
          'Raum': 'Dachboden',
          'AKS-Code': 'INVALID', // Invalid AKS code
          'Bezeichnung': 'Invalid Heizung',
          'Hersteller': 'Buderus',
          'Typ': 'Logano',
          'Baujahr': 2018
        },
        {
          'QR-Code': 'QR003',
          'Objekt-ID': 'OBJ003',
          'Raum': 'Garage',
          'AKS-Code': 'HZ001',
          'Bezeichnung': 'Another Valid Heizung',
          'Hersteller': 'Wolf',
          'Typ': 'CGB-2',
          'Baujahr': 2020
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(mixedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mixed');

      const mixedFile = path.join(__dirname, 'mixed.xlsx');
      XLSX.writeFile(workbook, mixedFile);

      const importJob = await ImportJob.create({
        filename: 'mixed.xlsx',
        originalName: 'mixed.xlsx',
        filePath: mixedFile,
        type: 'anlagen',
        status: 'pending',
        userId: testUser.id,
        mandantId: testMandant.id,
        konfiguration: {
          sheetName: 'Mixed',
          mapping: {
            'qrCode': 'QR-Code',
            'objektId': 'Objekt-ID',
            'raum': 'Raum',
            'aksCode': 'AKS-Code',
            'bezeichnung': 'Bezeichnung',
            'hersteller': 'Hersteller',
            'typ': 'Typ',
            'baujahr': 'Baujahr'
          }
        }
      });

      const result = await runImportWorker({
        jobId: importJob.id,
        mandantId: testMandant.id,
        userId: testUser.id
      });

      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(3);
      expect(result.data.imported).toBe(2); // QR001 and QR003
      expect(result.data.errors).toBe(1); // QR002 failed

      // Verify the valid records were imported
      const importedAnlagen = await Anlage.findAll({ 
        where: { mandantId: testMandant.id } 
      });
      expect(importedAnlagen).toHaveLength(2);
      expect(importedAnlagen.some(a => a.qrCode === 'QR001')).toBe(true);
      expect(importedAnlagen.some(a => a.qrCode === 'QR003')).toBe(true);

      // Clean up
      await fs.unlink(mixedFile);
    });
  });
});