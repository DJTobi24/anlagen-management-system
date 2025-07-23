# AKS-System Dokumentation

## Übersicht

Das AKS-System (Anlagen-Klassifizierungs-System) ermöglicht die dynamische Definition von Pflichtfeldern basierend auf dem AKS-Code einer Anlage. Jeder AKS-Code kann spezifische Felder mit individuellen Validierungsregeln definieren.

## Konzept

### AKS-Code Struktur
- **Format**: `AKS.XX.XXX.XX.XX` (z.B. `AKS.03.470.07.03`)
- **Kategorien**:
  - 01: Gebäude
  - 02: HLK (Heizung, Lüftung, Klima)
  - 03: Sanitär
  - 04: Gas/Medizintechnik
  - 05: Elektrotechnik
  - 06: Sicherheitstechnik
  - 07: Transportanlagen
  - 08: Außenanlagen
  - 09: Sonstiges

### KAS-Felder
Jeder AKS-Code definiert spezifische KAS-Felder (z.B. `KAS1273` für Leitfähigkeit):
- **Eindeutige KAS-Code-Nummer**
- **Feldtyp** (Text, Zahl, Datum, Auswahl, etc.)
- **Datentyp** (String, Integer, Decimal, etc.)
- **Validierungsregeln** (Min/Max, Regex, Pflichtfeld)
- **Einheiten** (μS/cm, m³/h, etc.)

## API-Endpoints

### 🔍 AKS-Abfragen

#### Alle Kategorien abrufen
```http
GET /api/v1/aks/categories
Authorization: Bearer <token>
```

#### AKS-Codes suchen
```http
GET /api/v1/aks/search?code=AKS.03&name=Enthärtung&page=1&limit=20
Authorization: Bearer <token>
```

#### Spezifischen AKS-Code abrufen
```http
GET /api/v1/aks/code/{aksCode}
Authorization: Bearer <token>
```

#### Feld-Mapping für AKS-Code
```http
GET /api/v1/aks/code/{aksCode}/mapping
Authorization: Bearer <token>
```

### ✅ Validierung

#### Feldwerte validieren
```http
POST /api/v1/aks/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "aksCode": "AKS.03.470.07.03",
  "fieldValues": [
    {
      "kasCode": "KAS1273",
      "value": "250"
    },
    {
      "kasCode": "KAS1274",
      "value": "5.5"
    }
  ]
}
```

### 🔧 AKS-Verwaltung (Admin)

#### AKS-Code erstellen
```http
POST /api/v1/aks/codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "AKS.03.470.07.03",
  "name": "Enthärtungsanlage",
  "description": "Wasserenthärtung für Gebäudetechnik",
  "category": "Sanitär"
}
```

#### AKS-Code aktualisieren
```http
PUT /api/v1/aks/codes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Enthärtungsanlage - Updated",
  "isActive": true
}
```

#### Feld zu AKS-Code hinzufügen
```http
POST /api/v1/aks/codes/{codeId}/fields
Authorization: Bearer <token>
Content-Type: application/json

{
  "kasCode": "KAS1273",
  "fieldName": "11_Leitfähigkeit",
  "displayName": "Leitfähigkeit",
  "fieldType": "number",
  "dataType": "decimal",
  "unit": "μS/cm",
  "isRequired": true,
  "minValue": 0,
  "maxValue": 10000,
  "helpText": "Gemessene Leitfähigkeit des Wassers"
}
```

### 📤 Excel-Import (Admin)

#### AKS aus Excel importieren
```http
POST /api/v1/aks/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- excel: [Excel-Datei]
```

## Excel-Import Format

### Erforderliche Spalten
| Spalte | Beschreibung | Beispiel |
|--------|--------------|----------|
| AKS-Code | AKS-Code | AKS.03.470.07.03 |
| KAS-Code | Eindeutiger Feldcode | KAS1273 |
| Feldname | Technischer Name | 11_Leitfähigkeit |
| Anzeigename | Benutzerfreundlicher Name | Leitfähigkeit |
| Feldtyp | UI-Feldtyp | number |
| Datentyp | Datenvalidierung | decimal |
| Pflichtfeld | Ja/Nein | Ja |

### Optionale Spalten
| Spalte | Beschreibung | Beispiel |
|--------|--------------|----------|
| Einheit | Maßeinheit | μS/cm |
| Min Wert | Minimalwert | 0 |
| Max Wert | Maximalwert | 10000 |
| Min Länge | Minimale Textlänge | 3 |
| Max Länge | Maximale Textlänge | 255 |
| Regex | Validierungsmuster | ^[A-Z]{2}\\d{4}$ |
| Optionen | Auswahloptionen | Option1,Option2,Option3 |
| Standardwert | Vorbelegung | 100 |
| Hilfetext | Benutzerhinweis | Bitte Wert in μS/cm eingeben |

### Beispiel Excel-Struktur
```
| AKS-Code        | KAS-Code | Feldname         | Anzeigename    | Feldtyp | Datentyp | Einheit | Pflichtfeld | Min Wert | Max Wert |
|-----------------|----------|------------------|----------------|---------|----------|---------|-------------|----------|----------|
| AKS.03.470.07.03| KAS1273  | 11_Leitfähigkeit | Leitfähigkeit  | number  | decimal  | μS/cm   | Ja          | 0        | 10000    |
| AKS.03.470.07.03| KAS1274  | 12_Nenndurchfluss| Nenndurchfluss | number  | decimal  | m³/h    | Ja          | 0        | 1000     |
| AKS.03.470.07.03| KAS1275  | 13_Betriebsstunden| Betriebsstunden| number  | integer  | h       | Nein        | 0        |          |
```

## Feldtypen

### Verfügbare Feldtypen
- **text**: Einzeiliger Text
- **number**: Numerische Eingabe
- **date**: Datumsauswahl
- **boolean**: Ja/Nein
- **select**: Einzelauswahl
- **multiselect**: Mehrfachauswahl
- **textarea**: Mehrzeiliger Text
- **file**: Dateiupload
- **radio**: Radio-Buttons
- **checkbox**: Checkboxen

### Datentypen
- **string**: Text
- **integer**: Ganzzahl
- **decimal**: Dezimalzahl
- **date**: Datum
- **boolean**: Wahrheitswert
- **json**: Strukturierte Daten

## Integration in Anlagen

### Bei Anlage-Erstellung
```json
{
  "objektId": "uuid",
  "aksCode": "AKS.03.470.07.03",
  "name": "Enthärtungsanlage Gebäude A",
  "status": "aktiv",
  "zustandsBewertung": 4,
  "aksFieldValues": [
    {
      "kasCode": "KAS1273",
      "value": "250"
    },
    {
      "kasCode": "KAS1274",
      "value": "5.5"
    }
  ]
}
```

### Validierung
- **Automatisch**: Bei Anlage-Erstellung/Update
- **Pflichtfelder**: Müssen ausgefüllt sein
- **Wertebereich**: Min/Max-Prüfung
- **Format**: Regex-Validierung
- **Typsicherheit**: Datentyp-Prüfung

### Fehlerbehandlung
```json
{
  "error": {
    "message": "AKS validation failed: Required field Leitfähigkeit is missing, Value must be at least 0"
  }
}
```

## Beispiel-Workflow

### 1. AKS-Code definieren
```bash
# AKS-Code erstellen
curl -X POST http://192.168.1.126:3000/api/v1/aks/codes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AKS.02.310.01.01",
    "name": "Lüftungsanlage",
    "category": "HLK"
  }'
```

### 2. Felder hinzufügen
```bash
# Feld für Luftmenge
curl -X POST http://192.168.1.126:3000/api/v1/aks/codes/CODE_ID/fields \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kasCode": "KAS2001",
    "fieldName": "01_Luftmenge",
    "displayName": "Nenn-Luftmenge",
    "fieldType": "number",
    "dataType": "decimal",
    "unit": "m³/h",
    "isRequired": true,
    "minValue": 0,
    "maxValue": 50000
  }'
```

### 3. Anlage mit AKS-Feldern erstellen
```bash
# Anlage mit validierten AKS-Feldern
curl -X POST http://192.168.1.126:3000/api/v1/anlagen \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objektId": "uuid",
    "aksCode": "AKS.02.310.01.01",
    "name": "RLT-Anlage Bürotrakt",
    "status": "aktiv",
    "zustandsBewertung": 4,
    "aksFieldValues": [
      {
        "kasCode": "KAS2001",
        "value": "12500"
      }
    ]
  }'
```

## Performance

### Optimierungen
- **Indizierte Suche**: Schneller Zugriff auf AKS-Codes
- **Caching**: Häufig verwendete Mappings
- **Batch-Validierung**: Mehrere Felder gleichzeitig
- **Lazy Loading**: Felder nur bei Bedarf laden

### Skalierbarkeit
- **500+ AKS-Codes** unterstützt
- **Unbegrenzte Felder** pro Code
- **Parallele Imports** möglich
- **Optimierte Queries** für große Datenmengen

## Best Practices

### AKS-Code-Verwaltung
1. **Eindeutige Codes** verwenden
2. **Sinnvolle Kategorisierung** wählen
3. **Beschreibende Namen** vergeben
4. **Versionierung** beachten

### Feld-Definition
1. **Sprechende KAS-Codes** (z.B. KAS1273 für Leitfähigkeit)
2. **Klare Feldnamen** mit Präfix (z.B. 11_Leitfähigkeit)
3. **Einheiten** immer angeben
4. **Hilfetexte** für komplexe Felder

### Import-Strategie
1. **Validierung** vor Import
2. **Batch-Größe** optimieren
3. **Fehlerbehandlung** implementieren
4. **Rollback** bei Fehlern

## Fehlerbehandlung

### Häufige Fehler
- `AKS code not found`: AKS-Code existiert nicht
- `Required field missing`: Pflichtfeld fehlt
- `Value out of range`: Wert außerhalb Min/Max
- `Invalid data type`: Falscher Datentyp
- `Duplicate KAS code`: KAS-Code bereits vorhanden

### Lösungsansätze
1. **Validierung** vor Speicherung
2. **Aussagekräftige Fehlermeldungen**
3. **Rollback-Mechanismen**
4. **Logging** für Debugging