# Vollständige API-Dokumentation - Anlagen Management System

## 📋 Übersicht
**Base URL:** `https://your-domain.com/api/v1`  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`  
**Rate Limit:** 100 requests per 15 minutes per IP  

## 🔐 1. AUTHENTICATION - Authentifizierung

### 1.1 Login
**POST** `/api/v1/auth/login`

Benutzer-Anmeldung mit E-Mail und Passwort.

**Request:**
```json
{
  "email": "techniker@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "techniker@example.com",
      "firstName": "Max",
      "lastName": "Mustermann",
      "rolle": "Techniker",
      "mandantId": "mandant_123"
    }
  },
  "message": "Login erfolgreich"
}
```

### 1.2 Token Refresh
**POST** `/api/v1/auth/refresh`

Erneuert den Access Token mit einem gültigen Refresh Token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 1.3 Logout
**POST** `/api/v1/auth/logout`

Meldet den Benutzer ab und invalidiert Tokens.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout erfolgreich"
}
```

### 1.4 Get Current User
**GET** `/api/v1/auth/me`

Gibt Informationen über den aktuell angemeldeten Benutzer zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "techniker@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "rolle": "Techniker",
    "mandantId": "mandant_123",
    "permissions": ["read_anlagen", "write_anlagen", "read_reports"]
  }
}
```

## 👥 2. USER MANAGEMENT - Benutzerverwaltung

### 2.1 Get All Users
**GET** `/api/v1/users`

Listet alle Benutzer des Mandanten auf.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page` (optional): Seitennummer (default: 1)
- `limit` (optional): Einträge pro Seite (default: 20)
- `search` (optional): Suchbegriff
- `rolle` (optional): Filter nach Rolle

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_1",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "rolle": "Admin",
      "aktiv": true,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "user_2",
      "email": "techniker@example.com",
      "firstName": "Max",
      "lastName": "Mustermann",
      "rolle": "Techniker",
      "aktiv": true,
      "createdAt": "2024-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

### 2.2 Create User
**POST** `/api/v1/users`

Erstellt einen neuen Benutzer.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "email": "neuer.techniker@example.com",
  "password": "InitialPassword123!",
  "firstName": "Neuer",
  "lastName": "Techniker",
  "rolle": "Techniker",
  "mandantId": "mandant_123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "user_3",
    "email": "neuer.techniker@example.com",
    "firstName": "Neuer",
    "lastName": "Techniker",
    "rolle": "Techniker",
    "aktiv": true,
    "createdAt": "2024-01-20T10:00:00Z"
  },
  "message": "Benutzer erfolgreich erstellt"
}
```

### 2.3 Update User
**PUT** `/api/v1/users/:id`

Aktualisiert einen bestehenden Benutzer.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "rolle": "Admin",
  "aktiv": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_3",
    "email": "neuer.techniker@example.com",
    "firstName": "Updated",
    "lastName": "Name",
    "rolle": "Admin",
    "aktiv": true,
    "updatedAt": "2024-01-21T10:00:00Z"
  },
  "message": "Benutzer erfolgreich aktualisiert"
}
```

## 🏢 3. ANLAGEN - Facility Management

### 3.1 Get All Anlagen
**GET** `/api/v1/anlagen`

Listet alle Anlagen des Mandanten auf.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page` (optional): Seitennummer
- `limit` (optional): Einträge pro Seite
- `search` (optional): Suche in Name, T-Nummer
- `aksCode` (optional): Filter nach AKS-Code
- `objektId` (optional): Filter nach Objekt
- `status` (optional): aktiv|inaktiv|defekt|ausser_betrieb

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "anlage_1",
      "tNummer": "T-2024-001",
      "name": "Klimaanlage Bürogebäude A",
      "aksCode": "480.10",
      "aksBezeichnung": "Klimaanlage",
      "objektId": "objekt_1",
      "objektName": "Bürogebäude A",
      "status": "aktiv",
      "zustandsBewertung": 4,
      "baujahr": 2020,
      "hersteller": "Daikin",
      "typ": "VRV-System",
      "seriennummer": "DAI2020123456",
      "etage": "2. OG",
      "raum": "Technikraum 2.01",
      "qrCode": "QR-2024-001",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### 3.2 Create Anlage
**POST** `/api/v1/anlagen`

Erstellt eine neue Anlage.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "objektId": "objekt_1",
  "aksCode": "480.10",
  "tNummer": "T-2024-002",
  "name": "Klimaanlage Bürogebäude B",
  "description": "Split-Klimaanlage für Büroräume",
  "status": "aktiv",
  "zustandsBewertung": 5,
  "etage": "1. OG",
  "raum": "Büro 1.05",
  "anzahl": 1,
  "hersteller": "Mitsubishi",
  "typ": "MSZ-LN35VG",
  "seriennummer": "MIT2024789",
  "baujahr": 2024,
  "qrCodeManual": "QR-2024-002",
  "dynamicFields": {
    "kuehlleistung": "3.5",
    "energieeffizienzklasse": "A+++"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "anlage_2",
    "tNummer": "T-2024-002",
    "name": "Klimaanlage Bürogebäude B",
    "aksCode": "480.10",
    "objektId": "objekt_1",
    "status": "aktiv",
    "zustandsBewertung": 5,
    "qrCode": "QR-2024-002",
    "createdAt": "2024-01-21T10:00:00Z"
  },
  "message": "Anlage erfolgreich erstellt"
}
```

### 3.3 Get Anlage by QR Code
**GET** `/api/v1/anlagen/qr/:qrCode`

Findet eine Anlage anhand ihres QR-Codes.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "anlage_1",
    "tNummer": "T-2024-001",
    "name": "Klimaanlage Bürogebäude A",
    "aksCode": "480.10",
    "qrCode": "QR-2024-001",
    "status": "aktiv",
    "lastMaintenance": "2024-01-15T10:00:00Z",
    "nextMaintenance": "2024-07-15T10:00:00Z",
    "maintenanceHistory": [
      {
        "date": "2024-01-15T10:00:00Z",
        "type": "Inspektion",
        "technician": "Max Mustermann",
        "notes": "Filter gewechselt, Funktion ok"
      }
    ]
  }
}
```

### 3.4 Search Anlagen
**GET** `/api/v1/anlagen/search`

Erweiterte Suche für Anlagen.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `q`: Suchbegriff (durchsucht Name, T-Nummer, Hersteller, Typ)
- `aksCode`: AKS-Code Filter
- `liegenschaftId`: Liegenschaft Filter
- `objektId`: Objekt Filter
- `etage`: Etage Filter
- `status`: Status Filter
- `zustandMin`: Minimale Zustandsbewertung (1-5)
- `zustandMax`: Maximale Zustandsbewertung (1-5)
- `baujahrVon`: Baujahr von
- `baujahrBis`: Baujahr bis

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "anlage_1",
      "tNummer": "T-2024-001",
      "name": "Klimaanlage Bürogebäude A",
      "aksCode": "480.10",
      "matchScore": 0.95
    }
  ],
  "totalResults": 15
}
```

## 📊 4. DATENAUFNAHME - Data Collection

### 4.1 Get My Aufträge
**GET** `/api/v1/datenaufnahme/meine-auftraege`

Gibt alle dem Benutzer zugewiesenen Datenaufnahme-Aufträge zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": "aufnahme_1",
    "titel": "Jahresinspektion 2024 - Gebäude A",
    "beschreibung": "Vollständige Inspektion aller technischen Anlagen",
    "status": "in_bearbeitung",
    "startDatum": "2024-01-15",
    "endDatum": "2024-02-15",
    "erstellerName": "Admin User",
    "liegenschaften": [
      {
        "id": "liegenschaft_1",
        "name": "Hauptstandort München",
        "adresse": "Beispielstraße 1, 80333 München"
      }
    ],
    "objekte": [
      {
        "id": "objekt_1",
        "name": "Bürogebäude A",
        "liegenschaftId": "liegenschaft_1"
      }
    ],
    "anlagen": [
      {
        "id": "da_anlage_1",
        "aufnahmeId": "aufnahme_1",
        "anlageId": "anlage_1",
        "name": "Klimaanlage Bürogebäude A",
        "tNummer": "T-2024-001",
        "aksCode": "480.10",
        "bearbeitet": false,
        "bearbeitetAm": null,
        "notizen": ""
      },
      {
        "id": "da_anlage_2",
        "aufnahmeId": "aufnahme_1",
        "anlageId": "anlage_2",
        "name": "Aufzug Hauptgebäude",
        "tNummer": "T-2024-010",
        "aksCode": "460.10",
        "bearbeitet": true,
        "bearbeitetAm": "2024-01-20T14:30:00Z",
        "notizen": "Wartung durchgeführt, kleine Reparatur nötig"
      }
    ],
    "fortschritt": {
      "total": 25,
      "bearbeitet": 10,
      "prozent": 40
    }
  }
]
```

### 4.2 Create Datenaufnahme
**POST** `/api/v1/datenaufnahme`

Erstellt einen neuen Datenaufnahme-Auftrag.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "titel": "Quartalsinspektion Q1/2024",
  "beschreibung": "Inspektion aller Klimaanlagen",
  "status": "vorbereitet",
  "startDatum": "2024-03-01",
  "endDatum": "2024-03-31",
  "zugewiesenAn": ["user_2", "user_3"],
  "liegenschaften": ["liegenschaft_1"],
  "objekte": ["objekt_1", "objekt_2"],
  "anlagenFilter": {
    "aksCode": ["480.10", "480.20"],
    "status": "aktiv"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "aufnahme_2",
    "titel": "Quartalsinspektion Q1/2024",
    "status": "vorbereitet",
    "anlagenCount": 15,
    "createdAt": "2024-01-21T10:00:00Z"
  },
  "message": "Datenaufnahme-Auftrag erfolgreich erstellt"
}
```

### 4.3 Mark Anlage as Bearbeitet
**POST** `/api/v1/datenaufnahme/:aufnahmeId/anlagen/:anlageId/bearbeitet`

Markiert eine Anlage in einem Datenaufnahme-Auftrag als bearbeitet.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "notizen": "Inspektion durchgeführt. Filter gewechselt, Kältemittel nachgefüllt.",
  "zustandsBewertung": 4,
  "maengel": [
    {
      "beschreibung": "Leichte Korrosion am Gehäuse",
      "prioritaet": "niedrig"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "anlageId": "anlage_1",
    "bearbeitet": true,
    "bearbeitetAm": "2024-01-21T14:30:00Z",
    "bearbeitetVon": "Max Mustermann"
  },
  "message": "Anlage als bearbeitet markiert"
}
```

### 4.4 Get Datenaufnahme Progress
**GET** `/api/v1/datenaufnahme/:id/fortschritt`

Gibt den Fortschritt eines Datenaufnahme-Auftrags zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "aufnahmeId": "aufnahme_1",
    "titel": "Jahresinspektion 2024",
    "status": "in_bearbeitung",
    "fortschritt": {
      "totalAnlagen": 50,
      "bearbeitetAnlagen": 35,
      "prozent": 70,
      "verbleibendeZeit": "5 Tage",
      "durchschnittlicheBearbeitungszeit": "15 Minuten",
      "nachObjekt": [
        {
          "objektId": "objekt_1",
          "objektName": "Bürogebäude A",
          "total": 25,
          "bearbeitet": 20,
          "prozent": 80
        },
        {
          "objektId": "objekt_2",
          "objektName": "Bürogebäude B",
          "total": 25,
          "bearbeitet": 15,
          "prozent": 60
        }
      ],
      "nachAksCode": [
        {
          "aksCode": "480.10",
          "bezeichnung": "Klimaanlagen",
          "total": 30,
          "bearbeitet": 25,
          "prozent": 83
        },
        {
          "aksCode": "460.10",
          "bezeichnung": "Aufzüge",
          "total": 20,
          "bearbeitet": 10,
          "prozent": 50
        }
      ],
      "techniker": [
        {
          "userId": "user_2",
          "name": "Max Mustermann",
          "bearbeitet": 20,
          "durchschnittlicheZeit": "12 Minuten"
        },
        {
          "userId": "user_3",
          "name": "Erika Musterfrau",
          "bearbeitet": 15,
          "durchschnittlicheZeit": "18 Minuten"
        }
      ]
    }
  }
}
```

## 🏗️ 5. AKS - Classification System

### 5.1 Get All AKS Codes
**GET** `/api/v1/aks`

Gibt alle AKS-Codes zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `search` (optional): Suche in Code oder Bezeichnung
- `level` (optional): Filter nach Ebene (1-4)
- `parentCode` (optional): Filter nach übergeordnetem Code

**Response (200 OK):**
```json
[
  {
    "code": "480",
    "bezeichnung": "Lüftungstechnische Anlagen",
    "level": 2,
    "parentCode": "400",
    "isCategory": true,
    "maintenanceIntervalMonths": null,
    "children": [
      {
        "code": "480.10",
        "bezeichnung": "Klimaanlagen",
        "level": 3,
        "parentCode": "480",
        "isCategory": false,
        "maintenanceIntervalMonths": 6
      },
      {
        "code": "480.20",
        "bezeichnung": "Lüftungsanlagen",
        "level": 3,
        "parentCode": "480",
        "isCategory": false,
        "maintenanceIntervalMonths": 12
      }
    ]
  }
]
```

### 5.2 Get AKS Tree Structure
**GET** `/api/v1/aks/tree`

Gibt die komplette AKS-Baumstruktur zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "code": "root",
    "bezeichnung": "AKS Struktur",
    "children": [
      {
        "code": "400",
        "bezeichnung": "Technische Anlagen",
        "level": 1,
        "children": [
          {
            "code": "460",
            "bezeichnung": "Förderanlagen",
            "level": 2,
            "children": [
              {
                "code": "460.10",
                "bezeichnung": "Aufzüge",
                "level": 3,
                "maintenanceIntervalMonths": 3
              }
            ]
          },
          {
            "code": "480",
            "bezeichnung": "Lüftungstechnische Anlagen",
            "level": 2,
            "children": [
              {
                "code": "480.10",
                "bezeichnung": "Klimaanlagen",
                "level": 3,
                "maintenanceIntervalMonths": 6
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## 🏠 6. AKS FIELDS - Dynamic Field Definitions

### 6.1 Get Fields by AKS Code
**GET** `/api/v1/aks-fields/fields/:aksCode`

Gibt alle Felddefinitionen für einen AKS-Code zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "field_1",
      "fieldName": "kuehlleistung",
      "fieldLabel": "Kühlleistung",
      "fieldType": "unit_value",
      "isRequired": true,
      "isVisible": true,
      "displayOrder": 1,
      "unit": "kW",
      "placeholder": "z.B. 3.5",
      "helpText": "Nennkühlleistung in kW",
      "minValue": 0.5,
      "maxValue": 100
    },
    {
      "id": "field_2",
      "fieldName": "energieeffizienzklasse",
      "fieldLabel": "Energieeffizienzklasse",
      "fieldType": "select",
      "isRequired": true,
      "isVisible": true,
      "displayOrder": 2,
      "selectOptions": ["A+++", "A++", "A+", "A", "B", "C", "D"],
      "defaultValue": "A"
    },
    {
      "id": "field_3",
      "fieldName": "kaeltemittel",
      "fieldLabel": "Kältemittel",
      "fieldType": "text",
      "isRequired": false,
      "isVisible": true,
      "displayOrder": 3,
      "placeholder": "z.B. R32"
    },
    {
      "id": "field_4",
      "fieldName": "letzteWartung",
      "fieldLabel": "Letzte Wartung",
      "fieldType": "date",
      "isRequired": true,
      "isVisible": true,
      "displayOrder": 4
    }
  ]
}
```

### 6.2 Save Anlage Field Values
**POST** `/api/v1/aks-fields/anlage/:anlageId/values`

Speichert die Feldwerte für eine Anlage.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "fieldValues": [
    {
      "fieldDefinitionId": "field_1",
      "value": "3.5",
      "numericValue": 3.5,
      "unit": "kW"
    },
    {
      "fieldDefinitionId": "field_2",
      "value": "A++",
      "numericValue": null,
      "unit": null
    },
    {
      "fieldDefinitionId": "field_3",
      "value": "R32",
      "numericValue": null,
      "unit": null
    },
    {
      "fieldDefinitionId": "field_4",
      "value": "2024-01-15",
      "numericValue": null,
      "unit": null
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "anlageId": "anlage_1",
    "savedFields": 4,
    "validated": true
  },
  "message": "Feldwerte erfolgreich gespeichert"
}
```

### 6.3 Validate Anlage Fields
**POST** `/api/v1/aks-fields/anlage/:anlageId/validate`

Validiert die Feldwerte einer Anlage gegen die AKS-Definitionen.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "missingRequired": ["field_4"],
    "invalidValues": [
      {
        "fieldId": "field_1",
        "fieldName": "kuehlleistung",
        "error": "Wert außerhalb des zulässigen Bereichs (0.5-100)"
      }
    ],
    "warnings": [
      {
        "fieldId": "field_3",
        "fieldName": "kaeltemittel",
        "warning": "Kältemittel R22 ist veraltet"
      }
    ]
  }
}
```

## 📁 7. IMPORT/EXPORT

### 7.1 Upload Excel for Import
**POST** `/api/v1/import/upload`

Lädt eine Excel-Datei hoch und startet den Import-Prozess.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Request (FormData):**
```
file: [Excel file]
objektId: objekt_1
importMode: create_or_update
dryRun: false
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "import_job_123",
    "filename": "anlagen_import_2024.xlsx",
    "status": "processing",
    "totalRows": 150,
    "createdAt": "2024-01-21T10:00:00Z"
  },
  "message": "Import gestartet. Sie können den Fortschritt mit der Job-ID verfolgen."
}
```

### 7.2 Get Import Job Status
**GET** `/api/v1/import/jobs/:id`

Gibt den Status eines Import-Jobs zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "import_job_123",
    "status": "completed",
    "progress": 100,
    "totalRows": 150,
    "processedRows": 150,
    "successfulRows": 145,
    "failedRows": 5,
    "errors": [
      {
        "row": 23,
        "field": "aksCode",
        "error": "Ungültiger AKS-Code: 999.99"
      },
      {
        "row": 45,
        "field": "tNummer",
        "error": "T-Nummer bereits vorhanden: T-2024-001"
      }
    ],
    "summary": {
      "created": 120,
      "updated": 25,
      "skipped": 5
    },
    "completedAt": "2024-01-21T10:05:00Z",
    "duration": "5 minutes"
  }
}
```

### 7.3 Download Import Template
**GET** `/api/v1/import/template/aks-fields`

Lädt eine Excel-Vorlage mit AKS-spezifischen Feldern herunter.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `aksCode` (optional): Spezifischer AKS-Code für die Felder

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="import_template_2024-01-21.xlsx"

[Binary Excel file data]
```

### 7.4 Export Anlagen to Excel
**GET** `/api/v1/anlagen/export`

Exportiert Anlagen als Excel-Datei.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `objektId` (optional): Filter nach Objekt
- `aksCode` (optional): Filter nach AKS-Code
- `includeHistory` (optional): Historie einschließen (true/false)

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="anlagen_export_2024-01-21.xlsx"

[Binary Excel file data]
```

## ⚙️ 8. SETTINGS - Einstellungen

### 8.1 Get User Settings
**GET** `/api/v1/settings/preferences`

Gibt die Benutzereinstellungen zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user_2",
    "language": "de",
    "timezone": "Europe/Berlin",
    "notifications": {
      "email": true,
      "push": false,
      "maintenanceReminders": true,
      "taskAssignments": true
    },
    "display": {
      "itemsPerPage": 25,
      "defaultView": "list",
      "showInactiveAnlagen": false,
      "dateFormat": "DD.MM.YYYY",
      "compactMode": false
    },
    "mobile": {
      "offlineMode": true,
      "autoSync": true,
      "syncOnWifiOnly": true,
      "photosQuality": "medium"
    }
  }
}
```

### 8.2 Update User Settings
**PUT** `/api/v1/settings/preferences`

Aktualisiert die Benutzereinstellungen.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "language": "en",
  "notifications": {
    "email": true,
    "push": true,
    "maintenanceReminders": true,
    "taskAssignments": false
  },
  "display": {
    "itemsPerPage": 50,
    "defaultView": "grid"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Einstellungen erfolgreich gespeichert"
}
```

## 🔒 9. MFA - Multi-Factor Authentication

### 9.1 Setup MFA
**POST** `/api/v1/mfa/setup`

Initialisiert die Zwei-Faktor-Authentifizierung.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344",
      "44332211",
      "99887766"
    ]
  },
  "message": "Scannen Sie den QR-Code mit Ihrer Authenticator-App"
}
```

### 9.2 Verify MFA Setup
**POST** `/api/v1/mfa/verify-setup`

Verifiziert und aktiviert MFA.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "token": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Zwei-Faktor-Authentifizierung erfolgreich aktiviert"
}
```

## 🏢 10. LIEGENSCHAFTEN & OBJEKTE

### 10.1 Get All Liegenschaften
**GET** `/api/v1/liegenschaften`

Listet alle Liegenschaften auf.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "liegenschaft_1",
      "name": "Hauptstandort München",
      "adresse": "Beispielstraße 1",
      "plz": "80333",
      "ort": "München",
      "land": "Deutschland",
      "flaeche": 15000,
      "baujahr": 1995,
      "objekteCount": 5,
      "anlagenCount": 250
    }
  ]
}
```

### 10.2 Get All Objekte
**GET** `/api/v1/objekte`

Listet alle Objekte auf.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `liegenschaftId` (optional): Filter nach Liegenschaft

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "objekt_1",
      "name": "Bürogebäude A",
      "liegenschaftId": "liegenschaft_1",
      "liegenschaftName": "Hauptstandort München",
      "typ": "Bürogebäude",
      "etagen": 5,
      "flaeche": 3000,
      "baujahr": 1995,
      "anlagenCount": 75
    }
  ]
}
```

## 📊 11. STATISTICS & REPORTS

### 11.1 Get Anlagen Statistics
**GET** `/api/v1/anlagen/statistics`

Gibt Statistiken über alle Anlagen zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 250,
    "byStatus": {
      "aktiv": 220,
      "inaktiv": 15,
      "defekt": 10,
      "ausser_betrieb": 5
    },
    "byZustand": {
      "1": 5,
      "2": 10,
      "3": 50,
      "4": 135,
      "5": 50
    },
    "byAksCode": [
      {
        "aksCode": "480.10",
        "bezeichnung": "Klimaanlagen",
        "count": 45,
        "avgZustand": 3.8
      },
      {
        "aksCode": "460.10",
        "bezeichnung": "Aufzüge",
        "count": 20,
        "avgZustand": 4.2
      }
    ],
    "maintenanceStatus": {
      "upToDate": 180,
      "dueSoon": 50,
      "overdue": 20
    },
    "ageDistribution": {
      "0-5": 80,
      "6-10": 70,
      "11-15": 50,
      "16-20": 30,
      "over20": 20
    }
  }
}
```

### 11.2 Get Wartung Fällig (Maintenance Due)
**GET** `/api/v1/anlagen/wartung/faellig`

Gibt alle Anlagen mit fälliger Wartung zurück.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI5NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `days` (optional): Anzahl Tage voraus (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "anlage_1",
      "tNummer": "T-2024-001",
      "name": "Klimaanlage Bürogebäude A",
      "aksCode": "480.10",
      "lastMaintenance": "2023-07-15T10:00:00Z",
      "nextMaintenance": "2024-01-15T10:00:00Z",
      "daysUntilDue": -6,
      "status": "overdue",
      "priority": "high"
    },
    {
      "id": "anlage_5",
      "tNummer": "T-2024-005",
      "name": "Aufzug Hauptgebäude",
      "aksCode": "460.10",
      "lastMaintenance": "2023-12-01T10:00:00Z",
      "nextMaintenance": "2024-02-01T10:00:00Z",
      "daysUntilDue": 11,
      "status": "dueSoon",
      "priority": "medium"
    }
  ],
  "summary": {
    "overdue": 5,
    "dueThisWeek": 8,
    "dueThisMonth": 22,
    "total": 35
  }
}
```

## 🔄 12. SYNCHRONIZATION (Mobile/Offline)

### 12.1 Sync Download
**GET** `/api/v1/sync/download`

Lädt alle Daten für Offline-Nutzung herunter.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `lastSync` (optional): Zeitstempel der letzten Synchronisation (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-21T10:00:00Z",
    "auftraege": [...],
    "anlagen": [...],
    "aksCodes": [...],
    "aksFieldDefinitions": [...],
    "objekte": [...],
    "liegenschaften": [...],
    "deletedIds": {
      "anlagen": ["anlage_999"],
      "auftraege": []
    },
    "version": "2024.1.21"
  }
}
```

### 12.2 Sync Upload
**POST** `/api/v1/sync/upload`

Lädt lokale Änderungen zum Server hoch.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "deviceId": "mobile_device_123",
  "changes": [
    {
      "type": "UPDATE_ANLAGE",
      "entityId": "anlage_1",
      "timestamp": "2024-01-21T09:30:00Z",
      "data": {
        "zustandsBewertung": 3,
        "notizen": "Wartung durchgeführt"
      }
    },
    {
      "type": "CREATE_ANLAGE",
      "tempId": "temp_anlage_456",
      "timestamp": "2024-01-21T09:45:00Z",
      "data": {
        "objektId": "objekt_1",
        "aksCode": "480.10",
        "name": "Neue Klimaanlage",
        "tNummer": "T-2024-100"
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "succeeded": 2,
    "failed": 0,
    "idMapping": {
      "temp_anlage_456": "anlage_100"
    },
    "conflicts": [],
    "serverTimestamp": "2024-01-21T10:00:00Z"
  }
}
```

## 🔍 13. SEARCH & FILTER

### 13.1 Global Search
**GET** `/api/v1/search`

Globale Suche über alle Entitäten.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `q`: Suchbegriff (min. 3 Zeichen)
- `types` (optional): Komma-getrennte Liste (anlagen,objekte,liegenschaften)
- `limit` (optional): Max. Ergebnisse pro Typ (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "anlagen": [
      {
        "id": "anlage_1",
        "tNummer": "T-2024-001",
        "name": "Klimaanlage Bürogebäude A",
        "matchType": "name",
        "score": 0.95
      }
    ],
    "objekte": [
      {
        "id": "objekt_1",
        "name": "Bürogebäude A",
        "matchType": "name",
        "score": 0.85
      }
    ],
    "totalResults": 15,
    "searchTime": "45ms"
  }
}
```

## 🚨 ERROR RESPONSES

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Benutzerfreundliche Fehlermeldung",
    "details": {
      "field": "email",
      "reason": "already_exists"
    }
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Ungültige Eingabedaten |
| 401 | UNAUTHORIZED | Nicht authentifiziert |
| 403 | FORBIDDEN | Keine Berechtigung |
| 404 | NOT_FOUND | Ressource nicht gefunden |
| 409 | CONFLICT | Konflikt (z.B. Duplikat) |
| 422 | UNPROCESSABLE_ENTITY | Ungültige Geschäftslogik |
| 429 | RATE_LIMITED | Zu viele Anfragen |
| 500 | INTERNAL_ERROR | Serverfehler |
| 503 | SERVICE_UNAVAILABLE | Service nicht verfügbar |

### Beispiel Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Die eingegebenen Daten sind ungültig",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "E-Mail-Adresse ist bereits registriert"
        },
        {
          "field": "password",
          "message": "Passwort muss mindestens 8 Zeichen lang sein"
        }
      ]
    }
  }
}
```

## 📝 NOTES

### Rate Limiting
- Standard: 100 Requests pro 15 Minuten pro IP
- Authenticated: 1000 Requests pro 15 Minuten pro User
- Import/Export: 10 Requests pro Stunde

### Pagination
Standard-Pagination für Listen-Endpoints:
- `page`: Seitennummer (default: 1)
- `limit`: Einträge pro Seite (default: 20, max: 100)
- Response enthält `pagination` Objekt

### Filtering
Die meisten Listen-Endpoints unterstützen Filterung:
- Mehrere Filter werden mit AND verknüpft
- Array-Parameter für OR-Verknüpfung

### Sorting
Standard-Sortierung:
- `sort`: Feldname (z.B. "name", "-createdAt" für DESC)
- Mehrere Sortierungen: `sort=name,-createdAt`

### Date Formats
- Alle Datumsangaben in ISO 8601 Format
- Timezone: UTC (wird in Response Header angegeben)
- Lokale Zeiten werden vom Client konvertiert

### File Uploads
- Max. Dateigröße: 10 MB (konfigurierbar)
- Unterstützte Formate: Excel (.xlsx, .xls), Bilder (.jpg, .png)
- Multipart/form-data für Uploads

### Webhooks (Planned)
Zukünftig geplante Webhook-Events:
- anlage.created
- anlage.updated
- maintenance.due
- import.completed

---

## 🔗 Weitere Informationen

- **API Status:** https://status.your-domain.com
- **Changelog:** https://docs.your-domain.com/changelog
- **Support:** support@your-domain.com
- **SDK Downloads:** https://github.com/your-org/ams-sdk