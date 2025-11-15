# POC App Fixes & Documentation Update

## Summary
This PR fixes critical bugs in the Next.js POC application and adds comprehensive documentation to CLAUDE.md. The app is now fully functional with proper data display.

## Changes

### 🐛 Bug Fixes

1. **Fix NocoDB String Type Handling** (feaae56)
   - NocoDB returns strings instead of numbers for `user_id`, `chat_id`, `latitude`, `longitude`
   - Updated TypeScript interfaces to accept `number | string`
   - Changed strict equality checks to loose equality (`==` instead of `===`)
   - Added `Number()` conversion for coordinates when passing to Leaflet

2. **Fix DNS Resolution Issue** (84cdbdc)
   - Next.js server couldn't resolve `n8n.unixweb.home64.de` hostname
   - Changed from server-side API proxy to client-side fetch
   - All components now fetch directly from n8n webhook in browser

3. **Fix Leaflet Component Imports** (61d76b5)
   - Resolved "Element type is invalid" error
   - Replaced dynamic imports with direct imports
   - Fixed `LayersControl.BaseLayer` nested component issue
   - Imports Leaflet CSS from npm instead of CDN

### 📝 Documentation

4. **Update CLAUDE.md** (5feda86)
   - Added comprehensive documentation for both applications
   - Documented Next.js POC architecture
   - Added development workflows for AI assistants
   - Included troubleshooting guide and quick reference

## Testing Done

- ✅ Map displays correctly with device markers
- ✅ Device filtering works (by ID and time range)
- ✅ Admin panel shows statistics
- ✅ Admin devices page displays device cards
- ✅ Auto-refresh working (5 second interval)
- ✅ All map layers functional (Standard/Satellite/Dark)

## Known Limitations (POC)

This is still a **Proof of Concept** with the following limitations:

- ⚠️ Hardcoded credentials (`admin/admin123`)
- ⚠️ No database integration
- ⚠️ No device CRUD functionality
- ⚠️ Single admin user only
- ⚠️ Basic security (no rate limiting, minimal CSRF protection)

See `CLAUDE.md` section "POC Limitations" for full details.

## Next Steps for Production

1. Database integration (Postgres/MySQL)
2. User management with hashed passwords
3. Device CRUD implementation
4. Security hardening
5. Advanced features (geofencing, notifications, export)

## How to Test

```bash
cd poc-app
npm install
npm run dev
```

Access:
- Public Map: http://localhost:3000
- Login: http://localhost:3000/login (admin/admin123)
- Admin: http://localhost:3000/admin

## Screenshots

The map now correctly displays:
- Device "11" (Huawei Smartphone) with blue marker
- Location near Munich (48.1383, 11.4276)
- Battery level and speed in popups
- Movement path as polyline

---

**Ready to merge?** Yes, all bugs fixed and app functional.
**Breaking changes?** No
**Deployment ready?** For testing only - needs production hardening
