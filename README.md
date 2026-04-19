<div align="center">

# 🏛️ VMS — Intelligent Visitor Management System

### CIMAGE Hackathon 2026

*A smart-campus visitor management platform built as a full-stack Next.js 16 monolith —
mobile-first, PWA-ready, and Docker-deployable with a complete CI/CD pipeline.*

---

[![CI](https://img.shields.io/github/actions/workflow/status/your-org/cimage-hackathon/ci.yml?label=CI&style=flat-square&logo=github)](../../.github/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/your-org/cimage-hackathon/deploy.yml?label=Deploy&style=flat-square&logo=vercel)](../../.github/workflows/deploy.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

### 👨‍💻 Developed by

**Shubham Kumar Mishra**
*Patna College*

---

### 🔗 Live Demo

| Resource | Link |
|---|---|
| 🔍 Swagger API Docs | [webapp-cimage-hackthon.vercel.app/api/docs](https://webapp-cimage-hackthon.vercel.app/api/docs) |
| 🛡️ User  | [webapp-cimage-hackthon.vercel.app/](https://webapp-cimage-hackthon.vercel.app/) |
| 🛡️ Guard Portal (Test Login) | [webapp-cimage-hackthon.vercel.app/guard/login](https://webapp-cimage-hackthon.vercel.app/guard/login) |

**Seeded Guard Credentials for Testing:**

| Email | Password |
|---|---|
| `guard1@campus.edu` | `guard@123` |
| `guard2@campus.edu` | `guard@123` |

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start — Local Setup](#2-quick-start--local-setup)
3. [Solution Architecture](#3-solution-architecture)
4. [Entity-Relationship Data Model](#4-entity-relationship-data-model)
5. [Tech Stack](#5-tech-stack)
6. [Features & Personas](#6-features--personas)
7. [Frontend Pages](#7-frontend-pages)
8. [REST API Reference](#8-rest-api-reference)
9. [Redis Cache Design](#9-redis-cache-design)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Docker & Containerisation](#11-docker--containerisation)
12. [Environment Variables](#12-environment-variables)
13. [Project Structure](#13-project-structure)
14. [Security & Edge Cases](#14-security--edge-cases)
15. [PWA Support](#15-pwa-support)
16. [Deployment to Production](#16-deployment-to-production)
17. [Team](#17-team)

---

## 1. Project Overview

**VMS** is an **Intelligent Visitor Management System** built for a smart campus. It digitises the entire visitor lifecycle — from online pre-registration to QR/OTP-gated entry, real-time active-visitor monitoring, and overstay detection — replacing paper-based visitor logs with a secure, auditable, full-stack platform.

### The problem it solves

| Old Way | VMS Way |
|---|---|
| Paper logbook at the gate | Digital pre-registration from any device |
| Manual ID check by guard | QR code or 6-digit OTP scan |
| No blacklist enforcement | Automatic blacklist check at registration & check-in |
| No overstay visibility | Real-time active-visitor dashboard + cron-based overstay flagging |
| No audit trail | Immutable `AuditLog` table on every state change |

### Evaluation criteria addressed

| Criterion | Where |
|---|---|
| ✅ Data modelling | 9 Prisma models, normalised schema, UUID PKs |
| ✅ ER diagram | [Section 4](#4-entity-relationship-data-model) |
| ✅ Architecture diagram | [Section 3](#3-solution-architecture) |
| ✅ CI/CD pipeline | [Section 10](#10-cicd-pipeline) |
| ✅ REST API + Swagger | 10 endpoints + live Swagger UI at `/api/docs` |
| ✅ Frontend persona | Full visitor journey (4 pages) + guard portal (5 pages) |
| ✅ Dockerisable | Multi-stage `Dockerfile` + `docker-compose.yml` |

---

## 2. Quick Start — Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- An [Upstash](https://upstash.com) Redis database (free tier)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/cimage-hackathon.git
cd cimage-hackathon/web-app

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in all values (see below)

# 4. Initialise the database
npx prisma generate
npx prisma db push

# 5. Seed sample data (hosts, gates, visitors)
npx prisma db seed

# 6. Start the development server
npm run dev
# → App running at http://localhost:3000
```

### Environment Variables (`.env`)

Create a `.env` file in the project root with the following keys:

```env
# ── Database ──────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host/vms?sslmode=require

# ── NextAuth ───────────────────────────────────────────────────────────
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# ── Google OAuth (optional — removes Google button if left empty) ──────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Upstash Redis (required for OTP & active visitor tracking) ─────────
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

> **Tip:** Generate `NEXTAUTH_SECRET` with:
> ```bash
> openssl rand -base64 32
> ```

### npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint checks |

### Useful Prisma commands

```bash
npx prisma studio          # GUI to browse & edit database records
npx prisma migrate reset   # ⚠ Wipe and re-apply migrations (dev only)
npx prisma db push         # Push schema changes without a migration file
```

---

## 3. Solution Architecture

### Three-Tier Architecture

```
╔═══════════════════════════════════════════════════════════════════╗
║                          CLIENT  TIER                             ║
║                                                                   ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              ║
║  │  Visitor    │  │   Guard     │  │  Admin /    │              ║
║  │  Web App    │  │   Portal    │  │  Swagger UI │              ║
║  │  (4 pages)  │  │  (5 pages)  │  │  /api/docs  │              ║
║  │  PWA ✅     │  │  NextAuth   │  │             │              ║
║  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              ║
╚═════════╪════════════════╪════════════════╪═══════════════════════╝
          │                │                │
          │        HTTPS / REST / Polling   │
          ▼                ▼                ▼
╔═══════════════════════════════════════════════════════════════════╗
║                       APPLICATION  TIER                           ║
║                                                                   ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │               Next.js 16  (App Router + RSC)              │    ║
║  │                                                           │    ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    ║
║  │  │  Auth    │ │ QR / OTP │ │Blacklist │ │ Swagger  │   │    ║
║  │  │  (JWT)   │ │  Service │ │  Check   │ │    UI    │   │    ║
║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    ║
║  │                                                           │    ║
║  │  ┌───────────────────────────────────────────────────┐   │    ║
║  │  │              REST API  (10 endpoints)              │   │    ║
║  │  │  POST /api/visitors/register                       │   │    ║
║  │  │  POST /api/visits/checkin    POST /api/visits/checkout │  ║
║  │  │  GET  /api/visits/active     GET  /api/visitors/[id]/pass│ ║
║  │  │  GET  /api/visitors/[id]/history                   │   │    ║
║  │  │  POST /api/visitors/[id]/regenerate-otp            │   │    ║
║  │  │  POST /api/blacklist         GET  /api/health       │   │    ║
║  │  │  GET  /api/hosts             GET  /api/cron/overstay│   │    ║
║  │  └───────────────────────────────────────────────────┘   │    ║
║  └──────────────────────────────────────────────────────────┘    ║
╚═══════════════════════════════╤═══════════════════════════════════╝
                                │
╔═══════════════════════════════╧═══════════════════════════════════╗
║                          DATA  TIER                               ║
║                                                                   ║
║  ┌────────────────────────┐     ┌───────────────────────────┐    ║
║  │   PostgreSQL (Neon)    │     │   Upstash Redis (REST)    │    ║
║  │                        │     │                           │    ║
║  │  Visitor  Host  Gate   │     │  otp:<visitId>  (5m TTL)  │    ║
║  │  Visit    AuditLog     │     │  active-visitors  (Set)   │    ║
║  │  Blacklist             │     │  blacklist        (Set)   │    ║
║  │  User  Account Session │     │  ratelimit:<ip>   (1m)    │    ║
║  └────────────────────────┘     └───────────────────────────┘    ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Request Lifecycle

```
Browser / Mobile App
       │
       ▼
  Next.js Middleware (src/middleware.ts)
  └── withAuth: checks JWT cookie for protected routes
       │
       ▼
  App Router Page (RSC or Route Handler)
  ├── Server Component: getServerAuthSession() → render HTML
  └── Route Handler: validate with Zod → Redis fast path → Prisma DB
       │
       ▼
  Redis (OTP · Active Visitors · Blacklist · Rate Limit)
       │
       ▼
  PostgreSQL via Prisma ORM (source of truth)
       │
       ▼
  JSON Response  ──→  Client re-render / redirect
```

---

## 4. Entity-Relationship Data Model

### ER Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────┐          ┌──────────────────────────────────────┐  │
│  │    User     │          │               Visit                  │  │
│  │─────────────│          │──────────────────────────────────────│  │
│  │ id (PK)     │          │ id (PK, uuid)                        │  │
│  │ name        │          │ visitorId (FK → Visitor)  ┐          │  │
│  │ email       │          │ hostId    (FK → Host)     │          │  │
│  │ password    │          │ gateId    (FK → Gate?)    │          │  │
│  │ role        │          │ purpose                   │          │  │
│  │ accounts ──────────►Account│ status (enum)         │          │  │
│  │ sessions ──────────►Session│ qrToken (unique)      │          │  │
│  └─────────────┘          │ otp                       │          │  │
│                            │ scheduledAt               │          │  │
│  ┌─────────────┐          │ checkedInAt?              │          │  │
│  │   Visitor   │◄─────────┤ checkedOutAt?             │          │  │
│  │─────────────│   1:M    │ expectedOut?              │          │  │
│  │ id (PK)     │          │ createdAt                 │          │  │
│  │ fullName    │          └───────────┬───────────────┘          │  │
│  │ email (uniq)│                      │ 1:M                      │  │
│  │ phone       │          ┌───────────▼───────────┐              │  │
│  │ photoUrl?   │          │       AuditLog         │              │  │
│  │isBlacklisted│          │───────────────────────│              │  │
│  │ createdAt   │          │ id (PK)               │              │  │
│  │ blacklist ──┤──1:1──►  │ visitId (FK → Visit)  │              │  │
│  └─────────────┘ Blacklist│ action                │              │  │
│                            │ actorId               │              │  │
│  ┌─────────────┐          │ metadata (JSON)       │              │  │
│  │    Host     │◄─────────│ createdAt             │              │  │
│  │─────────────│   M:1    └───────────────────────┘              │  │
│  │ id (PK)     │                                                  │  │
│  │ name        │          ┌───────────────────────┐              │  │
│  │ department  │          │       Blacklist        │              │  │
│  │ email (uniq)│          │───────────────────────│              │  │
│  │ phone       │          │ id (PK)               │              │  │
│  │ createdAt   │          │ visitorId (FK, unique) │              │  │
│  └─────────────┘          │ reason                │              │  │
│                            │ addedBy               │              │  │
│  ┌─────────────┐          │ addedAt               │              │  │
│  │    Gate     │◄──M:1────│ expiresAt?            │              │  │
│  │─────────────│  Visit   └───────────────────────┘              │  │
│  │ id (PK)     │                                                  │  │
│  │ name        │                                                  │  │
│  │ location    │                                                  │  │
│  │ isActive    │                                                  │  │
│  └─────────────┘                                                  │  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Table Definitions

| Table | PK | Key Fields | Relations |
|---|---|---|---|
| `Visitor` | `cuid` | fullName, email (unique), phone, isBlacklisted | → Visit (1:M), → Blacklist (1:1) |
| `Host` | `cuid` | name, department, email (unique) | ← Visit (M:1) |
| `Gate` | `cuid` | name, location, isActive | ← Visit (optional M:1) |
| `Visit` | `cuid` | status (enum), qrToken (unique), otp, scheduledAt | → Visitor, Host, Gate?, AuditLog |
| `AuditLog` | `cuid` | action, actorId, metadata (JSON) | → Visit |
| `Blacklist` | `cuid` | reason, addedBy, expiresAt? | → Visitor (unique) |
| `User` | `cuid` | email, password (bcrypt), role (RBAC) | → Account, Session |
| `Account` | `cuid` | provider, providerAccountId | → User |
| `Session` | `cuid` | sessionToken (unique), expires | → User |

### `VisitStatus` Enum

```
PENDING → APPROVED → CHECKED_IN → CHECKED_OUT
                   ↘ OVERSTAYED ↗
                   DENIED
```

### Database Indexes

```sql
-- Fast blacklist + status filtering
@@index([visitorId])  -- on Visit
@@index([status])     -- on Visit
@@index([checkedInAt]) -- on Visit
@@index([qrToken])    -- on Visit (unique)
@@index([visitId])    -- on AuditLog
```

---

## 5. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Framework** | Next.js App Router | 16.2.4 | SSR + API routes in one repo; RSC by default |
| **Language** | TypeScript | 5.x | Strict mode, no `any`, full type safety |
| **UI Library** | React | 19.2.4 | Server components; `"use client"` only when necessary |
| **Styling** | Tailwind CSS | v4 | Utility-first; zero runtime CSS; mobile-first |
| **ORM** | Prisma | 6.19 | Type-safe DB access; migration management; ER introspection |
| **Database** | PostgreSQL (Neon) | 16 | Serverless, free-tier hosted, ACID transactions |
| **Cache / KV** | Upstash Redis (REST) | — | Sub-ms OTP storage (TTL), active-visitor set, blacklist cache, rate limiting |
| **Auth** | NextAuth v4 + PrismaAdapter | 4.24 | JWT strategy; Credentials + Google OAuth; RBAC |
| **Validation** | Zod | v4 | Schema validation client-side and server-side; co-located with API handlers |
| **Email** | Nodemailer + Gmail SMTP | — | OTP delivery; gracefully degrades when unconfigured |
| **QR Codes** | `qrcode` + `qrcode.react` | — | Server-side base64 PNG + client-side SVG rendering |
| **API Docs** | `swagger-ui-react` + OpenAPI 3.0 | — | Live interactive docs at `/api/docs` |
| **Icons** | lucide-react | 1.8 | Only icon library; tree-shakeable |
| **Utilities** | clsx, bcryptjs, axios | — | Class merging, password hashing, HTTP client |
| **Linting** | ESLint 9 (flat config) | 9.x | `eslint-config-next` core-web-vitals + TypeScript |
| **Containerisation** | Docker + docker-compose | — | Multi-stage build; non-root user; 3-service compose |
| **CI/CD** | GitHub Actions | — | Lint → Test → Build → Docker push → SSH deploy |

---

## 6. Features & Personas

### Visitor (Web UI)
- Pre-register from any device (mobile-first, PWA installable)
- 3-step guided registration form with localStorage draft saving
- Receive a digital **QR Pass** + **6-digit OTP** via email
- Live visit status page with animated state transitions
- WhatsApp share for pass link; receipt download on checkout

### Guard (Web UI — ADMIN role)
- Login portal (`/guard/login`)
- Real-time active visitor dashboard with overstay flags
- Camera-based QR scanner (`html5-qrcode`)
- Manual OTP / token entry fallback
- One-click checkout confirmation

### Admin / Security (API + Swagger)
- All operations via REST API, consumed via Swagger UI at `/api/docs`
- Blacklist management (add / expire)
- Overstay cron trigger
- Visit history with pagination and status filters

---

## 7. Frontend Pages

### Visitor Pages (Public)

| # | Route | Description |
|---|---|---|
| 1 | `/` | Landing page — "Smart Campus Visitor Pass" hero, CTA |
| 2 | `/register` | Multi-step form (Personal → Visit details → Review) |
| 3 | `/pass/[visitId]` | QR code + OTP + 5-min countdown, regeneration button, WhatsApp share |
| 4 | `/visit/[visitId]` | Live status — CHECKED\_IN (green) / OVERSTAYED (amber) / CHECKED\_OUT (confetti) |

### Guard Portal (Protected — ADMIN role)

| # | Route | Description |
|---|---|---|
| 5 | `/guard/login` | Credentials sign-in |
| 6 | `/guard/dashboard` | Active visitors list, stats, quick actions |
| 7 | `/guard/scan` | Camera QR scanner |
| 8 | `/guard/manual` | Manual OTP / token check-in & check-out |
| 9 | `/guard/checkout/[visitId]` | Checkout confirmation screen |

### Auth Pages (Public)

| Route | Description |
|---|---|
| `/login` | Email/password + optional Google OAuth |
| `/signup` | Create account, auto sign-in |

### Seeded Guard Credentials

| Email | Password | Gate |
|---|---|---|
| `guard1@campus.edu` | `guard@123` | Main Gate |
| `guard2@campus.edu` | `guard@123` | East Gate |

---

## 8. REST API Reference

> 🔗 **Interactive Swagger UI:** [webapp-cimage-hackthon.vercel.app/api/docs](https://webapp-cimage-hackthon.vercel.app/api/docs)
> OpenAPI JSON: **`/api/docs/spec`**

### Consistent response shapes

```jsonc
// Success
{ "data": { ... }, "message": "Human-readable confirmation" }

// Error
{ "error": "Human-readable description", "code": "MACHINE_READABLE_CODE" }
```

---

### `POST /api/visitors/register`

Register a visitor, generate QR token + OTP, send OTP via email.

**Request body**
```json
{
  "fullName": "Rahul Verma",
  "email": "rahul@gmail.com",
  "phone": "+91-9123456780",
  "hostId": "uuid-of-host",
  "purpose": "Project Discussion",
  "scheduledAt": "2026-04-20T10:00:00.000Z",
  "expectedDuration": 120
}
```

**Response `201`**
```json
{
  "visitId": "uuid",
  "visitorId": "uuid",
  "qrToken": "uuid",
  "otp": "482913",
  "scheduledAt": "...",
  "expectedOut": "...",
  "hostName": "Dr. Rajesh Sharma",
  "status": "PENDING"
}
```

| Code | Meaning |
|---|---|
| 201 | Registered successfully |
| 403 | Visitor is blacklisted |
| 409 | Active visit already exists for today |
| 422 | Zod validation failed |

---

### `POST /api/visits/checkin`

Accepts either a UUID QR token or a 6-digit OTP.

```json
{ "token": "uuid-or-6-digit-otp" }
```

**Response `200`**
```json
{
  "visitId": "uuid",
  "visitorName": "Rahul Verma",
  "hostName": "Dr. Rajesh Sharma",
  "hostDepartment": "Computer Science",
  "checkedInAt": "...",
  "expectedOut": "...",
  "status": "CHECKED_IN"
}
```

---

### `POST /api/visits/checkout`

```json
{ "visitId": "uuid" }
```

**Response `200`**
```json
{
  "visitId": "uuid",
  "visitorName": "Rahul Verma",
  "duration": "2h 30m",
  "checkedOutAt": "...",
  "message": "Thank you for visiting, Rahul Verma! Visit duration: 2h 30m."
}
```

---

### `GET /api/visits/active`

Returns live active-visitor list from Redis set.

```json
{
  "activeVisitors": [
    {
      "visitId": "...",
      "visitorName": "...",
      "hostName": "...",
      "checkedInAt": "...",
      "expectedOut": "...",
      "isOverstayed": false
    }
  ],
  "count": 1
}
```

---

### `GET /api/visitors/[id]/pass`

Fetch QR image data + live OTP for a visit (`id` = `visitId`).

```json
{
  "visitId": "...",
  "qrDataUrl": "data:image/png;base64,...",
  "otp": "482913",
  "otpExpired": false,
  "status": "PENDING",
  "visitorName": "...",
  "hostName": "...",
  "scheduledAt": "..."
}
```

---

### `GET /api/visitors/[id]/history`

Paginated visit history (`id` = `visitorId`).

**Query params:** `?page=1&limit=10&status=CHECKED_OUT`

---

### `POST /api/visitors/[id]/regenerate-otp`

Regenerate a new OTP when expired (`id` = `visitId`).

```json
{ "otp": "591823", "message": "OTP regenerated successfully. Valid for 5 minutes." }
```

---

### `POST /api/blacklist`

```json
{
  "visitorId": "uuid",
  "reason": "Unauthorised access attempt",
  "addedBy": "security-admin",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

---

### `GET /api/health`

```json
{
  "status": "ok",
  "dbConnected": true,
  "redisConnected": true,
  "timestamp": "...",
  "activeVisitorCount": 2,
  "version": "1.0.0"
}
```

---

### `GET /api/hosts` · `GET /api/cron/overstay`

`/api/hosts` — returns the hosts list for the registration form dropdown.

`/api/cron/overstay` — scans all CHECKED\_IN visits past `expectedOut` and sets them to OVERSTAYED. Designed to be called by a Vercel/external cron every 5 minutes.

---

## 9. Redis Cache Design

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `otp:<visitId>` | String | **300 s** | Stores the 6-digit OTP; deleted on successful check-in |
| `active-visitors` | Set | None | Set of `visitorId`s currently on campus |
| `blacklist` | Set | None | Cache of blacklisted `visitorId`s; write-through from DB |
| `ratelimit:<ip>` | String (counter) | **60 s** | Max 10 requests/min per IP on registration endpoint |

Redis is queried **before** Postgres on every check-in and blacklist lookup — the DB is only hit on cache miss.

---

## 10. CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipelines                       │
│                                                                  │
│  Any branch push / PR to main                                    │
│  ──────────────────────────────                                  │
│  ┌─────────┐    ┌──────────┐    ┌──────────────────────┐        │
│  │  Lint   │───►│   Test   │───►│  Build & Docker Check│        │
│  │         │    │(Postgres │    │  (npm run build +    │        │
│  │eslint   │    │+ Redis   │    │  docker build -t vms)│        │
│  │prisma   │    │services) │    │                      │        │
│  │generate │    │prisma    │    │                      │        │
│  └─────────┘    │migrate   │    └──────────────────────┘        │
│                 │seed      │                                     │
│                 │jest --cov│                                     │
│                 └──────────┘                                     │
│                                                                  │
│  Push to main only                                               │
│  ─────────────────                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Deploy Job                             │   │
│  │  1. docker/login-action → ghcr.io                        │   │
│  │  2. docker/build-push-action (multi-platform, GHA cache) │   │
│  │     tags: ghcr.io/<org>/vms:<sha>  +  :latest            │   │
│  │  3. SSH into server (appleboy/ssh-action)                 │   │
│  │     docker pull → docker-compose up -d --no-deps app     │   │
│  │     curl /api/health → smoke test                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Required GitHub Secrets

| Secret | Used By |
|---|---|
| `UPSTASH_REDIS_REST_URL` | CI test job |
| `UPSTASH_REDIS_REST_TOKEN` | CI test job |
| `DEPLOY_HOST` | Deploy SSH (optional) |
| `DEPLOY_USER` | Deploy SSH (optional) |
| `DEPLOY_KEY` | Deploy SSH (optional) |
| `GITHUB_TOKEN` | Auto-provided — GHCR push |

---

## 11. Docker & Containerisation

### Multi-stage `Dockerfile`

```
Stage 1 — Builder  (node:20-alpine)
  ├── npm ci
  ├── npx prisma generate
  └── npm run build   →  .next/standalone

Stage 2 — Runner   (node:20-alpine)
  ├── Non-root user (nextjs:1001 / nodejs:1001)
  ├── Copy: public/, .next/standalone, .next/static, prisma/, node_modules/.prisma
  └── CMD ["node", "server.js"]   PORT 3000
```

### `docker-compose.yml` — 3 services

```yaml
services:
  app:       # VMS Next.js app — port 3000
  postgres:  # postgres:16-alpine — port 5432, volume pgdata, health-checked
  redis:     # redis:7-alpine — port 6379, AOF persistence, health-checked
```

The `app` service waits for both `postgres` and `redis` to pass health checks before starting.

### Run with Docker Compose

```bash
# 1. Copy environment template
cp .env.example .env
# (fill DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, Upstash vars)

# 2. Build and start all services
docker compose up --build

# 3. Push Prisma schema (first run)
docker compose exec app npx prisma db push

# 4. Seed sample data
docker compose exec app npx prisma db seed

# 5. Open app
open http://localhost:3000
```

### Run the image directly

```bash
docker build -t vms .
docker run -p 3000:3000 --env-file .env vms
```

---

## 12. Environment Variables

Copy `.env.example` → `.env` and fill in all values:

```env
# ── Database ──────────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@host/vms?sslmode=require"

# ── NextAuth ──────────────────────────────────────────────────
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"          # production: https://your-app.vercel.app

# ── Google OAuth (optional — removes Google button if unset) ──
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ── Upstash Redis (required for OTP / active visitors) ────────
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."

# ── Gmail SMTP (optional — OTP printed to console if unset) ───
GMAIL_USER="yourapp@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"     # Google app password, NOT account password
```

> `.env` is gitignored. Only `.env.example` (with empty values) is committed.

---

## 13. Project Structure

```
web-app/
├── prisma/
│   ├── schema.prisma              9 models (6 VMS + 3 auth)
│   ├── seed.ts                    5 hosts · 3 gates · 3 visitors · 2 visits
│   └── migrations/                init_vms_tables
│
├── src/
│   ├── app/
│   │   ├── (auth)/                Login, Signup pages
│   │   ├── (protected)/           Dashboard, admin shell
│   │   ├── api/
│   │   │   ├── visitors/
│   │   │   │   ├── register/route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── pass/route.ts
│   │   │   │       ├── history/route.ts
│   │   │   │       └── regenerate-otp/route.ts
│   │   │   ├── visits/
│   │   │   │   ├── checkin/route.ts
│   │   │   │   ├── checkout/route.ts
│   │   │   │   └── active/route.ts
│   │   │   ├── blacklist/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── hosts/route.ts
│   │   │   ├── cron/overstay/route.ts
│   │   │   └── docs/
│   │   │       ├── page.tsx       Swagger UI
│   │   │       └── spec/route.ts  OpenAPI JSON
│   │   ├── register/page.tsx      Visitor registration
│   │   ├── pass/[visitId]/page.tsx
│   │   ├── visit/[visitId]/page.tsx
│   │   ├── guard/                 Guard portal (5 pages)
│   │   ├── layout.tsx             Root layout · Providers · Inter font
│   │   ├── page.tsx               "/" → redirect based on session
│   │   └── globals.css            Tailwind v4 · safe-area utilities
│   │
│   ├── components/
│   │   ├── vms/
│   │   │   ├── RegistrationForm.tsx   Multi-step, localStorage draft
│   │   │   ├── PassDisplay.tsx        QR + OTP countdown + share
│   │   │   └── VisitStatus.tsx        3-state live view + confetti
│   │   ├── auth/
│   │   │   ├── AuthShell.tsx          Split hero + form layout
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx             4 variants · 3 sizes · loading
│   │   │   └── Input.tsx              Label + icon + error
│   │   ├── BottomNav.tsx              Mobile fixed tab bar (hidden lg)
│   │   ├── TopNav.tsx                 Desktop nav (hidden, lg:block)
│   │   ├── LogoutButton.tsx
│   │   └── Providers.tsx              SessionProvider wrapper
│   │
│   ├── lib/
│   │   ├── auth.ts                NextAuth config + getServerAuthSession
│   │   ├── db.ts                  Prisma singleton
│   │   ├── redis.ts               Upstash client + OTP/active/blacklist helpers
│   │   ├── otp.ts                 6-digit OTP generation
│   │   ├── qr.ts                  QR code → base64 PNG
│   │   ├── email.ts               Gmail SMTP via Nodemailer
│   │   ├── roles.ts               RBAC helpers (hasRole, requireRole)
│   │   ├── swagger.ts             OpenAPI 3.0 spec object
│   │   ├── validations.ts         Auth Zod schemas
│   │   └── vms-validations.ts     VMS Zod schemas
│   │
│   ├── types/
│   │   └── next-auth.d.ts         Session.user.id augmentation
│   │
│   └── middleware.ts              withAuth route protection
│
├── public/
│   ├── manifest.json              PWA manifest
│   ├── sw.js                      Service worker (cache-first)
│   └── icons/                     PWA icons 192 + 512 px
│
├── Dockerfile                     Multi-stage build
├── docker-compose.yml             app + postgres + redis
├── .github/
│   └── workflows/
│       ├── ci.yml                 Lint → Test → Build
│       └── deploy.yml             Docker push → SSH deploy
├── Agentcontext/                  Agent-facing reference docs
│   ├── ARCHITECTURE.md
│   ├── PROJECT_STATE.md
│   └── API_REFERENCE.md
├── context.md                     Human-facing source of truth
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. Security & Edge Cases

| Scenario | Handling |
|---|---|
| Blacklisted visitor registers | `403` at `/api/visitors/register` — checked via Redis set (DB fallback on cache miss) |
| Blacklisted visitor checks in | `403` at `/api/visits/checkin` — second enforcement layer at the gate |
| Duplicate registration same day | `409` with existing `visitId` so visitor can retrieve their pass |
| Duplicate check-in | `409` with original timestamp |
| OTP expired (5 min) | Countdown UI shows "Expired"; `regenerate-otp` endpoint issues a fresh one |
| Outside schedule window (±2 hrs) | `400` at check-in with human-readable message |
| Overstayed visitor | Cron endpoint (`/api/cron/overstay`) flips status to `OVERSTAYED`; pass page shows amber banner |
| Rate limiting | Redis counter — max 10 requests/min per IP on the registration endpoint |
| Offline visitor | Pass page caches QR + OTP to `localStorage`; works without network at the gate |
| Secrets in code | All secrets via `process.env.*`; `.env` gitignored; no hardcoded values |
| Hot-reload Prisma leaks | Prisma singleton pattern in `src/lib/db.ts` |
| Session trust | Every protected route checks `getServerAuthSession()` server-side **in addition** to the JWT middleware |
| RBAC | `src/lib/roles.ts` exposes `hasRole`, `requireRole`, `checkRole`; guard routes require ADMIN role |

---

## 15. PWA Support

VMS is installable as a Progressive Web App on Android and iOS:

- **`public/manifest.json`** — app name, theme colour (`#7c3aed` violet), `standalone` display mode
- **App shortcuts** — "Register Visit" and "Guard Scanner" shortcuts for home screen long-press
- **`public/sw.js`** — service worker with cache-first strategy; offline fallback page
- **Icons** — 192 × 192 and 512 × 512 PNG icons
- Tested installable on Chrome Android and Safari iOS (Add to Home Screen)

---

## 16. Deployment to Production

### Vercel (recommended for web-only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from web-app directory
cd web-app
vercel --prod
```

Set all environment variables from [Section 12](#12-environment-variables) in the Vercel project dashboard.

Add the Vercel cron in `vercel.json` for overstay detection:

```json
{
  "crons": [
    { "path": "/api/cron/overstay", "schedule": "*/5 * * * *" }
  ]
}
```

Update `NEXTAUTH_URL` to your production domain, and add the callback URL in Google Cloud Console:
`https://your-app.vercel.app/api/auth/callback/google`

### Self-hosted via Docker Compose

```bash
git clone https://github.com/your-org/cimage-hackathon.git
cd cimage-hackathon/web-app
cp .env.example .env   # fill in production values
docker compose up -d --build or npm run dev (for localhost)
npx prisma db push     # or: docker compose exec app npx prisma db push
```

Push to the `main` branch — GitHub Actions will automatically build, push to GHCR, and SSH-deploy.

---

## 17. Team

Built for **CIMAGE Hackathon 2026**.

**Developer:** Shubham Kumar Mishra — *Patna College*


---

<div align="center">

**VMS** · CIMAGE Hackathon 2026 · Built with Next.js 16, Prisma, Upstash Redis & Tailwind CSS

*Developed by **Shubham Kumar Mishra**, Patna College*

</div>
