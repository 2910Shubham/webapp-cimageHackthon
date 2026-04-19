import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/hosts
 * List all campus hosts for the registration dropdown.
 */
export async function GET(_request: NextRequest) {
  try {
    const hosts = await db.host.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ hosts });
  } catch (error) {
    console.error("Failed to fetch hosts:", error);
    return NextResponse.json(
      { error: "Failed to fetch hosts" },
      { status: 500 }
    );
  }
}
