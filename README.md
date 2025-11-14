# Location Tracker für n8n

Ein MQTT-basiertes Location-Tracking-System mit n8n, NocoDB und interaktiver Web-Visualisierung für OwnTracks-Geräte.

## Überblick

Dieses Repository enthält ein **MQTT-basiertes Location-Tracking-System** mit folgenden Komponenten:

- **n8n-tracker.json** - n8n-Workflow zur MQTT-Datenerfassung und API-Bereitstellung
- **index.html** - Interaktive Web-Oberfläche mit Leaflet.js

Das System empfängt Location-Updates von OwnTracks-kompatiblen Geräten über MQTT, speichert diese in einer NocoDB-Datenbank und bietet sowohl eine REST-API als auch eine Web-Visualisierung mit Echtzeit-Updates.

## Funktionen

### Workflow-Features
- **MQTT-Erfassung**: Automatischer Empfang von OwnTracks-Standortdaten über MQTT
- **Persistente Speicherung**: Unbegrenzte Historie in NocoDB-Datenbank
- **Telemetrie-Daten**: Batteriestatus und Geschwindigkeit werden mitgespeichert
- **REST-API**: JSON-Endpunkt für externe Anwendungen
- **Fehlerbehandlung**: Validierung und Fehlertoleranz bei ungültigen MQTT-Nachrichten

### Web-Oberflächen-Features
- **📍 Interaktive Karte** mit Leaflet.js
- **🗺️ 4 Kartenebenen**: Standard (OpenStreetMap), Satellit (Esri), Gelände (OpenTopoMap), Dunkel-Modus (CartoDB)
- **📱 Geräte-Filter**: Separate Ansicht pro Gerät
- **⏱️ Zeitfilter**: 1h, 3h, 6h, 12h, 24h
- **🔄 Auto-Refresh**: Toggle-fähig, 5-Sekunden-Intervall
- **📊 Bewegungshistorie**: Farbcodierte Polyline-Darstellung pro Gerät
- **🔋 Telemetrie-Anzeige**: Batteriestatus und Geschwindigkeit in Popups
- **🎨 Geräte-spezifische Farben**: Unterschiedliche Farben pro Gerät

## Voraussetzungen

### Basis-Anforderungen
- Eine laufende **n8n-Instanz** (Version 1.0+)
- **NocoDB-Instanz** mit API-Zugriff
- **MQTT-Broker** (z.B. Mosquitto)
- **OwnTracks-App** oder kompatibles MQTT-Gerät

### MQTT-Broker
Wenn noch kein MQTT-Broker vorhanden ist:

```bash
# Ubuntu/Debian
sudo apt install mosquitto mosquitto-clients

# Mosquitto starten
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test
mosquitto_sub -h localhost -p 1883 -t 'owntracks/#' -v
```

## Installation

### Schritt 1: n8n-Workflow importieren

1. Öffne deine n8n-Instanz
2. Navigiere zu **Workflows** → **Import from File**
3. Wähle `n8n-tracker.json` aus diesem Repository
4. Workflow wird als "Telegram Location Tracker - NocoDB" importiert (Name kann angepasst werden)

### Schritt 2: NocoDB-Datenbank einrichten

#### NocoDB-Tabelle erstellen

1. Erstelle ein neues Project in NocoDB
2. Erstelle eine Tabelle mit folgendem Schema:

| Spaltenname | Datentyp | Beschreibung |
|-------------|----------|--------------|
| `latitude` | Decimal | Breitengrad |
| `longitude` | Decimal | Längengrad |
| `timestamp` | DateTime | Zeitstempel (ISO 8601) |
| `user_id` | Number | Immer 0 für MQTT |
| `first_name` | Text | Tracker-ID (z.B. "10") |
| `last_name` | Text | Source-Typ (z.B. "fused") |
| `username` | Text | Tracker-ID (wie first_name) |
| `marker_label` | Text | Anzeigename für Karte |
| `display_time` | Text | Formatierter Zeitstempel |
| `chat_id` | Number | Immer 0 für MQTT |
| `battery` | Number | Batteriestatus (0-100) |
| `speed` | Decimal | Geschwindigkeit in m/s |

3. Notiere **Project ID** und **Table ID** aus der NocoDB-URL:
   ```
   https://nocodb.example.com/nc/PROJECT_ID/TABLE_ID
   ```

#### NocoDB API-Token generieren

1. In NocoDB: **Account Settings** → **Tokens** → **Create Token**
2. Kopiere den generierten Token

### Schritt 3: Credentials in n8n konfigurieren

#### MQTT-Credentials

1. In n8n: **Credentials** → **Create New**
2. Wähle **"MQTT"**
3. Konfiguriere:
   - **Protocol**: mqtt (oder mqtts für TLS)
   - **Host**: Dein MQTT-Broker (z.B. `localhost` oder `broker.example.com`)
   - **Port**: 1883 (Standard) oder 8883 (TLS)
   - **Username**: MQTT-Benutzername
   - **Password**: MQTT-Passwort
4. Speichere als "MQTT account"

#### NocoDB-Credentials

1. In n8n: **Credentials** → **Create New**
2. Wähle **"NocoDB API Token"**
3. Konfiguriere:
   - **API Token**: Token aus Schritt 2
   - **Base URL**: NocoDB-URL (z.B. `https://nocodb.example.com`)
4. Speichere als "NocoDB Token account"

### Schritt 4: Workflow-IDs anpassen

Öffne den importierten Workflow in n8n und passe an:

**In den Nodes "Lade Daten aus NocoDB" und "Speichere in NocoDB":**
- **Project ID**: Deine NocoDB-Projekt-ID (ersetze `pdxl4cx4dbu9nxi`)
- **Table ID**: Deine NocoDB-Tabellen-ID (ersetze `m8pqj5ixgnnrzkg`)

**Credential-Zuordnung prüfen:**
- MQTT Trigger → Wähle deine "MQTT account" Credentials
- NocoDB-Nodes → Wähle deine "NocoDB Token account" Credentials

### Schritt 5: OwnTracks-App konfigurieren

1. **OwnTracks-App installieren** (Android/iOS)

2. **MQTT-Modus aktivieren:**
   - Öffne OwnTracks → **Preferences**
   - **Mode**: MQTT
   - **Host**: Dein MQTT-Broker (z.B. `broker.example.com`)
   - **Port**: 1883 (oder 8883 für TLS)
   - **Username**: MQTT-Benutzername
   - **Password**: MQTT-Passwort
   - **Device ID** (tid): z.B. "10" oder "11" (wichtig für Geräte-Identifikation!)
   - **Tracker ID** (tid): Gleicher Wert wie Device ID

3. **TLS/Verschlüsselung** (optional aber empfohlen):
   - Port auf 8883 ändern
   - TLS aktivieren

4. **Tracking-Einstellungen:**
   - **Monitoring**: Signifikante Standortänderungen
   - **Move Mode**: 100m (oder nach Bedarf)

### Schritt 6: Web-Oberfläche konfigurieren

#### API-Endpunkt anpassen

Öffne `index.html` und passe die API-URL an (Zeile 178):

```javascript
const API_URL = 'https://deine-n8n-instanz.de/webhook/location';
```

**Webhook-URL finden:**
- In n8n: Öffne den Workflow
- Klicke auf den Node "Webhook - Location API"
- Die URL steht unter "Webhook URLs" (z.B. `https://n8n.example.com/webhook/location`)

#### Geräte-Namen konfigurieren

Passe die Geräte-Zuordnung in `index.html` an (Zeilen 142-152):

```javascript
const DEVICE_NAMES = {
    '10': 'Joachim Pixel',    // Device ID '10' → Anzeigename
    '11': 'Huawei Smartphone'  // Device ID '11' → Anzeigename
};

const DEVICE_COLORS = {
    '10': '#e74c3c', // Rot
    '11': '#3498db', // Blau
    'default': '#95a5a6' // Grau für unbekannte Geräte
};
```

**Wichtig:** Die Keys (`'10'`, `'11'`) müssen mit der **Tracker ID (tid)** aus OwnTracks übereinstimmen!

#### Web-Oberfläche hosten

**Option 1: Webserver (empfohlen)**
```bash
# Apache
sudo cp index.html /var/www/html/tracker/

# nginx
sudo cp index.html /usr/share/nginx/html/tracker/
```

**Option 2: Lokaler Test**
- Öffne `index.html` direkt im Browser
- Funktioniert nur, wenn CORS korrekt konfiguriert ist

**Option 3: Static Hosting**
- GitHub Pages
- Netlify
- Vercel

### Schritt 7: Workflow aktivieren und testen

1. **Workflow aktivieren:**
   - In n8n: Öffne den Workflow
   - Klicke auf **"Active"** (Toggle oben rechts)
   - Prüfe, dass alle Nodes grün sind (keine roten Fehler)

2. **Testen:**
   - Öffne OwnTracks-App
   - Sende einen Location-Update (App sendet automatisch oder manuell triggern)
   - Prüfe in n8n die **Execution History**
   - Öffne die Web-Oberfläche → Standort sollte erscheinen

3. **API-Test:**
   ```bash
   curl https://deine-n8n-instanz.de/webhook/location
   ```
   Sollte JSON zurückgeben mit `success: true` und Location-Daten

## Verwendung

### Standort senden (OwnTracks)

Die OwnTracks-App sendet automatisch Location-Updates basierend auf deinen Einstellungen:

- **Automatisch**: Bei signifikanten Standortänderungen
- **Manuell**: In der App auf "Publish" klicken
- **Intervall**: Konfigurierbar in App-Einstellungen

**MQTT-Topic-Format:**
```
owntracks/user/device
```
Beispiel: `owntracks/joachim/pixel`

**Nachrichtenformat (JSON):**
```json
{
  "_type": "location",
  "lat": 48.1351,
  "lon": 11.5820,
  "tst": 1700000000,
  "tid": "10",
  "batt": 85,
  "vel": 5,
  "acc": 10,
  "alt": 520
}
```

### Web-Oberfläche verwenden

#### Filter-Optionen

**🗺️ Kartenebene:**
- **Standard**: OpenStreetMap (gut für Navigation)
- **Satellit**: Esri World Imagery (Luftbild)
- **Gelände**: OpenTopoMap (Höhenlinien)
- **Dunkel**: CartoDB Dark (Nachtmodus)

**📱 Gerät-Filter:**
- **Alle Geräte**: Zeigt alle MQTT-Geräte
- **Einzelnes Gerät**: Wähle aus Dropdown (wird dynamisch befüllt)

**⏱️ Zeitfilter:**
- **1 Stunde**: Nur letzte Stunde (Standard)
- **3/6/12/24 Stunden**: Weitere Zeiträume
- Alle älteren Punkte werden ausgeblendet

**🔄 Auto-Refresh:**
- **AN** (grün): Aktualisiert alle 5 Sekunden
- **AUS** (rot): Keine automatische Aktualisierung

#### Karte verstehen

**Marker:**
- **Größe**: Größter Marker = neuester Standort (32x32px), kleinere = Historie (16x16px)
- **Farbe**: Geräte-spezifisch (siehe `DEVICE_COLORS` Konfiguration)
- **Icon**: Kreisförmig mit dekorativem Zeiger (kein tatsächlicher Richtungsindikator)

**Polylines:**
- Verbinden Standorte chronologisch
- Farbe entspricht Gerät
- Zeigen Bewegungspfad

**Popups:**
- Klicke auf Marker für Details
- Zeigt: Gerätename, Zeitstempel, Batterie %, Geschwindigkeit (km/h)

### REST-API verwenden

**Endpunkt:**
```
GET https://deine-n8n-instanz.de/webhook/location
```

**Beispiel-Antwort:**
```json
{
  "success": true,
  "current": {
    "latitude": 48.1351,
    "longitude": 11.5820,
    "timestamp": "2025-11-14T10:30:00.000Z",
    "user_id": 0,
    "first_name": "10",
    "last_name": "fused",
    "username": "10",
    "marker_label": "10",
    "display_time": "14.11.2025, 11:30:00",
    "chat_id": 0,
    "battery": 85,
    "speed": 5.2
  },
  "history": [
    { /* weitere Location-Objekte */ }
  ],
  "total_points": 42,
  "last_updated": "2025-11-14T10:30:00.000Z"
}
```

**Integration in eigene Apps:**
```javascript
// JavaScript Beispiel
fetch('https://n8n.example.com/webhook/location')
  .then(response => response.json())
  .then(data => {
    console.log('Aktueller Standort:', data.current);
    console.log('Batterie:', data.current.battery + '%');
  });
```

```python
# Python Beispiel
import requests

response = requests.get('https://n8n.example.com/webhook/location')
data = response.json()

if data['success']:
    current = data['current']
    print(f"Position: {current['latitude']}, {current['longitude']}")
    print(f"Batterie: {current['battery']}%")
```

## Workflow-Architektur

### Übersicht

Der **n8n-tracker.json** Workflow besteht aus zwei unabhängigen Flows:

```
Flow 1: MQTT Location Capture
┌──────────────┐
│ MQTT Trigger │ (owntracks/#)
└──────┬───────┘
       │
       v
┌──────────────────────────┐
│ MQTT Location verarbeiten│ (JavaScript)
└──────┬───────────────────┘
       │
       v
┌──────────────────┐
│ Speichere in     │ (NocoDB Create)
│ NocoDB           │
└──────────────────┘

Flow 2: Location API
┌──────────────────────┐
│ Webhook - Location   │ (GET /webhook/location)
│ API                  │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Lade Daten aus       │ (NocoDB Get All)
│ NocoDB               │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Format API Response  │ (JavaScript)
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ JSON Response        │ (CORS + JSON)
└──────────────────────┘
```

### Flow 1: MQTT Location Capture (Details)

**MQTT Trigger:**
- Subscribed auf Topic: `owntracks/#`
- Empfängt alle OwnTracks-Messages
- Keine Filter auf Trigger-Ebene

**MQTT Location verarbeiten (JavaScript):**
```javascript
// Wichtige Schritte:
1. Parse JSON aus message-Feld
2. Validiere lat, lon, tst (erforderlich)
3. Konvertiere Unix-Timestamp → ISO 8601
4. Extrahiere tid (Tracker ID) → username
5. Formatiere displayTime (de-DE, Europe/Berlin)
6. Packe Telemetrie in mqtt_data Objekt
7. Überspringe ungültige Nachrichten mit continue
```

**Speichere in NocoDB:**
- Erstellt neuen Datensatz pro Location
- Mappt 12 Felder (inkl. battery, speed)
- Keine Duplikatsprüfung (alle Updates werden gespeichert)

### Flow 2: Location API (Details)

**Webhook - Location API:**
- HTTP GET auf `/location`
- CORS: `Access-Control-Allow-Origin: *`
- Keine Authentifizierung (öffentlich!)

**Lade Daten aus NocoDB:**
- Holt ALLE Datensätze (`returnAll: true`)
- Keine Sortierung auf DB-Ebene
- Keine Pagination

**Format API Response (JavaScript):**
```javascript
// Schritte:
1. Sammle alle Location-Objekte
2. Sortiere nach timestamp (neueste zuerst)
3. Wähle neuste als "current"
4. Baue Response-Struktur
5. Zähle total_points
```

**JSON Response:**
- Content-Type: application/json
- CORS-Header gesetzt
- Keine Kompression

## Datenspeicherung & Schema

### NocoDB-Konfiguration

**Aktuelle IDs im Workflow:**
- **Project ID**: `pdxl4cx4dbu9nxi` (muss angepasst werden!)
- **Table ID**: `m8pqj5ixgnnrzkg` (muss angepasst werden!)
- **Credential**: "NocoDB Token account"

### Datenbank-Schema

Vollständiges Schema mit Beispieldaten:

| Feld | Typ | Beispielwert | Beschreibung |
|------|-----|--------------|--------------|
| `latitude` | Decimal | `48.1383784` | Breitengrad (WGS84) |
| `longitude` | Decimal | `11.4276172` | Längengrad (WGS84) |
| `timestamp` | DateTime | `2025-11-14T18:00:37.000Z` | UTC-Zeitstempel (ISO 8601) |
| `user_id` | Number | `0` | Immer 0 für MQTT-Geräte |
| `first_name` | Text | `"11"` | Tracker-ID (tid) |
| `last_name` | Text | `"fused"` | Location-Source |
| `username` | Text | `"11"` | Tracker-ID (gleich wie first_name) |
| `marker_label` | Text | `"11"` | Anzeigename für Karte |
| `display_time` | Text | `"14.11.2025, 19:00:37"` | Formatiert (de-DE) |
| `chat_id` | Number | `0` | Immer 0 für MQTT-Geräte |
| `battery` | Number | `73` | Batteriestatus (0-100%) |
| `speed` | Decimal | `0` | Geschwindigkeit in m/s |

### OwnTracks-Feld-Mapping

| NocoDB-Feld | OwnTracks-Feld | Transformation |
|-------------|----------------|----------------|
| `latitude` | `lat` | Direkt |
| `longitude` | `lon` | Direkt |
| `timestamp` | `tst` | Unix → ISO 8601 |
| `user_id` | - | Konstant: `0` |
| `first_name` | `tid` | Tracker-ID |
| `last_name` | `source` | Location-Quelle |
| `username` | `tid` | Tracker-ID |
| `marker_label` | `tid` | Tracker-ID |
| `display_time` | `tst` | Formatiert (de-DE, Berlin) |
| `chat_id` | - | Konstant: `0` |
| `battery` | `batt` | Direkt |
| `speed` | `vel` | m/s (nicht konvertiert!) |

**Nicht gespeicherte OwnTracks-Felder:**
- `acc` - Genauigkeit (Meter)
- `alt` - Höhe (Meter)
- `cog` - Kurs über Grund
- `conn` - Verbindungstyp (w/m)
- `_id` - Device Identifier

## Anpassungen & Customization

### Neues Gerät hinzufügen

**Schritt 1: OwnTracks-App konfigurieren**
- Setze Tracker ID (tid) auf eindeutige ID, z.B. "12"
- Konfiguriere MQTT-Verbindung wie oben beschrieben

**Schritt 2: index.html anpassen (Zeilen 142-152)**

```javascript
const DEVICE_NAMES = {
    '10': 'Joachim Pixel',
    '11': 'Huawei Smartphone',
    '12': 'Neues Gerät'  // HINZUFÜGEN
};

const DEVICE_COLORS = {
    '10': '#e74c3c',
    '11': '#3498db',
    '12': '#2ecc71',  // HINZUFÜGEN (Grün)
    'default': '#95a5a6'
};
```

**Farb-Vorschläge:**
- `#e74c3c` - Rot
- `#3498db` - Blau
- `#2ecc71` - Grün
- `#f39c12` - Orange
- `#9b59b6` - Lila
- `#1abc9c` - Türkis

**Schritt 3: Testen**
- Sende Location von neuem Gerät
- Prüfe Web-Oberfläche → Gerät sollte im Dropdown erscheinen
- Marker sollte in konfigurierter Farbe erscheinen

### Zeitzone ändern

**In n8n-Workflow, Node "MQTT Location verarbeiten" (Zeile 124):**

```javascript
// Aktuell: Berlin-Zeit
const displayTime = new Date(timestampMs).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin'
});

// Ändern zu New York:
const displayTime = new Date(timestampMs).toLocaleString('en-US', {
    timeZone: 'America/New_York'
});

// Ändern zu UTC:
const displayTime = new Date(timestampMs).toISOString();

// Eigenes Format:
const displayTime = new Date(timestampMs).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});
```

### Standard-Zeitfilter ändern

**In index.html (Zeile 125):**

```html
<!-- Aktuell: 1 Stunde (1h) -->
<option value="1h" selected>Letzte Stunde</option>

<!-- Ändern zu 24 Stunden: -->
<option value="1h">Letzte Stunde</option>
<option value="24h" selected>Letzte 24 Stunden</option>
```

### Auto-Refresh-Intervall anpassen

**In index.html (Zeile 419):**

```javascript
// Aktuell: 5 Sekunden (5000ms)
refreshInterval = setInterval(loadLocations, 5000);

// Ändern zu 10 Sekunden:
refreshInterval = setInterval(loadLocations, 10000);

// Ändern zu 1 Minute:
refreshInterval = setInterval(loadLocations, 60000);
```

### CORS einschränken (Sicherheit!)

**In n8n-Workflow, Node "JSON Response" (Zeile 67):**

```json
// Aktuell (unsicher):
{
  "name": "Access-Control-Allow-Origin",
  "value": "*"
}

// Ändern zu spezifischer Domain:
{
  "name": "Access-Control-Allow-Origin",
  "value": "https://web.example.com"
}
```

### Weitere NocoDB-Felder speichern

**Beispiel: Genauigkeit (accuracy) und Höhe (altitude) hinzufügen**

**Schritt 1: NocoDB-Spalten erstellen**
- `accuracy` (Number)
- `altitude` (Number)

**Schritt 2: Workflow-Node "MQTT Location verarbeiten" anpassen:**

```javascript
// In mqtt_data Objekt ergänzen:
mqtt_data: {
    accuracy: mqttData.acc,
    altitude: mqttData.alt,
    battery: mqttData.batt,
    velocity: mqttData.vel,
    course: mqttData.cog,
    connection: mqttData.conn,
    device_id: mqttData._id
}
```

**Schritt 3: Node "Speichere in NocoDB" anpassen:**

Füge in `fieldsUi.fieldValues` hinzu:
```json
{
  "fieldName": "accuracy",
  "fieldValue": "={{ $json.mqtt_data.accuracy }}"
},
{
  "fieldName": "altitude",
  "fieldValue": "={{ $json.mqtt_data.altitude }}"
}
```

**Schritt 4: index.html Popups erweitern (Zeile 320):**

```javascript
// Nach Speed-Anzeige hinzufügen:
if (loc.accuracy !== undefined && loc.accuracy !== null) {
    popupContent += `<br>📍 Genauigkeit: ${loc.accuracy}m`;
}

if (loc.altitude !== undefined && loc.altitude !== null) {
    popupContent += `<br>⛰️ Höhe: ${loc.altitude}m`;
}
```

### MQTT-Topic einschränken

**In n8n-Workflow, Node "MQTT Trigger" (Zeile 104):**

```javascript
// Aktuell: Alle OwnTracks-Topics
topics: "owntracks/#"

// Nur spezifischer Benutzer:
topics: "owntracks/joachim/#"

// Nur spezifisches Gerät:
topics: "owntracks/joachim/pixel"

// Mehrere Topics:
topics: "owntracks/joachim/#,owntracks/lisa/#"
```

## Sicherheitshinweise

### Kritisch (sofort beheben!)

**1. API ohne Authentifizierung**
- ⚠️ **Problem**: Jeder kann Standortdaten abrufen, wenn er die URL kennt
- ⚠️ **Risiko**: DSGVO-Verstoß, Privatsphäre-Verletzung
- ✅ **Lösung**:
  - Implementiere API-Key-Authentifizierung in n8n
  - Oder nutze Reverse-Proxy mit Basic Auth
  - Oder beschränke Zugriff per IP-Whitelist

**2. CORS offen für alle Domains**
- ⚠️ **Problem**: `Access-Control-Allow-Origin: *`
- ⚠️ **Risiko**: XSS-Angriffe, unautorisierten Zugriff
- ✅ **Lösung**: Beschränke auf deine Domain (siehe "CORS einschränken")

**3. DSGVO-Compliance**
- ⚠️ **Problem**: Personenbezogene Standortdaten ohne Einwilligung/Löschkonzept
- ⚠️ **Pflichten**: Informationspflicht, Einwilligung, Auskunftsrecht, Löschung
- ✅ **Lösung**:
  - Hole explizite Einwilligung von Nutzern ein
  - Implementiere automatische Löschung alter Daten (z.B. >30 Tage)
  - Dokumentiere Datenschutzmaßnahmen
  - Stelle Löschfunktion bereit

### Wichtig (empfohlen)

**4. MQTT ohne TLS**
- ⚠️ **Problem**: Unverschlüsselte Übertragung auf Port 1883
- ⚠️ **Risiko**: Standortdaten können abgefangen werden
- ✅ **Lösung**:
  - Aktiviere TLS in Mosquitto (Port 8883)
  - Konfiguriere OwnTracks mit TLS

**5. Keine Rate-Limiting**
- ⚠️ **Problem**: API kann unbegrenzt oft abgerufen werden
- ⚠️ **Risiko**: DoS-Angriff, Server-Überlastung
- ✅ **Lösung**: Implementiere Rate-Limiting (z.B. via nginx)

**6. NocoDB-Token zu weitreichend**
- ⚠️ **Problem**: Token hat möglicherweise Schreibrechte für API-Endpunkt
- ⚠️ **Risiko**: Datenmanipulation
- ✅ **Lösung**: Nutze separaten Read-Only-Token für API-Endpunkt (falls möglich)

### Best Practices

- **HTTPS erzwingen**: n8n-Webhooks nur über HTTPS erreichbar machen
- **Monitoring**: Überwache ungewöhnliche API-Zugriffe
- **Backup**: Sichere NocoDB-Datenbank regelmäßig
- **Updates**: Halte n8n, NocoDB, Mosquitto und Dependencies aktuell
- **Secrets**: Speichere Credentials nur in n8n Credential Store, nicht im Code
- **Logging**: Aktiviere Audit-Logging für Zugriffe

## Fehlerbehebung

### MQTT-Daten kommen nicht an

**Symptome**: OwnTracks sendet, aber nichts in NocoDB gespeichert

**Lösungen:**

1. **MQTT-Broker testen:**
   ```bash
   mosquitto_sub -h broker.example.com -p 1883 -u user -P pass -t 'owntracks/#' -v
   ```
   Sollte Nachrichten anzeigen, wenn OwnTracks sendet.

2. **OwnTracks-Konfiguration prüfen:**
   - Mode: MQTT (nicht HTTP!)
   - Topic: `owntracks/USER/DEVICE`
   - Verbindungsstatus in App prüfen
   - Test-Nachricht senden (Publish Button)

3. **n8n MQTT-Node prüfen:**
   - Credentials korrekt?
   - Topic-Pattern passt? (`owntracks/#`)
   - Workflow ist aktiviert?

4. **n8n Execution History prüfen:**
   - Workflows → n8n-tracker → Executions
   - Gibt es Executions?
   - Gibt es Fehler (rot markiert)?

5. **Debug mit manuellem Test:**
   ```bash
   # Sende Test-Nachricht per mosquitto_pub
   mosquitto_pub -h broker.example.com -p 1883 -u user -P pass \
     -t 'owntracks/test/device' \
     -m '{"_type":"location","lat":48.1351,"lon":11.5820,"tid":"10","tst":1700000000,"batt":85,"vel":5}'
   ```

### API gibt leere Daten zurück

**Symptome**: API antwortet mit `{"history": []}` oder `"current": null`

**Lösungen:**

1. **NocoDB-Verbindung testen:**
   - In n8n: Credentials → NocoDB → Test Connection
   - Sollte grüner Haken erscheinen

2. **NocoDB direkt testen:**
   ```bash
   curl -H "xc-token: YOUR_TOKEN" \
     "https://nocodb.example.com/api/v1/db/data/v1/PROJECT_ID/TABLE_ID"
   ```
   Sollte JSON mit Daten zurückgeben.

3. **Project/Table IDs prüfen:**
   - Öffne NocoDB-Tabelle im Browser
   - URL enthält die IDs: `/nc/PROJECT_ID/TABLE_ID`
   - Vergleiche mit IDs in n8n-Workflow

4. **Daten in NocoDB vorhanden?**
   - Öffne Tabelle in NocoDB
   - Sind Einträge vorhanden?
   - Wenn nicht: Problem liegt bei MQTT-Erfassung (siehe oben)

### Web-Oberfläche zeigt keine Karte

**Symptome**: Weiße Seite, Karte lädt nicht, Marker fehlen

**Lösungen:**

1. **Browser-Console prüfen (F12 → Console):**
   - CORS-Fehler? → API-CORS-Header prüfen
   - 404 auf Leaflet.js? → CDN-Problem (lokale Kopie nutzen)
   - API-Fehler? → Siehe "API gibt leere Daten zurück"
   - JavaScript-Fehler? → Code-Syntax prüfen

2. **API-URL prüfen:**
   - In index.html Zeile 178: `const API_URL = '...'`
   - URL muss erreichbar sein
   - Test im Browser: URL direkt aufrufen → Sollte JSON zurückgeben

3. **Netzwerk-Tab prüfen (F12 → Network):**
   - Request zu API wird gesendet?
   - Status 200 OK?
   - Response enthält Daten?
   - CORS-Header vorhanden?

4. **Leaflet.js CDN erreichbar?**
   - Prüfe ob `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` geladen wird
   - Falls CDN-Problem: Nutze lokale Kopie

### Koordinaten sind falsch/vertauscht

**Symptome**: Marker erscheinen im Meer, falsche Position

**Lösungen:**

1. **Reihenfolge prüfen:**
   - Leaflet erwartet: `[latitude, longitude]`
   - NICHT: `[longitude, latitude]`
   - OwnTracks sendet korrekt: `lat`, `lon`

2. **Daten in NocoDB prüfen:**
   - Öffne Tabelle
   - Ist `latitude` der Breitengrad (z.B. 48.x)?
   - Ist `longitude` der Längengrad (z.B. 11.x)?
   - Für München: ca. 48°N, 11°O

3. **JavaScript-Code prüfen:**
   ```javascript
   // RICHTIG:
   const lat = parseFloat(loc.latitude);
   const lon = parseFloat(loc.longitude);
   L.marker([lat, lon])

   // FALSCH:
   L.marker([lon, lat])  // Vertauscht!
   ```

### Geräte-Filter zeigt nicht alle Geräte

**Symptome**: Dropdown zeigt "Alle Geräte" aber keine einzelnen Geräte

**Lösungen:**

1. **MQTT-Daten vorhanden?**
   - API aufrufen und prüfen: Gibt es Einträge mit `user_id: 0`?
   - Wenn nicht: Keine MQTT-Daten in Datenbank

2. **username-Feld befüllt?**
   - In NocoDB prüfen: Ist `username` gesetzt?
   - Sollte gleich wie `first_name` sein (tid)

3. **JavaScript-Console prüfen:**
   ```javascript
   // In Browser-Console (F12):
   console.log(allData.history.filter(loc => loc.user_id == 0));
   ```
   Sollte MQTT-Einträge zeigen.

4. **Filter-Code prüfen (index.html Zeile 267):**
   ```javascript
   let filteredData = allData.history.filter(loc => loc.user_id == 0);
   ```
   Muss MQTT-Daten filtern.

### Geschwindigkeit wird nicht angezeigt

**Symptome**: Popup zeigt keine Geschwindigkeit, obwohl OwnTracks sendet

**Lösungen:**

1. **OwnTracks sendet velocity?**
   - Prüfe MQTT-Nachricht (mosquitto_sub)
   - Sollte `vel` Feld enthalten

2. **NocoDB-Feld `speed` vorhanden?**
   - Tabellen-Schema prüfen
   - Spalte `speed` (Decimal) muss existieren

3. **Workflow speichert speed?**
   - Node "Speichere in NocoDB" prüfen
   - Mapping: `fieldName: "speed"`, `fieldValue: "={{ $json.mqtt_data.velocity }}"`

4. **Null-Werte prüfen:**
   - Nicht alle OwnTracks-Messages enthalten `vel`
   - Code prüft auf `!== null` (index.html Zeile 328)

### Batteriestatus zeigt 0% oder fehlt

**Symptome**: Batterie wird als 0% angezeigt oder fehlt im Popup

**Lösungen:**

1. **OwnTracks sendet battery?**
   - Android/iOS unterscheiden sich
   - Manche Geräte senden kein `batt` Feld
   - Prüfe MQTT-Nachricht

2. **Berechtigungen in OwnTracks:**
   - Android: Batterie-Optimierung deaktivieren
   - iOS: Standortfreigabe "Immer" setzen

3. **NocoDB-Wert prüfen:**
   - Tabelle öffnen
   - Ist `battery` befüllt?
   - Typ Number (nicht Text!)

## Repository-Inhalte

| Datei | Beschreibung |
|-------|--------------|
| `n8n-tracker.json` | n8n-Workflow für MQTT-Erfassung und API |
| `index.html` | Web-Oberfläche mit Leaflet.js |
| `database-example.csv` | Beispiel-Datenexport aus NocoDB |
| `README.md` | Diese Dokumentation |
| `CLAUDE.md` | Technische Architektur-Dokumentation |

## Lizenz

Dieses Projekt steht unter der **MIT-Lizenz** zur freien Verfügung.

## Support & Contributing

- **Issues**: Melde Bugs oder Feature-Requests via GitHub Issues
- **Pull Requests**: Beiträge sind willkommen!
- **Fragen**: Öffne eine Discussion auf GitHub

## Roadmap (Potenzielle Features)

- [ ] API-Authentifizierung (API-Key, JWT)
- [ ] Automatische Datenlöschung (DSGVO-Compliance)
- [ ] Geofencing / Location-Alerts
- [ ] Multi-User-Support mit Zugriffsrechten
- [ ] Erweiterte Statistiken (Distanz, Durchschnittsgeschwindigkeit)
- [ ] Export-Funktion (GPX, KML, CSV)
- [ ] Push-Notifications bei Location-Updates
- [ ] Offline-Support für Web-UI (PWA)
- [ ] Mobile App (React Native / Flutter)
