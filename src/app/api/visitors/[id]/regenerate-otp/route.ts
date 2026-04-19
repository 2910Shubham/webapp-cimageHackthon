import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP } from "@/lib/otp";
import { storeOTP } from "@/lib/redis";
import { sendOTPEmail } from "@/lib/email";

/**
 * POST /api/visitors/[id]/regenerate-otp
 *
 * Regenerate OTP for a visit (when the previous one expired).
 * `id` here is the visitId.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: visitId } = await params;

    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        visitor: { select: { fullName: true, email: true } },
        host: { select: { name: true } },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if (visit.status !== "PENDING" && visit.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Cannot regenerate OTP for this visit status" },
        { status: 400 }
      );
    }

    // Generate new OTP
    const newOtp = generateOTP();

    // Update in database
    await db.visit.update({
      where: { id: visitId },
      data: { otp: newOtp },
    });

    // Store in Redis with 5-minute TTL
    await storeOTP(visitId, newOtp);

    // Send via email (non-blocking)
    sendOTPEmail({
      to: visit.visitor.email,
      visitorName: visit.visitor.fullName,
      otp: newOtp,
      hostName: visit.host.name,
      scheduledAt: visit.scheduledAt,
    }).catch((err) => console.error("Email send failed:", err));

    return NextResponse.json({
      otp: newOtp,
      message: "OTP regenerated successfully. Valid for 5 minutes.",
    });
  } catch (error) {
    console.error("OTP regeneration error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate OTP" },
      { status: 500 }
    );
  }
}
