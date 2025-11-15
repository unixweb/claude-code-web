import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deviceDb } from "@/lib/db";

// GET /api/devices/[id] - Get single device
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = deviceDb.findById(params.id);

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        color: device.color,
        isActive: device.isActive === 1,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        description: device.description,
        icon: device.icon,
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

// PATCH /api/devices/[id] - Update device
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = deviceDb.findById(params.id);
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, color, description, icon } = body;

    const updated = deviceDb.update(params.id, {
      name,
      color,
      description,
      icon,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update device" }, { status: 500 });
    }

    return NextResponse.json({ device: updated });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[id] - Soft delete device
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = deviceDb.findById(params.id);
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const success = deviceDb.delete(params.id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
    }

    return NextResponse.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
