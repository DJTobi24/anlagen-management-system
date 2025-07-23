const { validateAks, validateAnlageData } = require('../src/utils/aksValidator');
const { AksCode, Mandant } = require('../src/models');
const { sequelize } = require('../src/config/database');

describe('AKS Validation', () => {
  let testMandant;
  let heizungAks, lueftungAks, komplexAks;

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

    // Create various AKS codes for testing
    heizungAks = await AksCode.create({
      code: 'HZ001',
      bezeichnung: 'Heizungsanlage',
      kategorie: 'Heizung',
      pflichtfelder: ['hersteller', 'typ', 'baujahr', 'leistung'],
      validierungsregeln: {
        baujahr: { 
          type: 'number',
          min: 1990, 
          max: 2030,
          message: 'Baujahr muss zwischen 1990 und 2030 liegen'
        },
        leistung: { 
          type: 'number',
          min: 1, 
          max: 1000,
          message: 'Leistung muss zwischen 1 und 1000 kW liegen'
        },
        hersteller: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
          message: 'Hersteller muss zwischen 2 und 50 Zeichen lang sein'
        },
        typ: {
          type: 'string',
          pattern: '^[A-Z0-9-]+$',
          message: 'Typ darf nur Großbuchstaben, Zahlen und Bindestriche enthalten'
        },
        status: {
          type: 'enum',
          values: ['aktiv', 'wartung', 'defekt', 'außer_betrieb'],
          message: 'Ungültiger Status'
        }
      },
      mandantId: testMandant.id
    });

    lueftungAks = await AksCode.create({
      code: 'LU001',
      bezeichnung: 'Lüftungsanlage',
      kategorie: 'Lüftung',
      pflichtfelder: ['hersteller', 'volumenstrom'],
      validierungsregeln: {
        volumenstrom: {
          type: 'number',
          min: 100,
          max: 50000,
          message: 'Volumenstrom muss zwischen 100 und 50000 m³/h liegen'
        },
        filterklasse: {
          type: 'enum',
          values: ['G1', 'G2', 'G3', 'G4', 'M5', 'M6', 'F7', 'F8', 'F9', 'H10', 'H11', 'H12'],
          message: 'Ungültige Filterklasse'
        },
        schallpegel: {
          type: 'number',
          max: 60,
          message: 'Schallpegel darf maximal 60 dB betragen'
        }
      },
      optionaleFelder: ['filterklasse', 'schallpegel', 'energieeffizienz'],
      mandantId: testMandant.id
    });

    komplexAks = await AksCode.create({
      code: 'KX001',
      bezeichnung: 'Komplexe Anlage',
      kategorie: 'Sonstige',
      pflichtfelder: ['hersteller', 'konfiguration'],
      validierungsregeln: {
        konfiguration: {
          type: 'object',
          properties: {
            temperatur: {
              type: 'number',
              min: -20,
              max: 100
            },
            druck: {
              type: 'number',
              min: 0,
              max: 10
            },
            medium: {
              type: 'enum',
              values: ['wasser', 'luft', 'dampf', 'gas']
            }
          },
          required: ['temperatur', 'medium'],
          message: 'Konfiguration muss Temperatur und Medium enthalten'
        },
        wartungsintervall: {
          type: 'object',
          properties: {
            einheit: {
              type: 'enum',
              values: ['tage', 'wochen', 'monate', 'jahre']
            },
            wert: {
              type: 'number',
              min: 1,
              max: 10
            }
          },
          required: ['einheit', 'wert'],
          message: 'Wartungsintervall muss Einheit und Wert enthalten'
        }
      },
      mandantId: testMandant.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Basic AKS Validation', () => {
    it('should validate against existing AKS code', async () => {
      const result = await validateAks('HZ001', testMandant.id);
      
      expect(result.isValid).toBe(true);
      expect(result.aksCode).toBeTruthy();
      expect(result.aksCode.id).toBe(heizungAks.id);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-existent AKS code', async () => {
      const result = await validateAks('NONEXISTENT', testMandant.id);
      
      expect(result.isValid).toBe(false);
      expect(result.aksCode).toBeNull();
      expect(result.errors).toContain('AKS code not found');
    });

    it('should reject AKS code from different mandant', async () => {
      // Create another mandant with same AKS code
      const otherMandant = await Mandant.create({
        name: 'Other Mandant',
        kurzbezeichnung: 'OTHER',
        adresse: { strasse: 'Other Str', hausnummer: '1', plz: '54321', ort: 'Other City', land: 'Deutschland' },
        kontakt: { email: 'other@example.com', telefon: '123', ansprechpartner: 'Other' },
        einstellungen: { maxAnlagen: 100, maxBenutzer: 10, features: [] },
        aktiv: true
      });

      const result = await validateAks('HZ001', otherMandant.id);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('AKS code not found');

      // Cleanup
      await otherMandant.destroy();
    });
  });

  describe('Anlage Data Validation', () => {
    describe('Required Fields Validation', () => {
      it('should pass with all required fields', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5,
          status: 'aktiv'
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail with missing required fields', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          // Missing typ, baujahr, leistung
          status: 'aktiv'
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Required field missing: typ');
        expect(result.errors).toContain('Required field missing: baujahr');
        expect(result.errors).toContain('Required field missing: leistung');
      });

      it('should fail with empty required fields', async () => {
        const anlageData = {
          hersteller: '',
          typ: null,
          baujahr: undefined,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Required field missing: hersteller');
        expect(result.errors).toContain('Required field missing: typ');
        expect(result.errors).toContain('Required field missing: baujahr');
      });
    });

    describe('Number Validation', () => {
      it('should validate number ranges', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should reject numbers outside valid range', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 1850, // Too old
          leistung: 2000 // Too high
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Baujahr muss zwischen 1990 und 2030 liegen');
        expect(result.errors).toContain('Leistung muss zwischen 1 und 1000 kW liegen');
      });

      it('should reject non-numeric values for number fields', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 'zweitausend', // String instead of number
          leistung: 'sehr viel' // String instead of number
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('baujahr') && e.includes('number'))).toBe(true);
        expect(result.errors.some(e => e.includes('leistung') && e.includes('number'))).toBe(true);
      });
    });

    describe('String Validation', () => {
      it('should validate string length', async () => {
        const anlageData = {
          hersteller: 'AB', // Minimum length
          typ: 'V',
          baujahr: 2015,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should reject strings that are too short or too long', async () => {
        const anlageData = {
          hersteller: 'A', // Too short
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Hersteller muss zwischen 2 und 50 Zeichen lang sein');
      });

      it('should validate string patterns', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200', // Valid pattern
          baujahr: 2015,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should reject strings that don\'t match pattern', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'vitola 200', // Lowercase and space not allowed
          baujahr: 2015,
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Typ darf nur Großbuchstaben, Zahlen und Bindestriche enthalten');
      });
    });

    describe('Enum Validation', () => {
      it('should accept valid enum values', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5,
          status: 'wartung' // Valid enum value
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid enum values', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5,
          status: 'kaputt' // Invalid enum value
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Ungültiger Status');
      });

      it('should handle case-sensitive enum values', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 25.5,
          status: 'AKTIV' // Wrong case
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Ungültiger Status');
      });
    });

    describe('Complex Object Validation', () => {
      it('should validate complex object structure', async () => {
        const anlageData = {
          hersteller: 'Komplex GmbH',
          konfiguration: {
            temperatur: 75.5,
            druck: 2.5,
            medium: 'wasser'
          },
          wartungsintervall: {
            einheit: 'monate',
            wert: 6
          }
        };

        const result = await validateAnlageData(anlageData, 'KX001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should validate required properties in objects', async () => {
        const anlageData = {
          hersteller: 'Komplex GmbH',
          konfiguration: {
            druck: 2.5,
            // Missing required temperatur and medium
          }
        };

        const result = await validateAnlageData(anlageData, 'KX001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Konfiguration muss Temperatur und Medium enthalten');
      });

      it('should validate nested object properties', async () => {
        const anlageData = {
          hersteller: 'Komplex GmbH',
          konfiguration: {
            temperatur: 150, // Too high
            medium: 'plasma' // Invalid enum
          }
        };

        const result = await validateAnlageData(anlageData, 'KX001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('temperatur'))).toBe(true);
        expect(result.errors.some(e => e.includes('medium'))).toBe(true);
      });
    });

    describe('Optional Fields Validation', () => {
      it('should accept data without optional fields', async () => {
        const anlageData = {
          hersteller: 'Lufttech',
          volumenstrom: 5000
          // No optional fields
        };

        const result = await validateAnlageData(anlageData, 'LU001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should validate optional fields when present', async () => {
        const anlageData = {
          hersteller: 'Lufttech',
          volumenstrom: 5000,
          filterklasse: 'F7', // Valid optional field
          schallpegel: 45 // Valid optional field
        };

        const result = await validateAnlageData(anlageData, 'LU001', testMandant.id);
        
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid optional field values', async () => {
        const anlageData = {
          hersteller: 'Lufttech',
          volumenstrom: 5000,
          filterklasse: 'F20', // Invalid filter class
          schallpegel: 80 // Too loud
        };

        const result = await validateAnlageData(anlageData, 'LU001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Ungültige Filterklasse');
        expect(result.errors).toContain('Schallpegel darf maximal 60 dB betragen');
      });
    });

    describe('Edge Cases', () => {
      it('should handle null and undefined values', async () => {
        const anlageData = {
          hersteller: 'Test',
          typ: null,
          baujahr: undefined,
          leistung: 0,
          status: ''
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Required field missing: typ');
        expect(result.errors).toContain('Required field missing: baujahr');
      });

      it('should handle zero values correctly', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: 0 // Zero is below minimum
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Leistung muss zwischen 1 und 1000 kW liegen');
      });

      it('should handle very large numbers', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: Number.MAX_SAFE_INTEGER
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Leistung muss zwischen 1 und 1000 kW liegen');
      });

      it('should handle special float values', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 2015,
          leistung: NaN
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('leistung') && e.includes('number'))).toBe(true);
      });
    });

    describe('Performance', () => {
      it('should validate large datasets efficiently', async () => {
        const startTime = Date.now();
        
        // Validate 1000 records
        const promises = [];
        for (let i = 0; i < 1000; i++) {
          const anlageData = {
            hersteller: `Hersteller ${i}`,
            typ: `TYP-${i}`,
            baujahr: 2000 + (i % 30),
            leistung: 10 + (i % 100)
          };
          promises.push(validateAnlageData(anlageData, 'HZ001', testMandant.id));
        }

        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        expect(results).toHaveLength(1000);
        expect(results.every(r => r.isValid)).toBe(true);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      }, 10000);
    });

    describe('Custom Validation Messages', () => {
      it('should return custom validation messages', async () => {
        const anlageData = {
          hersteller: 'Viessmann',
          typ: 'VITOLA-200',
          baujahr: 1800, // Too old
          leistung: 25.5
        };

        const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Baujahr muss zwischen 1990 und 2030 liegen');
      });

      it('should return generic messages when custom message not provided', async () => {
        // This would test fields without custom messages
        const anlageData = {
          hersteller: 'Lufttech',
          volumenstrom: -100 // Below minimum, but no custom message
        };

        const result = await validateAnlageData(anlageData, 'LU001', testMandant.id);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Volumenstrom muss zwischen 100 und 50000 m³/h liegen');
      });
    });
  });

  describe('Validation Utilities', () => {
    it('should provide validation summary', async () => {
      const anlageData = {
        hersteller: 'A', // Too short
        typ: 'invalid type', // Invalid pattern
        baujahr: 1800, // Too old
        leistung: -5 // Negative
      };

      const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.summary).toBeTruthy();
      expect(result.summary.totalFields).toBe(4);
      expect(result.summary.validFields).toBe(0);
      expect(result.summary.invalidFields).toBe(4);
    });

    it('should provide field-specific error details', async () => {
      const anlageData = {
        hersteller: 'Viessmann',
        typ: 'invalid type',
        baujahr: 2015,
        leistung: 25.5
      };

      const result = await validateAnlageData(anlageData, 'HZ001', testMandant.id);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors).toBeTruthy();
      expect(result.fieldErrors.typ).toContain('Typ darf nur Großbuchstaben, Zahlen und Bindestriche enthalten');
      expect(result.fieldErrors.hersteller).toBeUndefined();
    });
  });
});