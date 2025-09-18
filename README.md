# Anlagen Management System (AMS)

<div align="center">
  <h3>Enterprise Facility Management Platform with QR-Code Asset Tracking</h3>
  <p>A comprehensive multi-tenant solution for managing facilities, assets, and maintenance workflows</p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org)
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com)
  [![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
</div>

## Overview

The Anlagen Management System (AMS) is a professional enterprise-grade facility management platform designed to streamline the management of facilities, assets, and maintenance operations. Built with modern technologies and best practices, AMS provides a scalable, secure, and user-friendly solution for organizations of all sizes.

### Key Features

- **🏢 Multi-Tenant Architecture** - Secure data isolation between organizations with tenant-specific configurations
- **📱 QR Code Asset Tracking** - Quick identification and tracking of assets with mobile scanning
- **📴 Offline-Capable PWA** - Continue working without internet connectivity with automatic synchronization
- **🔐 Role-Based Access Control** - Granular permission management (Admin, Techniker, Aufnehmer)
- **📊 Excel Import/Export** - Bulk data operations with customizable Excel templates
- **🔄 Real-time Synchronization** - Automatic data sync across all devices
- **📚 Comprehensive API** - RESTful API with complete Swagger/OpenAPI documentation
- **📱 Mobile-First Design** - Responsive UI optimized for tablets and smartphones
- **🔍 Advanced Search & Filtering** - AKS-based categorization and powerful search capabilities
- **📈 Audit Trail** - Complete tracking of all changes with user attribution
- **🎯 Field Customization** - Dynamic field definitions per AKS code
- **🔒 Multi-Factor Authentication** - Enhanced security with MFA support

## Tech Stack

### Backend
- **Node.js 18+** with Express.js and TypeScript
- **PostgreSQL 14+** database with multi-tenant support
- **Redis** for caching and session management
- **JWT** authentication with refresh tokens
- **Bull** queue for background job processing
- **ExcelJS** for Excel operations
- **Bcrypt** for password hashing

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive design
- **React Router v6** for navigation
- **Axios** for API communication
- **React Query** for server state management

### PWA Mobile App
- **Progressive Web App** with offline capabilities
- **IndexedDB** with Dexie for local storage
- **Service Worker** for caching and background sync
- **QR Code Scanner** with jsQR library
- **Photo Upload** with compression and offline storage

### DevOps
- **Docker** containerization
- **Docker Compose** for orchestration
- **GitHub Actions** for CI/CD
- **Nginx** for static file serving and reverse proxy

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 14+
- Redis 6+ (optional, falls back to in-memory)
- Docker and Docker Compose (for containerized deployment)

### Installation with Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/DJTobi24/anlagen-management-system.git
cd anlagen-management-system
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the applications**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- PWA App: http://localhost:3001

### Local Development Setup

1. **Clone and configure**
```bash
git clone https://github.com/DJTobi24/anlagen-management-system.git
cd anlagen-management-system
cp .env.example .env
```

2. **Install dependencies**
```bash
# Backend
npm install

# Frontend
cd frontend && npm install

# PWA App
cd ../pwa-app && npm install
```

3. **Set up PostgreSQL**
```bash
# Create database
createdb anlagen_management

# Run migrations
npm run migrate
```

4. **Start development servers**
```bash
# Backend (port 3000)
npm run dev

# In new terminal - Frontend (port 3002)
cd frontend && npm start

# In new terminal - PWA App (port 3001)
cd pwa-app && npm start
```

## Project Structure

```
anlagen-management-system/
├── src/                    # Backend source code
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic layer
│   ├── routes/            # API endpoint definitions
│   ├── middleware/        # Express middleware
│   ├── migrations/        # Database migrations
│   └── config/            # Configuration files
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client services
│   │   └── contexts/     # React contexts
│   └── public/           # Static assets
├── pwa-app/              # Progressive Web App
│   ├── src/
│   │   ├── pages/        # PWA pages
│   │   ├── components/   # PWA components
│   │   ├── db/          # IndexedDB layer
│   │   └── utils/       # Utilities
│   └── public/          # PWA assets
├── docker/              # Docker configurations
├── scripts/             # Utility scripts
├── templates/           # Excel templates
└── docs/               # Documentation
```

## Environment Configuration

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anlagen_management

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
```

## API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:

- Development: `http://localhost:3000/api-docs`
- Production: `https://your-domain.com/api-docs`

### Main API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

#### Assets (Anlagen)
- `GET /api/v1/anlagen` - List assets with filtering
- `POST /api/v1/anlagen` - Create new asset
- `GET /api/v1/anlagen/:id` - Get asset details
- `PUT /api/v1/anlagen/:id` - Update asset
- `DELETE /api/v1/anlagen/:id` - Delete asset
- `GET /api/v1/anlagen/:id/qr` - Generate QR code

#### Import/Export
- `POST /api/v1/import/excel` - Import Excel data
- `GET /api/v1/export/excel` - Export to Excel
- `GET /api/v1/import/template` - Download import template
- `GET /api/v1/import/jobs/:id` - Check import job status

#### Data Collection
- `GET /api/v1/datenaufnahme` - List data collection tasks
- `POST /api/v1/datenaufnahme` - Create collection task
- `PUT /api/v1/datenaufnahme/:id` - Update collection data
- `POST /api/v1/datenaufnahme/:id/upload` - Upload photos

## Development Commands

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm test            # Run tests
```

### Frontend
```bash
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
npm run lint        # Run linting
npm run lint:fix    # Fix linting issues
```

### PWA App
```bash
npm start           # Start development server
npm run build       # Build with service worker
npm test           # Run tests
```

### Docker Operations
```bash
docker-compose up -d        # Start all services
docker-compose logs -f      # View logs
docker-compose down         # Stop all services
./quick-rebuild.sh         # Quick rebuild backend
```

## Features in Detail

### 🏢 Multi-Tenant Architecture
- Complete data isolation between tenants
- Tenant-specific configurations and branding
- Shared infrastructure with logical separation
- Scalable to thousands of tenants

### 📱 QR Code System
- Automatic QR code generation for every asset
- Mobile scanner with camera integration
- Fallback manual entry for code input
- Bulk QR code printing support
- Custom QR code formats per tenant

### 📴 Offline Capabilities
- Local data storage with IndexedDB
- Intelligent sync queue management
- Automatic conflict resolution
- Background synchronization
- Offline-first architecture

### 📊 Import/Export System
- Customizable Excel templates
- Bulk data import with validation
- Real-time progress tracking
- Comprehensive error reporting
- Background processing for large files
- Import history and rollback capability

### 🔐 Security Features
- JWT authentication with secure refresh tokens
- Role-based access control (RBAC)
- Password policies and bcrypt hashing
- HTTPS enforcement
- SQL injection prevention
- XSS and CSRF protection
- Rate limiting and DDoS protection
- Security headers (HSTS, CSP, etc.)

### 🎯 AKS Field System
- Dynamic field definitions per AKS code
- Custom validation rules
- Conditional field visibility
- Multi-language support
- Template-based field groups

## Testing

### Backend Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run tests
npm run test:coverage      # Coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests
```

## Deployment

### Production Build
```bash
# Backend
npm run build

# Frontend
cd frontend && npm run build

# PWA
cd pwa-app && npm run build
```

### Docker Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Optimization
- Database indexing on frequently queried columns
- Redis caching for session and frequently accessed data
- Image optimization and lazy loading
- Code splitting and tree shaking
- Service worker caching strategies
- CDN integration for static assets

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql
# Check connection string in .env
```

**Redis Connection Failed**
```bash
# System will fall back to in-memory cache
# To fix: ensure Redis is running
redis-cli ping
```

**Port Already in Use**
```bash
# Change port in .env or kill process
lsof -i :3000
kill -9 <PID>
```

**Migration Failed**
```bash
# Reset database and re-run migrations
npm run migrate:reset
npm run migrate
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update API documentation
- Follow conventional commits
- Ensure all tests pass
- Update README if needed

## Documentation

- [API Documentation](./API_COMPLETE_DOCUMENTATION.md) - Complete API reference
- [Installation Guide](./INSTALLATION.md) - Detailed installation instructions
- [System Overview](./SYSTEM_OVERVIEW.md) - Architecture and design
- [AKS Documentation](./AKS_DOCUMENTATION.md) - AKS system guide
- [Import Documentation](./IMPORT_DOCUMENTATION.md) - Import/Export guide
- [CI/CD Guide](./CI_PIPELINE_GUIDE.md) - CI/CD pipeline setup
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Development Guide](./CLAUDE.md) - Development instructions

## Support

For support and questions:
- 📧 Create an issue on [GitHub Issues](https://github.com/DJTobi24/anlagen-management-system/issues)
- 📚 Check the [documentation](./docs)
- 🔍 Review API docs at `/api-docs`
- 💬 Join discussions on [GitHub Discussions](https://github.com/DJTobi24/anlagen-management-system/discussions)

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

Built with excellent open-source technologies:
- Node.js and Express.js
- React and TypeScript
- PostgreSQL and Redis
- Docker and Kubernetes
- Tailwind CSS
- And many other outstanding open-source projects

---

<div align="center">
  <p>Made with ❤️ for Enterprise Facility Management</p>
  <p>© 2024 Anlagen Management System. All rights reserved.</p>
</div>