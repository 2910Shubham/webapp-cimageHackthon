import crypto from "crypto";

/**
 * Generate a cryptographically random 6-digit OTP.
 */
export function generateOTP(): string {
  // crypto.randomInt gives a truly random integer in [0, 999999]
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a unique QR token (UUID v4).
 */
export function generateQRToken(): string {
  return crypto.randomUUID();
}
