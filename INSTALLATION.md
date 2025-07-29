# 🚀 Anlagen-Management-System - Installations-Anleitung

Eine vollständige Schritt-für-Schritt-Anleitung zur Installation und Einrichtung des Anlagen-Management-Systems.

## 📋 Inhaltsverzeichnis

1. [System-Anforderungen](#system-anforderungen)
2. [Schnellstart (Docker)](#schnellstart-docker)
3. [Entwicklungsumgebung](#entwicklungsumgebung)
4. [Produktions-Installation](#produktions-installation)
5. [Konfiguration](#konfiguration)
6. [Erste Schritte](#erste-schritte)
7. [Backup & Wartung](#backup--wartung)
8. [Problembehandlung](#problembehandlung)

## 🔧 System-Anforderungen

### Minimum-Anforderungen
- **CPU**: 2 Cores
- **RAM**: 4 GB
- **Storage**: 20 GB freier Speicherplatz
- **OS**: Linux (Ubuntu 20.04+), macOS 10.15+, Windows 10+

### Empfohlene Anforderungen
- **CPU**: 4 Cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Software-Abhängigkeiten
- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **Node.js**: >= 18.0 (nur für Entwicklung)
- **PostgreSQL**: >= 14.0 (falls lokal installiert)
- **Git**: Aktuelle Version

## 🚀 Schnellstart (Docker)

### Schritt 1: Repository klonen
```bash
git clone https://github.com/your-org/anlagen-management-system.git
cd anlagen-management-system
```

### Schritt 2: Environment-Dateien erstellen
```bash
# Backend-Konfiguration
cp backend/.env.example backend/.env

# Frontend-Konfiguration  
cp frontend/.env.example frontend/.env

# Produktions-Konfiguration
cp .env.production.example .env.production
```

### Schritt 3: Basis-Konfiguration anpassen
```bash
# Bearbeite backend/.env
nano backend/.env
```

Mindest-Konfiguration:
```env
NODE_ENV=development
PORT=5000
DB_NAME=anlagen_management
DB_USER=ams_user
DB_PASSWORD=ÄNDERE_MICH_BITTE
JWT_SECRET=ÄNDERE_MICH_AUCH_BITTE
```

### Schritt 4: System starten
```bash
# Alle Services starten
docker-compose up -d

# Logs verfolgen (optional)
docker-compose logs -f
```

### Schritt 5: Datenbank initialisieren
```bash
# Migrationen ausführen
docker-compose exec backend npm run db:migrate

# Demo-Daten laden
docker-compose exec backend npm run db:seed
```

### Schritt 6: System öffnen
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API-Dokumentation**: http://localhost:5000/api-docs

**Standard-Login**:
- Email: `admin@example.com`
- Passwort: `admin123`

---

## 💻 Entwicklungsumgebung

### Voraussetzungen installieren
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm postgresql-client git curl

# macOS (mit Homebrew)
brew install node postgresql git

# Windows (mit Chocolatey)
choco install nodejs postgresql git
```

### Schritt 1: Projekt einrichten
```bash
git clone https://github.com/your-org/anlagen-management-system.git
cd anlagen-management-system

# Dependencies installieren
npm install --prefix backend
npm install --prefix frontend
```

### Schritt 2: Lokale Datenbank einrichten
```bash
# PostgreSQL installieren und starten (Ubuntu)
sudo systemctl start postgresql
sudo -u postgres createdb anlagen_management
sudo -u postgres createuser ams_user --createdb --pwprompt
```

### Schritt 3: Environment konfigurieren
```bash
# Backend .env erstellen
cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anlagen_management
DB_USER=ams_user
DB_PASSWORD=dein_passwort
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
LOG_LEVEL=debug
EOF

# Frontend .env erstellen
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Anlagen-Management-System
REACT_APP_VERSION=1.0.0-dev
EOF
```

### Schritt 4: Entwicklungsserver starten
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
cd frontend
npm start
```

### Schritt 5: Datenbank initialisieren
```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## 🏭 Produktions-Installation

### Option A: Docker Compose (Empfohlen)

#### Schritt 1: Server vorbereiten
```bash
# Docker installieren (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout/Login für Docker-Gruppe
```

#### Schritt 2: Anwendung installieren
```bash
# Produktionsverzeichnis erstellen
sudo mkdir -p /opt/anlagen-management-system
sudo chown $USER:$USER /opt/anlagen-management-system
cd /opt/anlagen-management-system

# Repository klonen
git clone https://github.com/your-org/anlagen-management-system.git .

# Produktions-Konfiguration
cp .env.production.example .env.production
```

#### Schritt 3: Sichere Konfiguration
```bash
# Sichere Secrets generieren
export JWT_SECRET=$(openssl rand -hex 64)
export JWT_REFRESH_SECRET=$(openssl rand -hex 64)
export DB_PASSWORD=$(openssl rand -base64 32)

# .env.production bearbeiten
nano .env.production
```

Wichtige Produktions-Einstellungen:
```env
NODE_ENV=production
DB_PASSWORD=IHR_SICHERES_DB_PASSWORT
JWT_SECRET=IHR_SICHERER_JWT_SECRET
JWT_REFRESH_SECRET=IHR_SICHERER_REFRESH_SECRET
FRONTEND_URL=https://ihre-domain.com
BACKEND_URL=https://api.ihre-domain.com
LOG_LEVEL=warn
ENABLE_METRICS=true
```

#### Schritt 4: SSL-Zertifikate einrichten
```bash
# Verzeichnis für SSL-Zertifikate
mkdir -p ssl

# Let's Encrypt (mit Certbot)
sudo apt install certbot
sudo certbot certonly --standalone -d ihre-domain.com -d api.ihre-domain.com

# Zertifikate kopieren
sudo cp /etc/letsencrypt/live/ihre-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/ihre-domain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*
```

#### Schritt 5: Produktions-Deployment
```bash
# Images bauen
docker-compose -f docker-compose.prod.yml build

# Services starten
docker-compose -f docker-compose.prod.yml up -d

# Datenbank initialisieren
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### Option B: Kubernetes Deployment

#### Schritt 1: Kubernetes-Cluster vorbereiten
```bash
# kubectl installieren
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm installieren (optional)
curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar xz
sudo mv linux-amd64/helm /usr/local/bin/
```

#### Schritt 2: Kubernetes-Manifeste anwenden
```bash
# Namespace erstellen
export ENVIRONMENT=production
export VERSION=latest
envsubst < k8s/namespace.yaml | kubectl apply -f -

# Secrets erstellen
kubectl create secret generic ams-secrets \
  --from-literal=db-password="$DB_PASSWORD" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  -n ams-production

# Alle Manifeste anwenden
for file in k8s/*.yaml; do
  envsubst < "$file" | kubectl apply -f -
done
```

---

## ⚙️ Konfiguration

### Backend-Konfiguration (.env)
```env
# Server
NODE_ENV=production                # development|production
PORT=5000                         # Server-Port
HOST=0.0.0.0                      # Bind-Address

# Datenbank
DB_HOST=postgres                  # Database-Host
DB_PORT=5432                      # Database-Port  
DB_NAME=anlagen_management        # Database-Name
DB_USER=ams_user                  # Database-User
DB_PASSWORD=secure_password       # Database-Passwort

# Authentifizierung
JWT_SECRET=your_jwt_secret        # JWT-Secret (64+ Zeichen)
JWT_REFRESH_SECRET=refresh_secret # Refresh-Token-Secret
JWT_EXPIRES_IN=24h               # Token-Gültigkeit

# Cache & Session
REDIS_URL=redis://redis:6379     # Redis-URL
SESSION_SECRET=session_secret     # Session-Secret

# File Upload
UPLOAD_MAX_SIZE=50mb             # Max. Upload-Größe
UPLOAD_DIR=./uploads             # Upload-Verzeichnis

# Email (optional)
SMTP_HOST=smtp.gmail.com         # SMTP-Server
SMTP_PORT=587                    # SMTP-Port
SMTP_USER=user@gmail.com         # SMTP-Benutzer
SMTP_PASS=app_password           # SMTP-Passwort

# Logging & Monitoring
LOG_LEVEL=info                   # debug|info|warn|error
LOG_DIR=./logs                   # Log-Verzeichnis
ENABLE_METRICS=true              # Prometheus-Metriken

# Backup
BACKUP_SCHEDULE=true             # Automatische Backups
BACKUP_RETENTION_DAYS=30         # Backup-Aufbewahrung
AWS_ACCESS_KEY_ID=key            # S3-Access-Key (optional)
AWS_SECRET_ACCESS_KEY=secret     # S3-Secret-Key (optional)
BACKUP_S3_BUCKET=backup-bucket   # S3-Bucket (optional)
```

### Frontend-Konfiguration (.env)
```env
# API
REACT_APP_API_URL=http://localhost:5000/api  # Backend-URL
REACT_APP_API_TIMEOUT=30000                  # Request-Timeout

# App
REACT_APP_NAME=Anlagen-Management-System     # App-Name
REACT_APP_VERSION=1.0.0                      # App-Version

# Features
REACT_APP_PWA_ENABLED=true                   # PWA aktivieren
REACT_APP_OFFLINE_ENABLED=true               # Offline-Modus
REACT_APP_QR_ENABLED=true                    # QR-Scanner
REACT_APP_EXCEL_IMPORT_ENABLED=true          # Excel-Import
REACT_APP_BULK_OPERATIONS_ENABLED=true       # Bulk-Operationen

# QR-Scanner
REACT_APP_CAMERA_FACING_MODE=environment     # user|environment
```

### Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/ams
server {
    listen 80;
    server_name ihre-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ihre-domain.com;
    
    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🎯 Erste Schritte

### 1. System-Zugang
1. **Browser öffnen**: http://localhost:3000 (oder Ihre Domain)
2. **Anmelden** mit Standard-Credentials:
   - Email: `admin@example.com`
   - Passwort: `admin123`

### 2. Admin-Setup
1. **Passwort ändern**: Profil → Passwort ändern
2. **Neuen Admin erstellen**: Admin → Benutzerverwaltung
3. **Standard-Admin deaktivieren**: Empfohlen für Produktion

### 3. Mandanten einrichten
1. **Admin-Panel** → Mandanten-Verwaltung
2. **Neuen Mandanten erstellen**:
   - Name: "Ihre Firma GmbH"
   - Kurzbezeichnung: "FIRMA"
   - Adresse und Kontaktdaten eingeben
3. **Benutzer zuweisen**: Benutzer → Mandant zuweisen

### 4. AKS-Codes definieren
1. **Admin-Panel** → AKS-Verwaltung  
2. **Standard-AKS-Codes importieren** oder manuell erstellen:
   - HZ001: Heizungsanlagen
   - LU001: Lüftungsanlagen
   - EL001: Elektroanlagen
   - SA001: Sanitäranlagen

### 5. Erste Anlagen erfassen
1. **Anlagen** → Neue Anlage
2. **QR-Code** automatisch generiert
3. **Pflichtfelder** gemäß AKS-Code ausfüllen
4. **Standort** und Details ergänzen

### 6. Excel-Import testen
1. **Import-Center** öffnen
2. **Demo-Excel-Datei** herunterladen
3. **Import starten** und Fortschritt verfolgen
4. **Ergebnisse prüfen** in Anlagen-Liste

---

## 💾 Backup & Wartung

### Automatische Backups
```bash
# Backup-Status prüfen
docker-compose exec backend npm run backup:status

# Manuelles Backup erstellen
docker-compose exec backend npm run backup:create

# Backup wiederherstellen
docker-compose exec backend npm run backup:restore /app/backups/backup-20240101.sql
```

### Regelmäßige Wartung
```bash
# System-Updates (Ubuntu)
sudo apt update && sudo apt upgrade

# Docker-Cleanup
docker system prune -f
docker volume prune -f

# Log-Rotation
find /opt/anlagen-management-system/logs -name "*.log" -mtime +30 -delete

# SSL-Zertifikat erneuern
sudo certbot renew --dry-run
```

### Monitoring
```bash
# System-Status prüfen
docker-compose ps
docker-compose logs --tail=50

# Performance-Metriken
curl http://localhost:5000/metrics

# Datenbank-Status
docker-compose exec postgres pg_stat_activity
```

---

## 🔧 Problembehandlung

### Häufige Probleme

#### Problem: Container startet nicht
```bash
# Logs prüfen
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Container neu starten
docker-compose restart backend
```

#### Problem: Datenbank-Verbindung fehlschlägt
```bash
# PostgreSQL-Status prüfen
docker-compose exec postgres pg_isready

# Connection-String testen
docker-compose exec backend npm run db:test-connection

# Neu initialisieren
docker-compose exec backend npm run db:reset
```

#### Problem: Frontend lädt nicht
```bash
# Build-Prozess prüfen
docker-compose exec frontend npm run build

# Nginx-Konfiguration testen
docker-compose exec frontend nginx -t

# Cache leeren
docker-compose exec frontend rm -rf /var/cache/nginx/*
```

#### Problem: QR-Scanner funktioniert nicht
- **HTTPS erforderlich**: Kamera-Zugriff nur über HTTPS
- **Berechtigungen**: Browser-Berechtigungen prüfen
- **Entwicklung**: `HTTPS=true npm start` verwenden

#### Problem: Excel-Import schlägt fehl
```bash
# Worker-Status prüfen
docker-compose exec backend npm run worker:status

# Memory-Limit erhöhen
export NODE_OPTIONS="--max-old-space-size=4096"

# Import-Logs prüfen
docker-compose exec backend tail -f logs/import.log
```

### Debug-Modi aktivieren
```bash
# Backend Debug
docker-compose exec backend npm run dev:debug

# Frontend Debug
REACT_APP_DEBUG=true docker-compose up frontend

# Database Query Debug
DEBUG=sequelize:* docker-compose up backend
```

### Performance-Probleme
```bash
# Resource-Usage prüfen
docker stats

# Slow Query Log aktivieren
docker-compose exec postgres \
  psql -U ams_user -c "SET log_min_duration_statement = 1000;"

# Cache-Status prüfen
docker-compose exec redis redis-cli info memory
```

### Logs und Monitoring
```bash
# Alle Logs verfolgen
docker-compose logs -f

# Spezifische Service-Logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Log-Level ändern
# In .env: LOG_LEVEL=debug
docker-compose restart backend
```

---

## 📞 Support & Hilfe

### Dokumentation
- **API-Dokumentation**: http://localhost:5000/api-docs
- **GitHub Wiki**: https://github.com/your-org/anlagen-management-system/wiki
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Community
- **GitHub Issues**: Bug Reports und Feature Requests
- **Discussions**: https://github.com/your-org/anlagen-management-system/discussions
- **Discord**: Community-Chat (Link in README)

### Kommerzielle Unterstützung
- **Email**: support@ihre-firma.com
- **Telefon**: +49 123 456789
- **Support-Portal**: https://support.ihre-firma.com

---

## ✅ Installation erfolgreich?

Wenn Sie diese Punkte erfüllt haben, ist Ihre Installation erfolgreich:

- [ ] System startet ohne Fehler
- [ ] Frontend unter http://localhost:3000 erreichbar
- [ ] Backend-API unter http://localhost:5000 erreichbar
- [ ] Login mit Standard-Credentials funktioniert
- [ ] Erste Anlage kann erstellt werden
- [ ] QR-Scanner funktioniert (mit HTTPS)
- [ ] Excel-Import funktioniert
- [ ] Backup-System ist aktiv

**🎉 Herzlichen Glückwunsch! Ihr Anlagen-Management-System ist einsatzbereit.**

---

*Letzte Aktualisierung: $(date)*
*Version: 1.0.0*