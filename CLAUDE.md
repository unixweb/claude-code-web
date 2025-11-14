# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains an n8n workflow configuration (`tracker.json`) that implements a Telegram-based location tracking system without a database. The workflow stores location data in a simple JSON file (`/tmp/n8n-locations.json`) on the n8n server.

## Workflow Architecture

The workflow has two main execution paths:

### 1. Location Capture Flow (Telegram Trigger → Storage)
- **Telegram Trigger**: Receives incoming Telegram messages
- **Hat Location?**: Filters messages containing location data
- **Location verarbeiten**: Extracts and formats location data (lat/lon, user info, timestamp)
- **Lade existierende Daten**: Reads existing locations from `/tmp/n8n-locations.json`
- **Merge mit History**: Combines new location with existing data (keeps last 100 entries)
- **Speichere in File**: Writes updated JSON back to `/tmp/n8n-locations.json`
- **Telegram Bestätigung**: Sends confirmation message with location details and map link

### 2. Location API Flow (Webhook → JSON Response)
- **Webhook - Location API**: Exposes `/location` endpoint with CORS enabled
- **Lade Daten für API**: Reads location data from file
- **Format API Response**: Formats data into structured JSON (current location, history, metadata)
- **JSON Response**: Returns JSON with CORS headers

## Key Technical Details

### Data Storage
- Storage location: `/tmp/n8n-locations.json`
- Format: JSON array of location objects
- Max retention: 100 most recent locations (oldest automatically removed)
- Data persistence: File-based (survives n8n restarts but may be lost on system restart due to `/tmp` location)

### Location Object Structure
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
The workflow sends users a link to `https://web.unixweb.home64.de/tracker/index.html` for viewing locations on a map. This frontend is hosted separately and not included in this repository.

## Workflow Configuration

- **Telegram Credentials**: Uses "Telegram account n8n-munich-bot" (ID: dRHgVQKqowQHIait)
- **Webhook IDs**:
  - Telegram trigger: `telegram-location-webhook`
  - Location API: `location-api-endpoint`
- **Error Workflow**: ID `PhwIkaqyXRasTXDH` (configured but not included in this export)
- **Execution Order**: v1
- **Caller Policy**: workflowsFromSameOwner

## Modifying the Workflow

When editing this workflow:
1. The workflow is active by default - test changes carefully to avoid disrupting live tracking
2. JavaScript code nodes use n8n's code execution environment (not vanilla Node.js)
3. Shell commands execute in n8n's runtime environment - ensure `/tmp` is writable
4. CORS is configured for `*` (all origins) - restrict if needed for security
5. Date formatting uses `de-DE` locale - adjust if different locale needed
6. The 100-entry limit prevents unbounded growth - increase if more history is needed

## Deployment

To use this workflow:
1. Import `tracker.json` into n8n instance
2. Configure Telegram bot credentials
3. Ensure n8n has write permissions to `/tmp/n8n-locations.json`
4. Activate the workflow
5. Send a location via Telegram to test the capture flow
6. Access the webhook endpoint to verify API functionality
