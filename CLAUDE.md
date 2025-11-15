# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains **two location tracking applications** sharing the same MQTT/n8n backend:

### 1. Original Standalone System
- **n8n-tracker.json** - MQTT/OwnTracks workflow with NocoDB storage
- **index.html** - Standalone web interface (no dependencies, single HTML file)
- Simple, lightweight, no build process required
- Direct integration with n8n API

### 2. Next.js POC Application (`poc-app/`)
- **Modern web application** built with Next.js 14, TypeScript, and Tailwind CSS
- **Authentication system** using NextAuth.js v5
- **Admin panel** with device management and dashboard
- **Responsive design** with multiple map layers
- Production-ready architecture with room for expansion

Both applications:
- Subscribe to MQTT topics (OwnTracks-compatible) via the n8n workflow
- Store location data in NocoDB
- Provide real-time location visualization with device filtering
- Use the same backend API endpoint

**When to use which:**
- **index.html**: Quick deployment, embedded in static sites, no authentication needed
- **poc-app**: Full application with auth, admin features, scalable architecture

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

### Root Level Files

| File | Description |
|------|-------------|
| `n8n-tracker.json` | n8n workflow - MQTT location capture + API endpoint |
| `index.html` | Standalone web interface with multi-layer maps and device filtering |
| `database-example.csv` | Sample NocoDB export showing actual data structure |
| `README.md` | Comprehensive German documentation (setup, usage, troubleshooting) |
| `CLAUDE.md` | This file - technical architecture documentation |

### Next.js POC Application (`poc-app/`)

```
poc-app/
├── app/                          # Next.js 14 App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth.js API route (authentication)
│   │   └── locations/            # Location data proxy (fetches from n8n)
│   ├── admin/                    # Protected admin routes (requires auth)
│   │   ├── devices/              # Device management page
│   │   ├── page.tsx              # Admin dashboard
│   │   └── layout.tsx            # Admin layout with navigation
│   ├── login/                    # Login page
│   ├── page.tsx                  # Public map view (homepage)
│   └── layout.tsx                # Root layout
├── components/
│   └── map/
│       └── MapView.tsx           # Client-side Leaflet map component
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── devices.ts                # Device configuration and helpers
├── types/
│   └── location.ts               # TypeScript type definitions
├── middleware.ts                 # Route protection middleware
├── package.json                  # Dependencies
└── README.md                     # POC-specific documentation
```

---

## Next.js POC Application (poc-app/)

### Overview

The POC application is a **modern, production-ready** location tracking system built with Next.js 14. It provides authentication, an admin panel, and a clean architecture for future expansion.

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS v4
- **Maps:** Leaflet + React-Leaflet
- **Authentication:** NextAuth.js v5 (beta)
- **Data Source:** n8n API (same as index.html)

### Getting Started

**Prerequisites:**
- Node.js 18+
- npm or yarn

**Installation:**
```bash
cd poc-app
npm install
npm run dev
```

**Access:**
- Public Map: http://localhost:3000
- Login: http://localhost:3000/login
- Admin Panel: http://localhost:3000/admin

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

### Architecture

#### 1. Authentication Flow

```
User visits /admin
    ↓
Middleware checks auth (middleware.ts)
    ↓
Not authenticated? → Redirect to /login
    ↓
User submits credentials
    ↓
NextAuth validates (lib/auth.ts)
    ↓
Success? → Redirect to /admin
    ↓
Session stored, all /admin/* routes accessible
```

**Key Files:**
- **lib/auth.ts**: NextAuth configuration with hardcoded credentials (POC only)
- **middleware.ts**: Protects all `/admin/*` routes
- **app/api/auth/[...nextauth]/route.ts**: NextAuth API handler

**Important Notes:**
- POC uses **hardcoded credentials** - NOT for production
- Password: plain text comparison (no bcrypt validation despite imports)
- For production: use database, hash passwords, implement user management

#### 2. Data Flow

```
OwnTracks Device (MQTT)
    ↓
n8n MQTT Trigger
    ↓
NocoDB Storage
    ↓
n8n Webhook API (/webhook/location)
    ↓
poc-app API Route (/api/locations)
    ↓
React Components (Map, Dashboard, Devices)
```

**Key Files:**
- **app/api/locations/route.ts**: Proxies n8n API, adds CORS headers
- **types/location.ts**: TypeScript interfaces for Location and Device types
- **lib/devices.ts**: Device configuration (names, colors)

**API Endpoint Configuration:**
```typescript
// app/api/locations/route.ts
const N8N_API_URL = "https://n8n.unixweb.home64.de/webhook/location";
```

#### 3. Page Structure

**Public Routes (no auth required):**

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Public map view with device filtering |
| `/login` | `app/login/page.tsx` | Login form |

**Protected Routes (auth required):**

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `app/admin/page.tsx` | Dashboard with statistics |
| `/admin/devices` | `app/admin/devices/page.tsx` | Device management cards |

#### 4. Map Component

**File:** `components/map/MapView.tsx`

**Features:**
- Client-side only (uses 'use client' directive)
- Dynamic import to avoid SSR issues with Leaflet
- Device filtering by ID and time range
- Multiple map layers (Standard, Satellite, Dark)
- Custom circular markers with navigation-style indicator
- Auto-refresh every 5 seconds
- Polylines showing device paths

**Key Implementation Details:**
- Uses `react-leaflet` for React integration
- Filters MQTT-only devices (`user_id === 0`)
- Groups locations by device username
- Latest location shown with larger marker (32px vs 16px)
- Speed converted from m/s to km/h: `speed * 3.6`

#### 5. Device Configuration

**File:** `lib/devices.ts`

Centralized device configuration shared across the application:

```typescript
export const DEVICES: Record<string, Device> = {
  '10': { id: '10', name: 'Joachim Pixel', color: '#e74c3c' },
  '11': { id: '11', name: 'Huawei Smartphone', color: '#3498db' },
};
```

**Important:**
- Device IDs match OwnTracks `tid` (tracker ID)
- Colors used for map markers, polylines, and UI indicators
- Unknown devices fall back to DEFAULT_DEVICE (gray)

### Common Modifications for POC App

#### Adding a New Device

**Step 1:** Update `lib/devices.ts`:
```typescript
export const DEVICES: Record<string, Device> = {
  '10': { id: '10', name: 'Joachim Pixel', color: '#e74c3c' },
  '11': { id: '11', name: 'Huawei Smartphone', color: '#3498db' },
  '12': { id: '12', name: 'New Device', color: '#2ecc71' }, // Add here
};
```

**Step 2:** Configure OwnTracks app with `tid: "12"`

**Note:** The device will automatically appear in the map and admin panel.

#### Changing API Endpoint

Edit `app/api/locations/route.ts`:
```typescript
const N8N_API_URL = "https://your-n8n-instance.com/webhook/location";
```

#### Adding Real Authentication

**Step 1:** Install database client (e.g., Prisma, Drizzle):
```bash
npm install @prisma/client
```

**Step 2:** Update `lib/auth.ts`:
```typescript
authorize: async (credentials) => {
  // Query database for user
  const user = await db.user.findUnique({
    where: { username: credentials.username }
  });

  // Verify hashed password
  const isValid = await bcrypt.compare(
    credentials.password,
    user.passwordHash
  );

  return isValid ? user : null;
}
```

#### Implementing Device CRUD

Currently, Add/Edit/Delete buttons in `/admin/devices` are **placeholders**.

**To implement:**

1. **Create API routes:**
   - `app/api/devices/route.ts` (GET, POST)
   - `app/api/devices/[id]/route.ts` (PUT, DELETE)

2. **Add database schema** (e.g., Prisma):
```prisma
model Device {
  id        String   @id
  name      String
  color     String
  createdAt DateTime @default(now())
}
```

3. **Create forms in admin panel:**
   - Modal for adding new device
   - Edit form for existing devices
   - Confirmation dialog for deletion

4. **Update `lib/devices.ts`** to fetch from database instead of hardcoded object

#### Adding Environment Variables

Create `.env.local` in `poc-app/`:
```env
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
N8N_API_URL=https://n8n.unixweb.home64.de/webhook/location
```

Generate secure secret:
```bash
openssl rand -base64 32
```

Update `lib/auth.ts`:
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  // ...
});
```

### Building for Production

```bash
cd poc-app
npm run build
npm run start
```

**For deployment:**
- Set `NEXTAUTH_URL` to your production domain
- Use a strong `AUTH_SECRET`
- Consider using Vercel, Netlify, or Docker deployment
- Set up proper CORS in n8n API if needed

### POC Limitations

The poc-app is a **proof of concept** with the following limitations:

1. **No Database Integration**
   - Devices hardcoded in `lib/devices.ts`
   - Users hardcoded in `lib/auth.ts`
   - No persistent user sessions beyond cookies

2. **No Device CRUD**
   - Add/Edit/Delete buttons are UI-only
   - No API routes for device management
   - Changes require code modifications

3. **Basic Authentication**
   - Single admin user only
   - No password reset
   - No user registration
   - No role-based access control

4. **Missing Features**
   - No geofencing
   - No email/push notifications
   - No history playback with timeline
   - No CSV/GPX export
   - No real-time WebSocket updates

5. **Security Concerns**
   - Hardcoded credentials in source code
   - No rate limiting on login
   - No CSRF protection beyond NextAuth defaults
   - No input validation on forms

### Next Steps for Production

See `poc-app/README.md` for detailed roadmap including:
- Database integration (Postgres/MySQL)
- User management system
- Device CRUD implementation
- Advanced features (geofencing, notifications, export)
- Real-time updates via WebSockets
- Comprehensive security hardening

---

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

### 10. POC App: Leaflet SSR Issues
- Leaflet does NOT support server-side rendering
- `MapView.tsx` must use `'use client'` directive
- Map component should be dynamically imported with `ssr: false`
- Always check for `window` object before accessing Leaflet globals

### 11. POC App: Device Synchronization
- Device configuration exists in TWO places:
  - `poc-app/lib/devices.ts` (Next.js app)
  - `index.html` lines 142-152 (standalone app)
- **CRITICAL**: When adding a device, update BOTH files
- Failure to sync will cause devices to appear differently in each app

### 12. Git Branch Strategy
- Current development branch: `claude/claude-md-mhzzt2q7rr1lc8yy-01EkhckVmjq6Hffdky89WE4j`
- All commits should go to this feature branch
- Branch naming: `claude/<session-id>`
- DO NOT push to main/master without explicit permission

---

## Development Workflow for AI Assistants

### When Working with index.html

**Before Making Changes:**
1. Read the file completely to understand current state
2. Check line numbers mentioned in CLAUDE.md are still accurate
3. Verify API endpoint URL is correct

**Making Changes:**
1. Use Edit tool with exact string matching
2. Update line number references in CLAUDE.md if code moves
3. Test that changes don't break browser caching (see commit 52d9842)

**After Making Changes:**
1. Verify device colors/names are consistent
2. Check that MQTT filtering logic remains `user_id == 0`
3. Update README.md if behavior changes significantly

### When Working with poc-app/

**Project Commands:**
```bash
cd poc-app
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

**Before Making Changes:**
1. Understand the App Router structure (Next.js 14)
2. Check if changes affect both public and admin routes
3. Verify authentication impact

**Making Changes:**
1. **TypeScript strict mode**: All code must be type-safe
2. **Client vs Server**: Be explicit about 'use client' directive
3. **API routes**: Always add proper error handling
4. **Authentication**: Never bypass NextAuth for protected routes

**File Modification Patterns:**

| Task | Files to Update |
|------|-----------------|
| Add new device | `lib/devices.ts` + `index.html` (lines 142-152) |
| Change API endpoint | `app/api/locations/route.ts` |
| Add new admin route | `app/admin/[route]/page.tsx` + `app/admin/layout.tsx` |
| Modify auth logic | `lib/auth.ts` |
| Update types | `types/location.ts` |
| Change map behavior | `components/map/MapView.tsx` |

**Common Pitfalls to Avoid:**
1. **Don't** import Leaflet in Server Components
2. **Don't** use hardcoded credentials in production code
3. **Don't** forget to add routes to middleware matcher
4. **Don't** modify device config without updating both apps
5. **Don't** use absolute imports without checking tsconfig.json paths

### When Working with n8n Workflow

**Before Making Changes:**
1. Export current workflow as backup
2. Understand the two independent flows (MQTT capture + API)
3. Check NocoDB schema compatibility

**Making Changes:**
1. **NEVER** change workflow IDs or credential IDs
2. **Test** with sample MQTT message before deploying
3. **Validate** all field mappings match NocoDB schema
4. **Document** any new fields in this CLAUDE.md

**After Making Changes:**
1. Re-export workflow to `n8n-tracker.json`
2. Update CLAUDE.md if node configuration changes
3. Update `database-example.csv` if schema changes
4. Test both flows independently

### Code Style Conventions

**For index.html:**
- Use vanilla JavaScript (ES6+)
- No build process required
- Keep external dependencies to minimum (Leaflet only)
- Inline all configuration (no external config files)
- Comment complex logic with German or English

**For poc-app/:**
- TypeScript strict mode
- Use functional components (no class components)
- Prefer async/await over promises
- Use Tailwind utility classes (no custom CSS unless necessary)
- Follow Next.js App Router conventions
- Comment complex logic in English

**For n8n workflow:**
- Use descriptive German node names
- Add error handling in JavaScript code nodes
- Set `alwaysOutputData: true` for code nodes that might return empty
- Use `continue` to skip invalid items, not `throw`

### Testing Guidelines

**For index.html:**
- Open in browser directly (no build needed)
- Test with multiple devices in filter dropdown
- Verify auto-refresh works (check network tab)
- Test all map layers switch correctly
- Verify markers appear with correct colors

**For poc-app/:**
- Run `npm run dev` and test all routes
- Test authentication flow:
  - Visit /admin while logged out (should redirect to /login)
  - Login with admin/admin123
  - Access /admin and /admin/devices
  - Logout and verify redirect
- Test map functionality on homepage
- Check responsive design on mobile viewport
- Verify API proxy works: `/api/locations` should return data

**For n8n workflow:**
- Send test MQTT message to verify capture flow
- Access webhook URL directly to verify API flow
- Check NocoDB for new records
- Verify timestamp conversion (should be Berlin time)

### Git Commit Best Practices

**Commit Message Format:**
```
<type>: <description>

<optional body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: Add new device to tracking system

Updated both index.html and poc-app/lib/devices.ts with device '12'
configured as 'New Device' with green color (#2ecc71).

---

fix: Resolve Leaflet SSR error in MapView component

Added 'use client' directive and dynamic import with ssr: false
to prevent server-side rendering issues with Leaflet.

---

docs: Update CLAUDE.md with poc-app architecture
```

### When Documenting Changes

**Update these files when relevant:**
1. **CLAUDE.md**: Technical architecture changes, new conventions
2. **README.md**: User-facing documentation, setup instructions
3. **poc-app/README.md**: POC-specific features and limitations
4. **Inline comments**: Complex logic that isn't obvious

**Line Number References:**
- When referring to specific lines in CLAUDE.md, verify they're still accurate
- If code moves significantly, update all line references in this file
- Use format: `file.ext:line` (e.g., `index.html:178`)

### Deployment Checklist

**Before deploying index.html:**
- [ ] Verify API endpoint URL is production URL
- [ ] Check CORS settings in n8n workflow
- [ ] Test in multiple browsers
- [ ] Verify auto-refresh interval is appropriate
- [ ] Ensure device names/colors are final

**Before deploying poc-app:**
- [ ] Set environment variables in `.env.local`
- [ ] Generate secure `AUTH_SECRET`
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Run `npm run build` successfully
- [ ] Replace hardcoded credentials with database auth
- [ ] Set up proper CORS in n8n if restricting origins
- [ ] Test all routes in production mode
- [ ] Verify authentication flow works
- [ ] Check that API proxy handles errors gracefully

---

## Quick Reference

### File Locations by Task

| Task | File(s) |
|------|---------|
| Add device to standalone app | `index.html` lines 142-152 |
| Add device to Next.js app | `poc-app/lib/devices.ts` |
| Change n8n API endpoint (standalone) | `index.html` line 178 |
| Change n8n API endpoint (POC) | `poc-app/app/api/locations/route.ts` |
| Modify authentication | `poc-app/lib/auth.ts` |
| Update MQTT topic filter | `n8n-tracker.json` MQTT Trigger node |
| Change timestamp format | `n8n-tracker.json` "MQTT Location verarbeiten" node |
| Add NocoDB field | Workflow + NocoDB schema + both apps |
| Modify map markers | `index.html` (lines 284-376) or `poc-app/components/map/MapView.tsx` |
| Change admin panel | `poc-app/app/admin/**/*.tsx` |

### Key Configuration Values

| Setting | Location | Current Value |
|---------|----------|---------------|
| n8n API URL (standalone) | `index.html:178` | `https://n8n.unixweb.home64.de/webhook/location` |
| n8n API URL (POC) | `poc-app/app/api/locations/route.ts` | Same as above |
| MQTT Topic | `n8n-tracker.json` | `owntracks/#` |
| Default Time Filter | `index.html:125` | 1 hour |
| Auto-refresh Interval (standalone) | `index.html:419` | 5000ms (5 seconds) |
| Auto-refresh Interval (POC) | `poc-app/components/map/MapView.tsx` | 5000ms (5 seconds) |
| Default Map Center | Both apps | Munich (48.1351, 11.5820) |
| Default Zoom Level | Both apps | 12 |
| Timezone | n8n workflow | Europe/Berlin |
| Admin Credentials (POC) | `poc-app/lib/auth.ts` | admin / admin123 |

### External Dependencies

**Standalone (index.html):**
- Leaflet 1.9.4 (CDN)
- OpenStreetMap tiles
- Esri World Imagery (satellite)
- OpenTopoMap (terrain)
- CartoDB (dark mode)

**POC Application:**
- Next.js 16.0.3
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.1.17
- NextAuth.js 5.0.0-beta.30
- Leaflet 1.9.4
- react-leaflet 5.0.0

**Backend:**
- n8n (self-hosted)
- NocoDB (project: pdxl4cx4dbu9nxi, table: m8pqj5ixgnnrzkg)
- MQTT broker (for OwnTracks)

---

## Troubleshooting Common Issues

### Issue: Devices not appearing in filter dropdown

**Cause:** No data in database for `user_id == 0`

**Solution:**
1. Check MQTT broker connection
2. Verify OwnTracks app is sending data
3. Check n8n workflow execution logs
4. Verify NocoDB credentials in workflow

### Issue: Map not loading in POC app

**Cause:** Leaflet SSR issue or missing 'use client' directive

**Solution:**
1. Ensure `MapView.tsx` has `'use client'` at top
2. Check dynamic import has `ssr: false`
3. Verify Leaflet CSS is loaded in layout
4. Check browser console for errors

### Issue: Authentication not working

**Cause:** NextAuth configuration or session issues

**Solution:**
1. Check `AUTH_SECRET` is set in `.env.local`
2. Verify credentials match `lib/auth.ts`
3. Clear browser cookies and try again
4. Check middleware is not blocking auth routes

### Issue: Markers showing wrong colors

**Cause:** Device config mismatch between files

**Solution:**
1. Verify `index.html` DEVICE_COLORS (lines 146-152)
2. Check `poc-app/lib/devices.ts` color values
3. Ensure device IDs match exactly (string comparison)
4. Clear browser cache

### Issue: API returning 403 or CORS errors

**Cause:** n8n webhook CORS configuration

**Solution:**
1. Check n8n workflow "Webhook - Location API" node
2. Verify CORS allowed origins setting
3. For POC app, ensure proxy is working in `/api/locations`
4. Check n8n instance is accessible from client

---

## Version History

**Current Version:** 2.0 (with Next.js POC)

**Recent Changes:**
- `b3d8b26`: Merge PR #1 - Add Next.js POC application
- `e29c565`: Add Next.js POC with authentication and admin panel
- `182ebb8`: Fix marker z-index for location ordering
- `52d9842`: Fix browser caching issue in device filter
- `4bec87d`: Replace marker icons with circular navigation-style

**Migration Notes:**
- Both apps (standalone + POC) coexist and share backend
- No breaking changes to existing `index.html` deployments
- POC app is additive, not replacement
