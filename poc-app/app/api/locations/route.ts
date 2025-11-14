import { NextResponse } from "next/server";
import type { LocationResponse } from "@/types/location";

const N8N_API_URL = "https://n8n.unixweb.home64.de/webhook/location";

export async function GET() {
  try {
    const response = await fetch(N8N_API_URL, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error("Failed to fetch locations from n8n");
    }

    const data: LocationResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
