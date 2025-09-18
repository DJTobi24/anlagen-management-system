# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anlagen-Management-System (AMS) is a multi-tenant facility management system with QR code-based asset tracking. The system consists of:
- **Backend**: Node.js/Express/TypeScript API server with PostgreSQL database
- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **PWA App**: Progressive Web App for offline-capable field data collection

## Development Commands

### Backend Development (Root Directory)
```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start

# Database migrations
npm run migrate

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test
```

### Frontend Development (frontend/)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Linting
npm run lint
npm run lint:fix
```

### PWA App Development (pwa-app/)
```bash
cd pwa-app

# Install dependencies
npm install

# Start development server (port 3001)
npm start

# Build for production with service worker
npm run build
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# Rebuild and restart backend quickly
./quick-rebuild.sh

# View backend rebuild logs
tail -f quick-rebuild.log

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## Architecture Overview

### Backend Structure (src/)
- **controllers/**: Request handlers for each resource (anlageController, authController, datenaufnahmeController, etc.)
- **services/**: Business logic layer (anlageService, authService, settingsService, userService)
- **routes/**: API endpoint definitions mapped to controllers
- **middleware/**: Express middleware (auth.ts for JWT validation, authMiddleware.ts for enhanced auth)
- **config/**: Configuration files (database.ts, redis.ts, redis-mock.ts)
- **migrations/**: SQL migration files for database schema changes
- **models/**: Database models (if using ORM)
- **types/**: TypeScript type definitions
- **utils/**: Utility functions
- **workers/**: Background job processors

### Frontend Structure (frontend/src/)
- **components/**: Reusable React components organized by feature (Auth/, Layout/, etc.)
- **pages/**: Page-level components (Liegenschaften, Objekte, AnlageDetail, Settings, UserManagement)
- **services/**: API client services (authService.ts, aksService.ts)
- **contexts/**: React contexts (AuthContext.tsx for authentication state)
- **types/**: TypeScript interfaces and types
- **utils/**: Utility functions

### PWA App Structure (pwa-app/src/)
- **pages/**: Page components (AnlageCreate, AnlageDetail, AnlageCreateWithFields)
- **components/**: UI components (PhotoUpload, QRScanner, UniversalScanner)
- **db/**: IndexedDB database layer using Dexie (database.ts)
- **utils/**: Utilities including syncManager.ts for offline sync and dataRecovery.ts

### Database Architecture
- PostgreSQL database with multi-tenant support
- Redis for caching and session management
- Key tables: anlagen, liegenschaften, objekte, users, mandanten, aks_codes, datenaufnahme
- Audit logging with aenderungshistorie table
- Settings management with user_settings and system_settings tables

### API Architecture
- RESTful API with `/api/v1` prefix
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Techniker, Aufnehmer)
- Key endpoints:
  - Auth: `/api/v1/auth/*` (login, register, refresh, logout)
  - Anlagen: `/api/v1/anlagen/*` (CRUD operations)
  - Datenaufnahme: `/api/v1/datenaufnahme/*` (field data collection)
  - Import: `/api/v1/import/*` (Excel import/export)
  - Settings: `/api/v1/settings/*` (user and system settings)
  - User Management: `/api/v1/user-management/*`
  - AKS Fields: `/api/v1/aks-fields/*` (field definitions)
  - MFA: `/api/v1/mfa/*` (multi-factor authentication)

## Key Features & Implementation Details

### Authentication & Security
- JWT tokens stored in httpOnly cookies
- Refresh token rotation
- Multi-factor authentication support (MFA controller and routes)
- Password hashing with bcrypt
- Role-based middleware checks
- Authentication middleware in src/middleware/authMiddleware.ts

### Offline Capabilities (PWA)
- IndexedDB for local data storage using Dexie
- Sync queue for offline operations
- Service worker for caching
- Data recovery utilities

### QR Code System
- QR code generation for assets
- Camera-based QR scanning in PWA app
- Universal scanner component
- Manual code entry fallback

### Import/Export System
- Excel import/export using exceljs
- Bull queue for background processing
- Live progress updates
- Job history tracking
- Template generation service (excelTemplateService.ts)

## Environment Configuration

### Required Environment Variables (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anlagen_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
API_VERSION=v1
API_PREFIX=/api
```

## Testing Strategy
- Backend: Jest for unit tests
- Frontend: React Testing Library
- Test command: `npm test` in respective directories

## Deployment
- Docker-based deployment with docker-compose
- Services: PostgreSQL, Redis, Backend API, Frontend Nginx
- Production build process includes TypeScript compilation
- Frontend served via Nginx on port 80
- Backend API on port 3000
- PWA app built with service worker support

## Important Notes
- TypeScript strict mode is disabled - be careful with type safety
- The system uses path aliases (@/* for src/*)
- Multi-tenant architecture requires tenant context in all operations
- PWA app runs on port 3001 in development
- Frontend proxies API requests to backend in development
- Redis can fall back to in-memory mock (redis-mock.ts) when not available