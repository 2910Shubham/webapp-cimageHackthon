import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  addActiveVisitor,
  isBlacklisted as checkBlacklist,
  deleteOTP,
} from "@/lib/redis";
import { checkinSchema } from "@/lib/vms-validations";

/**
 * POST /api/visits/checkin
 *
 * Check-in visitor via QR token or OTP.
 * - Finds visit by qrToken (UUID) or by otp (6 digits)
 * - Validates blacklist and schedule window (±2 hours)
 * - Updates status to CHECKED_IN
 * - Adds to Redis active set
 * - Writes AuditLog
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 422 }
      );
    }

    const { token } = parsed.data;

    // Determine if token is a QR token (UUID) or OTP (6 digits)
    const isOTP = /^\d{6}$/.test(token);

    // ── Find the visit ──
    let visit;
    if (isOTP) {
      // Search by OTP — find the most recent pending/approved visit with this OTP
      visit = await db.visit.findFirst({
        where: {
          otp: token,
          status: { in: ["PENDING", "APPROVED"] },
        },
        include: {
          visitor: { select: { id: true, fullName: true, email: true, isBlacklisted: true } },
          host: { select: { name: true, department: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Search by QR token
      visit = await db.visit.findUnique({
        where: { qrToken: token },
        include: {
          visitor: { select: { id: true, fullName: true, email: true, isBlacklisted: true } },
          host: { select: { name: true, department: true } },
        },
      });
    }

    if (!visit) {
      return NextResponse.json(
        { error: "Visit not found", message: "No visit found with this token." },
        { status: 404 }
      );
    }

    // ── Check if already checked in ──
    if (visit.status === "CHECKED_IN") {
      return NextResponse.json(
        {
          error: "Already checked in",
          message: "This visitor is already checked in.",
          checkedInAt: visit.checkedInAt,
        },
        { status: 409 }
      );
    }

    if (visit.status === "CHECKED_OUT") {
      return NextResponse.json(
        { error: "Visit completed", message: "This visit has already been completed." },
        { status: 409 }
      );
    }

    if (visit.status === "DENIED") {
      return NextResponse.json(
        { error: "Visit denied", message: "This visit has been denied." },
        { status: 403 }
      );
    }

    // ── Check blacklist (Redis cache first) ──
    const blacklisted =
      visit.visitor.isBlacklisted ||
      (await checkBlacklist(visit.visitor.id));

    if (blacklisted) {
      return NextResponse.json(
        { error: "Access denied", message: "This visitor has been blacklisted." },
        { status: 403 }
      );
    }

    // ── Check schedule window (±2 hours) ──
    const now = new Date();
    const scheduled = new Date(visit.scheduledAt);
    const diffHours =
      Math.abs(now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);

    if (diffHours > 2) {
      return NextResponse.json(
        {
          error: "Outside schedule window",
          message: "Check-in is only allowed within 2 hours of the scheduled time.",
          scheduledAt: visit.scheduledAt,
        },
        { status: 400 }
      );
    }

    // ── Update visit status ──
    const checkedInAt = new Date();
    const updatedVisit = await db.visit.update({
      where: { id: visit.id },
      data: {
        status: "CHECKED_IN",
        checkedInAt,
      },
    });

    // ── Add to Redis active set ──
    await addActiveVisitor(visit.visitor.id);

    // ── Delete OTP from Redis (consumed) ──
    await deleteOTP(visit.id);

    // ── Write audit log ──
    await db.auditLog.create({
      data: {
        visitId: visit.id,
        action: "CHECKED_IN",
        actorId: "guard-scan",
        metadata: {
          method: isOTP ? "otp" : "qr-scan",
          checkedInAt: checkedInAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      visitId: updatedVisit.id,
      visitorName: visit.visitor.fullName,
      hostName: visit.host.name,
      hostDepartment: visit.host.department,
      checkedInAt: updatedVisit.checkedInAt,
      expectedOut: updatedVisit.expectedOut,
      status: updatedVisit.status,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Check-in failed" },
      { status: 500 }
    );
  }
}
