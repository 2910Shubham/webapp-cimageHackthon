import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { historyQuerySchema } from "@/lib/vms-validations";
import { VisitStatus } from "@prisma/client";

/**
 * GET /api/visitors/[id]/history
 *
 * Paginated visit history with audit log entries.
 * `id` here is the visitorId.
 * Supports: page, limit, status filter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: visitorId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const parsed = historyQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      status: searchParams.get("status") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 422 }
      );
    }

    const { page, limit, status } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      visitorId: string;
      status?: VisitStatus;
    } = { visitorId };

    if (status) {
      where.status = status as VisitStatus;
    }

    // Verify visitor exists
    const visitor = await db.visitor.findUnique({
      where: { id: visitorId },
      select: { id: true, fullName: true, email: true },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    // Fetch visits with audit logs
    const [visits, total] = await Promise.all([
      db.visit.findMany({
        where,
        include: {
          host: { select: { name: true, department: true } },
          gate: { select: { name: true } },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              action: true,
              actorId: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.visit.count({ where }),
    ]);

    return NextResponse.json({
      visitor: {
        id: visitor.id,
        fullName: visitor.fullName,
        email: visitor.email,
      },
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
