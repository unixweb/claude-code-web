# Location Tracker - Proof of Concept

A modern Next.js application for tracking MQTT-based location data with authentication and admin panel.

## Features

### Public Features
- 🗺️ **Interactive Map View** - Real-time location tracking with Leaflet.js
- 🎨 **Multiple Map Layers** - Standard, Satellite, and Dark themes
- 🔍 **Device Filtering** - Filter by device and time range
- 🔄 **Auto-refresh** - Updates every 5 seconds
- 📱 **Responsive Design** - Works on desktop and mobile

### Admin Panel (Protected)
- 🔐 **Authentication** - Secure login with NextAuth.js
- 📊 **Dashboard** - Overview of devices and statistics
- 📱 **Device Management** - View device status, battery, speed
- 🎨 **Device Cards** - Visual status indicators (online/offline)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet + React-Leaflet
- **Authentication:** NextAuth.js v5
- **Data Source:** n8n API (existing MQTT workflow)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser:
- Map View: http://localhost:3000
- Login: http://localhost:3000/login
- Admin Panel: http://localhost:3000/admin

### Demo Credentials

```
Username: admin
Password: admin123
```

## Project Structure

```
poc-app/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth API route
│   │   └── locations/             # Location data proxy
│   ├── admin/                     # Protected admin routes
│   │   ├── devices/               # Device management
│   │   └── page.tsx               # Dashboard
│   ├── login/                     # Login page
│   ├── page.tsx                   # Public map view
│   └── layout.tsx                 # Root layout
├── components/
│   └── map/
│       └── MapView.tsx            # Leaflet map component
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   └── devices.ts                 # Device config
├── types/
│   └── location.ts                # TypeScript types
└── middleware.ts                  # Route protection
```

## Key Features Explained

### Authentication Flow
1. User visits `/admin` → Redirected to `/login`
2. Login with credentials → NextAuth validates
3. On success → Redirected to `/admin`
4. Middleware protects all `/admin/*` routes

### Map View
- Fetches location data from n8n API via `/api/locations`
- Filters MQTT-only devices (`user_id === 0`)
- Groups locations by device
- Displays markers and polylines with device-specific colors
- Custom circular navigation-style markers

### Admin Panel
- **Dashboard:** Shows device count, online status, total locations
- **Devices:** Device cards with latest location, battery, speed
- Online/Offline status (online = updated within 10 minutes)

## API Endpoints

### Public
- `GET /api/locations` - Fetch all location data (proxies n8n API)

### Protected (requires auth)
- `GET /admin` - Admin dashboard
- `GET /admin/devices` - Device management

## Configuration

### Adding New Devices

Edit `lib/devices.ts`:

```typescript
export const DEVICES: Record<string, Device> = {
  '10': { id: '10', name: 'Joachim Pixel', color: '#e74c3c' },
  '11': { id: '11', name: 'Huawei Smartphone', color: '#3498db' },
  '12': { id: '12', name: 'New Device', color: '#2ecc71' }, // Add here
};
```

### Changing API Endpoint

Edit `app/api/locations/route.ts`:

```typescript
const N8N_API_URL = "https://your-n8n-instance.com/webhook/location";
```

### Authentication

For production, update `lib/auth.ts`:
- Use database instead of hardcoded users
- Hash passwords with bcrypt
- Add proper user management

## Development Notes

### POC Limitations
- ⚠️ **Hardcoded Users** - For production, use database
- ⚠️ **No Device CRUD** - Add/Edit/Delete buttons are placeholders
- ⚠️ **No User Management** - Single admin user only
- ⚠️ **No Geofencing** - Feature planned for full version
- ⚠️ **No Notifications** - Feature planned for full version

### Next Steps for Production
1. **Database Integration**
   - Add Postgres/MySQL for user and device storage
   - Replace hardcoded device config with DB records

2. **Device CRUD**
   - Implement Add/Edit/Delete device functionality
   - API routes for device management
   - Form validation

3. **User Management**
   - Multi-user support
   - Role-based access control (Admin, Viewer)
   - User registration and password reset

4. **Advanced Features**
   - Geofencing with alerts
   - Email/Push notifications
   - History playback with timeline
   - Export to CSV/GPX
   - Real-time updates (WebSockets)

## Building for Production

```bash
npm run build
npm run start
```

## Environment Variables

Create `.env.local`:

```env
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

For production, generate a secure secret:
```bash
openssl rand -base64 32
```

## License

POC - Internal use only

## Credits

- Built with Next.js 14
- Maps by Leaflet.js
- Authentication by NextAuth.js
- Integrates with existing n8n MQTT workflow
