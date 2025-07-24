# Anlagen-Management-System (AMS)

[![CI Pipeline](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/ci.yml)
[![Deploy Pipeline](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/deploy.yml/badge.svg)](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/deploy.yml)
[![Performance Tests](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/performance-test.yml/badge.svg)](https://github.com/DJTobi24/anlagen-management-system/actions/workflows/performance-test.yml)

Ein professionelles Multi-Tenant-System zur Verwaltung technischer Anlagen mit QR-Code-basierter Erfassung und mobilem Zugriff.

## 🚀 Features

### Kernfunktionen
- **Multi-Tenant-Architektur** - Vollständige Datenisolation zwischen Mandanten
- **QR-Code-Erfassung** - Mobile Anlagenerfassung über Kamera oder manuelle Eingabe
- **Role-Based Access Control** - Differenzierte Benutzerrollen (Admin, Techniker, Aufnehmer)
- **Excel Import/Export** - Massenimport und -export von Anlagendaten
- **PWA-Funktionalität** - Offline-fähige Progressive Web App
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile

### Verwaltungsfunktionen
- **Anlagenverwaltung** - CRUD-Operationen mit Filterung und Suche
- **Benutzerverwaltung** - Benutzer- und Rollenverwaltung pro Mandant
- **AKS-Verwaltung** - Anlagen-Kennzeichnungs-System mit Validierungsregeln
- **Import-Center** - Live-Progress und Job-Historie für Excel-Imports
- **Audit-Logging** - Vollständige Nachverfolgung aller Änderungen

### Technische Features
- **Offline-First** - IndexedDB mit Sync-Queue für Offline-Betrieb
- **Real-time Updates** - Live-Status-Updates und Benachrichtigungen
- **Bulk Operations** - Massenbearbeitung von Anlagen
- **Data Export** - Flexible Export-Optionen (Excel, CSV, PDF)
- **API-First** - RESTful API mit OpenAPI-Dokumentation

## 🛠 Technologie-Stack

### Backend
- **Node.js** + **Express.js** - Server Framework
- **PostgreSQL** - Relationale Datenbank
- **Sequelize ORM** - Database Abstraction Layer
- **JWT Authentication** - Token-basierte Authentifizierung
- **Multer** - Datei-Upload-Middleware
- **XLSX** - Excel-Verarbeitung
- **Jest** - Testing Framework

### Frontend
- **React 18** - UI-Framework
- **TypeScript** - Type-Safe JavaScript
- **Tailwind CSS** - Utility-First CSS Framework
- **Zustand** - State Management
- **React Router v6** - Client-Side Routing
- **React Query** - Server State Management
- **Recharts** - Datenvisualisierung
- **React QR Reader** - QR-Code-Scanning

### DevOps & Tools
- **Docker** - Containerisierung
- **Docker Compose** - Multi-Container-Orchestrierung
- **ESLint** + **Prettier** - Code Quality
- **Husky** - Git Hooks
- **GitHub Actions** - CI/CD Pipeline

## 📋 Voraussetzungen

### System-Anforderungen
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 14.0
- **Docker** >= 20.10 (optional)
- **Docker Compose** >= 2.0 (optional)

### Browser-Unterstützung
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 🚀 Installation

### Option 1: Mit Docker (Empfohlen)

1. **Repository klonen**
```bash
git clone https://github.com/your-org/anlagen-management-system.git
cd anlagen-management-system
```

2. **Environment-Dateien erstellen**
```bash
# Backend Environment
cp backend/.env.example backend/.env
# Frontend Environment  
cp frontend/.env.example frontend/.env
```

3. **Docker Container starten**
```bash
docker-compose up -d
```

4. **Datenbank initialisieren**
```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

5. **Anwendung öffnen**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API-Dokumentation: http://localhost:5000/api-docs

### Option 2: Lokale Installation

1. **Repository klonen**
```bash
git clone https://github.com/your-org/anlagen-management-system.git
cd anlagen-management-system
```

2. **PostgreSQL einrichten**
```bash
# PostgreSQL installieren (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Datenbank und Benutzer erstellen
sudo -u postgres psql
CREATE DATABASE anlagen_management;
CREATE USER ams_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE anlagen_management TO ams_user;
\q
```

3. **Backend konfigurieren**
```bash
cd backend
cp .env.example .env
# .env-Datei mit Datenbankdaten bearbeiten
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

4. **Frontend konfigurieren**
```bash
cd frontend
cp .env.example .env
# .env-Datei mit Backend-URL bearbeiten
npm install
npm start
```

## ⚙️ Konfiguration

### Backend-Konfiguration (.env)

```bash
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Datenbank
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anlagen_management
DB_USER=ams_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# File Upload
UPLOAD_MAX_SIZE=10mb
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (optional - für Caching)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Frontend-Konfiguration (.env)

```bash
# API
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000

# App
REACT_APP_NAME=Anlagen-Management-System
REACT_APP_VERSION=1.0.0

# PWA
REACT_APP_PWA_ENABLED=true
REACT_APP_OFFLINE_ENABLED=true

# QR-Scanner
REACT_APP_QR_ENABLED=true
REACT_APP_CAMERA_FACING_MODE=environment

# Features
REACT_APP_EXCEL_IMPORT_ENABLED=true
REACT_APP_BULK_OPERATIONS_ENABLED=true
REACT_APP_AUDIT_LOG_ENABLED=true
```

## 🔧 Entwicklung

### Backend-Entwicklung

```bash
cd backend

# Entwicklungsserver starten
npm run dev

# Tests ausführen
npm test
npm run test:watch
npm run test:coverage

# Datenbank-Migrationen
npm run db:migrate
npm run db:migrate:undo
npm run db:seed
npm run db:reset

# Code-Qualität
npm run lint
npm run lint:fix
npm run format

# Build für Produktion
npm run build
npm start
```

### Frontend-Entwicklung

```bash
cd frontend

# Entwicklungsserver starten
npm start

# Tests ausführen
npm test
npm run test:coverage
npm run test:ci

# Code-Qualität
npm run lint
npm run lint:fix
npm run format

# Build für Produktion
npm run build
npm run serve
```

## 🧪 Testing

### Backend-Tests

```bash
cd backend

# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Spezifische Test-Suite
npm test -- auth.test.js
npm test -- --grep "Authentication"

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e
```

### Frontend-Tests

```bash
cd frontend

# Unit Tests
npm test

# Integration Tests
npm run test:integration

# E2E Tests mit Cypress
npm run cypress:open
npm run cypress:run

# Visual Regression Tests
npm run test:visual
```

## 📚 API-Dokumentation

### OpenAPI/Swagger
- **Live-Dokumentation**: http://localhost:5000/api-docs
- **Swagger-Datei**: `/backend/docs/swagger.yaml`
- **Postman-Collection**: `/docs/postman/`

### Wichtige API-Endpunkte

```bash
# Authentication
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/refresh
POST /api/auth/logout

# Anlagen
GET    /api/anlagen
POST   /api/anlagen
GET    /api/anlagen/:id
PUT    /api/anlagen/:id
DELETE /api/anlagen/:id

# Import/Export
POST /api/import/excel
GET  /api/export/excel
GET  /api/import/jobs
GET  /api/import/jobs/:id/status

# Admin
GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/mandanten
POST   /api/admin/aks-codes
```

## 🐛 Troubleshooting

### Häufige Probleme

**Problem**: Datenbankverbindung fehlgeschlagen
```bash
# Lösung: Überprüfe Datenbankstatus
sudo service postgresql status
sudo service postgresql start

# Verbindung testen
psql -h localhost -U ams_user -d anlagen_management
```

**Problem**: Frontend kann Backend nicht erreichen
```bash
# Lösung: CORS-Konfiguration prüfen
# backend/src/config/cors.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
```

**Problem**: QR-Scanner funktioniert nicht
```bash
# Lösung: HTTPS für Kamera-Zugriff erforderlich
# Entwicklung mit HTTPS starten
HTTPS=true npm start
```

**Problem**: Excel-Import schlägt fehl
```bash
# Lösung: Speicher für große Dateien erhöhen
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/anlagen-management-system/issues)
- **Diskussionen**: [GitHub Discussions](https://github.com/your-org/anlagen-management-system/discussions)
- **Email**: support@your-domain.com
- **Dokumentation**: [Wiki](https://github.com/your-org/anlagen-management-system/wiki)

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

---

**Gebaut mit ❤️ für effizientes Anlagenmanagement**