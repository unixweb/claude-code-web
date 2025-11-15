import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DEVICES, getDevice } from "@/lib/devices";

// GET /api/devices/[id] - Get single device (using hardcoded config)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = getDevice(params.id);

    if (!DEVICES[params.id]) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        color: device.color,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching device:", error);
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

// PATCH /api/devices/[id] - Not implemented (requires database)
export async function PATCH() {
  return NextResponse.json(
    { error: "Device updates require database setup. Please update lib/devices.ts manually." },
    { status: 501 }
  );
}

// DELETE /api/devices/[id] - Not implemented (requires database)
export async function DELETE() {
  return NextResponse.json(
    { error: "Device deletion requires database setup. Please update lib/devices.ts manually." },
    { status: 501 }
  );
}
