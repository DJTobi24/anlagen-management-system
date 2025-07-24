# Anlagen-Management-System API Dokumentation

## Übersicht

Das Anlagen-Management-System (AMS) bietet eine RESTful API zur Verwaltung von technischen Anlagen, Gebäuden und Liegenschaften. Die API ist vollständig dokumentiert und kann über Swagger UI interaktiv getestet werden.

## Zugriff auf die API-Dokumentation

### Swagger UI (Interaktive Dokumentation)
- **Development**: http://localhost:3000/api/v1/docs
- **Production**: https://ams.swm.de/api/v1/docs

### API Übersichtsseite
- **Development**: http://localhost:3000/api/v1
- **Production**: https://ams.swm.de/api/v1

## Authentifizierung

Die API verwendet JWT (JSON Web Tokens) für die Authentifizierung.

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@swm.de",
  "password": "admin123"
}
```

### Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@swm.de",
    "name": "Admin User",
    "rolle": "admin"
  }
}
```

### Token verwenden
Bei allen weiteren Anfragen muss der Token im Authorization-Header mitgesendet werden:
```
Authorization: Bearer <token>
```

## Hauptmodule

### 1. Anlagen
- **GET** `/api/v1/anlagen` - Alle Anlagen abrufen
- **POST** `/api/v1/anlagen` - Neue Anlage erstellen
- **GET** `/api/v1/anlagen/{id}` - Anlage nach ID abrufen
- **PUT** `/api/v1/anlagen/{id}` - Anlage aktualisieren
- **DELETE** `/api/v1/anlagen/{id}` - Anlage löschen

### 2. Liegenschaften
- **GET** `/api/v1/liegenschaften` - Alle Liegenschaften abrufen
- **POST** `/api/v1/liegenschaften` - Neue Liegenschaft erstellen
- **GET** `/api/v1/liegenschaften/{id}` - Liegenschaft nach ID abrufen
- **PUT** `/api/v1/liegenschaften/{id}` - Liegenschaft aktualisieren
- **DELETE** `/api/v1/liegenschaften/{id}` - Liegenschaft löschen

### 3. Objekte/Gebäude
- **GET** `/api/v1/objekte` - Alle Objekte abrufen
- **POST** `/api/v1/objekte` - Neues Objekt erstellen
- **GET** `/api/v1/objekte/{id}` - Objekt nach ID abrufen
- **PUT** `/api/v1/objekte/{id}` - Objekt aktualisieren
- **DELETE** `/api/v1/objekte/{id}` - Objekt löschen

### 4. AKS (Anlagen-Kennzeichnungs-System)
- **GET** `/api/v1/aks` - AKS-Codes abrufen
- **GET** `/api/v1/aks/tree` - AKS als Baumstruktur
- **POST** `/api/v1/aks/import` - AKS-Daten importieren
- **PUT** `/api/v1/aks/{code}` - AKS-Code aktualisieren

### 5. Import
- **POST** `/api/v1/import/upload` - Excel-Import starten
- **GET** `/api/v1/import/jobs` - Import-Jobs abrufen
- **GET** `/api/v1/import/jobs/{jobId}` - Job-Status abrufen
- **POST** `/api/v1/import/jobs/{jobId}/cancel` - Import abbrechen
- **POST** `/api/v1/import/jobs/{jobId}/rollback` - Import rückgängig machen

### 6. FM-Datenaufnahme
- **GET** `/api/v1/fm-data/liegenschaften` - Liegenschaften für FM
- **GET** `/api/v1/fm-data/liegenschaften/{id}/buildings` - Gebäude einer Liegenschaft
- **GET** `/api/v1/fm-data/buildings/{id}/aks-tree` - AKS-Baum für Gebäude
- **GET** `/api/v1/fm-data/scan/{qrCode}` - Anlage per QR-Code finden

### 7. Benutzerverwaltung (Admin)
- **GET** `/api/v1/users` - Alle Benutzer abrufen
- **POST** `/api/v1/users` - Neuen Benutzer erstellen
- **PUT** `/api/v1/users/{id}` - Benutzer aktualisieren
- **DELETE** `/api/v1/users/{id}` - Benutzer löschen

## Beispiele

### Anlagen mit Filter abrufen
```bash
GET /api/v1/anlagen?status=aktiv&aks_code=HLS&page=1&limit=20
Authorization: Bearer <token>
```

### Neue Anlage erstellen
```bash
POST /api/v1/anlagen
Authorization: Bearer <token>
Content-Type: application/json

{
  "objekt_id": "123e4567-e89b-12d3-a456-426614174000",
  "t_nummer": "T-2024-001",
  "aks_code": "HLS-01",
  "name": "Heizkessel 1",
  "hersteller": "Viessmann",
  "modell": "Vitocrossal 300",
  "baujahr": 2020,
  "status": "aktiv",
  "zustands_bewertung": 1
}
```

### Excel-Import starten
```bash
POST /api/v1/import/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: anlagen_import.xlsx
columnMapping: {
  "tNummer": "T-Nummer",
  "aksCode": "AKS-Code",
  "name": "Anlagenname",
  "objektName": "Objekt",
  "liegenschaftName": "Liegenschaft"
}
```

## Fehlerbehandlung

Die API verwendet Standard HTTP-Statuscodes:

- **200 OK** - Anfrage erfolgreich
- **201 Created** - Ressource erfolgreich erstellt
- **400 Bad Request** - Ungültige Anfrage
- **401 Unauthorized** - Nicht authentifiziert
- **403 Forbidden** - Keine Berechtigung
- **404 Not Found** - Ressource nicht gefunden
- **500 Internal Server Error** - Serverfehler

### Fehlerformat
```json
{
  "message": "Beschreibung des Fehlers",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limiting

Die API ist auf 100 Anfragen pro Minute pro IP-Adresse begrenzt.

## Rollen und Berechtigungen

### Admin
- Vollzugriff auf alle Ressourcen
- Benutzerverwaltung
- AKS-Verwaltung
- Import-Rollback

### Techniker
- Lesen und Schreiben von Anlagen, Objekten, Liegenschaften
- Import durchführen
- FM-Datenaufnahme

### Leser
- Nur Lesezugriff auf alle Ressourcen
- Keine Änderungen möglich

## WebSocket Events (Coming Soon)

Für Echtzeit-Updates bei Import-Jobs und Wartungsbenachrichtigungen.

## Support

Bei Fragen oder Problemen wenden Sie sich an:
- Email: support@swm.de
- Telefon: +49 89 2361-0