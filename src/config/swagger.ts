import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anlagen-Management-System API',
      version: '1.0.0',
      description: `
        ## Übersicht
        Das Anlagen-Management-System (AMS) ist eine umfassende Lösung zur Verwaltung von technischen Anlagen, Gebäuden und Liegenschaften.
        
        ## Authentifizierung
        Die API verwendet JWT (JSON Web Tokens) für die Authentifizierung. Nach erfolgreicher Anmeldung erhalten Sie einen Token, der bei allen weiteren Anfragen im Authorization-Header mitgesendet werden muss:
        
        \`Authorization: Bearer <token>\`
        
        ## Fehlerbehandlung
        Die API verwendet Standard-HTTP-Statuscodes:
        - 200: Erfolg
        - 201: Erfolgreich erstellt
        - 400: Ungültige Anfrage
        - 401: Nicht authentifiziert
        - 403: Keine Berechtigung
        - 404: Nicht gefunden
        - 500: Serverfehler
        
        ## Rate Limiting
        Die API ist auf 100 Anfragen pro Minute pro IP-Adresse begrenzt.
      `,
      contact: {
        name: 'SWM Services GmbH',
        email: 'support@swm.de',
        url: 'https://www.swm.de'
      },
      license: {
        name: 'Proprietary',
        url: 'https://www.swm.de/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://ams.swm.de/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            }
          }
        },
        User: {
          type: 'object',
          required: ['email', 'name', 'rolle'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true
            },
            email: {
              type: 'string',
              format: 'email'
            },
            name: {
              type: 'string'
            },
            rolle: {
              type: 'string',
              enum: ['admin', 'techniker', 'leser']
            },
            abteilung: {
              type: 'string'
            },
            telefon: {
              type: 'string'
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true
            }
          }
        },
        Liegenschaft: {
          type: 'object',
          required: ['name', 'address'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true
            },
            name: {
              type: 'string',
              description: 'Name der Liegenschaft'
            },
            address: {
              type: 'string',
              description: 'Adresse der Liegenschaft'
            },
            description: {
              type: 'string',
              description: 'Beschreibung'
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            objekte_count: {
              type: 'integer',
              readOnly: true
            },
            anlagen_count: {
              type: 'integer',
              readOnly: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true
            }
          }
        },
        Objekt: {
          type: 'object',
          required: ['name', 'liegenschaft_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true
            },
            liegenschaft_id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Name des Objekts/Gebäudes'
            },
            floor: {
              type: 'string',
              description: 'Etage'
            },
            room: {
              type: 'string',
              description: 'Raum'
            },
            description: {
              type: 'string'
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            anlagen_count: {
              type: 'integer',
              readOnly: true
            }
          }
        },
        Anlage: {
          type: 'object',
          required: ['name', 'aks_code', 'objekt_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true
            },
            objekt_id: {
              type: 'string',
              format: 'uuid'
            },
            t_nummer: {
              type: 'string',
              description: 'Technische Nummer'
            },
            aks_code: {
              type: 'string',
              description: 'AKS-Code'
            },
            qr_code: {
              type: 'string',
              description: 'QR-Code als Base64'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            hersteller: {
              type: 'string'
            },
            modell: {
              type: 'string'
            },
            seriennummer: {
              type: 'string'
            },
            baujahr: {
              type: 'integer'
            },
            anschaffungswert: {
              type: 'number'
            },
            status: {
              type: 'string',
              enum: ['aktiv', 'inaktiv', 'wartung', 'defekt']
            },
            zustands_bewertung: {
              type: 'integer',
              minimum: 1,
              maximum: 5
            },
            letzte_wartung: {
              type: 'string',
              format: 'date'
            },
            naechste_wartung: {
              type: 'string',
              format: 'date'
            },
            wartungsintervall_monate: {
              type: 'integer'
            },
            dynamic_fields: {
              type: 'object',
              additionalProperties: true
            },
            is_active: {
              type: 'boolean',
              default: true
            }
          }
        },
        AksCode: {
          type: 'object',
          properties: {
            code: {
              type: 'string'
            },
            bezeichnung: {
              type: 'string'
            },
            beschreibung: {
              type: 'string'
            },
            kategorie: {
              type: 'string'
            },
            parent_code: {
              type: 'string'
            },
            ebene: {
              type: 'integer'
            },
            wartung_intervall_monate: {
              type: 'integer'
            },
            is_active: {
              type: 'boolean'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AksCode'
              }
            }
          }
        },
        ImportJob: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            fileName: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
            },
            totalRows: {
              type: 'integer'
            },
            processedRows: {
              type: 'integer'
            },
            successfulRows: {
              type: 'integer'
            },
            failedRows: {
              type: 'integer'
            },
            progress: {
              type: 'integer',
              minimum: 0,
              maximum: 100
            },
            startedAt: {
              type: 'string',
              format: 'date-time'
            },
            completedAt: {
              type: 'string',
              format: 'date-time'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: {
                    type: 'integer'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints für Benutzeranmeldung und -verwaltung'
      },
      {
        name: 'Anlagen',
        description: 'Verwaltung von technischen Anlagen'
      },
      {
        name: 'Liegenschaften',
        description: 'Verwaltung von Liegenschaften'
      },
      {
        name: 'Objekte',
        description: 'Verwaltung von Objekten/Gebäuden'
      },
      {
        name: 'AKS',
        description: 'Anlagen-Kennzeichnungs-System'
      },
      {
        name: 'Import',
        description: 'Datenimport aus Excel-Dateien'
      },
      {
        name: 'FM-Datenaufnahme',
        description: 'Facility Management Datenerfassung'
      },
      {
        name: 'Users',
        description: 'Benutzerverwaltung (nur Admin)'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export default swaggerJsdoc(options);