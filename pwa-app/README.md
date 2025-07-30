# AMS PWA Datenaufnahme App

Eine Progressive Web App (PWA) für die mobile Datenaufnahme von Anlagen vor Ort mit vollständiger Offline-Unterstützung.

## Features

### Offline-Funktionalität
- ✅ Vollständige Offline-Unterstützung mit IndexedDB
- ✅ Automatische Synchronisation bei Internetverbindung
- ✅ Lokale Speicherung aller Änderungen
- ✅ Background Sync für ausstehende Aktionen
- ✅ Konfliktauflösung (Last-Write-Wins)

### PWA-Features
- ✅ Service Worker mit Workbox
- ✅ App-Installation auf Mobilgeräten
- ✅ Offline-Seite und Indikator
- ✅ Push-Benachrichtigungen (vorbereitet)
- ✅ Responsive Design für alle Geräte

### Datenaufnahme-Features
- ✅ Anzeige zugewiesener Aufträge
- ✅ Filterung nach Such-Modus und Status
- ✅ Bearbeitung von Anlagen-Details
- ✅ Zustandsbewertung (1-5)
- ✅ Notizen und Beschreibungen
- ✅ Foto-Upload (vorbereitet)

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten (läuft auf Port 3001)
npm start

# Production Build erstellen
npm run build
```

## Deployment

Die App kann auf jedem statischen Webserver deployed werden:

```bash
# Build erstellen
npm run build

# Mit serve testen
npx serve -s build
```

## Technologie-Stack

- **Frontend:** React 18 mit TypeScript
- **Styling:** Tailwind CSS
- **Offline:** IndexedDB mit Dexie.js
- **PWA:** Workbox für Service Worker
- **Icons:** Lucide React
- **Routing:** React Router v6

## Architektur

### Datenbank-Schema (IndexedDB)

```typescript
// Aufträge
auftraege: {
  id, titel, beschreibung, status,
  liegenschaften, objekte, anlagen,
  lastSynced, localChanges
}

// Anlagen
anlagen: {
  id, aufnahme_id, anlage_id, name,
  sichtbar, such_modus, bearbeitet,
  localChanges, pendingChanges
}

// Sync Queue
syncQueue: {
  id, type, entityId, data,
  timestamp, retries, synced
}
```

### Sync-Strategie

1. **Automatisch bei Verbindung:** Sobald die App online geht
2. **Manueller Sync:** Über die Sync-Seite
3. **Background Sync:** Service Worker synchronisiert im Hintergrund
4. **Konfliktauflösung:** Last-Write-Wins Prinzip

### Caching-Strategie

- **API Calls:** NetworkFirst (5 Minuten Cache)
- **Bilder:** CacheFirst (30 Tage Cache)
- **Statische Assets:** StaleWhileRevalidate
- **App Shell:** Precached beim ersten Laden

## Entwicklung

### Ordnerstruktur

```
src/
├── components/     # UI-Komponenten
├── contexts/       # React Contexts (Auth, Sync)
├── db/            # IndexedDB Konfiguration
├── pages/         # Seiten-Komponenten
├── services/      # API Services
├── utils/         # Hilfsfunktionen
└── index.tsx      # Entry Point
```

### Wichtige Befehle

```bash
# Type-Check
npm run type-check

# Linting
npm run lint

# Tests (wenn vorhanden)
npm test
```

## Sicherheit

- JWT-basierte Authentifizierung
- Lokale Verschlüsselung sensibler Daten (geplant)
- Automatisches Logout bei 401-Fehlern
- HTTPS erforderlich für Service Worker

## Browser-Unterstützung

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+ (iOS)
- Samsung Internet 12+

## Bekannte Einschränkungen

- Foto-Upload noch nicht implementiert
- Maximale Offline-Datenmenge: ~50MB (Browser-abhängig)
- iOS: Keine Background Sync Unterstützung

## Roadmap

- [ ] Foto-Upload mit Komprimierung
- [ ] Offline-Kartenfunktion
- [ ] QR-Code Scanner
- [ ] Sprachnotizen
- [ ] Multi-User Konfliktauflösung
- [ ] Erweiterte Filteroptionen