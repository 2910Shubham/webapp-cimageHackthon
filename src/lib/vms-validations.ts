import { z } from "zod";

// ─── Visitor Registration Schema ─────────────────────────────

export const visitorRegisterSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone too long"),
  hostId: z.string().uuid("Invalid host ID"),
  purpose: z
    .string()
    .min(3, "Purpose must be at least 3 characters")
    .max(500, "Purpose too long"),
  scheduledAt: z.string().datetime({ message: "Invalid date/time format" }),
  expectedDuration: z
    .number()
    .min(30, "Minimum 30 minutes")
    .max(480, "Maximum 8 hours"),
});

export type VisitorRegisterInput = z.infer<typeof visitorRegisterSchema>;

// ─── Check-in Schema ─────────────────────────────────────────

export const checkinSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required"),
});

export type CheckinInput = z.infer<typeof checkinSchema>;

// ─── Check-out Schema ────────────────────────────────────────

export const checkoutSchema = z.object({
  visitId: z.string().uuid("Invalid visit ID"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Blacklist Schema ────────────────────────────────────────

export const blacklistSchema = z.object({
  visitorId: z.string().uuid("Invalid visitor ID"),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason too long"),
  addedBy: z.string().min(1, "AddedBy is required"),
  expiresAt: z.string().datetime().optional(),
});

export type BlacklistInput = z.infer<typeof blacklistSchema>;

// ─── History Query Schema ────────────────────────────────────

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum([
      "PENDING",
      "APPROVED",
      "CHECKED_IN",
      "CHECKED_OUT",
      "OVERSTAYED",
      "DENIED",
    ])
    .optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

// ─── Duration Helpers ────────────────────────────────────────

/**
 * Format duration between two dates as "Xh Ym".
 */
export function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
