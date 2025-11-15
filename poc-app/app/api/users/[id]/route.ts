import { NextResponse } from "next/server";

// User management requires database
export async function GET() {
  return NextResponse.json(
    { error: "User management requires database setup." },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "User management requires database setup." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "User management requires database setup." },
    { status: 501 }
  );
}
