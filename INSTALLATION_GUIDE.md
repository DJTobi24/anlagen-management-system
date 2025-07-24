# Anlagen-Management-System - Installationsanleitung

## Systemanforderungen

### Minimum
- Node.js 18.x oder höher
- PostgreSQL 14 oder höher
- Redis 6.x oder höher (optional, für Performance)
- 2 GB RAM
- 10 GB Festplattenspeicher

### Empfohlen
- Node.js 20.x
- PostgreSQL 16
- Redis 7.x
- 4 GB RAM
- 20 GB Festplattenspeicher
- Ubuntu 22.04 LTS oder vergleichbares OS

## Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd anlagen-management-system
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
```

Bearbeiten Sie die `.env` Datei:
```env
# Datenbank
DATABASE_URL=postgresql://user:password@localhost:5432/anlagendb
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anlagendb
DB_USER=your_user
DB_PASSWORD=your_password

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production

# Import Worker
IMPORT_WORKERS=20
MAX_FILE_SIZE=52428800
```

### 4. Datenbank initialisieren
```bash
# Datenbank erstellen
createdb anlagendb

# Migrationen ausführen
npm run migrate

# Initiale Daten laden
npm run seed
```

### 5. Build erstellen
```bash
npm run build
```

### 6. Server starten
```bash
# Produktion
npm start

# Entwicklung
npm run dev
```

## Docker Installation

### Mit Docker Compose
```bash
# Build und Start
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Stoppen
docker-compose down
```

### Mit Docker (einzeln)
```bash
# Image bauen
docker build -t anlagen-management .

# Container starten
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/anlagendb \
  -e JWT_SECRET=your-secret-key \
  --name anlagen-app \
  anlagen-management
```

## Kubernetes Installation

```bash
# Namespace erstellen
kubectl apply -f k8s/namespace.yaml

# Secrets erstellen
kubectl create secret generic anlagen-secrets \
  --from-literal=database-url='postgresql://user:password@host:5432/anlagendb' \
  --from-literal=jwt-secret='your-secret-key' \
  -n anlagen-system

# Deployment
kubectl apply -f k8s/
```

## Erste Schritte

### 1. Admin-Benutzer anlegen
```bash
npm run create-admin -- --email admin@example.com --password secure-password
```

### 2. Mandanten anlegen
1. Als Admin einloggen
2. Zu Einstellungen > Mandanten navigieren
3. Neuen Mandanten erstellen

### 3. AKS-Codes importieren
1. Zu Einstellungen > AKS-Verwaltung navigieren
2. AKS-Excel-Datei hochladen
3. Import starten

### 4. Benutzer anlegen
1. Zu Benutzerverwaltung navigieren
2. Neue Benutzer mit Mandantenzuordnung erstellen

## Gesundheitschecks

- Health-Check: `http://localhost:3000/api/health`
- Metrics: `http://localhost:3000/api/metrics`

## Backup & Restore

### Datenbank-Backup
```bash
# Backup erstellen
pg_dump anlagendb > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
psql anlagendb < backup_20240101.sql
```

### Datei-Backup
```bash
# Upload-Verzeichnis sichern
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## Performance-Optimierung

### PostgreSQL Tuning
```sql
-- Index-Optimierung
CREATE INDEX idx_anlagen_mandant ON anlagen(mandant_id);
CREATE INDEX idx_anlagen_aks ON anlagen(aks_code);
CREATE INDEX idx_anlagen_status ON anlagen(status);
```

### Redis aktivieren
1. Redis installieren
2. `REDIS_URL` in `.env` setzen
3. Server neu starten

## Monitoring

### PM2 (empfohlen)
```bash
# Installation
npm install -g pm2

# Start mit PM2
pm2 start ecosystem.config.js

# Monitoring
pm2 monit
```

### Systemd Service
```ini
[Unit]
Description=Anlagen Management System
After=network.target

[Service]
Type=simple
User=anlagen
WorkingDirectory=/opt/anlagen-management-system
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## SSL/TLS Konfiguration

### Mit Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name anlagen.example.com;

    ssl_certificate /etc/ssl/certs/anlagen.crt;
    ssl_certificate_key /etc/ssl/private/anlagen.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Server startet nicht
1. Port bereits belegt: `lsof -i :3000`
2. Datenbank-Verbindung prüfen: `psql -U user -h localhost -d anlagendb`
3. Logs prüfen: `npm run dev` oder `docker-compose logs`

### Import schlägt fehl
1. Dateiformat prüfen (nur .xlsx)
2. Dateigröße prüfen (max. 50MB)
3. Worker-Logs prüfen: `tail -f server.log`

### Performance-Probleme
1. Redis aktivieren
2. Worker-Anzahl erhöhen: `IMPORT_WORKERS=30`
3. Datenbank-Indizes prüfen

## Support

Bei Problemen:
1. Logs sammeln
2. Issue im Repository erstellen
3. Systemumgebung dokumentieren