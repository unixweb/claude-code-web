import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/devices - List all devices
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter by owner if not admin
    const where = session.user.role === "ADMIN"
      ? {}
      : { ownerId: session.user.id };

    const devices = await prisma.device.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            locations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get latest location for each device
    const devicesWithLocation = await Promise.all(
      devices.map(async (device) => {
        const latestLocation = await prisma.location.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: "desc" },
        });

        return {
          ...device,
          latestLocation,
        };
      })
    );

    return NextResponse.json({ devices: devicesWithLocation });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create new device
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color, description, icon } = body;

    // Validation
    if (!id || !name) {
      return NextResponse.json(
        { error: "Device ID and name are required" },
        { status: 400 }
      );
    }

    // Check if device ID already exists
    const existing = await prisma.device.findUnique({
      where: { id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Device ID already exists" },
        { status: 400 }
      );
    }

    // Create device
    const device = await prisma.device.create({
      data: {
        id,
        name,
        color: color || "#95a5a6",
        description,
        icon,
        ownerId: session.user.role === "ADMIN" ? session.user.id : session.user.id,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}
