import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQRDataURL } from "@/lib/qr";
import { getOTP } from "@/lib/redis";

/**
 * GET /api/visitors/[id]/pass
 *
 * Returns QR code (base64 data URL), OTP, and visit details
 * for the visitor's latest visit. `id` here is the visitId.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: visitId } = await params;

    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        visitor: {
          select: { fullName: true, email: true, phone: true },
        },
        host: {
          select: { name: true, department: true, email: true },
        },
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Visit not found" },
        { status: 404 }
      );
    }

    // Generate QR code data URL from the qrToken
    const qrDataUrl = await generateQRDataURL(visit.qrToken);

    // Try to get live OTP from Redis (may have expired)
    const liveOtp = await getOTP(visit.id);

    return NextResponse.json({
      visitId: visit.id,
      qrToken: visit.qrToken,
      qrDataUrl,
      otp: liveOtp || visit.otp,
      otpExpired: !liveOtp,
      status: visit.status,
      visitorName: visit.visitor.fullName,
      visitorEmail: visit.visitor.email,
      hostName: visit.host.name,
      hostDepartment: visit.host.department,
      purpose: visit.purpose,
      scheduledAt: visit.scheduledAt,
      expectedOut: visit.expectedOut,
      checkedInAt: visit.checkedInAt,
      checkedOutAt: visit.checkedOutAt,
    });
  } catch (error) {
    console.error("Pass fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pass" },
      { status: 500 }
    );
  }
}
