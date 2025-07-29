# CI Pipeline Test Guide

## Übersicht

Das Anlagen-Management-System verwendet GitHub Actions für kontinuierliche Integration und Deployment. Diese Anleitung beschreibt die verfügbaren Test-Skripte und deren Verwendung.

## Lokale Tests

### 1. CI Test-Skript

Führen Sie alle Pipeline-Tests lokal aus:

```bash
chmod +x scripts/test-ci.sh
./scripts/test-ci.sh
```

Dieses Skript prüft:
- Node.js und npm Versionen
- Abhängigkeiten-Installation
- TypeScript-Kompilierung
- Linting (falls konfiguriert)
- Unit Tests (falls vorhanden)
- Sicherheits-Audit
- Docker Build
- Erforderliche Dateien

### 2. API-Tests

Testen Sie alle API-Endpunkte:

```bash
node test-api-complete.js
```

Ergebnisse:
- ✅ 24/26 Tests bestanden (92% Erfolgsrate)
- ❌ 2 erwartete Fehler (referentielle Integrität)

### 3. Docker-Tests

```bash
# Backend neu bauen nach TypeScript-Änderungen
docker-compose build backend

# Alle Services starten
docker-compose up -d

# Logs prüfen
docker-compose logs -f backend
```

## GitHub Actions Workflows

### Aktive Workflows

1. **CI Pipeline (Simplified)** - `.github/workflows/ci-simple.yml`
   - Trigger: Push/PR auf main/develop
   - Jobs:
     - Lint & Build Check
     - Security Scan
     - Basic Tests

### Verfügbare Workflows (Deaktiviert)

1. **CI Pipeline (Full)** - `.github/workflows/ci.yml`
   - Umfassende Tests mit PostgreSQL und Redis
   - E2E-Tests mit Playwright
   - Docker Image Build
   - Container Security Scan

2. **Performance Tests** - `.github/workflows/performance-test.yml`
   - Load Testing
   - Response Time Monitoring

3. **Deployment** - `.github/workflows/deploy-production.yml`
   - Staging/Production Deployment
   - Rollback-Funktionalität

## Workflow-Aktivierung

Um weitere Workflows zu aktivieren:

1. Ändern Sie den Trigger in der YAML-Datei:
   ```yaml
   on:
     push:
       branches: [ main, develop ]
   ```

2. Konfigurieren Sie erforderliche Secrets in GitHub:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `DEPLOY_KEY`
   - etc.

## Test-Checkliste vor Commit

- [ ] TypeScript kompiliert ohne Fehler
- [ ] ESLint zeigt keine kritischen Fehler
- [ ] API-Tests laufen durch (92%+)
- [ ] Docker Build erfolgreich
- [ ] Keine Sicherheitslücken (high/critical)

## Fehlerbehebung

### Docker rebuild vergessen
```bash
docker-compose build backend
docker-compose up -d
```

### TypeScript-Fehler
```bash
npm run typecheck
```

### API-Test-Fehler
```bash
# Einzelnen Endpunkt testen
curl -X GET http://localhost:5000/api/v1/anlagen \
  -H "Authorization: Bearer $(cat token.txt)"
```

## Nächste Schritte

1. GitHub Actions Secrets konfigurieren
2. Workflows nach Bedarf aktivieren
3. Branch-Protection Rules einrichten
4. Deployment-Pipeline konfigurieren