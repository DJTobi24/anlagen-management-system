# 🔧 Troubleshooting Guide - Anlagen-Management-System

Ein umfassender Leitfaden zur Problembehandlung und Fehlerbehebung im Anlagen-Management-System.

## 📋 Inhaltsverzeichnis

1. [Schnelle Hilfe](#schnelle-hilfe)
2. [System-Probleme](#system-probleme)
3. [Datenbank-Probleme](#datenbank-probleme)
4. [Frontend-Probleme](#frontend-probleme)
5. [Backend-Probleme](#backend-probleme)
6. [Authentifizierung](#authentifizierung)
7. [Performance-Probleme](#performance-probleme)
8. [Import/Export-Probleme](#importexport-probleme)
9. [QR-Scanner-Probleme](#qr-scanner-probleme)
10. [Docker-Probleme](#docker-probleme)
11. [Monitoring & Logs](#monitoring--logs)
12. [Erweiterte Diagnose](#erweiterte-diagnose)

---

## 🚨 Schnelle Hilfe

### System komplett neu starten
```bash
# Alle Container stoppen und neu starten
docker-compose down -v
docker-compose up -d

# Warten bis alle Services bereit sind
./scripts/verify-integration.sh
```

### Häufigste Probleme und Sofortlösungen

| Problem | Sofortlösung |
|---------|--------------|
| Login funktioniert nicht | `docker-compose restart backend` |
| Frontend lädt nicht | `docker-compose restart frontend` |
| Database-Fehler | `docker-compose restart postgres` |
| QR-Scanner startet nicht | HTTPS aktivieren: `HTTPS=true npm start` |
| Import hängt | Worker neu starten: `docker-compose restart backend` |

---

## 🖥 System-Probleme

### Problem: Container starten nicht

**Symptome:**
- `docker-compose up` schlägt fehl
- Services zeigen Status "Exited" oder "Restarting"

**Diagnose:**
```bash
# Container-Status prüfen
docker-compose ps

# Logs aller Services anzeigen
docker-compose logs

# Spezifische Service-Logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

**Lösungen:**

1. **Port-Konflikte:**
```bash
# Verwendete Ports prüfen
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :5432

# Ports in docker-compose.yml ändern
```

2. **Fehlende Environment-Variablen:**
```bash
# .env-Dateien prüfen
ls -la backend/.env frontend/.env

# Fehlende Dateien erstellen
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Docker-Speicher-Problem:**
```bash
# Docker-System bereinigen
docker system prune -f
docker volume prune -f

# Docker neu starten
sudo systemctl restart docker
```

### Problem: Langsame System-Performance

**Symptome:**
- Lange Ladezeiten
- Timeouts bei Requests
- Hohe CPU/Memory-Nutzung

**Diagnose:**
```bash
# System-Ressourcen überwachen
docker stats

# Einzelne Container analysieren
docker exec -it ams-backend-1 top
docker exec -it ams-postgres-1 pg_stat_activity

# Disk-Space prüfen
df -h
docker system df
```

**Lösungen:**

1. **Resource-Limits anpassen:**
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

2. **Cache optimieren:**
```bash
# Redis-Cache leeren
docker-compose exec redis redis-cli FLUSHALL

# Backend-Cache neu starten
docker-compose restart backend
```

---

## 🗄 Datenbank-Probleme

### Problem: Datenbankverbindung fehlgeschlagen

**Symptome:**
- "Connection refused" Fehler
- Backend kann nicht starten
- Migrations schlagen fehl

**Diagnose:**
```bash
# PostgreSQL-Status prüfen
docker-compose exec postgres pg_isready -U ams_user

# Verbindung testen
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "SELECT 1;"

# Database-Logs prüfen
docker-compose logs postgres
```

**Lösungen:**

1. **PostgreSQL neu starten:**
```bash
docker-compose restart postgres

# Warten bis bereit
timeout 60 bash -c 'until docker-compose exec postgres pg_isready -U ams_user; do sleep 2; done'
```

2. **Database-Konfiguration prüfen:**
```bash
# Environment-Variablen prüfen
docker-compose exec backend printenv | grep DB_

# Connection-String testen
docker-compose exec backend npm run db:test-connection
```

3. **Database neu initialisieren:**
```bash
# ACHTUNG: Löscht alle Daten!
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

### Problem: Migration-Fehler

**Symptome:**
- "Migration failed" Meldungen
- Schema-Inkonsistenzen
- Tabellen fehlen

**Diagnose:**
```bash
# Migration-Status prüfen
docker-compose exec backend npm run db:migrate:status

# Database-Schema analysieren
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "\dt"
```

**Lösungen:**

1. **Migrations zurücksetzen:**
```bash
# Letzte Migration rückgängig
docker-compose exec backend npm run db:migrate:undo

# Alle Migrations neu ausführen
docker-compose exec backend npm run db:migrate
```

2. **Schema komplett neu erstellen:**
```bash
# Database-Reset (VORSICHT: Datenverlust!)
docker-compose exec backend npm run db:reset
```

---

## 🌐 Frontend-Probleme

### Problem: Frontend lädt nicht / Weiße Seite

**Symptome:**
- Leere weiße Seite
- JavaScript-Fehler in Browser-Konsole
- Build-Fehler

**Diagnose:**
```bash
# Browser-Entwicklertools öffnen (F12)
# Console-Tab prüfen auf Fehler

# Frontend-Logs prüfen
docker-compose logs frontend

# Build-Status prüfen
docker-compose exec frontend npm run build
```

**Lösungen:**

1. **Browser-Cache leeren:**
```bash
# Hard-Refresh: Ctrl+Shift+R (Chrome/Firefox)
# Oder Entwicklertools → Application → Storage → Clear storage
```

2. **Frontend neu bauen:**
```bash
# Development
docker-compose exec frontend npm start

# Production
docker-compose exec frontend npm run build
docker-compose restart frontend
```

3. **Node-Modules neu installieren:**
```bash
docker-compose exec frontend rm -rf node_modules package-lock.json
docker-compose exec frontend npm install
```

### Problem: API-Calls schlagen fehl

**Symptome:**
- "Network Error" in Browser
- 404/500 Fehler bei API-Requests
- CORS-Fehler

**Diagnose:**
```bash
# Backend erreichbar?
curl -f http://localhost:5000/api/health

# CORS-Headers prüfen
curl -I -H "Origin: http://localhost:3000" http://localhost:5000/api/health

# Network-Tab in Browser-Entwicklertools prüfen
```

**Lösungen:**

1. **Backend-URL konfigurieren:**
```bash
# In frontend/.env
REACT_APP_API_URL=http://localhost:5000/api

# Container neu starten
docker-compose restart frontend
```

2. **CORS-Konfiguration prüfen:**
```javascript
// In backend/src/middleware/security.js
const corsOptions = {
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
};
```

---

## ⚙️ Backend-Probleme

### Problem: Backend startet nicht

**Symptome:**
- Container exitiert sofort
- Port-Binding-Fehler
- Module-not-found Fehler

**Diagnose:**
```bash
# Backend-Logs detailliert
docker-compose logs --tail=100 backend

# Container interaktiv starten
docker-compose run --rm backend bash

# Abhängigkeiten prüfen
docker-compose exec backend npm list
```

**Lösungen:**

1. **Dependencies neu installieren:**
```bash
docker-compose exec backend npm install
docker-compose restart backend
```

2. **Environment-Variablen prüfen:**
```bash
# Alle ENV-Vars anzeigen
docker-compose exec backend printenv

# Kritische Variablen prüfen
docker-compose exec backend node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET OK' : 'JWT_SECRET MISSING')"
```

3. **Port-Konflikt lösen:**
```bash
# Verwendete Ports prüfen
sudo lsof -i :5000

# Port in docker-compose.yml ändern
```

### Problem: API-Endpunkte antwortet nicht

**Symptome:**
- Timeout bei API-Requests
- 500 Internal Server Error
- Lange Response-Zeiten

**Diagnose:**
```bash
# API-Health-Check
curl -v http://localhost:5000/api/health

# Backend-Logs live verfolgen
docker-compose logs -f backend

# Database-Queries prüfen
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "SELECT * FROM pg_stat_activity;"
```

**Lösungen:**

1. **Memory-Limit erhöhen:**
```bash
# Node.js Memory-Limit
export NODE_OPTIONS="--max-old-space-size=4096"
docker-compose restart backend
```

2. **Database-Connection-Pool optimieren:**
```javascript
// In backend/src/config/database.js
pool: {
  max: 20,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

---

## 🔐 Authentifizierung

### Problem: Login funktioniert nicht

**Symptome:**
- "Invalid credentials" trotz korrekter Daten
- JWT-Token-Fehler
- Session-Probleme

**Diagnose:**
```bash
# Benutzer in Database prüfen
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "SELECT email, aktiv FROM \"Users\" LIMIT 5;"

# JWT-Secret prüfen
docker-compose exec backend node -e "console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'undefined')"

# Login-Request testen
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Lösungen:**

1. **Standard-Benutzer zurücksetzen:**
```bash
# Database-Seed neu ausführen
docker-compose exec backend npm run db:seed:undo
docker-compose exec backend npm run db:seed
```

2. **JWT-Secret neu generieren:**
```bash
# Neues Secret generieren
openssl rand -hex 64

# In backend/.env setzen
JWT_SECRET=neues-secret-hier
```

3. **Passwort manuell zurücksetzen:**
```sql
-- In PostgreSQL
UPDATE "Users" SET passwort = '$2b$10$X9h8K2qF...' WHERE email = 'admin@example.com';
```

### Problem: Session läuft zu schnell ab

**Symptome:**
- Nutzer wird nach kurzer Zeit ausgeloggt
- "Token expired" Fehler
- Häufige Re-Authentifizierung erforderlich

**Diagnose:**
```bash
# Token-Lebensdauer prüfen
docker-compose exec backend node -e "console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN)"

# Redis-Session prüfen
docker-compose exec redis redis-cli keys "*session*"
```

**Lösungen:**

1. **Token-Lebensdauer anpassen:**
```bash
# In backend/.env
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

2. **Session-Konfiguration optimieren:**
```javascript
// In backend/src/middleware/auth.js
const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
  rolling: true // Session bei Aktivität verlängern
};
```

---

## 📊 Performance-Probleme

### Problem: Langsame Database-Queries

**Symptome:**
- Lange Ladezeiten bei Listen
- Timeout-Fehler
- Hohe Database-CPU

**Diagnose:**
```bash
# Slow Query Log aktivieren
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "
  ALTER SYSTEM SET log_min_duration_statement = 1000;
  SELECT pg_reload_conf();
"

# Aktive Queries anzeigen
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "
  SELECT query, state, query_start 
  FROM pg_stat_activity 
  WHERE state = 'active';
"

# Index-Usage prüfen
docker-compose exec postgres psql -U ams_user -d anlagen_management -c "
  SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
  FROM pg_stat_user_indexes 
  ORDER BY idx_scan DESC;
"
```

**Lösungen:**

1. **Fehlende Indizes hinzufügen:**
```sql
-- Häufig verwendete Queries analysieren und Indizes erstellen
CREATE INDEX idx_anlagen_mandant_status ON "Anlagen" (mandantId, status);
CREATE INDEX idx_anlagen_qr_code ON "Anlagen" (qrCode);
```

2. **Query-Optimierung:**
```javascript
// Eager Loading verwenden
const anlagen = await Anlage.findAll({
  include: [
    { model: Objekt, as: 'objekt' },
    { model: AksCode, as: 'aksCode' }
  ]
});
```

3. **Connection-Pool optimieren:**
```javascript
// Database-Pool-Konfiguration
pool: {
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000
}
```

### Problem: Hoher Memory-Verbrauch

**Symptome:**
- Container werden durch OOM-Killer beendet
- Swap-Usage steigt stark
- System wird langsam

**Diagnose:**
```bash
# Memory-Usage überwachen
docker stats --no-stream

# Einzelne Prozesse analysieren
docker exec -it ams-backend-1 ps aux --sort=-%mem | head -10

# Node.js Memory-Profiling
docker-compose exec backend node --inspect=0.0.0.0:9229 dist/server.js
```

**Lösungen:**

1. **Memory-Limits setzen:**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
    environment:
      NODE_OPTIONS: "--max-old-space-size=512"
```

2. **Memory-Leaks identifizieren:**
```javascript
// Memory-Monitoring einbauen
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', Object.keys(used).map(key => 
    `${key}: ${Math.round(used[key] / 1024 / 1024)} MB`
  ).join(', '));
}, 60000);
```

---

## 📥 Import/Export-Probleme

### Problem: Excel-Import schlägt fehl

**Symptome:**
- Import hängt bei "Processing"
- Fehler beim Dateien-Upload
- Unvollständige Datenimporte

**Diagnose:**
```bash
# Import-Job-Status prüfen
docker-compose exec backend npm run import:status

# Worker-Logs prüfen
docker-compose logs backend | grep -i import

# Dateigröße prüfen
ls -lh backend/uploads/

# Temp-Verzeichnis prüfen
docker-compose exec backend ls -la /tmp/
```

**Lösungen:**

1. **Upload-Limits erhöhen:**
```javascript
// In backend/src/config/multer.js
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});
```

2. **Worker-Memory erhöhen:**
```bash
# In backend/.env
NODE_OPTIONS="--max-old-space-size=4096"
```

3. **Import-Queue zurücksetzen:**
```bash
# Redis-Queue leeren
docker-compose exec redis redis-cli FLUSHDB

# Import-Jobs zurücksetzen
docker-compose exec backend npm run import:reset
```

### Problem: Excel-Datei wird nicht erkannt

**Symptome:**
- "Invalid file format" Fehler
- Upload wird abgelehnt
- Leere Import-Resultate

**Diagnose:**
```bash
# Datei-Header prüfen
docker-compose exec backend file uploads/import-file.xlsx

# MIME-Type prüfen
docker-compose exec backend node -e "
  const mime = require('mime-types');
  console.log(mime.lookup('test.xlsx'));
"
```

**Lösungen:**

1. **MIME-Types erweitern:**
```javascript
// In backend/src/middleware/upload.js
const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
];
```

2. **Template verwenden:**
```bash
# Demo-Template herunterladen
curl -O http://localhost:5000/api/import/template
```

---

## 📱 QR-Scanner-Probleme

### Problem: Kamera-Zugriff verweigert

**Symptome:**
- "Permission denied" Fehler
- Schwarzer Bildschirm
- Kamera startet nicht

**Diagnose:**
```bash
# Browser-Berechtigungen prüfen
# Chrome: Adressleiste → Schloss-Symbol → Berechtigungen
# Firefox: Adressleiste → Schild-Symbol → Berechtigungen

# HTTPS-Status prüfen
curl -I https://localhost:3000
```

**Lösungen:**

1. **HTTPS aktivieren:**
```bash
# Development mit HTTPS
HTTPS=true npm start

# Oder Self-Signed Certificate
npm install -g mkcert
mkcert localhost
# Zertifikate in nginx.conf einbinden
```

2. **Browser-Berechtigungen zurücksetzen:**
```
1. Chrome → Einstellungen → Datenschutz und Sicherheit → Website-Einstellungen → Kamera
2. Website finden und "Zurücksetzen" klicken
3. Seite neu laden und Berechtigung erteilen
```

### Problem: QR-Code wird nicht erkannt

**Symptome:**
- Scanner läuft, erkennt aber keine Codes
- Langsame Erkennung
- Falsche QR-Codes werden erkannt

**Diagnose:**
```bash
# QR-Code-Format testen
# Generiere Test-QR-Code: https://qr-code-generator.com/
# Test mit verschiedenen QR-Code-Größen

# Scanner-Logs prüfen
# Browser-Konsole → Console-Tab
```

**Lösungen:**

1. **Scanner-Konfiguration optimieren:**
```javascript
// In frontend/src/components/QRScanner.tsx
const scannerConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0
};
```

2. **Belichtung verbessern:**
```
1. Ausreichend Licht sicherstellen
2. QR-Code flach halten
3. Kamera-Abstand optimieren (10-30cm)
4. Kontrast zwischen QR-Code und Hintergrund erhöhen
```

---

## 🐳 Docker-Probleme

### Problem: Docker-Compose schlägt fehl

**Symptome:**
- "docker-compose command not found"
- Permission-Denied-Fehler
- Version-Inkompatibilität

**Diagnose:**
```bash
# Docker-Installation prüfen
docker --version
docker-compose --version

# Docker-Service-Status
sudo systemctl status docker

# Benutzer-Berechtigungen
groups $USER | grep docker
```

**Lösungen:**

1. **Docker-Installation reparieren:**
```bash
# Docker neu installieren (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Benutzer zu Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER
# Logout/Login erforderlich
```

2. **Docker-Compose aktualisieren:**
```bash
# Neueste Version installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Problem: Volume-Mount-Probleme

**Symptome:**
- Dateien werden nicht zwischen Host und Container synchronisiert
- Permission-Denied bei File-Operations
- Leere Volumes

**Diagnose:**
```bash
# Volume-Mounts prüfen
docker-compose exec backend ls -la /app/uploads/
docker-compose exec backend whoami

# Volume-Informationen
docker volume ls
docker volume inspect ams_postgres_data
```

**Lösungen:**

1. **Berechtigungen korrigieren:**
```bash
# Host-Verzeichnis-Berechtigungen
sudo chown -R $USER:$USER ./uploads ./logs
chmod -R 755 ./uploads ./logs

# Container-User-Mapping
docker-compose exec backend chown -R node:node /app/uploads
```

2. **Volume-Probleme zurücksetzen:**
```bash
# Volumes neu erstellen
docker-compose down -v
docker volume prune -f
docker-compose up -d
```

---

## 📋 Monitoring & Logs

### Problem: Logs fehlen oder sind unvollständig

**Symptome:**
- Leere Log-Dateien
- Fehlende Fehler-Informationen
- Log-Rotation funktioniert nicht

**Diagnose:**
```bash
# Log-Verzeichnisse prüfen
ls -la backend/logs/
docker-compose exec backend ls -la /app/logs/

# Log-Level prüfen
docker-compose exec backend echo $LOG_LEVEL

# Winston-Konfiguration testen
docker-compose exec backend node -e "
  const logger = require('./src/utils/logger');
  logger.info('Test log message');
"
```

**Lösungen:**

1. **Log-Level anpassen:**
```bash
# In backend/.env
LOG_LEVEL=debug

# Container neu starten
docker-compose restart backend
```

2. **Log-Verzeichnis-Berechtigungen:**
```bash
# Host-Verzeichnis erstellen
mkdir -p backend/logs
chmod 755 backend/logs

# Container-Berechtigungen
docker-compose exec backend mkdir -p /app/logs
docker-compose exec backend chmod 755 /app/logs
```

### Problem: Metriken werden nicht gesammelt

**Symptome:**
- Prometheus-Endpunkt nicht erreichbar
- Fehlende Performance-Daten
- Monitoring-Dashboard leer

**Diagnose:**
```bash
# Metriken-Endpunkt testen
curl http://localhost:5000/metrics

# Prometheus-Client prüfen
docker-compose exec backend node -e "
  const promClient = require('prom-client');
  console.log('Prometheus client loaded:', !!promClient);
"

# Environment-Variable prüfen
docker-compose exec backend echo $ENABLE_METRICS
```

**Lösungen:**

1. **Metriken aktivieren:**
```bash
# In backend/.env
ENABLE_METRICS=true

# Container neu starten
docker-compose restart backend
```

2. **Metriken-Service-Test:**
```bash
# Prometheus-Metriken manuell generieren
curl -X POST http://localhost:5000/api/anlagen
curl http://localhost:5000/metrics | grep ams_
```

---

## 🔬 Erweiterte Diagnose

### System-Health-Check komplett durchführen

```bash
#!/bin/bash
# Umfassendes System-Diagnose-Script

echo "=== AMS System Diagnostics ==="

# 1. Docker-Status
echo "1. Docker Status:"
docker --version
docker-compose --version
docker-compose ps

# 2. Service-Erreichbarkeit
echo "2. Service Reachability:"
curl -f http://localhost:3000/ && echo "Frontend: OK" || echo "Frontend: FAIL"
curl -f http://localhost:5000/api/health && echo "Backend: OK" || echo "Backend: FAIL"

# 3. Database-Verbindung
echo "3. Database Connection:"
docker-compose exec -T postgres pg_isready -U ams_user && echo "PostgreSQL: OK" || echo "PostgreSQL: FAIL"

# 4. Redis-Verbindung
echo "4. Cache Connection:"
docker-compose exec -T redis redis-cli ping | grep -q PONG && echo "Redis: OK" || echo "Redis: FAIL"

# 5. Logs-Analyse
echo "5. Recent Errors:"
docker-compose logs --tail=20 | grep -i error | head -5

# 6. Resource-Usage
echo "6. Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 7. Disk-Space
echo "7. Disk Space:"
df -h | grep -E "/$|/var"
docker system df

echo "=== Diagnostics Complete ==="
```

### Performance-Profiling aktivieren

```bash
# Node.js Profiling aktivieren
docker-compose exec backend node --prof dist/server.js

# Memory-Heap-Dump erstellen
docker-compose exec backend node --inspect=0.0.0.0:9229 dist/server.js

# Chrome DevTools: chrome://inspect → Configure → Add localhost:9229
```

### Database-Performance analysieren

```sql
-- Langsame Queries identifizieren
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Index-Effizienz prüfen
SELECT 
  schemaname, tablename, indexname, 
  idx_scan, idx_tup_read, idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Table-Statistiken
SELECT 
  schemaname, tablename, 
  n_tup_ins, n_tup_upd, n_tup_del,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📞 Support kontaktieren

Wenn die oben genannten Lösungen nicht helfen:

### Informationen sammeln
```bash
# System-Informationen sammeln
./scripts/collect-debug-info.sh > debug-info.txt

# Logs exportieren
docker-compose logs > all-logs.txt

# Konfiguration anonymisieren
grep -v -E "(PASSWORD|SECRET|KEY)" backend/.env > config-safe.txt
```

### Support-Kanäle
- **GitHub Issues**: Für Bug-Reports mit Debug-Informationen
- **Community-Forum**: Für allgemeine Fragen
- **Enterprise-Support**: Für kritische Produktions-Probleme

### Beim Support angeben:
- Betriebssystem und Version
- Docker und Docker-Compose Versionen
- Fehlermeldungen (vollständig)
- Schritte zur Reproduktion
- System-Logs (anonymisiert)
- Erwartetes vs. tatsächliches Verhalten

---

*Letztes Update: $(date)*
*Version: 1.0.0*