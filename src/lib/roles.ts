import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Role hierarchy (higher index = higher authority).
 *
 *   USER (0) < ADMIN (1) < SUPERADMIN (2)
 *
 * Every higher role implicitly has all the permissions of lower roles.
 */

export type AppRole = "USER" | "ADMIN" | "SUPERADMIN";

const ROLE_HIERARCHY: Record<AppRole, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
} as const;

/**
 * All roles defined in the system, ordered from lowest to highest.
 */
export const ALL_ROLES: readonly AppRole[] = ["USER", "ADMIN", "SUPERADMIN"];

// ─── Pure helpers ────────────────────────────────────────────────

/** True if `userRole` is equal to or higher than `requiredRole`. */
export function hasRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** True if `userRole` is strictly higher than `targetRole`. */
export function isAbove(userRole: AppRole, targetRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

/** True if the role is exactly SUPERADMIN. */
export function isSuperAdmin(role: AppRole): boolean {
  return role === "SUPERADMIN";
}

/** True if the role is ADMIN or higher. */
export function isAdmin(role: AppRole): boolean {
  return hasRole(role, "ADMIN");
}

/**
 * Returns the roles that `actorRole` is allowed to assign to other users.
 * - SUPERADMIN can assign any role.
 * - ADMIN can only assign USER (cannot promote to ADMIN or SUPERADMIN).
 * - USER cannot assign roles.
 */
export function assignableRoles(actorRole: AppRole): AppRole[] {
  if (actorRole === "SUPERADMIN") {
    return ["USER", "ADMIN", "SUPERADMIN"];
  }
  if (actorRole === "ADMIN") {
    return ["USER"];
  }
  return [];
}

// ─── Server-side guards (use in Server Components / Route Handlers) ─────

/**
 * Ensures the current user's session has at least `minimumRole`.
 * Redirects to `/dashboard` if the user is authenticated but underprivileged,
 * or to `/login` if there is no session at all.
 *
 * Returns the validated session so callers can use it directly.
 *
 * @example
 * ```ts
 * // In a server component
 * const session = await requireRole("ADMIN");
 * ```
 */
export async function requireRole(minimumRole: AppRole) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role ?? "USER") as AppRole;

  if (!hasRole(userRole, minimumRole)) {
    redirect("/dashboard?error=unauthorized");
  }

  return session;
}

/**
 * Non-redirecting version of role check.
 * Returns `{ authorized: true, session }` or `{ authorized: false }`.
 * Useful inside API route handlers where you want to return a JSON error.
 */
export async function checkRole(minimumRole: AppRole) {
  const session = await getServerAuthSession();

  if (!session) {
    return { authorized: false as const, session: null };
  }

  const userRole = (session.user.role ?? "USER") as AppRole;

  if (!hasRole(userRole, minimumRole)) {
    return { authorized: false as const, session };
  }

  return { authorized: true as const, session };
}
