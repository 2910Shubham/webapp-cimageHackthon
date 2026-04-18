import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRole, isAbove } from "@/lib/roles";
import { updateRoleSchema } from "@/lib/validations";

/**
 * GET /api/admin/users
 * Returns all users. Requires ADMIN or above.
 */
export async function GET() {
  const { authorized, session } = await checkRole("ADMIN");

  if (!authorized || !session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
}

/**
 * PATCH /api/admin/users
 * Update a user's role. Requires ADMIN or above.
 * Body: { userId: string, role: "USER" | "ADMIN" | "SUPERADMIN" }
 *
 * Rules:
 * - Cannot change your own role.
 * - Cannot promote/demote someone at or above your own level.
 * - ADMIN can only assign USER (cannot create other admins).
 * - SUPERADMIN can assign any role.
 */
export async function PATCH(request: Request) {
  const { authorized, session } = await checkRole("ADMIN");

  if (!authorized || !session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = updateRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { userId, role: newRole } = parsed.data;
  const actorRole = session.user.role;

  // Cannot change your own role
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role", code: "SELF_CHANGE" },
      { status: 400 },
    );
  }

  // Look up the target user
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Cannot change role of someone at or above your level
  if (!isAbove(actorRole, targetUser.role)) {
    return NextResponse.json(
      { error: "Cannot modify a user at or above your authority level", code: "INSUFFICIENT_AUTHORITY" },
      { status: 403 },
    );
  }

  // Cannot assign a role at or above your own level (except SUPERADMIN)
  if (actorRole !== "SUPERADMIN" && !isAbove(actorRole, newRole)) {
    return NextResponse.json(
      { error: "Cannot assign a role at or above your own level", code: "ROLE_ESCALATION" },
      { status: 403 },
    );
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({
    data: updatedUser,
    message: `Role updated to ${newRole}`,
  });
}
