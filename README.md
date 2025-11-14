# Location Tracker für n8n

Ein umfassendes n8n-Workflow-System zur Standort-Verfolgung mit mehreren Datenquellen und erweiterten Visualisierungsmöglichkeiten.

## Überblick

Dieses Repository enthält **drei n8n-Workflows** für Location Tracking mit verschiedenen Speicher- und Datenquellen-Optionen:

1. **tracker.json** - Telegram-basiert mit Datei-Speicherung (einfach, keine Datenbank)
2. **tracker-db.json** - Telegram-basiert mit NocoDB-Speicherung (produktionsreif, persistent)
3. **tracker-mqtt.json** - MQTT-basiert mit NocoDB-Speicherung (für OwnTracks/IoT-Geräte)

Zusätzlich bietet das Repository **zwei Web-Oberflächen** zur Visualisierung:
- **index.html** - Erweiterte Oberfläche mit Filterung, mehreren Kartenebenen und Multi-Source-Support
- **index_owntrack.html** - Vereinfachte Oberfläche mit MQTT-spezifischen Features (Batterie, Geschwindigkeit)

## Funktionen

### Workflow-Features
- **Multi-Source-Erfassung**: Standorte über Telegram-Bot oder MQTT/OwnTracks
- **Flexible Speicherung**: Wahl zwischen Datei-basiert (einfach) oder NocoDB (persistent, skalierbar)
- **Historien-Verwaltung**:
  - tracker.json: Letzte 100 Standorte (konfigurierbar)
  - tracker-db.json / tracker-mqtt.json: Unbegrenzt (Datenbank-basiert)
- **REST-API**: Einheitlicher `/location` Endpunkt für alle Workflows
- **Telegram-Benachrichtigungen**: Automatische Bestätigung mit Koordinaten und Kartenlink
- **Echtzeit-Updates**: 5-Sekunden Auto-Refresh für Live-Tracking

### Web-Oberflächen-Features
- **📍 Interaktive Karten** mit Leaflet.js
- **🗺️ Mehrere Kartenebenen**: Standard, Satellit, Gelände, Dunkel-Modus
- **📡 Datenquellen-Filter**: Telegram, MQTT oder kombiniert
- **👤 Benutzer/Geräte-Filter**: Separate Ansicht pro Person/Gerät
- **⏱️ Zeitfilter**: 1h, 6h, 24h, 7 Tage, 30 Tage
- **🔄 Toggle Auto-Refresh**: An/Aus-Schaltung für Live-Updates
- **📊 Standort-Historie**: Polyline-Darstellung des Bewegungspfads
- **🔋 MQTT-Telemetrie**: Batterie, Geschwindigkeit, Genauigkeit (index_owntrack.html)

## Voraussetzungen

### Basis-Anforderungen (alle Workflows)
- Eine laufende n8n-Instanz (Version 1.0+)
- Zugriff auf n8n-Credentials-Management

### Workflow-spezifische Anforderungen

**tracker.json (Datei-basiert)**:
- Schreibrechte für `/tmp/n8n-locations.json` auf dem n8n-Server
- Telegram-Bot mit gültigem API-Token

**tracker-db.json (NocoDB)**:
- NocoDB-Instanz mit API-Zugriff
- NocoDB-Token mit Schreibrechten
- Telegram-Bot mit gültigem API-Token

**tracker-mqtt.json (MQTT)**:
- MQTT-Broker (z.B. Mosquitto)
- MQTT-Credentials mit Subscribe-Rechten auf `owntracks/#`
- NocoDB-Instanz (siehe tracker-db.json)
- OwnTracks-App oder kompatibles MQTT-Gerät

## Installation

### Schritt 1: Workflow wählen und importieren

Wähle den passenden Workflow für deinen Anwendungsfall:

| Workflow | Empfohlen für | Vorteile | Nachteile |
|----------|---------------|----------|-----------|
| **tracker.json** | Testen, Prototyping | Einfach, keine DB nötig | Begrenzte Historie, /tmp-Speicher |
| **tracker-db.json** | Produktion (Telegram) | Persistent, unbegrenzt | NocoDB erforderlich |
| **tracker-mqtt.json** | IoT-Geräte, OwnTracks | Multi-Gerät-Support | MQTT-Broker + NocoDB |

**Import-Schritte**:
1. Öffne deine n8n-Instanz
2. Navigiere zu "Workflows" → "Import from File"
3. Wähle die gewünschte `.json` Datei aus

### Schritt 2: Credentials konfigurieren

#### Telegram-Bot (tracker.json & tracker-db.json)

1. Erstelle einen Bot über [@BotFather](https://t.me/botfather):
   ```
   /newbot
   Wähle Name: "My Location Tracker"
   Wähle Username: "my_location_tracker_bot"
   ```
2. Kopiere das API-Token (Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
3. In n8n:
   - Gehe zu "Credentials" → "Create New"
   - Wähle "Telegram API"
   - Gib das Access Token ein
   - Speichere als "Telegram account n8n-munich-bot" (oder passe Workflow-Nodes an)

#### NocoDB (tracker-db.json & tracker-mqtt.json)

1. Erstelle in NocoDB:
   - Ein neues Project
   - Eine Tabelle mit dem Schema (siehe unten)
2. Generiere einen API-Token:
   - NocoDB: Account Settings → Tokens → Create Token
3. In n8n:
   - Gehe zu "Credentials" → "Create New"
   - Wähle "NocoDB API Token"
   - Gib Token und Base-URL ein
   - Notiere die Credential-ID für den Workflow

**NocoDB Tabellen-Schema**:
```
Tabelle: Locations
- latitude (Decimal)
- longitude (Decimal)
- timestamp (DateTime)
- user_id (Number)
- first_name (Text)
- last_name (Text)
- username (Text)
- marker_label (Text)
- display_time (Text)
- chat_id (Number)
```

#### MQTT-Broker (tracker-mqtt.json)

1. Installiere einen MQTT-Broker (z.B. Mosquitto):
   ```bash
   # Ubuntu/Debian
   sudo apt install mosquitto mosquitto-clients
   ```
2. In n8n:
   - Gehe zu "Credentials" → "Create New"
   - Wähle "MQTT"
   - Gib Broker-URL, Port, Username, Passwort ein
3. Passe im Workflow die Credential-ID an (aktuell Platzhalter: `MQTT_CREDENTIAL_ID`)

### Schritt 3: Workflow-IDs anpassen (nur bei NocoDB)

Öffne den importierten Workflow und passe an:
- **Project ID**: Deine NocoDB-Projekt-ID
- **Table ID**: Deine NocoDB-Tabellen-ID

Diese findest du in der NocoDB-URL:
```
https://nocodb.example.com/nc/PROJECT_ID/TABLE_ID
```

### Schritt 4: Workflow aktivieren

1. Öffne den importierten Workflow
2. Prüfe alle Credentials (rote Nodes = fehlende/falsche Credentials)
3. Klicke auf "Active" um den Workflow zu aktivieren

### Schritt 5: Testen

**Telegram-Workflows**:
1. Öffne deinen Telegram-Bot
2. Sende einen Standort (📎 → Standort)
3. Du solltest eine Bestätigungsnachricht erhalten

**MQTT-Workflow**:
1. Konfiguriere OwnTracks-App mit deinem MQTT-Broker
2. Sende einen Location-Update
3. Prüfe in n8n die Workflow-Execution-Historie

## Verwendung

### Standort senden (Telegram)

1. Öffne den Chat mit deinem Telegram-Bot
2. Klicke auf das Büroklammer-Symbol (📎)
3. Wähle "Standort"
4. Sende deinen aktuellen Standort oder wähle einen auf der Karte
5. Der Bot bestätigt mit Details und einem Link zur Web-Ansicht

### Standort senden (MQTT/OwnTracks)

1. **OwnTracks-App konfigurieren**:
   - Mode: MQTT
   - Host: Dein MQTT-Broker
   - Port: 1883 (oder dein Port)
   - Username/Password: Deine MQTT-Credentials
   - Device ID: z.B. "le" (wird als Marker-Label verwendet)

2. **Tracking starten**:
   - OwnTracks sendet automatisch Location-Updates
   - Konfiguriere Intervall und Genauigkeit in der App

### REST-API abrufen

Alle Workflows stellen den gleichen API-Endpunkt zur Verfügung:

```bash
GET https://deine-n8n-instanz.de/webhook/location
```

**Beispiel-Antwort**:
```json
{
  "success": true,
  "current": {
    "latitude": 48.1351,
    "longitude": 11.5820,
    "timestamp": "2025-11-14T10:30:00.000Z",
    "user_id": 123456789,
    "first_name": "Max",
    "last_name": "Mustermann",
    "username": "maxmuster",
    "marker_label": "Max Mustermann",
    "display_time": "14.11.2025, 11:30:00",
    "chat_id": 123456789
  },
  "history": [...],
  "total_points": 42,
  "last_updated": "2025-11-14T10:30:00.000Z"
}
```

**MQTT-spezifische Felder** (nur in index_owntrack.html angezeigt):
```json
{
  "battery": 85,
  "speed": 5.2,
  "accuracy": 10,
  "altitude": 520
}
```

### Web-Oberflächen

Das Repository enthält zwei Web-Interfaces mit unterschiedlichen Features:

#### index.html - Erweiterte Multi-Source-Oberfläche

**Empfohlen für**: Produktionsumgebungen mit mehreren Datenquellen

**Features**:
- 🗺️ **4 Kartenebenen**: Standard (OSM), Satellit (Esri), Gelände (OpenTopoMap), Dunkel (CartoDB)
- 📡 **Datenquellen-Filter**: Telegram, MQTT oder alle
- 👤 **Benutzer/Gerät-Filter**: Dynamische Liste aller aktiven Quellen
- ⏱️ **Zeitfilter**: 1h, 6h, 24h, 7d, 30d oder alle
- 📊 **Erweiterte Visualisierung**: Farbcodierte Marker (rot=neuester, blau=Historie)
- 🔄 **Auto-Refresh**: Toggle-fähig, 5-Sekunden-Intervall

**Verwendung**:
1. Öffne `index.html` im Browser
2. Nutze die Filter-Dropdowns zur Datenauswahl:
   - **Kartenebene**: Wähle zwischen Standard, Satellit, Gelände, Dunkel
   - **Datenquelle**: Telegram, MQTT oder beide
   - **Benutzer/Gerät**: Filter nach spezifischem User/Device
   - **Zeitraum**: Begrenze Historie auf gewünschten Zeitraum
3. Klicke Marker für Details
4. Toggle Auto-Refresh nach Bedarf

#### index_owntrack.html - MQTT/OwnTracks-fokussierte Oberfläche

**Empfohlen für**: OwnTracks-Nutzer, die Telemetrie-Daten benötigen

**Features**:
- 🔋 **Batteriestatus**: Anzeige des Gerätebatteriestands
- 🚗 **Geschwindigkeitsanzeige**: km/h-Anzeige aus MQTT-Daten
- 📍 **Vereinfachte Ansicht**: Fokus auf aktuellen Standort
- 🔄 **Auto-Refresh**: Gleicher Toggle wie index.html

**Verwendung**:
1. Öffne `index_owntrack.html` im Browser
2. Die Karte zeigt automatisch den neuesten OwnTracks-Standort
3. Popups enthalten MQTT-spezifische Daten (Batterie, Speed)

### Konfiguration der Web-Oberflächen

**API-Endpunkt anpassen**:

In beiden HTML-Dateien die API-URL ändern:
```javascript
// Für index.html (Zeile 175)
// Für index_owntrack.html (Zeile 85)
const API_URL = 'https://deine-n8n-instanz.de/webhook/location';
```

**Deployment-Optionen**:
1. **Webserver-Hosting** (empfohlen für Produktion):
   ```bash
   # Apache
   cp index.html /var/www/html/tracker/

   # nginx
   cp index.html /usr/share/nginx/html/tracker/
   ```

2. **Lokaler Test**:
   - Öffne die `.html` Datei direkt im Browser
   - Funktioniert nur, wenn CORS korrekt konfiguriert ist

3. **GitHub Pages / Static Hosting**:
   - Pushe die HTML-Dateien zu GitHub
   - Aktiviere GitHub Pages
   - Oder nutze Netlify, Vercel, etc.

**CORS-Konfiguration**:
Die n8n-Workflows haben CORS bereits aktiviert (`Access-Control-Allow-Origin: *`). Für Produktion sollte dies eingeschränkt werden (siehe Sicherheitshinweise)

## Workflow-Architektur

### tracker.json (Datei-basiert)

**Standort-Erfassung**:
```
Telegram Trigger
    ↓
Hat Location? (Filter)
    ↓
Location verarbeiten (JS: Daten extrahieren & formatieren)
    ↓
Lade existierende Daten (Shell: cat /tmp/n8n-locations.json)
    ↓
Merge mit History (JS: Array merge + 100-Entry-Limit)
    ↓
Speichere in File (Shell: echo > /tmp/n8n-locations.json)
    ↓
Telegram Bestätigung (Nachricht mit Koordinaten & Kartenlink)
```

**API-Endpunkt**:
```
Webhook - Location API (GET /webhook/location)
    ↓
Lade Daten für API (Shell: cat /tmp/n8n-locations.json)
    ↓
Format API Response (JS: JSON strukturieren)
    ↓
JSON Response (CORS + JSON zurückgeben)
```

### tracker-db.json (NocoDB)

**Standort-Erfassung**:
```
Telegram Trigger
    ↓
Hat Location? (Filter)
    ↓
Location verarbeiten (JS: Daten extrahieren & formatieren)
    ↓
Speichere in NocoDB (NocoDB: Create Record)
    ↓
[Parallel]
    ↓
Hole letzten Eintrag (NocoDB: List Records, Limit 1, Sort desc)
    ↓
Zähle Einträge (NocoDB: Count)
    ↓
Merge (JS: Combine Results)
    ↓
Bereite Bestätigung vor (JS: Format Message)
    ↓
Telegram Bestätigung (Nachricht mit Stats & Link)
```

**API-Endpunkt**:
```
Webhook - Location API (GET /webhook/location)
    ↓
Lade Daten aus NocoDB (NocoDB: List Records, Sort by timestamp desc)
    ↓
Format API Response (JS: JSON strukturieren)
    ↓
JSON Response (CORS + JSON zurückgeben)
```

### tracker-mqtt.json (MQTT/OwnTracks)

**Standort-Erfassung** (vereinfachter Single-Path):
```
MQTT Trigger (Topic: owntracks/#)
    ↓
Ist Location? (Filter: _type === "location")
    ↓
MQTT Location verarbeiten (JS: OwnTracks → NocoDB Schema Mapping)
    ↓
Speichere in NocoDB (NocoDB: Create Record)
```

**Keine separate Bestätigung** (MQTT ist unidirektional)

**API-Endpunkt**: Shared mit tracker-db.json (gleiche NocoDB-Tabelle)

## Datenspeicherung & Schema

### tracker.json (Datei-basiert)

**Speicherung**:
- **Speicherort**: `/tmp/n8n-locations.json`
- **Format**: JSON-Array mit Location-Objekten
- **Maximale Einträge**: 100 (älteste werden automatisch entfernt)
- **Persistenz**: Überlebt n8n-Neustarts, aber nicht System-Neustarts (da `/tmp`)

**Empfehlung für Produktion**:
Ändere den Speicherort zu einem persistenten Pfad:

In den Nodes **"Lade existierende Daten"** und **"Lade Daten für API"**:
```bash
cat /var/lib/n8n/locations.json 2>/dev/null || echo '[]'
```

In Node **"Speichere in File"**:
```bash
echo '...' > /var/lib/n8n/locations.json
```

### tracker-db.json & tracker-mqtt.json (NocoDB)

**Speicherung**:
- **Backend**: NocoDB Datenbank
- **Project ID**: `pdxl4cx4dbu9nxi` (Beispiel - muss angepasst werden)
- **Table ID**: `m8pqj5ixgnnrzkg` (Beispiel - muss angepasst werden)
- **Maximale Einträge**: Unbegrenzt (Datenbank-basiert)
- **Persistenz**: Vollständig persistent
- **Shared Database**: Beide Workflows nutzen die gleiche Tabelle

### Location-Objekt Schema

**Alle Workflows** nutzen das gleiche Schema für Konsistenz:

```json
{
  "latitude": 48.1351,              // Decimal (Breitengrad)
  "longitude": 11.5820,             // Decimal (Längengrad)
  "timestamp": "2025-11-14T10:30:00.000Z",  // ISO 8601 DateTime
  "user_id": 123456789,             // Number (Telegram ID oder 0 für MQTT)
  "first_name": "Max",              // Text (Telegram: Vorname, MQTT: tracker ID)
  "last_name": "Mustermann",        // Text (Telegram: Nachname, MQTT: source)
  "username": "maxmuster",          // Text (Telegram: @username, MQTT: tracker ID)
  "marker_label": "Max Mustermann", // Text (Anzeigename für Karte)
  "display_time": "14.11.2025, 11:30:00",  // Text (de-DE formatiert)
  "chat_id": 123456789              // Number (Telegram Chat ID oder 0 für MQTT)
}
```

### Unterscheidung Telegram vs. MQTT

In der Datenbank/API können Einträge anhand folgender Felder unterschieden werden:

| Feld | Telegram | MQTT/OwnTracks |
|------|----------|----------------|
| `user_id` | Echte Telegram-User-ID (z.B. 123456789) | `0` |
| `chat_id` | Echte Telegram-Chat-ID (z.B. 123456789) | `0` |
| `first_name` | Telegram-Vorname (z.B. "Max") | Tracker-ID (z.B. "le") |
| `last_name` | Telegram-Nachname (z.B. "Mustermann") | Source (z.B. "fused") |
| `marker_label` | "Vorname Nachname" | "TID @ SSID" (z.B. "le @ HomeWifi") |

### MQTT-spezifische Daten

OwnTracks sendet zusätzliche Telemetrie-Daten, die **nicht** in der Datenbank gespeichert werden, aber im Node "MQTT Location verarbeiten" verfügbar sind:

```json
{
  "acc": 10,        // Genauigkeit in Metern
  "alt": 520,       // Höhe über Meeresspiegel
  "batt": 85,       // Batteriestatus (0-100%)
  "vel": 5,         // Geschwindigkeit (m/s)
  "conn": "w",      // Verbindungstyp (w=WiFi, m=Mobile)
  "t": "u"          // Trigger (u=User, t=Timer, etc.)
}
```

Diese Daten können bei Bedarf zum Schema hinzugefügt werden (erfordert Anpassung der NocoDB-Tabelle und Workflows)

## Anpassungen & Customization

### Anzahl gespeicherter Standorte ändern (nur tracker.json)

Im Node **"Merge mit History"** die Limit-Logik anpassen:

```javascript
// Aktuell: 100 Einträge
if (locations.length > 100) {
  locations = locations.slice(0, 100);
}

// Ändern zu z.B. 500 Einträge:
if (locations.length > 500) {
  locations = locations.slice(0, 500);
}
```

**Hinweis**: NocoDB-Workflows haben kein Client-Side-Limit.

### Datumsformat ändern

Im Node **"Location verarbeiten"** (Telegram) oder **"MQTT Location verarbeiten"** (MQTT) das Locale anpassen:

```javascript
// Aktuell: Deutsch (de-DE)
const displayTime = new Date(messageDate * 1000).toLocaleString('de-DE');

// Ändern zu z.B. Englisch (en-US):
const displayTime = new Date(messageDate * 1000).toLocaleString('en-US');

// Oder eigenes Format:
const displayTime = new Date(messageDate * 1000).toLocaleString('de-DE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
```

### CORS-Beschränkung (Sicherheit)

Im Node **"Webhook - Location API"** unter **Options → Response Headers**:

```javascript
// Aktuell (unsicher für Produktion): Alle Origins erlaubt
"Access-Control-Allow-Origin": "*"

// Besser für Produktion: Spezifische Domain
"Access-Control-Allow-Origin": "https://deine-domain.de"

// Oder mehrere Domains (erfordert Logik im Node):
// const allowedOrigins = ['https://domain1.de', 'https://domain2.de'];
// const origin = request.headers.origin;
// return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
```

### Auto-Refresh Intervall anpassen

In **index.html** oder **index_owntrack.html**:

```javascript
// Aktuell: 5 Sekunden (5000ms)
refreshInterval = setInterval(loadLocations, 5000);

// Ändern zu z.B. 10 Sekunden:
refreshInterval = setInterval(loadLocations, 10000);

// Oder 30 Sekunden:
refreshInterval = setInterval(loadLocations, 30000);
```

### MQTT Topic ändern

Im Node **"MQTT Trigger"** (tracker-mqtt.json):

```javascript
// Aktuell: Alle OwnTracks-Topics
Topic: owntracks/#

// Ändern zu spezifischem User/Device:
Topic: owntracks/joachim/phone

// Oder eigene Topic-Struktur:
Topic: location/+/+  // location/user/device
```

Passe auch den Filter-Node **"Ist Location?"** entsprechend an.

### NocoDB Tabellen-Felder erweitern

Um MQTT-Telemetrie-Daten zu speichern:

1. **In NocoDB**: Füge neue Spalten hinzu:
   - `battery` (Number)
   - `speed` (Decimal)
   - `accuracy` (Number)
   - `altitude` (Number)

2. **Im Workflow** (Node "MQTT Location verarbeiten"):
   ```javascript
   // Füge zu locationData hinzu:
   battery: json.batt || null,
   speed: json.vel || null,
   accuracy: json.acc || null,
   altitude: json.alt || null
   ```

3. **In index_owntrack.html**: Daten sind bereits ausgelesen (Zeilen 137-145)

### Kartenebene Standardauswahl ändern

In **index.html**:

```javascript
// Aktuell: Standard (OSM)
let currentLayer = mapLayers.standard;

// Ändern zu z.B. Satellit:
let currentLayer = mapLayers.satellite;

// Und Dropdown synchronisieren:
document.getElementById('mapLayerSelect').value = 'satellite';
```

## Sicherheitshinweise

### Kritisch (vor Produktionseinsatz beheben!)

1. **API-Authentifizierung fehlt**:
   - Der `/location` Endpunkt ist **öffentlich ohne Authentifizierung** zugänglich
   - Jeder kann Standortdaten abrufen, wenn er die URL kennt
   - **Empfehlung**: Implementiere API-Key-Authentifizierung in n8n oder nutze einen Reverse-Proxy mit Auth

2. **CORS für alle Origins offen**:
   - `Access-Control-Allow-Origin: *` erlaubt Zugriff von jeder Domain
   - **Risiko**: Cross-Site-Scripting (XSS), Datenabfluss
   - **Empfehlung**: Beschränke auf deine spezifische Domain (siehe Anpassungen)

3. **Standortdaten sind hochsensibel (DSGVO)**:
   - Personenbezogene Daten (Name, User-ID, exakte Koordinaten)
   - **Pflichten**: Informationspflicht, Einwilligung, Löschkonzept
   - **Empfehlung**:
     - Hole explizite Einwilligung von Nutzern ein
     - Implementiere automatische Löschung alter Daten (z.B. >30 Tage)
     - Dokumentiere Datenschutzmaßnahmen

### Wichtig (empfohlene Sicherheitsmaßnahmen)

4. **Credentials-Sicherheit**:
   - **Telegram-Bot-Token**: Niemals in Code oder Logs speichern
   - **NocoDB-Token**: Nutze Read-Only-Token für API-Endpunkt (wenn möglich)
   - **MQTT-Credentials**: Nutze TLS-Verschlüsselung (Port 8883)

5. **File-basierte Speicherung** (tracker.json):
   - `/tmp` Verzeichnis ist evtl. für andere Benutzer lesbar
   - **Empfehlung**: Setze Dateiberechtigungen (`chmod 600`)
   - Besser: Nutze NocoDB-Variante für Produktion

6. **Rate Limiting fehlt**:
   - API kann beliebig oft abgerufen werden
   - **Risiko**: DoS-Angriff, Server-Überlastung
   - **Empfehlung**: Implementiere Rate Limiting (z.B. via nginx)

### Best Practices

- **HTTPS erzwingen**: Stelle sicher, dass n8n-Webhooks nur über HTTPS erreichbar sind
- **Monitoring**: Überwache ungewöhnliche API-Zugriffe
- **Backup**: Sichere NocoDB-Datenbank regelmäßig
- **Updates**: Halte n8n, NocoDB und alle Dependencies aktuell

## Fehlerbehebung

### Telegram-Bot antwortet nicht

**Symptome**: Standort wird gesendet, aber keine Bestätigung

**Lösungen**:
1. Prüfe, ob Workflow aktiv ist (grüner "Active"-Toggle in n8n)
2. Prüfe Telegram-Credentials:
   ```bash
   # In n8n: Credentials → Telegram → Test Connection
   ```
3. Prüfe Workflow-Execution-Historie:
   - n8n → Workflows → tracker → Executions
   - Suche nach Fehlermeldungen (rot markiert)
4. Prüfe Telegram-Bot-Webhook:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

### API gibt leere/fehlerhafte Daten zurück

**Symptome**: API antwortet mit `[]`, `null` oder HTTP 500

**Lösungen**:

**Für tracker.json (Datei-basiert)**:
1. Prüfe, ob Datei existiert:
   ```bash
   ls -la /tmp/n8n-locations.json
   ```
2. Prüfe Dateiinhalt:
   ```bash
   cat /tmp/n8n-locations.json | jq .
   ```
3. Prüfe Berechtigungen:
   ```bash
   # n8n-User muss lesen können
   chmod 644 /tmp/n8n-locations.json
   ```

**Für tracker-db.json/tracker-mqtt.json (NocoDB)**:
1. Teste NocoDB-Verbindung in n8n (Credentials → Test)
2. Prüfe Project/Table IDs im Workflow
3. Prüfe NocoDB-API direkt:
   ```bash
   curl -H "xc-token: YOUR_TOKEN" \
     https://nocodb.example.com/api/v1/db/data/v1/PROJECT_ID/TABLE_ID
   ```

### MQTT-Daten kommen nicht an (tracker-mqtt.json)

**Symptome**: OwnTracks sendet, aber nichts in NocoDB gespeichert

**Lösungen**:
1. Teste MQTT-Broker-Verbindung:
   ```bash
   mosquitto_sub -h broker.example.com -p 1883 -u user -P pass -t 'owntracks/#' -v
   ```
2. Prüfe OwnTracks-Konfiguration:
   - Mode: MQTT (nicht HTTP!)
   - Topic: `owntracks/USER/DEVICE`
   - TLS: Nur wenn Broker TLS nutzt
3. Prüfe n8n MQTT-Node:
   - Credentials korrekt
   - Topic-Pattern passt (`owntracks/#`)
4. Prüfe Workflow-Filter:
   - Node "Ist Location?" muss `_type: "location"` filtern
5. Debug mit Workflow-Execution:
   - Trigger manuell mit Test-Payload
   ```json
   {
     "_type": "location",
     "lat": 48.1351,
     "lon": 11.5820,
     "tid": "le",
     "tst": 1731582600
   }
   ```

### Web-Oberfläche zeigt keine Karte

**Symptome**: Weiße Seite, Karte lädt nicht, Marker fehlen

**Lösungen**:
1. Prüfe Browser-Console (F12 → Console):
   - CORS-Fehler? → Siehe Sicherheitshinweise
   - 404 auf Leaflet.js? → CDN-Problem, lokale Kopie nutzen
   - API-Fehler? → Siehe "API gibt leere Daten zurück"
2. Prüfe API-URL in HTML:
   ```javascript
   // index.html Zeile 175
   // index_owntrack.html Zeile 85
   const API_URL = 'https://...';  // Muss erreichbar sein!
   ```
3. Teste API direkt im Browser:
   ```
   https://deine-n8n-instanz.de/webhook/location
   ```
   Sollte JSON zurückgeben, nicht HTML/Fehlerseite
4. Prüfe Netzwerk-Tab (F12 → Network):
   - Status 200 für API-Request?
   - CORS-Header vorhanden?

### Koordinaten sind falsch/vertauscht

**Symptome**: Marker erscheinen im Meer, falsche Position

**Lösungen**:
1. Prüfe Reihenfolge: **Latitude (Breitengrad) kommt vor Longitude (Längengrad)**
   - Richtig: `[48.1351, 11.5820]` (lat, lon)
   - Falsch: `[11.5820, 48.1351]` (lon, lat)
2. Prüfe MQTT-Mapping (nur tracker-mqtt.json):
   - Node "MQTT Location verarbeiten"
   - `latitude: json.lat` (nicht `json.lon`!)
3. Prüfe String-Parsing:
   ```javascript
   // Koordinaten müssen Numbers sein, nicht Strings!
   const lat = parseFloat(loc.latitude);  // Gut
   const lat = loc.latitude;              // Schlecht, wenn String
   ```

### Standorte verschwinden nach System-Neustart (tracker.json)

**Symptome**: Nach Neustart des Servers sind alle Standorte weg

**Ursache**: `/tmp` wird bei System-Neustart geleert

**Lösungen**:
1. **Kurzfristig**: Nutze persistenten Pfad (siehe "Datenspeicherung & Schema")
2. **Langfristig**: Wechsele zu tracker-db.json (NocoDB)

## Repository-Inhalte

| Datei | Beschreibung | Typ |
|-------|--------------|-----|
| `tracker.json` | Telegram + Datei-Speicherung | n8n Workflow |
| `tracker-db.json` | Telegram + NocoDB | n8n Workflow |
| `tracker-mqtt.json` | MQTT/OwnTracks + NocoDB | n8n Workflow |
| `index.html` | Erweiterte Multi-Source Web-UI | HTML/JavaScript |
| `index_owntrack.html` | MQTT-fokussierte Web-UI | HTML/JavaScript |
| `locations-example.csv` | Beispieldaten für Tests | CSV |
| `README.md` | Diese Dokumentation | Markdown |
| `CLAUDE.md` | Technische Architektur-Doku | Markdown |

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
- [ ] Multi-Tenant-Support (mehrere Bots)
- [ ] Erweiterte Statistiken (Distanz, Durchschnittsgeschwindigkeit)
- [ ] Export-Funktion (GPX, KML)
- [ ] Push-Notifications bei Location-Updates
- [ ] Offline-Support für Web-UI (PWA)
