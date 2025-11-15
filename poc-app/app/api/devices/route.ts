import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DEVICES } from "@/lib/devices";
import type { LocationResponse } from "@/types/location";

const N8N_API_URL = "https://n8n.unixweb.home64.de/webhook/location";

// GET /api/devices - List all devices (using hardcoded config)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch location data from n8n to get latest locations
    let locationData: LocationResponse | null = null;
    try {
      const response = await fetch(N8N_API_URL, { cache: "no-store" });
      if (response.ok) {
        locationData = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }

    // Convert hardcoded DEVICES to API format with latest location
    const devicesWithLocation = Object.values(DEVICES).map((device) => {
      // Find latest location for this device
      const latestLocation = locationData?.history
        ?.filter((loc) => loc.username === device.id)
        ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return {
        id: device.id,
        name: device.name,
        color: device.color,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latestLocation: latestLocation || null,
        _count: {
          locations: locationData?.history?.filter((loc) => loc.username === device.id).length || 0,
        },
      };
    });

    return NextResponse.json({ devices: devicesWithLocation });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

// POST /api/devices - Not implemented (requires database)
export async function POST() {
  return NextResponse.json(
    { error: "Device creation requires database setup. Please update lib/devices.ts manually." },
    { status: 501 }
  );
}
