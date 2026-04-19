import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeOTP, isBlacklisted as checkBlacklist } from "@/lib/redis";
import { generateOTP, generateQRToken } from "@/lib/otp";
import { visitorRegisterSchema } from "@/lib/vms-validations";
import { sendOTPEmail } from "@/lib/email";

/**
 * POST /api/visitors/register
 *
 * Register a new visitor — creates Visitor (if not exists), generates QR + OTP,
 * creates Visit with PENDING status, stores OTP in Redis (5min TTL),
 * sends OTP via Gmail, writes AuditLog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Validate input ──
    const parsed = visitorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 422 }
      );
    }

    const { fullName, email, phone, hostId, purpose, scheduledAt, expectedDuration } =
      parsed.data;

    // ── Check host exists ──
    const host = await db.host.findUnique({ where: { id: hostId } });
    if (!host) {
      return NextResponse.json(
        { error: "Host not found", message: `No host with ID ${hostId}` },
        { status: 404 }
      );
    }

    // ── Upsert visitor (create if not exists) ──
    let visitor = await db.visitor.findUnique({ where: { email } });

    if (visitor) {
      // Check blacklist (Redis cache first)
      const blacklisted = await checkBlacklist(visitor.id);
      if (blacklisted || visitor.isBlacklisted) {
        return NextResponse.json(
          {
            error: "Access denied",
            message: "This visitor has been blacklisted and cannot register.",
          },
          { status: 403 }
        );
      }

      // Check for duplicate active visit today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeVisit = await db.visit.findFirst({
        where: {
          visitorId: visitor.id,
          status: { in: ["PENDING", "APPROVED", "CHECKED_IN"] },
          scheduledAt: { gte: today, lt: tomorrow },
        },
      });

      if (activeVisit) {
        return NextResponse.json(
          {
            error: "Active visit exists",
            message: "You already have an active visit scheduled for today.",
            visitId: activeVisit.id,
          },
          { status: 409 }
        );
      }

      // Update visitor info if changed
      if (visitor.fullName !== fullName || visitor.phone !== phone) {
        visitor = await db.visitor.update({
          where: { id: visitor.id },
          data: { fullName, phone },
        });
      }
    } else {
      visitor = await db.visitor.create({
        data: { fullName, email, phone },
      });
    }

    // ── Generate QR token and OTP ──
    const qrToken = generateQRToken();
    const otp = generateOTP();
    const scheduledDate = new Date(scheduledAt);
    const expectedOut = new Date(scheduledDate.getTime() + expectedDuration * 60 * 1000);

    // ── Create visit ──
    const visit = await db.visit.create({
      data: {
        visitorId: visitor.id,
        hostId,
        purpose,
        qrToken,
        otp,
        scheduledAt: scheduledDate,
        expectedOut,
        status: "PENDING",
      },
    });

    // ── Store OTP in Redis with 5-minute TTL ──
    await storeOTP(visit.id, otp);

    // ── Write audit log ──
    await db.auditLog.create({
      data: {
        visitId: visit.id,
        action: "VISIT_CREATED",
        actorId: "system",
        metadata: {
          source: "web-registration",
          visitorEmail: email,
          hostName: host.name,
        },
      },
    });

    // ── Send OTP via Gmail (non-blocking) ──
    sendOTPEmail({
      to: email,
      visitorName: fullName,
      otp,
      hostName: host.name,
      scheduledAt: scheduledDate,
    }).catch((err) => console.error("Email send failed:", err));

    return NextResponse.json(
      {
        visitId: visit.id,
        visitorId: visitor.id,
        qrToken: visit.qrToken,
        otp,
        scheduledAt: visit.scheduledAt,
        expectedOut: visit.expectedOut,
        hostName: host.name,
        status: visit.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Registration failed" },
      { status: 500 }
    );
  }
}
