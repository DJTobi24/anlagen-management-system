# Anlagen-Management-System - Systemübersicht

## Komponenten-Zusammenfassung

### 1. Backend (TypeScript/Node.js)
**Verzeichnis:** `/src`

**Hauptkomponenten:**
- **Server:** `src/index.ts` - Express-Server mit allen Middlewares
- **Routen:** `/src/routes/` - REST API Endpoints
  - `auth.ts` - Login, Logout, Token-Refresh
  - `anlagen.ts` - CRUD-Operationen für Anlagen
  - `aks.ts` - AKS-Code Verwaltung
  - `import.ts` - Excel-Import mit Worker-Queue
  - `users.ts` - Benutzerverwaltung
  - `mandanten.ts` - Multi-Mandanten-Verwaltung
- **Services:** `/src/services/` - Business-Logik
  - `importWorkerManager.ts` - Verwaltet 20 Import-Worker
  - `aksService.ts` - AKS-Validierung und -Verwaltung
  - `authService.ts` - JWT-Authentifizierung
- **Middleware:** `/src/middleware/`
  - `auth.ts` - JWT-Validierung
  - `errorHandler.ts` - Globale Fehlerbehandlung
- **Datenbank:** PostgreSQL mit TypeORM
- **Cache:** Redis (optional, fällt auf Mock zurück)

### 2. Datenbank-Schema
**Migrationen:** `/src/migrations/`

**Haupttabellen:**
- `mandanten` - Multi-Mandanten-Unterstützung
- `users` - Benutzer mit Rollen (admin, manager, techniker, viewer)
- `anlagen` - Haupttabelle für alle Anlagen
- `aks_codes` - AKS-Referenztabelle
- `import_jobs` - Import-Status-Tracking

### 3. Import-System
**Features:**
- Excel-Import (.xlsx) bis 50MB
- 20 parallele Worker-Prozesse
- Validierung gegen AKS-Codes
- Fehlerbehandlung mit detailliertem Feedback
- Progress-Tracking in Echtzeit

### 4. Sicherheit
- JWT-basierte Authentifizierung
- Passwort-Hashing mit bcrypt
- Rollen-basierte Zugriffskontrolle
- Mandanten-Isolation
- Input-Validierung
- Rate-Limiting ready

### 5. Test-Daten
**Verfügbare Mandanten:**
1. Stadtwerke München (SWM)
2. Immobilien Berlin GmbH (IBG)
3. Klinikum Frankfurt (KLF)

**Test-Benutzer:**
- Admin: `admin@swm.de` / `Admin123!`
- Admin: `admin@ibg.de` / `Admin123!`
- Admin: `admin@klf.de` / `Admin123!`
- Weitere Benutzer mit Passwort: `User123!`

### 6. Erstellte Dateien

**Dokumentation:**
- `INSTALLATION_GUIDE.md` - Vollständige Installationsanleitung
- `TROUBLESHOOTING.md` - Problemlösungs-Guide
- `AKS_DOCUMENTATION.md` - AKS-System Dokumentation
- `IMPORT_DOCUMENTATION.md` - Import-System Guide

**Skripte:**
- `scripts/start.sh` - Start-Skript
- `scripts/verify-integration.sh` - System-Check
- `scripts/performance-test.js` - Load-Testing
- `scripts/security-check.sh` - Sicherheits-Audit
- `scripts/generate-test-data.ts` - Test-Daten Generator

**Konfiguration:**
- `docker-compose.yml` - Docker-Setup
- `Dockerfile` - Container-Definition
- `.env.example` - Umgebungsvariablen-Template

**Datenbank:**
- `src/migrations/001_initial_schema.sql` - Basis-Schema
- `src/migrations/004_aks_system_tables.sql` - AKS-Tabellen
- `src/migrations/005_test_data.sql` - Demo-Daten

## System starten

### Entwicklung
```bash
# Dependencies installieren
npm install

# Datenbank migrieren
npm run migrate

# Server starten
npm run dev
```

### Docker
```bash
# Mit Docker Compose
docker-compose up -d

# Logs anzeigen
docker-compose logs -f
```

### Produktion
```bash
# Build erstellen
npm run build

# Mit PM2 starten
pm2 start ecosystem.config.js
```

## API-Endpoints

### Authentifizierung
- `POST /api/auth/login` - Anmeldung
- `POST /api/auth/logout` - Abmeldung
- `POST /api/auth/refresh` - Token erneuern

### Anlagen
- `GET /api/anlagen` - Liste mit Pagination
- `GET /api/anlagen/:id` - Einzelne Anlage
- `POST /api/anlagen` - Neue Anlage
- `PUT /api/anlagen/:id` - Anlage aktualisieren
- `DELETE /api/anlagen/:id` - Anlage löschen
- `GET /api/anlagen/search` - Suche
- `GET /api/anlagen/statistics` - Statistiken

### Import
- `POST /api/import/upload` - Excel hochladen
- `GET /api/import/status/:jobId` - Import-Status
- `GET /api/import/template` - Excel-Template

### AKS
- `GET /api/aks/codes` - Alle AKS-Codes
- `POST /api/aks/import` - AKS-Codes importieren
- `GET /api/aks/validate/:code` - Code validieren

## Performance

- Unterstützt 50+ gleichzeitige Benutzer
- Import von 10.000+ Anlagen möglich
- Response-Zeit < 200ms für die meisten Endpoints
- Horizontale Skalierung über Docker/Kubernetes

## Monitoring

- Health-Check: `/api/health`
- Metrics: `/api/metrics` (wenn aktiviert)
- Strukturierte Logs mit Winston
- Error-Tracking vorbereitet

## Nächste Schritte

1. Frontend entwickeln (React/Angular/Vue)
2. Elasticsearch für erweiterte Suche
3. Reporting-Modul
4. Mobile App
5. Wartungsplan-Automatisierung
6. IoT-Integration für Echtzeit-Monitoring