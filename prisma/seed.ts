import { PrismaClient, VisitStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Hosts ───────────────────────────────────────────────
  const hosts = await Promise.all([
    prisma.host.upsert({
      where: { email: "dr.sharma@campus.edu" },
      update: {},
      create: {
        name: "Dr. Rajesh Sharma",
        department: "Computer Science",
        email: "dr.sharma@campus.edu",
        phone: "+91-9876543210",
      },
    }),
    prisma.host.upsert({
      where: { email: "prof.gupta@campus.edu" },
      update: {},
      create: {
        name: "Prof. Anita Gupta",
        department: "Electronics & Communication",
        email: "prof.gupta@campus.edu",
        phone: "+91-9876543211",
      },
    }),
    prisma.host.upsert({
      where: { email: "dr.patel@campus.edu" },
      update: {},
      create: {
        name: "Dr. Vikram Patel",
        department: "Mechanical Engineering",
        email: "dr.patel@campus.edu",
        phone: "+91-9876543212",
      },
    }),
    prisma.host.upsert({
      where: { email: "prof.singh@campus.edu" },
      update: {},
      create: {
        name: "Prof. Meera Singh",
        department: "Administration",
        email: "prof.singh@campus.edu",
        phone: "+91-9876543213",
      },
    }),
    prisma.host.upsert({
      where: { email: "dr.kumar@campus.edu" },
      update: {},
      create: {
        name: "Dr. Arun Kumar",
        department: "Physics",
        email: "dr.kumar@campus.edu",
        phone: "+91-9876543214",
      },
    }),
  ]);

  console.log(`✅ Created ${hosts.length} hosts`);

  // ─── Gates ───────────────────────────────────────────────
  const gates = await Promise.all([
    prisma.gate.create({
      data: {
        name: "Main Gate",
        location: "North Entrance — NH-30 Side",
        isActive: true,
      },
    }),
    prisma.gate.create({
      data: {
        name: "East Gate",
        location: "East Wing — Hostel Side",
        isActive: true,
      },
    }),
    prisma.gate.create({
      data: {
        name: "Service Gate",
        location: "South — Service Road",
        isActive: false,
      },
    }),
  ]);

  console.log(`✅ Created ${gates.length} gates`);

  // ─── Visitors ────────────────────────────────────────────
  const visitors = await Promise.all([
    prisma.visitor.upsert({
      where: { email: "rahul.verma@gmail.com" },
      update: {},
      create: {
        fullName: "Rahul Verma",
        email: "rahul.verma@gmail.com",
        phone: "+91-9123456780",
      },
    }),
    prisma.visitor.upsert({
      where: { email: "priya.das@gmail.com" },
      update: {},
      create: {
        fullName: "Priya Das",
        email: "priya.das@gmail.com",
        phone: "+91-9123456781",
      },
    }),
    prisma.visitor.upsert({
      where: { email: "amit.joshi@gmail.com" },
      update: {},
      create: {
        fullName: "Amit Joshi",
        email: "amit.joshi@gmail.com",
        phone: "+91-9123456782",
        isBlacklisted: true,
      },
    }),
  ]);

  console.log(`✅ Created ${visitors.length} visitors`);

  // ─── Blacklist entry for Amit Joshi ──────────────────────
  await prisma.blacklist.upsert({
    where: { visitorId: visitors[2].id },
    update: {},
    create: {
      visitorId: visitors[2].id,
      reason: "Unauthorized access attempt on 2026-01-15",
      addedBy: "security-admin",
    },
  });

  console.log(`✅ Created blacklist entry`);

  // ─── Sample Visits ───────────────────────────────────────
  const now = new Date();

  // Visit 1: Completed visit (Rahul → Dr. Sharma)
  const visit1 = await prisma.visit.create({
    data: {
      visitorId: visitors[0].id,
      hostId: hosts[0].id,
      gateId: gates[0].id,
      purpose: "Project Discussion",
      status: VisitStatus.CHECKED_OUT,
      otp: "482913",
      scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      checkedInAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      checkedOutAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      expectedOut: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  });

  // Visit 2: Currently pending (Priya → Prof. Gupta)
  const visit2 = await prisma.visit.create({
    data: {
      visitorId: visitors[1].id,
      hostId: hosts[1].id,
      purpose: "Campus Tour",
      status: VisitStatus.PENDING,
      otp: "735291",
      scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      expectedOut: new Date(now.getTime() + 5 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created ${2} sample visits`);

  // ─── Audit Logs ──────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        visitId: visit1.id,
        action: "VISIT_CREATED",
        actorId: "system",
        metadata: { source: "web-registration" },
      },
      {
        visitId: visit1.id,
        action: "CHECKED_IN",
        actorId: "guard-main-gate",
        metadata: { gateId: gates[0].id, method: "qr-scan" },
      },
      {
        visitId: visit1.id,
        action: "CHECKED_OUT",
        actorId: "guard-main-gate",
        metadata: { gateId: gates[0].id, duration: "2h 30m" },
      },
      {
        visitId: visit2.id,
        action: "VISIT_CREATED",
        actorId: "system",
        metadata: { source: "web-registration" },
      },
    ],
  });

  console.log(`✅ Created audit log entries`);

  console.log("\n🎉 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
