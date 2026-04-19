import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger";

/**
 * GET /api/docs/spec
 * Returns the OpenAPI JSON spec for Swagger UI.
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}
