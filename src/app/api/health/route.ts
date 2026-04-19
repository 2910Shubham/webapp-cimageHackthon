import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import redis, { getActiveVisitorIds } from "@/lib/redis";

/**
 * GET /api/health
 * System health check — database, Redis, active visitor count.
 *
 * @swagger
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 */
export async function GET(_request: NextRequest) {
  let dbConnected = false;
  let redisConnected = false;
  let activeVisitorCount = 0;

  // Test PostgreSQL
  try {
    await db.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  // Test Upstash Redis
  try {
    await redis.ping();
    redisConnected = true;
    const activeIds = await getActiveVisitorIds();
    activeVisitorCount = activeIds.length;
  } catch {
    redisConnected = false;
  }

  const healthy = dbConnected && redisConnected;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      dbConnected,
      redisConnected,
      timestamp: new Date().toISOString(),
      activeVisitorCount,
      version: "1.0.0",
    },
    { status: healthy ? 200 : 503 }
  );
}
