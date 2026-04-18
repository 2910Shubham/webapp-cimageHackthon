/**
 * Promote a user to SUPERADMIN by email.
 *
 * Usage:
 *   npx tsx prisma/promote.ts <email>
 *
 * Example:
 *   npx tsx prisma/promote.ts admin@example.com
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx prisma/promote.ts <email>");
    process.exit(1);
  }

  const db = new PrismaClient();

  try {
    const user = await db.user.update({
      where: { email },
      data: { role: "SUPERADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log("✅ User promoted to SUPERADMIN:");
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error("❌ Failed to promote user:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
