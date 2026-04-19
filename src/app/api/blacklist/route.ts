import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addToBlacklist } from "@/lib/redis";
import { blacklistSchema } from "@/lib/vms-validations";

/**
 * POST /api/blacklist
 *
 * Blacklist a visitor — creates Blacklist record, sets isBlacklisted on Visitor,
 * adds to Redis blacklist set, writes AuditLog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = blacklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 422 }
      );
    }

    const { visitorId, reason, addedBy, expiresAt } = parsed.data;

    // ── Check visitor exists ──
    const visitor = await db.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    // ── Check if already blacklisted ──
    if (visitor.isBlacklisted) {
      return NextResponse.json(
        { error: "Already blacklisted", message: "This visitor is already on the blacklist." },
        { status: 409 }
      );
    }

    // ── Create blacklist record + update visitor ──
    await db.$transaction([
      db.blacklist.create({
        data: {
          visitorId,
          reason,
          addedBy,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      }),
      db.visitor.update({
        where: { id: visitorId },
        data: { isBlacklisted: true },
      }),
    ]);

    // ── Add to Redis blacklist cache ──
    await addToBlacklist(visitorId);

    // ── Write audit log for any active visits ──
    const activeVisits = await db.visit.findMany({
      where: {
        visitorId,
        status: { in: ["PENDING", "APPROVED", "CHECKED_IN"] },
      },
    });

    for (const visit of activeVisits) {
      await db.auditLog.create({
        data: {
          visitId: visit.id,
          action: "VISITOR_BLACKLISTED",
          actorId: addedBy,
          metadata: { reason },
        },
      });

      // Deny any pending/approved visits
      if (visit.status === "PENDING" || visit.status === "APPROVED") {
        await db.visit.update({
          where: { id: visit.id },
          data: { status: "DENIED" },
        });
      }
    }

    return NextResponse.json(
      {
        message: "Visitor blacklisted successfully",
        visitorId,
        reason,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Blacklist error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Blacklist operation failed" },
      { status: 500 }
    );
  }
}
