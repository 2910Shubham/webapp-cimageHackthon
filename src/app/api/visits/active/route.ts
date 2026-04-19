import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveVisitorIds } from "@/lib/redis";

/**
 * GET /api/visits/active
 *
 * Get all active (checked-in) visitors.
 * Reads visitor IDs from Redis active set, fetches full data from PostgreSQL.
 * Returns array sorted by checkedInAt descending with isOverstayed flag.
 */
export async function GET(_request: NextRequest) {
  try {
    // Get active visitor IDs from Redis (sub-millisecond)
    const activeIds = await getActiveVisitorIds();

    if (activeIds.length === 0) {
      return NextResponse.json({ activeVisitors: [], count: 0 });
    }

    // Fetch full visit data from PostgreSQL
    const activeVisits = await db.visit.findMany({
      where: {
        visitor: { id: { in: activeIds } },
        status: { in: ["CHECKED_IN", "OVERSTAYED"] },
      },
      include: {
        visitor: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        host: {
          select: { name: true, department: true },
        },
        gate: {
          select: { name: true },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });

    const now = new Date();
    const enrichedVisits = activeVisits.map((visit) => ({
      visitId: visit.id,
      visitorId: visit.visitor.id,
      visitorName: visit.visitor.fullName,
      visitorEmail: visit.visitor.email,
      visitorPhone: visit.visitor.phone,
      hostName: visit.host.name,
      hostDepartment: visit.host.department,
      gateName: visit.gate?.name || null,
      purpose: visit.purpose,
      checkedInAt: visit.checkedInAt,
      expectedOut: visit.expectedOut,
      isOverstayed: visit.expectedOut
        ? now > new Date(visit.expectedOut)
        : false,
      status: visit.status,
    }));

    return NextResponse.json({
      activeVisitors: enrichedVisits,
      count: enrichedVisits.length,
    });
  } catch (error) {
    console.error("Active visitors fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active visitors" },
      { status: 500 }
    );
  }
}
