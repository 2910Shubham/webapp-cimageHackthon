import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

/**
 * Role hierarchy for middleware-level checks.
 * Mirrors src/lib/roles.ts but must be self-contained
 * because middleware runs on the Edge runtime.
 */
const ROLE_LEVEL: Record<string, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

/**
 * Map of path prefixes to the minimum role required.
 * Routes not listed here but in the matcher will simply require authentication.
 */
const ROUTE_ROLES: Record<string, string> = {
  "/admin": "ADMIN",
};

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;
    const userRole = (token?.role as string) ?? "USER";
    const userLevel = ROLE_LEVEL[userRole] ?? 0;

    // Check role-restricted routes
    for (const [prefix, requiredRole] of Object.entries(ROUTE_ROLES)) {
      if (pathname.startsWith(prefix)) {
        const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;

        if (userLevel < requiredLevel) {
          const url = request.nextUrl.clone();

          url.pathname = "/dashboard";
          url.searchParams.set("error", "unauthorized");
          return NextResponse.redirect(url);
        }
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
