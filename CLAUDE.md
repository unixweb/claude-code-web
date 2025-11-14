# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains three n8n workflow configurations for location tracking:

1. **tracker.json** - Telegram-based with file storage using `/tmp/n8n-locations.json` (simpler, no database required)
2. **tracker-db.json** - Telegram-based with NocoDB storage (production-ready, persistent storage)
3. **tracker-mqtt.json** - MQTT-based with NocoDB storage (for OwnTracks/MQTT location data)

The Telegram workflows share the same architecture but differ in storage backend. The MQTT workflow integrates OwnTracks-compatible location data into the same NocoDB database.

## Workflow Architecture

### Telegram-based Workflows

Both Telegram workflows have two main execution paths:

**1. Location Capture Flow (Telegram Trigger → Storage)**

tracker.json (File-based):
- Telegram Trigger → Hat Location? → Location verarbeiten → Lade existierende Daten → Merge mit History → Speichere in File → Telegram Bestätigung

tracker-db.json (NocoDB-based):
- Telegram Trigger → Hat Location? → Location verarbeiten → Speichere in NocoDB → [Hole letzten Eintrag + Zähle Einträge] → Merge → Bereite Bestätigung vor → Telegram Bestätigung

Key nodes:
- **Telegram Trigger**: Receives incoming Telegram messages
- **Hat Location?**: Filters messages containing location data
- **Location verarbeiten**: Extracts and formats location data (lat/lon, user info, timestamp) using JavaScript
- **Storage**: Either file-based (shell commands) or NocoDB API calls
- **Telegram Bestätigung**: Sends confirmation with location details and map link

**2. Location API Flow (Webhook → JSON Response)** - See section below

### MQTT-based Workflow

**tracker-mqtt.json** has a simpler, single-path architecture:

MQTT Trigger → Ist Location? → MQTT Location verarbeiten → Speichere in NocoDB

Key nodes:
- **MQTT Trigger**: Subscribes to MQTT topic `owntracks/#` (OwnTracks-compatible)
- **Ist Location?**: Filters for messages with `_type: "location"`
- **MQTT Location verarbeiten**: Transforms MQTT/OwnTracks data format to match NocoDB schema
- **Speichere in NocoDB**: Stores location in same database as Telegram data

### Location API Flow (Shared)

**tracker.json (File-based)**:
- Webhook - Location API → Lade Daten für API (shell: cat) → Format API Response → JSON Response

**tracker-db.json (NocoDB-based)**:
- Webhook - Location API → Lade Daten aus NocoDB → Format API Response → JSON Response

Both expose `/location` endpoint with CORS enabled, returning current location, history, and metadata. The MQTT workflow shares the same NocoDB database and thus the same API.

## Key Technical Details

### Data Storage

**tracker.json (File-based)**:
- Location: `/tmp/n8n-locations.json`
- Format: JSON array of location objects
- Max retention: 100 most recent locations (oldest automatically removed)
- Persistence: Survives n8n restarts but may be lost on system restart due to `/tmp` location

**tracker-db.json & tracker-mqtt.json (NocoDB)**:
- Location: NocoDB database (Project: `pdxl4cx4dbu9nxi`, Table: `m8pqj5ixgnnrzkg`)
- Format: NocoDB records (no client-side limit)
- Persistence: Full database persistence
- API: Uses n8n's NocoDB node with token authentication (ID: `6fNBtcghMe8wFoE5`)
- Both workflows write to the same database table

### Location Object Structure (NocoDB Schema)

The NocoDB database uses the following schema for all location sources:

```json
{
  "latitude": number,
  "longitude": number,
  "timestamp": "ISO 8601 string",
  "user_id": number,
  "first_name": string,
  "last_name": string,
  "username": string,
  "marker_label": string,
  "display_time": "de-DE locale string",
  "chat_id": number
}
```

**Data Mapping for MQTT/OwnTracks**:
- `latitude` ← `lat`
- `longitude` ← `lon`
- `timestamp` ← `tst` (Unix timestamp converted to ISO 8601)
- `user_id` ← `0` (MQTT has no user ID)
- `first_name` ← `tid` (tracker ID, e.g., "le")
- `last_name` ← `source` (e.g., "fused")
- `username` ← `tid`
- `marker_label` ← Combination of `tid` and optionally `SSID`
- `display_time` ← Formatted timestamp
- `chat_id` ← `0` (MQTT has no chat ID)

Additional MQTT data (accuracy, altitude, battery, velocity, etc.) is available in the transformation node but not stored in the database.

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

### Web Interface
The workflow sends users a link to `https://web.unixweb.home64.de/tracker/index.html` for viewing locations on a map.

The `index.html` file in this repository provides a standalone web interface:
- **Map Library**: Leaflet.js (loaded from CDN)
- **API Endpoint**: Configured to `https://n8n.unixweb.eu/webhook/location` (index.html:85)
- **Features**: Auto-refresh (5 second interval), location history polyline, marker popups
- **Hosting**: Can be hosted on any web server or opened as a local file

## Workflow Configuration

### Shared Configuration (Both Workflows)
- **Telegram Credentials**: "Telegram account n8n-munich-bot" (ID: `dRHgVQKqowQHIait`)
- **Webhook IDs**:
  - Telegram trigger: `telegram-location-webhook`
  - Location API: `location-api-endpoint`
- **Execution Order**: v1
- **Caller Policy**: workflowsFromSameOwner
- **Status**: Both workflows set to `active: true` by default

### tracker.json Specific
- **Storage**: Shell commands (cat, echo) for file I/O
- **Error Workflow**: ID `PhwIkaqyXRasTXDH` (configured but not in this export)

### tracker-db.json Specific
- **NocoDB Credentials**: "NocoDB Token account" (ID: `6fNBtcghMe8wFoE5`)
- **Project ID**: `pdxl4cx4dbu9nxi`
- **Table ID**: `m8pqj5ixgnnrzkg`
- **Sort Order**: Uses array structure `[{field: "timestamp", direction: "desc"}]` for sorting locations

### tracker-mqtt.json Specific
- **MQTT Credentials**: Requires MQTT broker credentials (placeholder ID: `MQTT_CREDENTIAL_ID`)
- **Topic**: `owntracks/#` (subscribes to all OwnTracks topics)
- **Message Filter**: Only processes messages with `_type: "location"`
- **NocoDB Config**: Same as tracker-db.json (shares database)
- **Status**: Set to `active: false` by default (activate after configuring MQTT credentials)

## Modifying the Workflows

### Important Considerations
1. **Both workflows are active by default** - test changes carefully to avoid disrupting live tracking
2. **JavaScript code nodes** use n8n's execution environment (not vanilla Node.js)
3. **Date formatting** uses `de-DE` locale - change in "Location verarbeiten" node if needed
4. **CORS** is configured for `*` (all origins) - restrict for production security

### tracker.json Specific
- Shell commands execute in n8n's runtime environment - ensure `/tmp` is writable
- The 100-entry limit prevents unbounded growth - adjust in "Merge mit History" node
- Consider moving from `/tmp` to persistent storage for production (see README.md)

### tracker-db.json & tracker-mqtt.json Specific
- NocoDB sorting requires array structure: `[{field: "timestamp", direction: "desc"}]`
- No client-side entry limit (relies on database capacity)
- Requires valid NocoDB credentials and accessible database
- Both workflows write to the same NocoDB table

### tracker-mqtt.json Specific
- Requires MQTT broker configuration before activation
- Topic pattern can be adjusted to match your MQTT setup
- Data transformation maps OwnTracks format to NocoDB schema
- MQTT data fields (accuracy, battery, velocity) are extracted but not persisted to database

### Common Modifications

**Change history limit (tracker.json only)**:
In "Merge mit History" node, change `locations.slice(0, 100)` to desired limit

**Change date format**:
In "Location verarbeiten" node, change `.toLocaleString('de-DE')` to desired locale

**Restrict CORS**:
In "Webhook - Location API" node, change `Access-Control-Allow-Origin: *` to specific domain

**Update web interface URL**:
In "Telegram Bestätigung" node and `index.html:85`, update API endpoint URL

## Repository Contents

- **tracker.json** - Telegram with file-based storage (simple, no database)
- **tracker-db.json** - Telegram with NocoDB storage (production-ready)
- **tracker-mqtt.json** - MQTT/OwnTracks with NocoDB storage (IoT devices)
- **index.html** - Leaflet.js web interface for map visualization
- **locations-example.csv** - Example data format for testing
- **README.md** - Detailed German documentation with setup and usage instructions

## MQTT/OwnTracks Integration

The **tracker-mqtt.json** workflow is designed for OwnTracks-compatible MQTT location data.

### Setup Requirements
1. Configure MQTT broker credentials in n8n
2. Update the credential ID in tracker-mqtt.json (currently placeholder: `MQTT_CREDENTIAL_ID`)
3. Import workflow into n8n
4. Activate the workflow

### OwnTracks Configuration
Configure your OwnTracks app/device to publish to the same MQTT broker:
- **Topic pattern**: `owntracks/user/device` (workflow subscribes to `owntracks/#`)
- **Mode**: MQTT
- **Expected message format**: JSON with `_type: "location"`

### Data Flow
1. OwnTracks device publishes location to MQTT broker
2. n8n MQTT trigger receives message
3. Filter checks for `_type: "location"`
4. Data transformation maps MQTT fields to NocoDB schema
5. Location stored in same database as Telegram locations
6. Available via same `/location` API endpoint

### Distinguishing Data Sources
In the database:
- **Telegram entries**: Have real `user_id` and `chat_id` values, `first_name`/`last_name` from Telegram profile
- **MQTT entries**: Have `user_id: 0` and `chat_id: 0`, use `tid` (tracker ID) in name fields
