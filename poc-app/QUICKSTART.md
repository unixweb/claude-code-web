# Quick Start Guide

## Jetzt testen (OHNE Datenbank)

Die App funktioniert **sofort** ohne Datenbank mit den existierenden Devices (10, 11):

```bash
cd poc-app
npm install  # Falls noch nicht gemacht
npm run dev
```

**URLs:**
- Map: http://localhost:3000
- Login: http://localhost:3000/login (admin/admin123)
- Admin: http://localhost:3000/admin
- Devices: http://localhost:3000/admin/devices

**Limitation:**
- Device-Verwaltung (Add/Edit/Delete) funktioniert **NICHT** ohne Datenbank
- User-Management funktioniert **NICHT** ohne Datenbank
- Hardcoded Auth wird verwendet

---

## Mit Datenbank (Voll funktionsfähig)

### Option 1: Schnellstart mit Docker

1. **PostgreSQL mit Docker starten:**
```bash
docker run --name location-tracker-db \
  -e POSTGRES_DB=location_tracker \
  -e POSTGRES_USER=tracker_user \
  -e POSTGRES_PASSWORD=secure-password \
  -p 5432:5432 \
  -d postgres:14-alpine
```

2. **DATABASE_URL setzen:**
```bash
# In poc-app/.env.local
echo 'DATABASE_URL="postgresql://tracker_user:secure-password@localhost:5432/location_tracker"' >> .env.local
```

3. **Prisma Migration ausführen:**
```bash
npx prisma migrate dev --name init
```

4. **Datenbank mit Testdaten füllen:**
```bash
# Erstelle prisma/seed.ts (siehe DATABASE_SETUP.md)
npx prisma db seed
```

5. **Auth auf Datenbank umstellen:**
```bash
# In app/api/auth/[...nextauth]/route.ts
# Ändere Import von '@/lib/auth' zu '@/lib/auth-db'
```

6. **App starten:**
```bash
npm run dev
```

### Option 2: Cloud Datenbank (Supabase - Kostenlos)

1. **Account erstellen:** https://supabase.com
2. **Neues Projekt erstellen**
3. **Connection String kopieren:** Settings → Database → Connection String
4. **In `.env.local` einfügen:**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```
5. **Migration ausführen:**
```bash
npx prisma migrate deploy
npx prisma db seed
```

6. **Auth umstellen** (siehe Schritt 5 oben)
7. **App starten:** `npm run dev`

---

## Features nach DB-Setup

### ✅ Mit Datenbank verfügbar:

1. **Device Management**
   - ➕ Devices hinzufügen (Admin Panel)
   - ✏️ Devices bearbeiten (Name, Farbe, Beschreibung)
   - 🗑️ Devices löschen
   - 📊 Location-History zählen

2. **User Management**
   - ➕ Neue User erstellen
   - 👥 Rollen: ADMIN, VIEWER
   - 🔐 Gehashte Passwörter (bcrypt)
   - 📧 Email optional

3. **Location Storage**
   - 📍 Locations aus n8n in DB importieren
   - 📈 Unbegrenzte History
   - 🔍 Schnelle Queries mit Indexes

### 🚧 Geplant (noch nicht implementiert):

4. **Geofencing** - Virtuelle Zäune mit Alerts
5. **Notifications** - Email/Push Benachrichtigungen
6. **History Playback** - Timeline Ansicht
7. **Export** - CSV/GPX/KML Export
8. **WebSocket** - Echtzeit Updates

---

## Troubleshooting

### "Can't reach database server"

**Problem:** Datenbank läuft nicht oder DATABASE_URL falsch

**Lösung:**
```bash
# Docker DB prüfen
docker ps | grep location-tracker-db

# Neu starten falls nötig
docker start location-tracker-db

# DATABASE_URL in .env.local prüfen
cat .env.local | grep DATABASE_URL
```

### "Relation does not exist"

**Problem:** Prisma Migration nicht ausgeführt

**Lösung:**
```bash
npx prisma migrate deploy
# oder
npx prisma migrate reset  # WARNUNG: löscht alle Daten!
```

### Device-Buttons tun nichts

**Problem:** DB nicht verfügbar oder Auth nicht auf DB umgestellt

**Lösung:**
1. Prüfe `.env.local` → DATABASE_URL gesetzt?
2. `npx prisma studio` → Funktioniert die DB-Verbindung?
3. Auth-Import gecheckt? (auth-db.ts statt auth.ts)

### 401 Unauthorized bei /api/devices

**Problem:** Nicht eingeloggt oder Session abgelaufen

**Lösung:**
1. Logout + neu einloggen
2. Browser-Cookies löschen
3. Prüfe ob AUTH_SECRET in .env.local gesetzt ist

---

## Production Deployment

Siehe `DATABASE_SETUP.md` für detaillierte Anweisungen.

**Kurzversion:**
1. Cloud DB erstellen (Supabase/Railway/Neon)
2. DATABASE_URL setzen
3. `npx prisma migrate deploy`
4. `npm run build`
5. `npm run start` oder auf Vercel/Netlify deployen

---

## Nächste Schritte

Nach dem Setup:

1. **Device hinzufügen** in Admin Panel
2. **OwnTracks konfigurieren** mit neuem Device-TID
3. **User Management** testen (Admin Panel → Users)
4. **API testen** mit `curl` oder Postman

**API Endpunkte:**
- `GET /api/devices` - Alle Devices
- `POST /api/devices` - Device erstellen
- `PATCH /api/devices/[id]` - Device updaten
- `DELETE /api/devices/[id]` - Device löschen
- `GET /api/users` - Alle User (Admin only)
- `POST /api/users` - User erstellen (Admin only)
