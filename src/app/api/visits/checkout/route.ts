import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { removeActiveVisitor } from "@/lib/redis";
import { checkoutSchema, formatDuration } from "@/lib/vms-validations";

/**
 * POST /api/visits/checkout
 *
 * Check-out visitor — updates status to CHECKED_OUT,
 * calculates duration, removes from Redis active set, writes AuditLog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 422 }
      );
    }

    const { visitId } = parsed.data;

    // ── Find the visit ──
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        visitor: { select: { id: true, fullName: true } },
        host: { select: { name: true } },
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Visit not found" },
        { status: 404 }
      );
    }

    if (visit.status === "CHECKED_OUT") {
      return NextResponse.json(
        {
          error: "Already checked out",
          message: "This visit has already been completed.",
          checkedOutAt: visit.checkedOutAt,
        },
        { status: 409 }
      );
    }

    if (visit.status !== "CHECKED_IN" && visit.status !== "OVERSTAYED") {
      return NextResponse.json(
        {
          error: "Invalid state",
          message: `Cannot check out from status: ${visit.status}`,
        },
        { status: 400 }
      );
    }

    // ── Update visit status ──
    const checkedOutAt = new Date();
    const updatedVisit = await db.visit.update({
      where: { id: visitId },
      data: {
        status: "CHECKED_OUT",
        checkedOutAt,
      },
    });

    // ── Calculate duration ──
    const duration = visit.checkedInAt
      ? formatDuration(visit.checkedInAt, checkedOutAt)
      : "N/A";

    // ── Remove from Redis active set ──
    await removeActiveVisitor(visit.visitor.id);

    // ── Write audit log ──
    await db.auditLog.create({
      data: {
        visitId: visit.id,
        action: "CHECKED_OUT",
        actorId: "guard-scan",
        metadata: {
          checkedOutAt: checkedOutAt.toISOString(),
          duration,
        },
      },
    });

    return NextResponse.json({
      visitId: updatedVisit.id,
      visitorName: visit.visitor.fullName,
      hostName: visit.host.name,
      duration,
      checkedOutAt: updatedVisit.checkedOutAt,
      message: `Thank you for visiting, ${visit.visitor.fullName}! Visit duration: ${duration}.`,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Check-out failed" },
      { status: 500 }
    );
  }
}
