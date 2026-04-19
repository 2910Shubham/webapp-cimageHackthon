import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/cron/overstay
 *
 * Overstay detection — finds all CHECKED_IN visits past their expectedOut time,
 * updates to OVERSTAYED status, writes AuditLog.
 * Should be called every 60 seconds by a cron job or external scheduler.
 */
export async function GET() {
  try {
    const now = new Date();

    // Find overstayed visits
    const overstayedVisits = await db.visit.findMany({
      where: {
        status: "CHECKED_IN",
        expectedOut: { lt: now },
      },
      include: {
        visitor: { select: { fullName: true } },
      },
    });

    if (overstayedVisits.length === 0) {
      return NextResponse.json({ updated: 0, message: "No overstayed visits" });
    }

    // Update each to OVERSTAYED
    const updates = overstayedVisits.map((visit) =>
      db.visit.update({
        where: { id: visit.id },
        data: { status: "OVERSTAYED" },
      })
    );

    const auditLogs = overstayedVisits.map((visit) =>
      db.auditLog.create({
        data: {
          visitId: visit.id,
          action: "OVERSTAYED",
          actorId: "cron-system",
          metadata: {
            expectedOut: visit.expectedOut?.toISOString(),
            detectedAt: now.toISOString(),
          },
        },
      })
    );

    await db.$transaction([...updates, ...auditLogs]);

    return NextResponse.json({
      updated: overstayedVisits.length,
      visitors: overstayedVisits.map((v) => ({
        visitId: v.id,
        visitorName: v.visitor.fullName,
        expectedOut: v.expectedOut,
      })),
    });
  } catch (error) {
    console.error("Overstay cron error:", error);
    return NextResponse.json(
      { error: "Overstay detection failed" },
      { status: 500 }
    );
  }
}
