"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

type AppRole = "USER" | "ADMIN" | "SUPERADMIN";

const ROLE_LEVEL: Record<AppRole, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

type RoleGateProps = {
  /** Minimum role required to render children */
  minimumRole: AppRole;
  /** Content to render when the user has sufficient permissions */
  children: ReactNode;
  /** Optional fallback to render when the user lacks permissions */
  fallback?: ReactNode;
};

/**
 * Client-side role gate. Renders children only if the
 * current session user has at least `minimumRole`.
 *
 * @example
 * ```tsx
 * <RoleGate minimumRole="ADMIN">
 *   <DangerousButton />
 * </RoleGate>
 * ```
 */
export function RoleGate({ minimumRole, children, fallback = null }: RoleGateProps) {
  const { data: session } = useSession();
  const userRole = (session?.user?.role ?? "USER") as AppRole;
  const userLevel = ROLE_LEVEL[userRole] ?? 0;
  const requiredLevel = ROLE_LEVEL[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
