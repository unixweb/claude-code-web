# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains an **MQTT-based location tracking system** using n8n and NocoDB:

- **n8n-tracker.json** - MQTT/OwnTracks workflow with NocoDB storage
- **index.html** - Web interface with device filtering, time-based filtering, and multiple map layers

The system subscribes to MQTT topics (OwnTracks-compatible), processes location data, stores it in NocoDB, and provides both a REST API and web visualization.

## Workflow Architecture

The **n8n-tracker.json** workflow contains two independent execution flows:

### 1. MQTT Location Capture Flow

```
MQTT Trigger (owntracks/#)
    ↓
MQTT Location verarbeiten (JavaScript: Parse JSON, transform data)
    ↓
Speichere in NocoDB (Create record with lat/lon, battery, speed, etc.)
```

**Key nodes:**
- **MQTT Trigger**: Subscribes to `owntracks/#` topic, receives JSON messages from OwnTracks devices
- **MQTT Location verarbeiten**:
  - Parses the `message` field (JSON string)
  - Validates required fields (lat, lon, tst)
  - Transforms OwnTracks format to NocoDB schema
  - Extracts telemetry data (battery, velocity, accuracy, altitude, etc.)
  - Converts Unix timestamp to ISO 8601 format
- **Speichere in NocoDB**: Stores location with metadata in database

### 2. Location API Flow

```
Webhook - Location API (GET /webhook/location)
    ↓
Lade Daten aus NocoDB (Get all records)
    ↓
Format API Response (JavaScript: Sort, structure JSON)
    ↓
JSON Response (CORS-enabled)
```

**Key nodes:**
- **Webhook - Location API**: Public endpoint at `/webhook/location` with CORS enabled
- **Lade Daten aus NocoDB**: Fetches all location records from database
- **Format API Response**: Sorts by timestamp (newest first), builds response structure
- **JSON Response**: Returns structured JSON with CORS headers

## Key Technical Details

### Data Storage

**NocoDB Database Configuration:**
- **Project ID**: `pdxl4cx4dbu9nxi`
- **Table ID**: `m8pqj5ixgnnrzkg`
- **Credential ID**: `T9XuGr6CJD2W2BPO` (NocoDB Token account)
- **Persistence**: Full database persistence (no client-side limit)

### NocoDB Schema

The database stores location records with the following fields:

```
latitude        (Decimal)     - Geographic latitude
longitude       (Decimal)     - Geographic longitude
timestamp       (DateTime)    - ISO 8601 timestamp
user_id         (Number)      - Always 0 for MQTT devices
first_name      (Text)        - Tracker ID (e.g., "10", "11")
last_name       (Text)        - Source type (e.g., "fused")
username        (Text)        - Same as tracker ID
marker_label    (Text)        - Display label for map markers
display_time    (Text)        - Formatted timestamp (de-DE locale)
chat_id         (Number)      - Always 0 for MQTT devices
battery         (Number)      - Battery percentage (0-100)
speed           (Decimal)     - Velocity in m/s
```

### OwnTracks Data Mapping

The MQTT transformation node maps OwnTracks JSON fields to NocoDB schema:

| NocoDB Field | OwnTracks Field | Transformation |
|--------------|-----------------|----------------|
| `latitude` | `lat` | Direct mapping |
| `longitude` | `lon` | Direct mapping |
| `timestamp` | `tst` | Unix timestamp → ISO 8601 |
| `user_id` | - | Static: `0` |
| `first_name` | `tid` | Tracker ID (device identifier) |
| `last_name` | `source` | Location source (e.g., "fused") |
| `username` | `tid` | Same as tracker ID |
| `marker_label` | `tid` | Used for map display |
| `display_time` | `tst` | Formatted with `de-DE` locale |
| `chat_id` | - | Static: `0` |
| `battery` | `batt` | Battery percentage |
| `speed` | `vel` | Velocity in m/s |

**Additional OwnTracks data available but NOT stored:**
- `acc` - Accuracy in meters
- `alt` - Altitude
- `cog` - Course over ground
- `conn` - Connection type (w=WiFi, m=Mobile)
- `_id` - Device identifier

### API Response Structure
```json
{
  "success": true,
  "current": <most recent location object>,
  "history": [<array of all location objects>],
  "total_points": number,
  "last_updated": "ISO 8601 string"
}
```

### Web Interface (index.html)

The web interface is a single-page application built with Leaflet.js:

**Configuration:**
- **API Endpoint**: `https://n8n.unixweb.home64.de/webhook/location` (line 178)
- **Default View**: Munich (48.1351, 11.5820) at zoom level 12
- **Auto-refresh**: 5 second interval (configurable)

**Key Features:**
1. **Multiple Map Layers** (lines 158-171):
   - Standard (OpenStreetMap)
   - Satellite (Esri World Imagery)
   - Terrain (OpenTopoMap)
   - Dark Mode (CartoDB Dark)

2. **Device Mapping** (lines 142-152):
   - Hardcoded device names: `'10'` → "Joachim Pixel", `'11'` → "Huawei Smartphone"
   - Device-specific colors: Red (#e74c3c) for device 10, Blue (#3498db) for device 11
   - **Important**: Device names are mapped from the `username` field (which contains the tracker ID)

3. **Filtering System**:
   - **Device Filter**: Dropdown populated dynamically from available `username` values
   - **Time Filter**: 1h, 3h, 6h, 12h, 24h (default: 1 hour)
   - Filter logic: Always filters to `user_id == 0` (MQTT-only), then applies device and time filters

4. **Visualization** (lines 284-376):
   - **Markers**: Circular SVG icons with navigation-style clock hand
   - **Size**: Latest location = 32x32px, history = 16x16px
   - **Colors**: Device-specific colors from `DEVICE_COLORS` mapping
   - **Polylines**: Shows movement path per device, color-coded
   - **Popups**: Show device name, timestamp, battery %, speed (km/h)

**Important Implementation Details:**
- The `username` field filter logic (line 267) filters MQTT data by checking `user_id == 0`
- Device colors and names must be updated in the hardcoded mappings (lines 142-152)
- Speed conversion: OwnTracks velocity (m/s) is converted to km/h with `speed * 3.6` (line 329)

## Workflow Configuration (n8n-tracker.json)

**Workflow Settings:**
- **Name**: "Telegram Location Tracker - NocoDB"
- **Workflow ID**: `6P6dKqi4IKcJ521m`
- **Version ID**: `de17706a-a0ea-42ce-a069-dd09dce421d2`
- **Execution Order**: v1
- **Caller Policy**: workflowsFromSameOwner
- **Status**: `active: true`
- **Error Workflow**: `0bBZzSE6SUzVsif5`
- **Tags**: "owntrack"

**Credentials:**
- **MQTT**: Credential ID `L07VVR2BDfDda6Zo` ("MQTT account")
- **NocoDB**: Credential ID `T9XuGr6CJD2W2BPO` ("NocoDB Token account")

**Node Configuration:**
- **MQTT Trigger**:
  - Topic: `owntracks/#`
  - Subscribes to all OwnTracks topics
  - No message filtering at trigger level (all messages pass through)

- **MQTT Location verarbeiten** (Code Node):
  - Parses JSON from `message` field
  - Validates required fields: `lat`, `lon`, `tst`
  - Skips invalid messages with `continue`
  - Sets `alwaysOutputData: true` to handle empty results
  - Timezone: Europe/Berlin for `display_time`

- **Speichere in NocoDB**:
  - Operation: `create`
  - Maps 12 fields from JSON to NocoDB columns
  - Includes telemetry: `battery` (from `mqtt_data.battery`), `speed` (from `mqtt_data.velocity`)

- **Webhook - Location API**:
  - Path: `/location`
  - Webhook ID: `location-api-endpoint`
  - Response Mode: `lastNode`
  - CORS: Allowed origins = `*`

## Common Modifications

### Adding a New Device

**Step 1: Update index.html device mappings (lines 142-152)**
```javascript
const DEVICE_NAMES = {
    '10': 'Joachim Pixel',
    '11': 'Huawei Smartphone',
    '12': 'New Device Name'  // Add this line
};

const DEVICE_COLORS = {
    '10': '#e74c3c',
    '11': '#3498db',
    '12': '#2ecc71',  // Add this line (green)
    'default': '#95a5a6'
};
```

**Step 2: Configure OwnTracks app**
- Set Tracker ID (`tid`) to match the key (e.g., "12")
- Topic will be `owntracks/user/12`
- The workflow automatically picks up new devices

### Changing Date/Time Format

**In n8n workflow node "MQTT Location verarbeiten" (line 124):**
```javascript
// Current: German format with Berlin timezone
const displayTime = new Date(timestampMs).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

// Change to US format:
const displayTime = new Date(timestampMs).toLocaleString('en-US', { timeZone: 'America/New_York' });

// Change to ISO format:
const displayTime = new Date(timestampMs).toISOString();
```

### Restricting CORS (Security)

**In n8n workflow node "Webhook - Location API" (lines 65-75):**
```javascript
// Current (insecure):
{ "name": "Access-Control-Allow-Origin", "value": "*" }

// Change to specific domain:
{ "name": "Access-Control-Allow-Origin", "value": "https://web.unixweb.home64.de" }
```

### Adding New NocoDB Fields

**Example: Store accuracy and altitude**

**Step 1: Add columns in NocoDB:**
- `accuracy` (Number)
- `altitude` (Number)

**Step 2: Update "MQTT Location verarbeiten" node (line 124):**
```javascript
mqtt_data: {
    accuracy: mqttData.acc,
    altitude: mqttData.alt,
    battery: mqttData.batt,
    velocity: mqttData.vel,
    // ... existing fields
}
```

**Step 3: Update "Speichere in NocoDB" node to map new fields:**
```javascript
{ "fieldName": "accuracy", "fieldValue": "={{ $json.mqtt_data.accuracy }}" },
{ "fieldName": "altitude", "fieldValue": "={{ $json.mqtt_data.altitude }}" }
```

### Changing MQTT Topic Filter

**In node "MQTT Trigger" (line 104):**
```javascript
// Current: All OwnTracks topics
topics: "owntracks/#"

// Change to specific user:
topics: "owntracks/joachim/#"

// Change to specific device:
topics: "owntracks/joachim/pixel"

// Multiple topics:
topics: "owntracks/joachim/#,owntracks/lisa/#"
```

### Updating API Endpoint URL

**In index.html (line 178):**
```javascript
// Current:
const API_URL = 'https://n8n.unixweb.home64.de/webhook/location';

// Change to your n8n instance:
const API_URL = 'https://your-n8n.example.com/webhook/location';
```

### Changing Auto-Refresh Interval

**In index.html (line 419):**
```javascript
// Current: 5 seconds
refreshInterval = setInterval(loadLocations, 5000);

// Change to 10 seconds:
refreshInterval = setInterval(loadLocations, 10000);

// Change to 30 seconds:
refreshInterval = setInterval(loadLocations, 30000);
```

## Repository Contents

| File | Description |
|------|-------------|
| `n8n-tracker.json` | n8n workflow - MQTT location capture + API endpoint |
| `index.html` | Web interface with multi-layer maps and device filtering |
| `database-example.csv` | Sample NocoDB export showing actual data structure |
| `README.md` | Comprehensive German documentation (setup, usage, troubleshooting) |
| `CLAUDE.md` | This file - technical architecture documentation |

## Important Gotchas and Edge Cases

### 1. Device Identification via `username` Field
- The `username` field contains the OwnTracks tracker ID (`tid`), not a username
- The web interface filters devices by `username`, not by `first_name` or `marker_label`
- **Example**: Device with `tid: "10"` will have `username: "10"` in database
- Device names are hardcoded in `index.html` (lines 142-145) - must be manually updated

### 2. MQTT Message Validation
- The workflow does NOT filter by `_type: "location"` despite what older documentation says
- All MQTT messages are processed; validation happens in the JavaScript code node
- Messages missing `lat`, `lon`, or `tst` are silently skipped with `continue`
- **Result**: Non-location MQTT messages don't cause errors, they're just ignored

### 3. Time Filter Default
- The web interface defaults to **1 hour** time filter (line 125)
- This means newly deployed users won't see historical data unless they change the filter
- Consider changing default to `24h` or `all` for better initial experience

### 4. Circular Marker Icon Implementation
- Markers use SVG `divIcon` with a navigation-style clock hand (lines 337-345)
- The clock hand is purely decorative, does NOT represent actual direction/heading
- This replaced standard Leaflet pin icons in recent commits (see commit 4bec87d)

### 5. Speed Unit Conversion
- OwnTracks sends velocity in **m/s** (`vel` field)
- Stored in database as m/s in `speed` column
- Converted to km/h in web UI with `speed * 3.6` (line 329)
- **Important**: If you display speed elsewhere, remember to convert

### 6. Battery Data May Be Null
- Not all OwnTracks messages include battery data
- The code checks for `battery !== undefined && battery !== null` before displaying (line 323)
- Same applies to `speed` field (line 328)

### 7. CORS Configuration
- API has CORS set to `*` (all origins allowed)
- This is intentional for development but **insecure for production**
- See "Restricting CORS" section for how to fix

### 8. Error Workflow Reference
- The workflow references error workflow ID `0bBZzSE6SUzVsif5`
- This error workflow is NOT included in the repository export
- If importing to a new n8n instance, errors will fail silently without this workflow

### 9. Timezone Handling
- All timestamps are converted to Europe/Berlin timezone (line 124 in workflow)
- This is hardcoded in the JavaScript transformation
- Database stores ISO 8601 UTC timestamps, but `display_time` is Berlin time
