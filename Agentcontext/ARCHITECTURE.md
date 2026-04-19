# VMS Architecture & Components Reference

## Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Visitor   │  │ Guard    │  │ Admin    │  │ Host     │   │
│  │ Web UI ✅ │  │ Tablet   │  │ Dashboard│  │ Portal   │   │
│  │ (4 pages) │  │ (API)    │  │ (API)    │  │ (API)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST / Polling
┌──────────────────────┴──────────────────────────────────────┐
│                   APPLICATION TIER                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (App Router)                  │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Auth    │ │ QR/OTP  │ │ Blacklist│ │ Swagger  │  │   │
│  │  │ (JWT)   │ │ Service │ │ Check    │ │ UI       │  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └──────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │         REST API (10 endpoints)                 │  │   │
│  │  │  /visitors/register  /visits/checkin            │  │   │
│  │  │  /visits/checkout    /visits/active              │  │   │
│  │  │  /visitors/[id]/pass /visitors/[id]/history     │  │   │
│  │  │  /blacklist          /health                     │  │   │
│  │  │  /hosts              /cron/overstay              │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      DATA TIER                               │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │   PostgreSQL (Neon)    │  │    Upstash Redis (REST)    │ │
│  │                        │  │                            │ │
│  │  • Visitor table       │  │  • OTP storage (5min TTL)  │ │
│  │  • Host table          │  │  • Active visitor set      │ │
│  │  • Gate table          │  │  • Blacklist cache         │ │
│  │  • Visit table         │  │  • Rate limit counters     │ │
│  │  • AuditLog table      │  │                            │ │
│  │  • Blacklist table     │  │                            │ │
│  │  • User/Account/Session│  │                            │ │
│  └────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Map

### Library Modules (`src/lib/`)
| File                 | Purpose                                    | Exports                               |
|---------------------|--------------------------------------------|----------------------------------------|
| `db.ts`             | Prisma client singleton                    | `db`                                   |
| `redis.ts`          | Upstash Redis + all cache operations       | `redis`, `KEYS`, OTP/active/blacklist fns |
| `auth.ts`           | NextAuth configuration                     | `authOptions`, `getServerAuthSession`  |
| `otp.ts`            | OTP and QR token generation                | `generateOTP`, `generateQRToken`       |
| `qr.ts`             | QR code rendering (base64/SVG)             | `generateQRDataURL`, `generateQRSVG`  |
| `email.ts`          | Gmail SMTP via Nodemailer                  | `sendOTPEmail`, `sendStatusEmail`      |
| `validations.ts`    | Auth Zod schemas                           | `loginSchema`, `signupSchema`          |
| `vms-validations.ts`| VMS Zod schemas                            | `visitorRegisterSchema`, etc.          |
| `swagger.ts`        | OpenAPI 3.0 specification object           | `swaggerSpec`                          |
| `roles.ts`          | RBAC helpers                               | `hasRole`, `requireRole`, `checkRole`  |

### Frontend Components (`src/components/vms/`)
| Component            | Route Used In       | Features                                    |
|---------------------|---------------------|---------------------------------------------|
| `RegistrationForm`  | `/register`         | 3-step form, localStorage, validation       |
| `PassDisplay`       | `/pass/[visitId]`   | QR code, OTP countdown, regeneration, share |
| `VisitStatus`       | `/visit/[visitId]`  | 3 states, live timer, confetti, receipt     |

### Visitor Journey Flow
```
Landing Page (/) → Register (/register) → Pass (/pass/[id]) → Visit Status (/visit/[id])
       │                  │                      │                      │
       │                  ├─ Step 1: Personal    ├─ QR code            ├─ CHECKED_IN
       │                  ├─ Step 2: Visit       ├─ OTP + timer        ├─ OVERSTAYED
       │                  └─ Step 3: Review      ├─ WhatsApp share     └─ CHECKED_OUT
       │                                         └─ Auto-redirect            │
       └── CTA "Register" ──────→               on check-in ──────→    Download receipt
```

## Data Flow: Registration
```
1. User fills form → POST /api/visitors/register
2. Server: Validate with Zod
3. Server: Check blacklist (Redis → DB fallback)
4. Server: Upsert Visitor record
5. Server: Check duplicate active visit today
6. Server: Generate QR token + OTP
7. Server: Create Visit record (PENDING)
8. Server: Store OTP in Redis (5min TTL)
9. Server: Write AuditLog
10. Server: Send OTP email (async, non-blocking)
11. Client: Redirect to /pass/[visitId]
```

## Data Flow: Check-in
```
1. Guard scans QR / enters OTP → POST /api/visits/checkin
2. Server: Detect if token is QR (UUID) or OTP (6 digits)
3. Server: Find Visit by qrToken or otp
4. Server: Check not already checked in (409)
5. Server: Check blacklist (Redis)
6. Server: Validate schedule window (±2 hours)
7. Server: Update Visit → CHECKED_IN
8. Server: Add to Redis active-visitors set
9. Server: Delete OTP from Redis
10. Server: Write AuditLog
11. Visitor's pass page: Auto-redirect to /visit/[id] (via polling)
```

## Seeded Data
| Type       | Count | Details                                         |
|-----------|-------|--------------------------------------------------|
| Hosts     | 5     | Dr. Sharma (CS), Prof. Gupta (ECE), etc.        |
| Gates     | 3     | Main Gate, East Gate, Service Gate (inactive)    |
| Visitors  | 3     | Rahul, Priya, Amit (blacklisted)                |
| Visits    | 2     | 1 completed (Rahul), 1 pending (Priya)          |
| AuditLogs | 4     | Created, checked-in, checked-out entries         |
| Blacklist | 1     | Amit Joshi                                       |
