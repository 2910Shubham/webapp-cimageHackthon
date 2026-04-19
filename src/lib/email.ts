import nodemailer from "nodemailer";

/**
 * Gmail SMTP transporter.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env.
 *
 * To generate an App Password:
 * 1. Enable 2FA on your Google account
 * 2. Go to https://myaccount.google.com/apppasswords
 * 3. Generate a new app password for "Mail"
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface OTPEmailOptions {
  to: string;
  visitorName: string;
  otp: string;
  hostName: string;
  scheduledAt: Date;
}

/**
 * Send OTP email to visitor via Gmail SMTP.
 */
export async function sendOTPEmail({
  to,
  visitorName,
  otp,
  hostName,
  scheduledAt,
}: OTPEmailOptions): Promise<boolean> {
  // Skip sending if Gmail credentials are not configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️  Gmail credentials not configured — OTP email skipped");
    console.log(`📧 OTP for ${visitorName}: ${otp}`);
    return false;
  }

  const formattedDate = scheduledAt.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = scheduledAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    await transporter.sendMail({
      from: `"Smart Campus VMS" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Your Campus Visit Pass — OTP: ${otp}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏫 Smart Campus</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Visitor Management System</p>
          </div>
          
          <div style="padding: 32px;">
            <p style="color: #334155; font-size: 16px;">Hello <strong>${visitorName}</strong>,</p>
            <p style="color: #64748b;">Your campus visit has been registered. Use the OTP below at the gate:</p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #64748b; margin: 0 0 8px; font-size: 14px;">Your One-Time Password</p>
              <h2 style="color: #1a1a2e; font-size: 40px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otp}</h2>
              <p style="color: #ef4444; margin: 8px 0 0; font-size: 13px;">⏱ Valid for 5 minutes</p>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 16px 0;">
              <h3 style="color: #334155; margin: 0 0 12px;">Visit Details</h3>
              <table style="width: 100%; font-size: 14px; color: #64748b;">
                <tr><td style="padding: 4px 0;"><strong>Host:</strong></td><td>${hostName}</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Date:</strong></td><td>${formattedDate}</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Time:</strong></td><td>${formattedTime}</td></tr>
              </table>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
              Show this OTP or your QR pass at the campus gate. Do not share this with anyone.
            </p>
          </div>
          
          <div style="background: #f1f5f9; padding: 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Smart Campus Visitor Management System • Powered by CIMAGE
            </p>
          </div>
        </div>
      `,
    });

    console.log(`✅ OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    return false;
  }
}

interface VisitStatusEmailOptions {
  to: string;
  visitorName: string;
  status: "CHECKED_IN" | "CHECKED_OUT";
  hostName: string;
  timestamp: Date;
  duration?: string;
}

/**
 * Send visit status notification email.
 */
export async function sendStatusEmail({
  to,
  visitorName,
  status,
  hostName,
  timestamp,
  duration,
}: VisitStatusEmailOptions): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return false;
  }

  const isCheckIn = status === "CHECKED_IN";
  const subject = isCheckIn
    ? `✅ Checked In — Welcome to Campus`
    : `👋 Visit Complete — Thank You`;

  const body = isCheckIn
    ? `You have been checked in at ${timestamp.toLocaleTimeString("en-IN")}. Host: ${hostName}.`
    : `Your visit is complete. Duration: ${duration ?? "N/A"}. Thank you for visiting!`;

  try {
    await transporter.sendMail({
      from: `"Smart Campus VMS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
          <h2 style="color: #1a1a2e;">${subject}</h2>
          <p style="color: #334155;">Hello ${visitorName},</p>
          <p style="color: #64748b;">${body}</p>
          <hr style="border: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Smart Campus VMS • Powered by CIMAGE</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
