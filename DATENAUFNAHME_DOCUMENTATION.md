# Datenaufnahme-Vorbereitung Dokumentation

## Übersicht

Die Datenaufnahme-Vorbereitung ist eine umfassende Funktion im Anlagen-Management-System, die es ermöglicht, strukturierte Datenaufnahme-Aufträge für Mitarbeiter zu erstellen und zu verwalten. Diese Funktion optimiert den Prozess der Vor-Ort-Datenerfassung und -aktualisierung von Anlagen.

## Funktionsumfang

### 1. Auftragserstellung (Admin/Supervisor)

Administratoren und Supervisoren können Datenaufnahme-Aufträge erstellen mit:

- **Titel und Beschreibung**: Klare Aufgabenbeschreibung
- **Mitarbeiterzuweisung**: Direktzuweisung an spezifische Mitarbeiter
- **Zeitraum**: Start- und Enddatum festlegen
- **Bereichsauswahl**:
  - Liegenschaften
  - Objekte/Gebäude
  - Spezifische Anlagen

### 2. Anlagen-Konfiguration

Für jede zugewiesene Anlage können folgende Einstellungen vorgenommen werden:

- **Sichtbarkeit**: Anlage für Mitarbeiter sichtbar/unsichtbar
- **Such-Modus**: Markierung von Anlagen, die gesucht werden sollen
- **Notizen**: Spezielle Hinweise für einzelne Anlagen

### 3. Mitarbeiter-Ansicht

Mitarbeiter sehen nur ihre zugewiesenen Aufträge mit:

- **Gefilterte Anlagen**: Nur sichtbare Anlagen werden angezeigt
- **Such-Markierung**: Deutliche Kennzeichnung zu suchender Anlagen
- **Fortschrittsanzeige**: Echtzeit-Tracking des Bearbeitungsstatus
- **Mobile-optimierte Ansicht**: Für Tablet/Smartphone-Nutzung vor Ort

### 4. Datenerfassung

Bei der Bearbeitung einer Anlage können Mitarbeiter:

- **Basis-Daten aktualisieren**: Name, T-Nummer, Beschreibung
- **Status ändern**: Betriebszustand, Zustandsbewertung
- **Fotos aufnehmen**: Direkte Kamera-Integration
- **Notizen hinzufügen**: Besonderheiten dokumentieren

### 5. Fortschrittsverfolgung

- **Echtzeit-Updates**: Sofortige Statusaktualisierung
- **Detaillierter Verlauf**: Wer hat wann was geändert
- **Export-Funktion**: CSV-Export der Aktivitäten
- **Statistiken**: Übersicht über Gesamtfortschritt

## API-Endpunkte

### Datenaufnahme-Verwaltung

```
GET    /api/v1/datenaufnahme              # Alle Aufträge abrufen
GET    /api/v1/datenaufnahme/:id          # Einzelnen Auftrag abrufen
POST   /api/v1/datenaufnahme              # Neuen Auftrag erstellen
PUT    /api/v1/datenaufnahme/:id          # Auftrag aktualisieren
DELETE /api/v1/datenaufnahme/:id          # Auftrag löschen

GET    /api/v1/datenaufnahme/:id/fortschritt    # Fortschritt abrufen
PUT    /api/v1/datenaufnahme/:id/anlagen-config # Anlagen-Konfiguration
POST   /api/v1/datenaufnahme/:aufnahmeId/anlage/:anlageId/bearbeitet
```

## Datenbank-Schema

### Haupttabellen

1. **datenaufnahme_auftraege**: Basis-Auftragsdaten
2. **datenaufnahme_liegenschaften**: Zugewiesene Liegenschaften
3. **datenaufnahme_objekte**: Zugewiesene Objekte
4. **datenaufnahme_anlagen**: Anlagen-Konfiguration
5. **datenaufnahme_fortschritt**: Aktivitätsverlauf

### Status-Workflow

```
vorbereitet → in_bearbeitung → abgeschlossen
                    ↓
                pausiert
```

## Benutzerrollen

### Administrator
- Vollzugriff auf alle Funktionen
- Kann Aufträge erstellen, bearbeiten, löschen
- Sieht alle Aufträge und Fortschritte

### Supervisor
- Kann Aufträge erstellen und bearbeiten
- Sieht Aufträge seines Bereichs
- Kann Mitarbeiter zuweisen

### Mitarbeiter
- Sieht nur eigene zugewiesene Aufträge
- Kann Anlagen bearbeiten und Status aktualisieren
- Keine Verwaltungsfunktionen

## Implementierungsdetails

### Backend (TypeScript/Node.js)

- **Controller**: `datenaufnahmeController.ts`
- **Routes**: `datenaufnahme.ts`
- **Types**: `types/datenaufnahme.ts`
- **Migration**: `010_datenaufnahme_vorbereitung.sql`

### Frontend (React/TypeScript)

- **Verwaltung**: `DatenaufnahmeVerwaltung.tsx`
- **Mitarbeiter-View**: `MeineDatenaufnahmen.tsx`
- **Modals**: 
  - `CreateDatenaufnahmeModal.tsx`
  - `DatenaufnahmeDetailModal.tsx`
  - `AnlageBearbeitenModal.tsx`
- **Service**: `datenaufnahmeService.ts`

## Best Practices

### Für Administratoren

1. **Klare Aufgabenbeschreibung**: Verwenden Sie aussagekräftige Titel und Beschreibungen
2. **Sinnvolle Gruppierung**: Fassen Sie zusammenhängende Bereiche in einem Auftrag zusammen
3. **Realistische Zeiträume**: Planen Sie ausreichend Zeit für die Datenaufnahme ein
4. **Gezielte Suche**: Nutzen Sie den Such-Modus nur für wirklich zu suchende Anlagen

### Für Mitarbeiter

1. **Systematisches Vorgehen**: Arbeiten Sie Bereiche strukturiert ab
2. **Vollständige Erfassung**: Füllen Sie alle relevanten Felder aus
3. **Fotodokumentation**: Machen Sie aussagekräftige Fotos
4. **Zeitnahe Bearbeitung**: Markieren Sie Anlagen sofort nach Bearbeitung

## Sicherheit

- **Mandantentrennung**: Strikte Trennung der Daten zwischen Mandanten
- **Rollenbasierte Zugriffskontrolle**: Nur berechtigte Benutzer sehen Daten
- **Audit-Trail**: Vollständige Protokollierung aller Änderungen
- **JWT-Authentifizierung**: Sichere API-Zugriffe

## Performance-Optimierung

- **Lazy Loading**: Anlagen werden nur bei Bedarf geladen
- **Batch-Updates**: Mehrere Änderungen werden gebündelt
- **Indizierte Abfragen**: Optimierte Datenbankzugriffe
- **Caching**: Häufig verwendete Daten werden zwischengespeichert

## Zukünftige Erweiterungen

1. **Offline-Fähigkeit**: PWA-Support für Arbeit ohne Internetverbindung
2. **QR-Code Integration**: Direkte Anlage-Identifikation per QR-Code
3. **Sprachnotizen**: Audio-Aufnahmen als Alternative zu Text
4. **Team-Aufträge**: Mehrere Mitarbeiter pro Auftrag
5. **Automatische Berichte**: PDF-Generierung nach Abschluss