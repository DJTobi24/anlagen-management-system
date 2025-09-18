# Android App Development Prompt - AMS Datenaufnahme

## Projektübersicht

Entwickle eine native Android-App für das Anlagen-Management-System (AMS) zur mobilen Datenaufnahme von technischen Gebäudeanlagen. Die App soll eine vollständige Portierung der bestehenden PWA-Funktionalität mit Material Design 3 (Material You) für Smartphones und Tablets sein.

## Technische Anforderungen

### Zielplattformen
- **Minimum SDK**: Android 7.0 (API Level 24)
- **Target SDK**: Android 14 (API Level 34)
- **Geräte**: Smartphones und Tablets (7" bis 12.9")
- **Orientierung**: Portrait und Landscape mit adaptivem Layout
- **Offline-First**: Vollständige Offline-Funktionalität mit Hintergrundsynchronisation

### Technology Stack
- **Sprache**: Kotlin (100%)
- **UI Framework**: Jetpack Compose mit Material Design 3
- **Architektur**: MVVM mit Clean Architecture
- **Dependency Injection**: Hilt
- **Datenbank**: Room Database mit SQLite
- **Netzwerk**: Retrofit 2 + OkHttp4 + Moshi
- **Asynchrone Operationen**: Kotlin Coroutines + Flow
- **Navigation**: Navigation Compose
- **Hintergrundsynchronisation**: WorkManager
- **Kamera**: CameraX
- **QR/Barcode Scanner**: ML Kit Barcode Scanning
- **Bildverarbeitung**: Coil für Bildladung und Caching
- **State Management**: StateFlow + Compose State

## Kernfunktionalitäten

### 1. Authentifizierung & Session Management
```kotlin
// Features zu implementieren:
- Login-Screen mit E-Mail/Passwort
- Biometrische Authentifizierung (Fingerabdruck/Gesichtserkennung)
- JWT Token Management mit automatischem Refresh
- Secure Token Storage mit EncryptedSharedPreferences
- Offline Session Persistence
- Auto-Logout bei Token-Ablauf
- Remember Me Funktionalität
```

### 2. Hauptnavigation & UI-Struktur

#### Bottom Navigation (Material 3 Navigation Bar)
```kotlin
// Tabs:
1. Aufträge (Jobs) - Icon: assignment
2. Synchronisation - Icon: sync
```

#### Adaptive Layout für Tablets
- **Kompakt (< 600dp)**: Einspalten-Layout mit Bottom Navigation
- **Medium (600-839dp)**: Navigation Rail + Content
- **Erweitert (≥ 840dp)**: Navigation Drawer + Master-Detail View

### 3. Auftragsmanagement (Aufnahmen)

#### Auftragsübersicht
```kotlin
data class Auftrag(
    val id: String,
    val titel: String,
    val beschreibung: String?,
    val status: AuftragStatus,
    val startDatum: LocalDate?,
    val fortschritt: Float, // 0.0 - 1.0
    val anlagenGesamt: Int,
    val anlagenBearbeitet: Int,
    val lokalGeaendert: Boolean
)

enum class AuftragStatus {
    VORBEREITET, IN_BEARBEITUNG, ABGESCHLOSSEN, PAUSIERT
}

// UI Features:
- Material 3 Cards mit Statusindikator
- Fortschrittsanzeige (LinearProgressIndicator)
- Swipe-to-Refresh (PullRefreshIndicator)
- Filterung nach Status
- Sortierung nach Datum/Name
- Suchfunktion mit SearchBar
```

### 4. Anlagenverwaltung

#### Anlagenliste
```kotlin
// Features:
- LazyColumn mit optimierter Performance
- Sticky Headers für Gruppierung (Etage/Raum)
- Floating Action Button für neue Anlage
- Chip-basierte Filter (Status, AKS-Code)
- Badge für bearbeitete/neue Anlagen
- Material 3 Search mit Suggestions
```

#### Anlage Erstellen/Bearbeiten
```kotlin
data class Anlage(
    val id: String,
    val name: String,
    val tNummer: String?,
    val aksCode: String,
    val status: AnlageStatus,
    val zustandsBewertung: Int, // 1-5
    val etage: String?,
    val raum: String?,
    val hersteller: String?,
    val typ: String?,
    val seriennummer: String?,
    val baujahr: Int?,
    val qrCode: String?,
    val fotos: List<Uri>,
    val dynamicFields: Map<String, Any>,
    val bearbeitet: Boolean,
    val lokalGeaendert: Boolean,
    val istNeu: Boolean
)

// Formular-Features:
- Material 3 TextField Komponenten
- Exposed Dropdown Menu für AKS-Code
- Slider für Zustandsbewertung
- DatePicker für Baujahr
- Dynamic Form Fields basierend auf AKS-Code
- Form Validation mit visuellen Fehlermeldungen
```

### 5. QR-Code & Barcode Scanner

```kotlin
// Scanner Features:
- ML Kit Barcode Scanner API
- Live-Kamera-Vorschau mit Overlay
- Multi-Format Support (QR, Code128, EAN13, etc.)
- Torch/Flashlight Toggle
- Kamera-Wechsel (Front/Back)
- Galerie-Import Option
- Vibration bei erfolgreicher Erkennung
- Manual Code Entry Dialog als Fallback

// UI-Komponenten:
- CameraX PreviewView
- Custom Overlay mit Scan-Bereich
- Material 3 IconButtons für Controls
- BottomSheet für manuelle Eingabe
```

### 6. Foto-Management

```kotlin
// Foto-Features:
- Bis zu 5 Fotos pro Anlage
- CameraX Foto-Capture
- Galerie-Integration
- Foto-Vorschau mit Zoom (Accompanist Pager)
- Swipe-to-Delete mit Undo
- Automatische Bildkompression
- EXIF-Daten behalten
- Offline-Speicherung im App-Storage

// UI-Komponenten:
- LazyRow für Foto-Thumbnails
- Full-Screen Photo Viewer
- Material 3 Cards mit Delete-Action
- Progress Indicator beim Upload
```

### 7. Offline-Funktionalität & Synchronisation

```kotlin
// Room Database Schema:
@Entity
data class CachedAuftrag(...)

@Entity  
data class CachedAnlage(...)

@Entity
data class SyncQueueItem(
    val id: Long,
    val action: SyncAction,
    val entityType: String,
    val entityId: String,
    val payload: String,
    val timestamp: Long,
    val retryCount: Int
)

// Sync-Features:
- Automatische Hintergrundsynchronisation
- Manuelle Sync-Trigger
- Konfliktauflösung (Local First)
- Retry-Mechanismus mit Exponential Backoff
- Progress Tracking mit Notification
- Sync-Status in UI (Material 3 CircularProgressIndicator)
```

### 8. Dynamische Formularfelder

```kotlin
// AKS Field System:
data class AksFieldDefinition(
    val id: String,
    val fieldKey: String,
    val label: String,
    val fieldType: FieldType,
    val required: Boolean,
    val options: List<String>?,
    val validation: FieldValidation?
)

enum class FieldType {
    TEXT, NUMBER, BOOLEAN, SELECT, DATE, MULTI_SELECT
}

// Dynamische UI-Generierung:
- Adaptive Formular-Komponenten
- Client-seitige Validierung
- Conditional Fields
- Material 3 Input-Komponenten
```

## Material Design 3 Spezifikationen

### Farbschema & Theming

```kotlin
// Dynamic Color mit Material You
- Unterstützung für Dynamic Colors (Android 12+)
- Fallback auf Custom Color Scheme
- Light/Dark Mode Support
- High Contrast Mode

// Color Roles:
- Primary: Hauptaktionen und Navigation
- Secondary: Sekundäre Aktionen
- Tertiary: Akzente und spezielle States
- Error: Validierungsfehler
- Surface: Karten und Container
- Background: App-Hintergrund
```

### Typografie

```kotlin
// Material 3 Type Scale:
- Display: App-Titel
- Headline: Screen-Titel
- Title: Card-Titel
- Body: Haupttext
- Label: Buttons und Chips

// Font: Roboto mit fallback auf System Font
```

### Komponenten-Bibliothek

```kotlin
// Zu verwendende Material 3 Komponenten:
- NavigationBar / NavigationRail / NavigationDrawer
- TopAppBar (CenterAligned für Hauptscreens)
- FloatingActionButton (Extended auf Tablets)
- Card (Filled, Elevated, Outlined je nach Kontext)
- TextField (Outlined variant)
- Button (Filled, Tonal, Outlined, Text)
- IconButton mit Tooltips
- Chip (Filter, Input, Assist, Suggestion)
- Badge für Status-Indikatoren
- ProgressIndicator (Linear & Circular)
- Snackbar für Feedback
- Dialog & BottomSheet
- Switch, Checkbox, RadioButton
- Slider für Bewertungen
- DatePicker & TimePicker
- SearchBar mit SearchView
```

### Motion & Animation

```kotlin
// Material Motion:
- Shared Element Transitions zwischen Listen und Details
- Container Transform für Modals
- Fade Through für Tab-Wechsel
- Axis Transition für Navigation
- Stagger Animation für Listen
- Spring-basierte Animations
```

### Responsive Design

```kotlin
// Window Size Classes:
@Composable
fun AdaptiveLayout() {
    val windowSizeClass = calculateWindowSizeClass()
    
    when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Compact -> CompactLayout()
        WindowWidthSizeClass.Medium -> MediumLayout()
        WindowWidthSizeClass.Expanded -> ExpandedLayout()
    }
}

// Adaptive Components:
- Compact: Bottom Navigation, Single Pane
- Medium: Navigation Rail, Single Pane with FAB
- Expanded: Navigation Drawer, List-Detail View
```

## Erweiterte Features

### 1. Intelligente Suche & Filter

```kotlin
// Features:
- Volltextsuche über alle Felder
- Gespeicherte Suchfilter
- Letzte Suchanfragen
- Auto-Complete Vorschläge
- Voice Search Integration
```

### 2. Offline-Karten Integration

```kotlin
// Optional - Falls Standortdaten relevant:
- OpenStreetMap Offline-Tiles
- Indoor-Mapping für Gebäude
- Anlagen-Markierungen auf Karte
```

### 3. Barcode-Label Druck

```kotlin
// Bluetooth Drucker Integration:
- Zebra/Brother Mobile Printer SDK
- QR-Code/Barcode Generation
- Label-Templates
```

### 4. Erweiterte Kamera-Features

```kotlin
// Computer Vision:
- OCR für Typenschilder (ML Kit Text Recognition)
- Automatische Dokumentenerkennung
- Bildqualitäts-Prüfung
```

### 5. Datenexport

```kotlin
// Export-Optionen:
- PDF-Report Generation
- Excel-Export (Apache POI Android)
- Share Intent für Dateien
```

## Sicherheitsanforderungen

```kotlin
// Security Implementation:
1. App-Verschlüsselung:
   - EncryptedSharedPreferences für Token
   - SQLCipher für Datenbank-Verschlüsselung
   
2. Netzwerk-Sicherheit:
   - Certificate Pinning
   - Network Security Config
   
3. App-Schutz:
   - ProGuard/R8 Obfuscation
   - Anti-Tampering
   - Root Detection
   
4. Biometrie:
   - BiometricPrompt API
   - Fallback auf PIN/Passwort
   
5. Datenschutz:
   - Keine Analytics ohne Zustimmung
   - Lokale Datenhaltung wo möglich
   - DSGVO-konform
```

## Performance-Optimierungen

```kotlin
// Performance Guidelines:
1. Lazy Loading:
   - Paging 3 für große Listen
   - Lazy Composables
   
2. Bildoptimierung:
   - WebP Format
   - Mehrere Auflösungen
   - Coil Memory/Disk Cache
   
3. Datenbank:
   - Indizierte Queries
   - Batch Operations
   - Flow für reaktive Updates
   
4. Memory Management:
   - LeakCanary Integration
   - Proper Lifecycle Handling
   
5. App Size:
   - App Bundle (.aab)
   - Dynamic Feature Modules
   - ProGuard Optimierung
```

## Testing-Strategie

```kotlin
// Test Coverage:
1. Unit Tests (80% Coverage):
   - ViewModels
   - Use Cases
   - Repositories
   
2. Integration Tests:
   - Room Database
   - Retrofit Services
   - WorkManager Jobs
   
3. UI Tests:
   - Compose Testing
   - Screenshot Tests
   
4. End-to-End Tests:
   - Critical User Journeys
   - Offline/Online Scenarios
```

## Accessibility (Barrierefreiheit)

```kotlin
// Accessibility Features:
- TalkBack Support
- Content Descriptions
- Semantics in Compose
- Minimum Touch Targets (48dp)
- Color Contrast (WCAG AA)
- Keyboard Navigation
- Screen Reader Optimierung
- RTL Layout Support
```

## Localization

```kotlin
// Unterstützte Sprachen:
- Deutsch (Standard)
- Englisch
- Französisch (optional)
- Italienisch (optional)

// Implementation:
- strings.xml Ressourcen
- Plurals Support
- Date/Time Formatierung
- Number Formatierung
```

## Deployment & Distribution

```kotlin
// Release Management:
1. Version Strategy:
   - Semantic Versioning
   - Version Code Auto-Increment
   
2. Build Variants:
   - Debug, Staging, Production
   - Feature Flags
   
3. Distribution:
   - Google Play Store
   - Enterprise Distribution (MDM)
   - APK für Sideloading
   
4. CI/CD:
   - GitHub Actions
   - Automated Testing
   - Automated Deployment
```

## Monitoring & Analytics

```kotlin
// Crash Reporting:
- Firebase Crashlytics
- Custom Error Logging

// Performance Monitoring:
- Firebase Performance
- Custom Metrics

// Usage Analytics (mit Zustimmung):
- Firebase Analytics
- Custom Events
```

## Projekt-Struktur

```
app/
├── src/main/java/com/ams/datenaufnahme/
│   ├── core/
│   │   ├── data/
│   │   │   ├── local/
│   │   │   │   ├── database/
│   │   │   │   ├── datastore/
│   │   │   │   └── files/
│   │   │   ├── remote/
│   │   │   │   ├── api/
│   │   │   │   └── dto/
│   │   │   └── repository/
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   ├── usecase/
│   │   │   └── repository/
│   │   └── presentation/
│   │       ├── theme/
│   │       └── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── auftraege/
│   │   ├── anlagen/
│   │   ├── scanner/
│   │   ├── sync/
│   │   └── settings/
│   └── utils/
├── src/test/
├── src/androidTest/
└── build.gradle.kts
```

## Entwicklungs-Timeline

### Phase 1: Foundation (2 Wochen)
- Projekt-Setup mit Material 3
- Authentifizierung
- Basis-Navigation
- Room Database Schema

### Phase 2: Core Features (3 Wochen)
- Auftragsverwaltung
- Anlagenverwaltung
- Offline-Funktionalität
- Basis-Synchronisation

### Phase 3: Advanced Features (3 Wochen)
- QR/Barcode Scanner
- Foto-Management
- Dynamische Formulare
- Erweiterte Synchronisation

### Phase 4: Polish & Optimization (2 Wochen)
- UI/UX Verbesserungen
- Performance-Optimierung
- Testing
- Bug Fixes

### Phase 5: Release Preparation (1 Woche)
- Play Store Vorbereitung
- Dokumentation
- Beta Testing
- Release

## Besondere Hinweise

1. **Material You**: Nutze Dynamic Colors wo immer möglich für personalisierte Themes
2. **Tablet-Optimierung**: Stelle sicher, dass die App auf Tablets optimal funktioniert
3. **Offline-First**: Alle Features müssen offline funktionieren
4. **Performance**: App sollte auch auf älteren Geräten flüssig laufen
5. **Sicherheit**: Implementiere alle Sicherheitsfeatures von Anfang an
6. **Wartbarkeit**: Schreibe sauberen, dokumentierten Code mit Tests

## Referenz-Apps für UI/UX Inspiration

- Google Keep (Material 3 Design)
- Google Tasks (Einfache Aufgabenverwaltung)
- Microsoft Field Service (Enterprise Features)
- Adobe Scan (Kamera-Features)
- Evernote (Offline-Sync)

## Kontakt & Support

Bei Fragen zur PWA-Funktionalität oder API-Integration stehen die bestehenden Codebasis und Dokumentation zur Verfügung:
- PWA Source: `/pwa-app/src/`
- API Dokumentation: Backend API auf Port 3000
- Datenmodelle: Siehe TypeScript Interfaces in PWA

---

**Dieser Prompt enthält alle notwendigen Informationen zur Entwicklung einer vollwertigen Android-App mit Material Design 3, die funktional äquivalent zur bestehenden PWA ist.**