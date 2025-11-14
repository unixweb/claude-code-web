# Telegram Location Tracker

Ein n8n-Workflow zur Verfolgung von Standorten über Telegram, ohne Datenbank-Anforderungen.

## Überblick

Dieser Workflow ermöglicht es Nutzern, ihre Standorte über einen Telegram-Bot zu teilen. Die Standortdaten werden in einer einfachen JSON-Datei gespeichert und können über eine API abgerufen werden, um sie auf einer Karte anzuzeigen.

## Funktionen

- **Standort-Erfassung**: Empfängt Standorte über Telegram und speichert sie automatisch
- **Historien-Verwaltung**: Behält die letzten 100 Standorte
- **API-Endpunkt**: Stellt Standortdaten per REST-API zur Verfügung
- **Web-Oberfläche**: Interaktive Karte mit Leaflet.js zur Visualisierung (index.html)
- **Bestätigungs-Nachrichten**: Sendet Bestätigungen mit Koordinaten und Kartenlink
- **Keine Datenbank**: Verwendet einfache dateibasierte Speicherung

## Voraussetzungen

- Eine laufende n8n-Instanz
- Ein Telegram-Bot mit gültigem API-Token
- Schreibrechte für `/tmp/n8n-locations.json` auf dem n8n-Server

## Installation

1. **Workflow importieren**:
   - Öffne deine n8n-Instanz
   - Navigiere zu "Workflows" → "Import from File"
   - Wähle die `tracker.json` Datei aus

2. **Telegram-Bot konfigurieren**:
   - Erstelle einen Bot über [@BotFather](https://t.me/botfather)
   - Kopiere das API-Token
   - In n8n: Gehe zu "Credentials" und füge die Telegram-API-Credentials hinzu
   - Weise die Credentials dem "Telegram Trigger" und "Telegram Bestätigung" Node zu

3. **Workflow aktivieren**:
   - Öffne den importierten Workflow
   - Klicke auf "Active" um den Workflow zu aktivieren

4. **Testen**:
   - Sende einen Standort an deinen Telegram-Bot
   - Du solltest eine Bestätigungsnachricht mit den Koordinaten erhalten

## Verwendung

### Standort senden

1. Öffne den Chat mit deinem Telegram-Bot
2. Klicke auf das Büroklammer-Symbol (Anhang)
3. Wähle "Standort"
4. Sende deinen aktuellen Standort oder wähle einen auf der Karte
5. Der Bot bestätigt den empfangenen Standort mit Details

### Standorte abrufen

Der Workflow stellt einen API-Endpunkt zur Verfügung:

```
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

### Karten-Ansicht

Die Bestätigungsnachricht enthält einen Link zur Karten-Ansicht:
```
https://web.unixweb.home64.de/tracker/index.html
```

**Web-Oberfläche (index.html)**

Das Repository enthält eine vollständige Web-Oberfläche zur Visualisierung der Standortdaten:

**Features**:
- 📍 Interaktive Karte mit [Leaflet.js](https://leafletjs.com/)
- 🔄 Auto-Refresh alle 5 Sekunden (kann umgeschaltet werden)
- 📊 Aktuellster Standort als Marker mit Popup
- 📈 Standort-Historie als blaue Linie
- ℹ️ Status-Info mit Anzahl der Datenpunkte
- 🎯 Automatische Zentrierung auf aktuellen Standort

**Verwendung**:
1. Öffne die `index.html` in einem Browser
2. Die Karte lädt automatisch die neuesten Standorte
3. Klicke auf Marker für Details (Name, Zeitstempel)
4. Schalte Auto-Refresh nach Bedarf um

**Konfiguration**:
Passe die API-URL in `index.html` an deine n8n-Instanz an:
```javascript
// Zeile 85:
const API_URL = 'https://deine-n8n-instanz.de/webhook/location';
```

**Deployment**:
- Hoste die `index.html` auf einem Webserver (Apache, nginx, etc.)
- Oder öffne sie direkt als Datei im Browser (für lokale Tests)
- CORS muss in n8n aktiviert sein (ist standardmäßig der Fall)

## Workflow-Struktur

### Standort-Erfassung (Hauptfluss)

```
Telegram Trigger
    ↓
Hat Location? (Filter)
    ↓
Location verarbeiten (JS: Daten extrahieren)
    ↓
Lade existierende Daten (Shell: cat JSON-Datei)
    ↓
Merge mit History (JS: Neue Daten hinzufügen)
    ↓
Speichere in File (Shell: JSON schreiben)
    ↓
Telegram Bestätigung (Nachricht an User)
```

### API-Endpunkt

```
Webhook - Location API
    ↓
Lade Daten für API (Shell: cat JSON-Datei)
    ↓
Format API Response (JS: JSON formatieren)
    ↓
JSON Response (CORS-Header + JSON zurückgeben)
```

## Datenspeicherung

- **Speicherort**: `/tmp/n8n-locations.json`
- **Format**: JSON-Array mit Standort-Objekten
- **Maximale Einträge**: 100 (älteste werden automatisch entfernt)
- **Persistenz**: Die Datei überlebt n8n-Neustarts, kann aber bei System-Neustarts verloren gehen (da in `/tmp`)

### Empfehlung für Produktion

Für produktiven Einsatz sollte der Speicherort von `/tmp/n8n-locations.json` zu einem persistenten Pfad geändert werden:

```javascript
// In den Nodes "Lade existierende Daten" und "Lade Daten für API":
cat /var/lib/n8n/locations.json 2>/dev/null || echo '[]'

// In dem Node "Speichere in File":
echo '...' > /var/lib/n8n/locations.json
```

## Anpassungen

### Anzahl gespeicherter Standorte ändern

Im Node "Merge mit History" die Zeile ändern:

```javascript
// Von 100 zu z.B. 500 ändern:
if (locations.length > 500) {
  locations = locations.slice(0, 500);
}
```

### Datumsformat ändern

Im Node "Location verarbeiten" das Locale ändern:

```javascript
// Von 'de-DE' zu z.B. 'en-US' ändern:
const displayTime = new Date(messageDate * 1000).toLocaleString('en-US');
```

### CORS-Beschränkung

Im Node "Webhook - Location API" unter Options → Response Headers:

```javascript
// Aktuell: Alle Origins erlaubt
"Access-Control-Allow-Origin": "*"

// Besser für Produktion:
"Access-Control-Allow-Origin": "https://deine-domain.de"
```

## Sicherheitshinweise

- Der API-Endpunkt ist öffentlich zugänglich - implementiere ggf. Authentifizierung
- CORS ist für alle Origins geöffnet - beschränke dies in Produktion
- Die Telegram-Bot-Credentials sollten sicher verwahrt werden
- Standortdaten sind sensibel - beachte DSGVO-Anforderungen

## Fehlerbehebung

### "Standort gespeichert" wird nicht angezeigt

- Prüfe, ob der Workflow aktiv ist
- Prüfe die Telegram-Bot-Credentials
- Schau in die Workflow-Execution-Historie für Fehler

### API gibt leere Daten zurück

- Prüfe, ob die Datei `/tmp/n8n-locations.json` existiert
- Teste den Shell-Befehl: `cat /tmp/n8n-locations.json`
- Prüfe Dateiberechtigungen (n8n muss lesen können)

### Standorte gehen nach Neustart verloren

- Ändere den Speicherort von `/tmp/` zu einem persistenten Pfad
- Siehe "Empfehlung für Produktion" oben

## Lizenz

Dieses Projekt steht zur freien Verfügung.

## Support

Bei Fragen oder Problemen, erstelle bitte ein Issue in diesem Repository.
