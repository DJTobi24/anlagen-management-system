# Excel-Import-System Dokumentation

## Übersicht

Das Excel-Import-System ermöglicht den gleichzeitigen Import von bis zu 5.000 Anlagen mit:
- **Worker Threads** für Parallelverarbeitung (optimiert für 25 Kerne)
- **Redis-Queue** für asynchrone Job-Verwaltung
- **Robuste Fehlerbehandlung** mit detaillierten Berichten
- **Rollback-Funktionalität** für Datenkonsistenz

## API-Endpoints

### 🔐 Authentifizierung erforderlich
Alle Endpoints benötigen einen gültigen JWT Bearer Token.

### 📤 Excel-Upload
```http
POST /api/v1/import/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- excel: [Excel-Datei] (.xlsx oder .xls, max 50MB)
- columnMapping: [JSON-String] (optional - Standard-Mapping wird verwendet)
```

**Beispiel columnMapping:**
```json
{
  "tNummer": "T-Nummer",
  "aksCode": "AKS-Code", 
  "name": "Anlagenname",
  "description": "Beschreibung",
  "status": "Status",
  "zustandsBewertung": "Zustandsbewertung",
  "objektName": "Objekt",
  "liegenschaftName": "Liegenschaft",
  "floor": "Etage",
  "room": "Raum"
}
```

**Response:**
```json
{
  "message": "Import job started successfully",
  "data": {
    "jobId": "uuid",
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [],
      "totalRows": 1234
    },
    "estimatedRows": 1234
  }
}
```

### 📋 Job-Management

#### Import-Jobs abrufen
```http
GET /api/v1/import/jobs?page=1&limit=20
Authorization: Bearer <token>
```

#### Spezifischen Job abrufen
```http
GET /api/v1/import/jobs/{jobId}
Authorization: Bearer <token>
```

#### Fehlerreport herunterladen
```http
GET /api/v1/import/jobs/{jobId}/report
Authorization: Bearer <token>
```
Lädt Excel-Datei mit detaillierten Fehlern herunter.

#### Job abbrechen
```http
POST /api/v1/import/jobs/{jobId}/cancel
Authorization: Bearer <token>
```

#### Job zurückrollen (nur Admin)
```http
POST /api/v1/import/jobs/{jobId}/rollback
Authorization: Bearer <token>
```

### 📊 Statistiken

#### Import-Statistiken
```http
GET /api/v1/import/stats
Authorization: Bearer <token>
```

#### Queue-Statistiken (nur Admin)
```http
GET /api/v1/import/queue/stats
Authorization: Bearer <token>
```

#### Standard-Spalten-Mapping
```http
GET /api/v1/import/mapping/default
Authorization: Bearer <token>
```

## Excel-Struktur

### Erforderliche Spalten
| Spalte | Beschreibung | Pflicht | Beispiel |
|--------|--------------|---------|----------|
| AKS-Code | Anlagen-Klassifizierung | ✅ | HLK.001.01 |
| Anlagenname | Name der Anlage | ✅ | Lüftungsanlage Bürotrakt |
| Objekt | Objekt-Name | ✅ | Technikraum EG |
| Liegenschaft | Liegenschaft-Name | ✅ | Hauptgebäude |

### Optionale Spalten
| Spalte | Beschreibung | Standard | Beispiel |
|--------|--------------|----------|----------|
| T-Nummer | Planon-ID | null | T123456 |
| Beschreibung | Detailbeschreibung | "" | RLT-Anlage mit Wärmerückgewinnung |
| Status | Anlagenstatus | aktiv | aktiv, inaktiv, wartung, defekt |
| Zustandsbewertung | Bewertung 1-5 | 1 | 4 |
| Etage | Stockwerk | "" | EG, 1.OG, UG |
| Raum | Raumnummer | "" | T001, R205 |

### Beispiel Excel-Struktur
```
| T-Nummer | AKS-Code   | Anlagenname           | Beschreibung          | Status | Zustandsbewertung | Objekt        | Liegenschaft  | Etage | Raum |
|----------|------------|-----------------------|-----------------------|--------|-------------------|---------------|---------------|-------|------|
| T123456  | HLK.001.01 | Lüftungsanlage Nord   | Zu- und Abluftanlage  | aktiv  | 4                 | Technikraum   | Hauptgebäude  | EG    | T001 |
| T123457  | HLK.002.01 | Heizung Bürotrakt     | Gasheizung 150kW      | aktiv  | 3                 | Heizungsraum  | Hauptgebäude  | UG    | H001 |
|          | ELT.001.01 | Hauptverteilung       | 400V Schaltanlage     | aktiv  | 5                 | Elektroraum   | Nebengebäude  | EG    | E001 |
```

## Import-Verhalten

### Duplikatsprüfung
- **T-Nummer**: Wenn vorhanden, wird geprüft ob bereits eine Anlage mit dieser T-Nummer existiert
- **Duplikate**: Werden abgelehnt mit Status "Nicht gefunden"

### Hierarchie-Erstellung
Das System erstellt automatisch fehlende Hierarchie-Elemente:

1. **Liegenschaft**: Wird automatisch erstellt falls nicht vorhanden
2. **Objekt**: Wird automatisch erstellt falls nicht vorhanden
3. **Anlage**: Wird mit generierten QR-Code erstellt

### Status-Mapping
Verschiedene Eingaben werden automatisch gemappt:
- `aktiv`, `active` → `aktiv`
- `inaktiv`, `inactive` → `inaktiv`  
- `wartung`, `maintenance` → `wartung`
- `defekt`, `defective`, `broken` → `defekt`

## Parallelverarbeitung

### Worker Threads
- **Anzahl**: Automatisch optimiert (80% der Kerne, max 25)
- **Batch-Größe**: Dynamisch basierend auf Worker-Anzahl
- **Fortschritt**: Real-time Updates alle 10 verarbeiteten Zeilen

### Performance
- **Bis zu 5.000 Anlagen** parallel verarbeitbar
- **Optimiert für 25 Kerne** verfügbare Hardware
- **Asynchrone Verarbeitung** ohne UI-Blockierung

## Fehlerbehandlung

### Validierungsfehler
- **Leere Pflichtfelder**: Zeilen werden abgelehnt
- **Ungültige Zustandsbewertung**: Muss 1-5 sein
- **Ungültiger Status**: Muss bekannter Status sein
- **Duplikate**: T-Nummer bereits vorhanden

### Fehlerreport
- **Excel-Format**: Detaillierte Fehlerliste
- **Zeilenbezug**: Genauer Verweis auf Originalzeile
- **Feldbezug**: Welches Feld den Fehler verursacht
- **Daten**: Originaldaten für Korrektur

## Rollback-System

### Rollback-Daten
Bei jedem Import werden gespeichert:
- **Erstellte Anlagen**: IDs für Löschung
- **Erstellte Objekte**: IDs für Löschung (falls leer)
- **Erstellte Liegenschaften**: IDs für Löschung (falls leer)
- **Geänderte Anlagen**: Ursprungsdaten für Wiederherstellung

### Sichere Rollbacks
- **Abhängigkeitsprüfung**: Objekte/Liegenschaften nur löschen wenn leer
- **Transaktional**: Alles oder nichts
- **Nur Admin**: Rollback-Berechtigung beschränkt

## Berechtigungen

| Rolle | Upload | Jobs anzeigen | Abbrechen | Rollback | Queue Stats |
|-------|--------|---------------|-----------|----------|-------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Techniker** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Aufnehmer** | ❌ | ✅ | ❌ | ❌ | ❌ |

## Beispiel-Workflow

### 1. Excel-Datei vorbereiten
```bash
# Beispiel-Datei mit korrekten Spalten
curl -o beispiel.xlsx http://192.168.1.126:3000/api/v1/import/mapping/default
```

### 2. Upload starten
```bash
curl -X POST http://192.168.1.126:3000/api/v1/import/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "excel=@anlagen_import.xlsx"
```

### 3. Status überwachen
```bash
# Job-Status abrufen
curl http://192.168.1.126:3000/api/v1/import/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Fehlerreport bei Bedarf
```bash
# Fehlerreport herunterladen
curl http://192.168.1.126:3000/api/v1/import/jobs/JOB_ID/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o fehlerreport.xlsx
```

### 5. Rollback bei Bedarf
```bash
# Import rückgängig machen (nur Admin)
curl -X POST http://192.168.1.126:3000/api/v1/import/jobs/JOB_ID/rollback \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Monitoring

### Job-Status
- `pending`: Wartet auf Verarbeitung
- `processing`: Wird verarbeitet
- `completed`: Erfolgreich abgeschlossen
- `failed`: Fehlgeschlagen
- `cancelled`: Abgebrochen
- `rolled_back`: Zurückgerollt

### Progress-Tracking
```json
{
  "id": "job-uuid",
  "status": "processing",
  "totalRows": 1000,
  "processedRows": 750,
  "successfulRows": 720,
  "failedRows": 30,
  "progress": 75,
  "errors": [...]
}
```