import { NextRequest, NextResponse } from "next/server";
import type { LocationResponse } from "@/types/location";
import { locationDb } from "@/lib/db";

/**
 * GET /api/locations
 *
 * Fetches location data from local SQLite cache instead of n8n webhook.
 * Supports query parameters for filtering:
 * - username: Filter by device tracker ID
 * - timeRangeHours: Filter by time range (e.g., 1, 3, 6, 12, 24)
 * - limit: Maximum number of records (default: 1000)
 *
 * Returns the same format as the old n8n webhook for backward compatibility.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || undefined;
    const timeRangeHours = searchParams.get('timeRangeHours')
      ? parseInt(searchParams.get('timeRangeHours')!, 10)
      : undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 1000;

    // Fetch locations from SQLite with filters
    const locations = locationDb.findMany({
      user_id: 0, // Always filter for MQTT devices
      username,
      timeRangeHours,
      limit,
    });

    // Transform to match n8n webhook response format
    const response: LocationResponse = {
      success: true,
      current: locations.length > 0 ? locations[0] : null,
      history: locations,
      total_points: locations.length,
      last_updated: locations.length > 0 ? locations[0].timestamp : new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch locations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
