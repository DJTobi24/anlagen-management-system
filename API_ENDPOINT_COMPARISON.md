# API Endpoint Vergleich

## Dokumentierte vs. Implementierte Endpunkte

### ✅ Vollständig implementierte Module

#### 1. Anlagen
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/anlagen | ✅ router.get('/') | ✅ |
| POST /api/v1/anlagen | ✅ router.post('/') | ✅ |
| GET /api/v1/anlagen/{id} | ✅ router.get('/:id') | ✅ |
| PUT /api/v1/anlagen/{id} | ✅ router.put('/:id') | ✅ |
| DELETE /api/v1/anlagen/{id} | ✅ router.delete('/:id') | ✅ |
| - | ✅ GET /anlagen/search | Zusätzlich |
| - | ✅ GET /anlagen/statistics | Zusätzlich |
| - | ✅ GET /anlagen/wartung/faellig | Zusätzlich |
| - | ✅ GET /anlagen/qr/:qrCode | Zusätzlich |

#### 2. Liegenschaften
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/liegenschaften | ✅ router.get('/') | ✅ |
| POST /api/v1/liegenschaften | ✅ router.post('/') | ✅ |
| GET /api/v1/liegenschaften/{id} | ✅ router.get('/:id') | ✅ |
| PUT /api/v1/liegenschaften/{id} | ✅ router.put('/:id') | ✅ |
| DELETE /api/v1/liegenschaften/{id} | ✅ router.delete('/:id') | ✅ |

#### 3. Objekte
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/objekte | ✅ router.get('/') | ✅ |
| POST /api/v1/objekte | ✅ router.post('/') | ✅ |
| GET /api/v1/objekte/{id} | ✅ router.get('/:id') | ✅ |
| PUT /api/v1/objekte/{id} | ✅ router.put('/:id') | ✅ |
| DELETE /api/v1/objekte/{id} | ✅ router.delete('/:id') | ✅ |

#### 4. Benutzerverwaltung
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/users | ✅ router.get('/') | ✅ |
| POST /api/v1/users | ✅ router.post('/') | ✅ |
| PUT /api/v1/users/{id} | ✅ router.put('/:id') | ✅ |
| DELETE /api/v1/users/{id} | ✅ router.delete('/:id') | ✅ |
| - | ✅ GET /users/:id | Zusätzlich |

#### 5. FM-Datenaufnahme
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/fm-data/liegenschaften | ✅ router.get('/liegenschaften') | ✅ |
| GET /api/v1/fm-data/liegenschaften/{id}/buildings | ✅ router.get('/liegenschaften/:liegenschaftId/buildings') | ✅ |
| GET /api/v1/fm-data/buildings/{id}/aks-tree | ✅ router.get('/buildings/:buildingId/aks-tree') | ✅ |
| GET /api/v1/fm-data/scan/{qrCode} | ❌ Nicht implementiert | ❌ |
| - | ✅ GET /buildings/:buildingId/aks/:aksCode/anlagen | Zusätzlich |

### ⚠️ Teilweise implementierte Module

#### 6. AKS (Anlagen-Kennzeichnungs-System)
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| GET /api/v1/aks | ❌ Nicht direkt implementiert | ❌ |
| GET /api/v1/aks/tree | ✅ router.get('/tree') | ✅ |
| POST /api/v1/aks/import | ❓ Mehrere POST-Routen vorhanden | ⚠️ |
| PUT /api/v1/aks/{code} | ❓ PUT-Routen vorhanden | ⚠️ |
| - | ✅ GET /aks/categories | Zusätzlich |
| - | ✅ GET /aks/code/:code | Zusätzlich |
| - | ✅ GET /aks/search | Zusätzlich |
| - | ✅ GET /aks/field-types | Zusätzlich |
| - | ✅ POST /aks/validate | Zusätzlich |

#### 7. Import
| Dokumentiert | Implementiert | Status |
|--------------|---------------|--------|
| POST /api/v1/import/upload | ❓ POST-Routen vorhanden | ⚠️ |
| GET /api/v1/import/jobs | ❓ GET-Routen vorhanden | ⚠️ |
| GET /api/v1/import/jobs/{jobId} | ❓ GET-Routen vorhanden | ⚠️ |
| POST /api/v1/import/jobs/{jobId}/cancel | ❌ Nicht implementiert | ❌ |
| POST /api/v1/import/jobs/{jobId}/rollback | ❌ Nicht implementiert | ❌ |
| - | ✅ GET /import/sample/excel | Zusätzlich |
| - | ✅ GET /import/mapping/default | Zusätzlich |

### 📊 Zusammenfassung

- **Vollständig implementiert:** 5/7 Module (71%)
- **Teilweise implementiert:** 2/7 Module (29%)
- **Fehlende Endpunkte:**
  1. GET /api/v1/aks (Basis AKS-Codes abrufen)
  2. GET /api/v1/fm-data/scan/{qrCode}
  3. POST /api/v1/import/jobs/{jobId}/cancel
  4. POST /api/v1/import/jobs/{jobId}/rollback

### 🔧 Empfehlungen

1. **Fehlende Endpunkte implementieren:**
   - QR-Code Scanner für FM-Datenaufnahme
   - Import-Job Cancel/Rollback Funktionen
   - Basis AKS-Endpunkt

2. **API-Dokumentation aktualisieren:**
   - Zusätzliche implementierte Endpunkte dokumentieren
   - Swagger/OpenAPI Schema vervollständigen

3. **Konsistenz verbessern:**
   - Klare Benennung der Import-Endpunkte
   - AKS-Endpunkte strukturieren