# iOS App Development Prompt - Anlagen Management System

## Projektübersicht
Erstelle eine native iOS App für iOS 18+ in SwiftUI, die alle Funktionen der bestehenden PWA-App für das Anlagen Management System übernimmt und erweitert. Die App soll für iPhone und iPad optimiert sein.

## Bestehende PWA-Funktionalität (muss 1:1 übernommen werden)

### 1. Authentifizierung
- Login mit E-Mail und Passwort
- Session-Management mit JWT Tokens
- Auto-Logout bei Inaktivität
- Offline-Fähigkeit mit lokaler Session

### 2. Datenaufnahme-Verwaltung
- Liste aller zugewiesenen Aufträge anzeigen
- Aufträge nach Status filtern (offen, in Bearbeitung, abgeschlossen)
- Offline-Synchronisation von Aufträgen
- Fortschrittsanzeige pro Auftrag

### 3. Anlagen-Management
- Anlagen eines Auftrags anzeigen
- Neue Anlagen erstellen mit folgenden Feldern:
  - Objekt-Auswahl
  - AKS-Code (mit Suche und Dropdown)
  - Name und Beschreibung
  - Status (aktiv, wartung, defekt, inaktiv)
  - Zustandsbewertung (1-5)
  - QR-Code (manuell oder Scanner)
  - Etage und Raum
  - Anzahl/Stückzahl
  - Hersteller und Typ/Modell
  - Seriennummer (mit Barcode-Scanner)
  - Baujahr
  - Fotos (bis zu 5 Stück)
- Bestehende Anlagen bearbeiten
- Anlagen als "bearbeitet" markieren
- Notizen zu Anlagen hinzufügen

### 4. QR-Code/Barcode-Scanner
- Kamera-basiertes Scannen von QR-Codes
- Barcode-Scanning für Seriennummern
- Manuelle Eingabe als Alternative

### 5. Foto-Funktionalität
- Fotos direkt aufnehmen
- Fotos aus Galerie auswählen
- Mehrere Fotos pro Anlage (max. 5)
- Foto-Vorschau und Lösch-Funktion
- Base64-Kodierung für Offline-Speicherung

### 6. Offline-Funktionalität
- Vollständige Offline-Fähigkeit
- Lokale Datenspeicherung mit Core Data
- Automatische Synchronisation bei Internetverbindung
- Konfliktauflösung bei gleichzeitigen Änderungen
- Sync-Queue für ausstehende Änderungen
- Download aller relevanten Daten für Offline-Nutzung

### 7. Synchronisation
- Hintergrund-Synchronisation
- Manueller Sync-Button
- Sync-Status-Anzeige
- Fehlerbehandlung und Retry-Mechanismus
- Optimistische Updates

## Zusätzliche iOS-spezifische Features

### 1. Native iOS Integration
- Face ID/Touch ID für Login
- Widgets für Auftrags-Übersicht
- App Shortcuts für häufige Aktionen
- Live Activities für aktive Aufträge
- Push-Benachrichtigungen für neue Aufträge
- Spotlight-Integration für Anlagen-Suche

### 2. Erweiterte Kamera-Features
- Mehrfach-Foto-Aufnahme im Burst-Mode
- HDR-Unterstützung für bessere Bildqualität
- Dokumenten-Scanner-Modus für Typenschilder
- AR-Modus zum Visualisieren von Anlagen-Standorten
- OCR für automatische Seriennummern-Erkennung

### 3. iPad-spezifische Features
- Split-View für Auftrags- und Anlagen-Liste
- Drag & Drop für Fotos zwischen Anlagen
- Apple Pencil Support für Notizen/Skizzen
- Multi-Window Support
- Keyboard Shortcuts

### 4. Erweiterte Offline-Features
- Intelligentes Vorladen basierend auf Nutzungsmustern
- Kompression für effizienten Speicher
- Partial Sync für große Datenmengen
- Offline-Karten für Gebäude-Navigation

### 5. Kollaborations-Features
- Teilen von Anlagen-Details via ShareSheet
- AirDrop für Foto-Austausch zwischen Technikern
- Gemeinsame Bearbeitung von Aufträgen
- Kommentare und Mentions

### 6. Reporting & Analytics
- Dashboard mit Tages-/Wochen-Statistiken
- Export-Funktion (PDF, Excel)
- Zeiterfassung pro Auftrag
- Routen-Optimierung zwischen Objekten

## Technische Anforderungen

### Architecture
```
- MVVM mit Combine/async-await
- SwiftUI für alle UI-Komponenten
- Core Data für lokale Persistenz
- URLSession für Netzwerk-Kommunikation
- Modular aufgebaut mit Swift Packages
```

### Datenmodelle (Core Data)

#### Core Data Entities

##### 1. User Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var email: String
@NSManaged public var firstName: String?
@NSManaged public var lastName: String?
@NSManaged public var rolle: String
@NSManaged public var mandantId: UUID
@NSManaged public var permissions: [String]?
@NSManaged public var token: String?
@NSManaged public var refreshToken: String?
@NSManaged public var tokenExpiry: Date?
```

##### 2. Auftrag Entity (Datenaufnahme)
```swift
@NSManaged public var id: UUID
@NSManaged public var titel: String
@NSManaged public var beschreibung: String?
@NSManaged public var status: String // offen, in_bearbeitung, abgeschlossen
@NSManaged public var anlagenSichtbar: Bool
@NSManaged public var anlagenBearbeitbar: Bool
@NSManaged public var prioritaet: String // niedrig, mittel, hoch
@NSManaged public var faelligAm: Date?
@NSManaged public var fortschritt: Float
@NSManaged public var zugewieseneAnlagen: [UUID]?
@NSManaged public var bearbeiteteAnlagen: [UUID]?
@NSManaged public var createdAt: Date
@NSManaged public var updatedAt: Date
@NSManaged public var syncedAt: Date?
@NSManaged public var localChanges: Bool

// Relationships
@NSManaged public var objekte: NSSet? // To-Many: Objekt
@NSManaged public var anlagen: NSSet? // To-Many: Anlage
```

##### 3. Anlage Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var name: String
@NSManaged public var tNummer: String?
@NSManaged public var aksCode: String
@NSManaged public var qrCode: String? // Base64 oder Text
@NSManaged public var status: String
@NSManaged public var zustandsBewertung: Int16
@NSManaged public var beschreibung: String?
@NSManaged public var objektId: UUID
// Neue Felder
@NSManaged public var etage: String?
@NSManaged public var raum: String?
@NSManaged public var anzahl: Int16
@NSManaged public var hersteller: String?
@NSManaged public var typ: String?
@NSManaged public var seriennummer: String?
@NSManaged public var baujahr: Int16
@NSManaged public var qrCodeManual: String?
@NSManaged public var herstellerQrData: String?
@NSManaged public var metadaten: Data? // JSON
@NSManaged public var pruefpflichtig: Bool
@NSManaged public var createdAt: Date
@NSManaged public var updatedAt: Date
@NSManaged public var syncedAt: Date?
@NSManaged public var localChanges: Bool
@NSManaged public var isNew: Bool // Für neue Anlagen
@NSManaged public var bearbeitet: Bool
@NSManaged public var bearbeitetAm: Date?
@NSManaged public var notizen: String?

// Relationships
@NSManaged public var objekt: Objekt?
@NSManaged public var fotos: NSSet? // To-Many: Foto
@NSManaged public var auftraege: NSSet? // To-Many: Auftrag
@NSManaged public var historie: NSSet? // To-Many: AnlageHistory
```

##### 4. Objekt Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var name: String
@NSManaged public var code: String?
@NSManaged public var liegenschaftId: UUID
@NSManaged public var liegenschaftName: String?

// Relationships
@NSManaged public var anlagen: NSSet? // To-Many: Anlage
@NSManaged public var auftraege: NSSet? // To-Many: Auftrag
```

##### 5. Foto Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var imageData: Data // Base64 encoded
@NSManaged public var thumbnailData: Data? // Kleinere Version
@NSManaged public var createdAt: Date
@NSManaged public var syncedAt: Date?
@NSManaged public var localPath: String? // Für Cache

// Relationships
@NSManaged public var anlage: Anlage?
```

##### 6. AKSCode Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var code: String
@NSManaged public var bezeichnung: String
@NSManaged public var kategorie: String?
@NSManaged public var parentCode: String?
@NSManaged public var aktiv: Bool
@NSManaged public var cachedAt: Date
```

##### 7. SyncQueueItem Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var action: String // CREATE_ANLAGE, UPDATE_ANLAGE, etc.
@NSManaged public var entityId: String
@NSManaged public var entityType: String
@NSManaged public var payload: Data // JSON
@NSManaged public var createdAt: Date
@NSManaged public var retryCount: Int16
@NSManaged public var lastError: String?
@NSManaged public var synced: Bool
```

##### 8. AnlageHistory Entity
```swift
@NSManaged public var id: UUID
@NSManaged public var aktion: String // erstellt, aktualisiert
@NSManaged public var benutzerName: String
@NSManaged public var createdAt: Date
@NSManaged public var geaenderteFelder: [String]?
@NSManaged public var alteWerte: Data? // JSON
@NSManaged public var neueWerte: Data? // JSON
@NSManaged public var quelle: String // ios-app, web, pwa

// Relationships
@NSManaged public var anlage: Anlage?
```

#### Core Data Stack Setup
```swift
class PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init() {
        container = NSPersistentContainer(name: "AnlagenManagement")
        
        // Enable automatic migration
        let description = container.persistentStoreDescriptions.first
        description?.setOption(true as NSNumber, 
                               forKey: NSMigratePersistentStoresAutomaticallyOption)
        description?.setOption(true as NSNumber, 
                               forKey: NSInferMappingModelAutomaticallyOption)
        
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data failed to load: \(error)")
            }
        }
        
        // Merge policy für Konflikte
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }
}
```

### API-Integration

#### Base Configuration
```swift
struct APIConfig {
    static let baseURL = "https://api.anlagen-management.de" // Konfigurierbar
    static let apiPrefix = "/api/v1"
    static let timeout: TimeInterval = 30.0
}

// Headers für alle Requests
Headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <JWT_TOKEN>",
    "X-Request-Source": "ios-app" // Wichtig für Tracking
}
```

#### Vollständige API-Routen Dokumentation

##### 1. Authentication & Session Management
```
POST   /api/v1/auth/login
Body:  { "email": "string", "password": "string" }
Response: { "token": "string", "refreshToken": "string", "user": {...} }

POST   /api/v1/auth/refresh
Body:  { "refreshToken": "string" }
Response: { "token": "string", "refreshToken": "string" }

POST   /api/v1/auth/logout
Headers: Authorization required

POST   /api/v1/auth/revoke-all
Headers: Authorization required

GET    /api/v1/auth/me
Headers: Authorization required
Response: { "user": { "id", "email", "name", "rolle", "mandant_id", "permissions": [] } }
```

##### 2. Datenaufnahme (Aufträge)
```
GET    /api/v1/datenaufnahme/meine-auftraege
Headers: Authorization required
Response: [{
    "id": "uuid",
    "titel": "string",
    "beschreibung": "string",
    "status": "offen|in_bearbeitung|abgeschlossen",
    "anlagen_sichtbar": boolean,
    "anlagen_bearbeitbar": boolean,
    "prioritaet": "niedrig|mittel|hoch",
    "faellig_am": "date",
    "fortschritt": number,
    "objekte": [{
        "id": "uuid",
        "name": "string",
        "liegenschaft_id": "uuid",
        "liegenschaft_name": "string"
    }],
    "zugewiesene_anlagen": ["uuid"],
    "bearbeitete_anlagen": ["uuid"]
}]

GET    /api/v1/datenaufnahme/:id
Headers: Authorization required

GET    /api/v1/datenaufnahme/:id/fortschritt
Response: { 
    "total": number, 
    "bearbeitet": number, 
    "fortschritt": number,
    "anlagen_details": [{...}]
}

PUT    /api/v1/datenaufnahme/:id
Body:  { "status": "string", ... }

POST   /api/v1/datenaufnahme/:aufnahmeId/anlagen/:anlageId/bearbeitet
Body:  { "notizen": "string" }

POST   /api/v1/datenaufnahme/:aufnahmeId/anlagen/:anlageId/hinzufuegen
Body:  {} // Empty body
```

##### 3. Anlagen Management
```
GET    /api/v1/anlagen
Query: ?objekt_id=uuid&status=string&search=string
Headers: Authorization required
Response: [{
    "id": "uuid",
    "name": "string",
    "t_nummer": "string",
    "aks_code": "string",
    "qr_code": "string", // Base64 image oder Text
    "status": "aktiv|wartung|defekt|inaktiv",
    "zustands_bewertung": 1-5,
    "description": "string",
    "objekt_id": "uuid",
    "objekt_name": "string",
    "liegenschaft_name": "string",
    // Neue Felder:
    "etage": "string",
    "raum": "string", 
    "anzahl": number,
    "hersteller": "string",
    "typ": "string",
    "seriennummer": "string",
    "baujahr": number,
    "qr_code_manual": "string",
    "hersteller_qr_data": "string",
    "fotos": ["base64_string"],
    "metadaten": {...},
    "pruefpflichtig": boolean,
    "created_at": "datetime",
    "updated_at": "datetime"
}]

GET    /api/v1/anlagen/:id
Headers: Authorization required

GET    /api/v1/anlagen/:id/history
Response: [{
    "id": "uuid",
    "aktion": "erstellt|aktualisiert",
    "benutzer_name": "string",
    "created_at": "datetime",
    "geaenderte_felder": ["string"],
    "alte_werte": {...},
    "neue_werte": {...},
    "quelle": "pwa|web|api"
}]

POST   /api/v1/anlagen
Body: {
    "objektId": "uuid",
    "tNummer": "string" | null,
    "aksCode": "string",
    "name": "string",
    "description": "string",
    "status": "aktiv|wartung|defekt|inaktiv",
    "zustandsBewertung": 1-5,
    "etage": "string",
    "raum": "string",
    "anzahl": number,
    "hersteller": "string",
    "typ": "string", 
    "seriennummer": "string",
    "baujahr": number,
    "qrCodeManual": "string",
    "herstellerQrData": "string",
    "fotos": ["base64_string"],
    "aufnahmeId": "uuid" // Optional für Datenaufnahme
}

PUT    /api/v1/anlagen/:id
Body: { 
    // Alle Felder wie bei POST, aber optional
    "metadaten": {...} // Zusätzlich
}

DELETE /api/v1/anlagen/:id

GET    /api/v1/anlagen/qr/:qrCode
Params: qrCode (URL encoded)

GET    /api/v1/anlagen/search
Query: ?objektId=uuid&status=string&aksCode=string&zustandsBewertung=number&search=string

GET    /api/v1/anlagen/statistics
Response: {
    "total_anlagen": number,
    "anlagen_by_status": {
        "aktiv": number,
        "wartung": number,
        "defekt": number,
        "inaktiv": number
    },
    "wartung_faellig": number,
    "wartung_ueberfaellig": number,
    "anlagen_by_kategorie": {...}
}
```

##### 4. AKS-Codes
```
GET    /api/v1/aks
Query: ?search=string&kategorie=string&limit=number
Response: [{
    "id": "uuid",
    "code": "string",
    "bezeichnung": "string", 
    "kategorie": "string",
    "parent_code": "string",
    "aktiv": boolean
}]

GET    /api/v1/aks/search
Query: ?q=string&limit=20

GET    /api/v1/aks/tree
Response: Hierarchische Struktur

GET    /api/v1/aks/categories
Response: ["string"]

GET    /api/v1/aks/code/:code
Response: Detaillierte AKS-Code Info

GET    /api/v1/aks/code/:code/mapping
Response: Feld-Mapping Informationen
```

##### 5. Liegenschaften & Objekte
```
GET    /api/v1/liegenschaften
Response: [{
    "id": "uuid",
    "name": "string",
    "code": "string",
    "adresse": "string",
    "mandant_id": "uuid"
}]

GET    /api/v1/objekte
Query: ?liegenschaft_id=uuid
Response: [{
    "id": "uuid",
    "name": "string",
    "code": "string",
    "liegenschaft_id": "uuid",
    "liegenschaft_name": "string"
}]

GET    /api/v1/objekte/:id
```

##### 6. User Management
```
GET    /api/v1/users
Headers: Authorization (Admin/Techniker)

GET    /api/v1/users/:id

GET    /api/v1/user-management/users
Response: [{
    "id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "rolle": "string",
    "mandant_id": "uuid",
    "mandant_name": "string",
    "aktiv": boolean,
    "permissions": ["string"]
}]
```

##### 7. Settings & Profile
```
GET    /api/v1/settings/profile
Response: User profile data

PUT    /api/v1/settings/profile
Body:  { "firstName": "string", "lastName": "string", ... }

GET    /api/v1/settings/preferences
Response: { "theme": "light|dark", "language": "de|en", ... }

PUT    /api/v1/settings/preferences
Body:  { "theme": "string", ... }
```

##### 8. Multi-Factor Authentication (Optional)
```
GET    /api/v1/mfa/status
Response: { "enabled": boolean, "type": "totp|sms" }

POST   /api/v1/mfa/setup
Response: { "secret": "string", "qrCode": "base64" }

POST   /api/v1/mfa/verify-setup
Body:  { "token": "string" }

POST   /api/v1/mfa/disable
Body:  { "password": "string" }
```

#### Response Format
Alle API Responses folgen diesem Format:
```json
// Success
{
    "data": {...} | [...],
    "message": "string" // Optional
}

// Error
{
    "error": "string",
    "message": "string",
    "statusCode": number,
    "details": {...} // Optional
}
```

#### Error Codes
- 400: Bad Request - Validierungsfehler
- 401: Unauthorized - Token fehlt/ungültig
- 403: Forbidden - Keine Berechtigung
- 404: Not Found - Ressource nicht gefunden
- 409: Conflict - Duplikat oder Constraint-Verletzung
- 422: Unprocessable Entity - Business Logic Fehler
- 500: Internal Server Error

#### Sync & Offline Queue
Für Offline-Support müssen folgende Aktionen in einer Queue gespeichert werden:
```swift
enum SyncAction {
    case createAnlage(data: AnlageCreateRequest)
    case updateAnlage(id: String, data: AnlageUpdateRequest)
    case markBearbeitet(aufnahmeId: String, anlageId: String, notizen: String)
    case updateAuftragStatus(id: String, status: String)
}
```

#### Important Headers & Parameters
- **X-Request-Source**: "ios-app" für Tracking
- **Accept-Language**: "de-DE" für Lokalisierung
- **X-App-Version**: App Version für Kompatibilität
- **X-Device-ID**: Unique Device ID für Sync
- Alle IDs sind UUIDs
- Alle Dates im ISO 8601 Format
- Base64 für Bilder mit "data:image/png;base64," Prefix
- Arrays für Fotos max. 5 Einträge
- Seriennummern können Sonderzeichen enthalten

### UI/UX Guidelines
- iOS Human Interface Guidelines befolgen
- Dark Mode Support
- Dynamic Type für Accessibility
- VoiceOver Unterstützung
- Haptic Feedback für wichtige Aktionen
- Smooth Animations (60fps)
- Pull-to-Refresh
- Swipe Actions für Listen

### Sicherheit
- Keychain für sichere Token-Speicherung
- Biometrische Authentifizierung
- Certificate Pinning für API
- Verschlüsselung sensibler Daten
- App Transport Security

### Performance
- Lazy Loading für Listen
- Image Caching und Compression
- Background Processing für Sync
- Memory Management optimieren
- Battery-schonende Synchronisation

### Testing
- Unit Tests für ViewModels
- UI Tests für kritische Workflows
- Integration Tests für Sync
- Performance Tests
- Accessibility Tests

## Projektstruktur
```
AnlagenManagement/
├── App/
│   ├── AnlagenManagementApp.swift
│   ├── AppDelegate.swift
│   └── Info.plist
├── Core/
│   ├── Models/
│   ├── Network/
│   ├── Database/
│   ├── Services/
│   └── Extensions/
├── Features/
│   ├── Authentication/
│   ├── Auftraege/
│   ├── Anlagen/
│   ├── Scanner/
│   ├── Sync/
│   └── Settings/
├── Resources/
│   ├── Assets.xcassets
│   ├── Localizable.strings
│   └── LaunchScreen.storyboard
└── Tests/
```

## Entwicklungs-Prioritäten
1. Core Data Setup und Modelle
2. Authentication mit Offline-Support
3. Auftrags-Liste und Detail-Views
4. Anlagen-CRUD-Operationen
5. Offline-Sync-Mechanismus
6. Kamera und Scanner Integration
7. iPad-Optimierungen
8. Erweiterte Features

## Besondere Hinweise
- Die App muss von Tag 1 vollständig offline-fähig sein
- Alle Daten müssen auch ohne Internet verfügbar sein
- Sync-Konflikte müssen elegant gelöst werden
- Die App soll sich "nativ" anfühlen, nicht wie eine Web-App
- Performance ist kritisch - die App wird auf Baustellen mit schlechtem Empfang genutzt
- Batterieverbrauch minimieren
- Große Datenmengen effizient handhaben (tausende Anlagen pro Auftrag möglich)

## Migrations-Strategie von PWA zu iOS
- Bestehende Nutzer sollen sich nahtlos einloggen können
- Lokale PWA-Daten sollen importierbar sein
- Feature-Parität in Phase 1, Erweiterungen in Phase 2
- Schrittweise Migration unterstützen

## Code-Beispiel für Start:

```swift
import SwiftUI
import CoreData

@main
struct AnlagenManagementApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var syncManager = SyncManager()
    
    let persistenceController = PersistenceController.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(authManager)
                .environmentObject(syncManager)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Configure network monitoring
        // Setup background sync
        // Register for notifications
        // Check authentication state
    }
}
```

## Wichtige Implementierungs-Details

### Anlagen-Ansicht in der App
Die iOS App muss eine umfassende Anlagen-Übersicht bieten, die über die PWA hinausgeht:

#### 1. Anlagen-Liste View
```swift
struct AnlagenListView: View {
    // Filteroptionen
    - Nach Liegenschaft/Objekt
    - Nach Status
    - Nach AKS-Code
    - Nach Zustandsbewertung
    - Volltextsuche
    
    // Sortierung
    - Nach Name
    - Nach T-Nummer
    - Nach Erstelldatum
    - Nach Zustand
    
    // Anzeige
    - Kompakte Listenansicht
    - Detaillierte Kartenansicht
    - Map-Ansicht (wenn Koordinaten vorhanden)
}
```

#### 2. Anlagen-Detail View
Vollständige Anzeige aller Anlagen-Informationen:
- Alle Basisdaten
- QR-Code Anzeige (als Bild wenn Base64, generiert wenn Text)
- Fotos in Galerie-Ansicht
- Metadaten
- Historie mit Timeline
- Wartungsinformationen
- Dokumente (wenn vorhanden)

#### 3. Anlagen-Bearbeitung
- Inline-Bearbeitung für schnelle Änderungen
- Vollständiger Edit-Modus
- Foto-Aufnahme direkt in der Detail-Ansicht
- QR-Code Scanner Integration

### Offline-First Architektur

#### Sync-Strategie
```swift
class SyncManager {
    // 1. Download bei App-Start
    func downloadInitialData() {
        // Alle Aufträge des Users
        // Alle zugehörigen Anlagen
        // Alle relevanten Objekte
        // AKS-Codes Cache
    }
    
    // 2. Incremental Sync
    func syncChanges() {
        // Upload lokale Änderungen
        // Download neue/geänderte Daten
        // Konfliktauflösung
    }
    
    // 3. Background Sync
    func setupBackgroundSync() {
        // iOS Background Tasks
        // Silent Push Notifications
    }
}
```

#### Konfliktauflösung
- Server-Daten haben Vorrang bei Konflikten
- Lokale Änderungen werden in separater Queue gespeichert
- User wird über Konflikte informiert
- Möglichkeit zur manuellen Konfliktauflösung

### Performance-Optimierungen

#### 1. Bildverwaltung
```swift
class ImageManager {
    // Kompression vor Upload
    func compressImage(_ image: UIImage) -> Data {
        // JPEG mit 80% Qualität
        // Max 1920x1920 Resolution
    }
    
    // Thumbnail Generation
    func generateThumbnail(_ image: UIImage) -> UIImage {
        // 150x150 für Listen
        // 300x300 für Grid
    }
    
    // Lazy Loading
    func loadImage(for anlageId: UUID) -> AnyPublisher<UIImage?, Never> {
        // Erst Thumbnail, dann Full Size
    }
}
```

#### 2. Datenbank-Optimierungen
- Batch Inserts/Updates
- Indexed Fetches
- Lazy Loading für Relationships
- Background Context für schwere Operationen

### UI/UX Best Practices

#### 1. Navigation
- Tab Bar für Hauptbereiche
- Swipe-Back überall
- Breadcrumb für tiefe Navigation
- Quick Actions via 3D Touch/Long Press

#### 2. Feedback
- Haptic Feedback für Aktionen
- Progress Indicators für Sync
- Offline-Banner wenn keine Verbindung
- Success/Error Toasts

#### 3. Accessibility
- VoiceOver Labels für alle Controls
- Dynamic Type Support
- High Contrast Mode
- Reduce Motion Support

### Security Implementation

#### 1. Keychain Integration
```swift
class KeychainManager {
    func saveToken(_ token: String) {
        // Secure Enclave wenn verfügbar
        // Fallback auf standard Keychain
    }
    
    func enableBiometric() {
        // Face ID/Touch ID Setup
        // Fallback auf Passcode
    }
}
```

#### 2. Data Encryption
- Core Data Encryption für sensible Daten
- SSL Pinning für API Calls
- Verschlüsselte Backups

### Testing Strategy

#### 1. Unit Tests
- ViewModels: 80% Coverage
- Services: 90% Coverage
- Core Data: Migrations testen

#### 2. UI Tests
- Critical User Flows
- Offline Scenarios
- Sync Scenarios

#### 3. Performance Tests
- Große Datenmengen (1000+ Anlagen)
- Bildverarbeitung
- Sync Performance

## Start der Entwicklung

Beginne mit:
1. **Core Data Setup** - Alle Entities und Relationships
2. **API Client** - Mit Offline Queue und Token Management
3. **Authentication Flow** - Login, Token Refresh, Biometric
4. **Hauptnavigation** - Tab Bar mit Aufträge, Anlagen, Einstellungen
5. **Auftrags-Liste** - Erste funktionale View
6. **Offline Sync** - Grundlegende Implementierung
7. **Anlagen CRUD** - Create, Read, Update mit Offline Support
8. **Kamera/Scanner** - QR und Foto Integration

Stelle sicher, dass die App von Anfang an:
- Vollständig offline-fähig ist
- Performant mit großen Datenmengen umgeht
- Sich nativ anfühlt (keine Web-View Elemente)
- Alle PWA-Features übernimmt und erweitert
- Die iOS Platform Features optimal nutzt

Die App soll das beste Tool für Techniker im Feld sein - zuverlässig, schnell und intuitiv.