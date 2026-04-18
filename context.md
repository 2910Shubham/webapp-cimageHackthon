# `web-app` — Project Context

> Single source of truth for the architecture, folder structure, conventions, and runtime behavior of the `web-app` package inside the `cimage-hackathon` monorepo.
>
> If something here disagrees with the code, the code wins — please update this file in the same PR.

---

## 1. What This Is

A **mobile-first Next.js 16 web app** that doubles as the web codebase for a hackathon. It is intended to be:

1. Deployed standalone on Vercel as a responsive web app, **and**
2. Wrapped inside a Flutter WebView (see `../mobileApp/`) for the mobile submission.

> One codebase. Two submissions.

The current state is a **boilerplate / scaffold** — auth + protected shell + design system primitives are in place, but no domain features have been added yet. The hackathon problem statement will be layered on top.

### High-level capabilities (today)

- Email/password sign up and login (NextAuth v4, JWT strategy, bcrypt-hashed passwords).
- Optional Google OAuth (auto-enabled when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set).
- Persistent sessions backed by Postgres (Neon) via Prisma.
- **Role-based access control (RBAC)** with a 3-tier hierarchy: `SUPERADMIN > ADMIN > USER`.
  - Role stored on the `User` model, piped through JWT → session.
  - Middleware-level role gating (`ROUTE_ROLES` map), server-side guards (`requireRole`, `checkRole`), and client-side `<RoleGate>` component.
  - Admin panel (`/admin`) for user/role management (ADMIN+ only).
- Route protection via NextAuth `withAuth` middleware (role-aware) **and** server-side `getServerSession` checks in protected layouts.
- Responsive shell:
  - Mobile (< `lg`): single-column with a fixed bottom tab bar (`BottomNav`).
  - Desktop (≥ `lg`): top navigation bar (`TopNav`), wider centered content, two-column auth pages.
  - Nav bars conditionally show an Admin tab for ADMIN/SUPERADMIN users.

---

## 2. Tech Stack

| Layer        | Choice                                            | Notes |
| ------------ | ------------------------------------------------- | ----- |
| Framework    | **Next.js 16.2.4** (App Router, RSC)              | New version — see `AGENTS.md`; check `node_modules/next/dist/docs/` before assuming old APIs. |
| Language     | **TypeScript 5** (`strict: true`, no `any`)       | Path alias `@/* → src/*`. |
| UI           | **React 19.2.4**                                  | Server components by default; `"use client"` only when needed. |
| Styling      | **Tailwind CSS v4** (via `@tailwindcss/postcss`)  | Configured in `globals.css` with `@import "tailwindcss"` and `@theme inline`. `tailwind.config.ts` is mostly inert under v4 but kept for content paths. |
| Auth         | **NextAuth v4** (`next-auth@4.24`)                | JWT session strategy, Credentials + optional Google providers. |
| ORM          | **Prisma 6.19** + `@auth/prisma-adapter`          | Postgres dialect. |
| Database     | **PostgreSQL** (Neon serverless, free tier)       | Connection via `DATABASE_URL`. |
| Validation   | **Zod 4**                                         | Schemas in `src/lib/validations.ts`, used on both client and server. |
| Icons        | **lucide-react**                                  | Only icon library allowed. |
| Utilities    | `clsx`, `bcryptjs`, `axios`                       | No other utility libs without explicit reason. |
| Linting      | **ESLint 9** flat config (`eslint.config.mjs`)    | Extends `eslint-config-next` core-web-vitals + typescript. |
| Deploy       | **Vercel**                                        | See deployment section. |

> **Hard rule:** No UI component libraries (no shadcn, MUI, Chakra, Radix, etc.). All UI is built from scratch with Tailwind.

---

## 3. Folder Structure

```
web-app/
├── prisma/
│   ├── schema.prisma            # Prisma data model: Role enum, User, Account, Session
│   └── promote.ts               # CLI script: npx tsx prisma/promote.ts <email> → SUPERADMIN
├── public/                      # Static assets (default Next.js SVGs for now)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                     # App Router root
│   │   ├── (auth)/              # Public auth route group (no session required)
│   │   │   ├── layout.tsx       # Pass-through layout (returns children)
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Server component, renders <AuthShell><LoginForm/></AuthShell>
│   │   │   └── signup/
│   │   │       └── page.tsx     # Server component, renders <AuthShell><SignupForm/></AuthShell>
│   │   ├── (protected)/         # Authenticated route group
│   │   │   ├── layout.tsx       # getServerAuthSession → redirect("/login") if no session; mounts TopNav + BottomNav
│   │   │   ├── admin/page.tsx   # Admin panel — requireRole("ADMIN"); renders UserManagement
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── api/
│   │   │   ├── admin/users/route.ts          # GET = list users, PATCH = change role (ADMIN+)
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth GET/POST handlers
│   │   │   └── user/route.ts                 # POST = signup (create user, default role=USER)
│   │   ├── layout.tsx           # Root layout: <html>/<body>, Inter font, <Providers>
│   │   ├── page.tsx             # "/" → redirect to /dashboard or /login based on session
│   │   ├── globals.css          # Tailwind v4 import + base/utilities (pb-safe, pt-safe)
│   │   └── favicon.ico
│   ├── components/
│   │   ├── admin/
│   │   │   └── UserManagement.tsx # "use client" — lists users, role stats, role change dropdowns
│   │   ├── auth/
│   │   │   ├── AuthShell.tsx    # Server component: split hero + form layout for /login + /signup
│   │   │   ├── LoginForm.tsx    # "use client" — credentials + optional Google sign-in
│   │   │   └── SignupForm.tsx   # "use client" — POST /api/user then signIn("credentials")
│   │   ├── ui/
│   │   │   ├── Button.tsx       # variants: primary | secondary | ghost | danger; sizes: sm | md | lg; loading + fullWidth
│   │   │   └── Input.tsx        # label + optional icon + error text
│   │   ├── BottomNav.tsx        # Mobile-only fixed bottom tab bar; shows Admin tab for ADMIN+
│   │   ├── TopNav.tsx           # Desktop-only top nav; shows Admin tab for ADMIN+
│   │   ├── LogoutButton.tsx     # "use client" — signOut({ callbackUrl: "/login" })
│   │   ├── Providers.tsx        # "use client" — wraps SessionProvider
│   │   └── RoleGate.tsx         # "use client" — conditional rendering by minimum role
│   ├── lib/
│   │   ├── auth.ts              # NextAuth options + getServerAuthSession() helper; pipes role through JWT→session
│   │   ├── db.ts                # Prisma singleton (avoids hot-reload connection leaks)
│   │   ├── roles.ts             # RBAC utilities: hasRole, isAbove, requireRole, checkRole, assignableRoles
│   │   └── validations.ts       # Zod schemas: roleSchema, signupSchema, loginSchema, updateRoleSchema
│   ├── types/
│   │   └── next-auth.d.ts       # Module augmentation: Session.user.{id, role}, JWT.{id, role}
│   └── middleware.ts            # Role-aware withAuth — ROUTE_ROLES map + matcher for all protected paths
├── .env                         # Local secrets (gitignored)
├── .env.example                 # Template (committed): DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
├── .gitignore
├── AGENTS.md                    # ⚠ Reminder: Next 16 has breaking changes — read node_modules/next/dist/docs/ first
├── CLAUDE.md                    # Just references AGENTS.md
├── README.md                    # Default create-next-app readme
├── overview.md                  # Phase-by-phase build plan (the original spec for the boilerplate)
├── eslint.config.mjs
├── next.config.ts               # images.remotePatterns for lh3.googleusercontent.com (Google avatars)
├── next-env.d.ts                # Auto-generated; gitignored
├── package.json
├── postcss.config.mjs           # Loads @tailwindcss/postcss
├── tailwind.config.ts           # content: ["./src/**/*.{ts,tsx}"]
└── tsconfig.json                # paths: { "@/*": ["./src/*"] }
```

### Route map

| URL                  | File                                          | Type          | Auth       |
| -------------------- | --------------------------------------------- | ------------- | ---------- |
| `/`                  | `src/app/page.tsx`                            | Server (RSC)  | Redirects based on session |
| `/login`             | `src/app/(auth)/login/page.tsx`               | Server + form | Public     |
| `/signup`            | `src/app/(auth)/signup/page.tsx`              | Server + form | Public     |
| `/dashboard`         | `src/app/(protected)/dashboard/page.tsx`      | Server (RSC)  | Required   |
| `/search`            | `src/app/(protected)/search/page.tsx`         | Server (RSC)  | Required   |
| `/notifications`     | `src/app/(protected)/notifications/page.tsx`  | Server (RSC)  | Required   |
| `/profile`           | `src/app/(protected)/profile/page.tsx`        | Server (RSC)  | Required   |
| `/admin`             | `src/app/(protected)/admin/page.tsx`          | Server (RSC)  | ADMIN+     |
| `/api/auth/*`        | `src/app/api/auth/[...nextauth]/route.ts`     | Route handler | NextAuth   |
| `POST /api/user`     | `src/app/api/user/route.ts`                   | Route handler | Public (signup) |
| `GET /api/admin/users`   | `src/app/api/admin/users/route.ts`        | Route handler | ADMIN+     |
| `PATCH /api/admin/users` | `src/app/api/admin/users/route.ts`        | Route handler | ADMIN+     |

---

## 4. Architecture & Data Flow

### 4.1 Rendering model

- **Server Components by default.** Pages and layouts are async server components; they call `getServerAuthSession()` directly (no client fetch for auth state).
- **`"use client"` is reserved for:** forms (`LoginForm`, `SignupForm`), navigation that uses `usePathname` (`BottomNav`, `TopNav`), `LogoutButton`, the `Providers` (SessionProvider) wrapper, and the `Button`/`Input` primitives (because they may attach event handlers).
- The root `<main>` no longer enforces a 430 px clamp (the original spec did) — the protected layout now uses `max-w-7xl` so desktop gets full width while mobile keeps its tab bar.

### 4.2 Auth flow

```
  ┌──────────────┐     ┌────────────────────┐     ┌────────────────────────┐
  │  /signup     │ ──► │ POST /api/user     │ ──► │ db.user.create(...)    │
  │ (SignupForm) │     │ (zod, bcrypt x12)  │     │  → { id, email }       │
  └──────────────┘     └────────────────────┘     └────────────────────────┘
          │
          ▼
  signIn("credentials", { email, password, redirect: false })
          │
          ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ NextAuth (authOptions in src/lib/auth.ts)                    │
  │  • CredentialsProvider.authorize: zod parse → bcrypt.compare │
  │  •   returns { id, name, email, image, role }                │
  │  • (optional) GoogleProvider                                 │
  │  • session.strategy = "jwt"                                  │
  │  • callbacks.jwt: token.id = user.id, token.role = user.role │
  │  • callbacks.session: session.user.{id,role} = token.{id,role}│
  │  • callbacks.redirect: clamps redirects to same origin       │
  │  • PrismaAdapter(db) backs Account/Session tables            │
  └──────────────────────────────────────────────────────────────┘
          │
          ▼
  Browser is given a NextAuth session cookie (JWT containing id + role).
          │
          ▼
  Subsequent requests:
   • src/middleware.ts (withAuth) gates all protected routes; checks ROUTE_ROLES map
     for role-restricted prefixes (e.g. /admin → ADMIN). Redirects to /dashboard?error=unauthorized.
   • Server components inside (protected)/layout.tsx call getServerAuthSession()
     and redirect("/login") if no session (defense in depth).
   • Role-gated pages additionally call requireRole("ADMIN") from src/lib/roles.ts.
```

### 4.3 API contract

All API routes return a consistent JSON shape:

- **Success:** `{ data: ..., message: "..." }`
- **Error:** `{ error: "...", code: "..." }`

`POST /api/user` example responses:

| Status | Body |
| ------ | ---- |
| 201    | `{ data: { id, email, role }, message: "Account created" }` |
| 400    | `{ error: "Invalid request body", code: "VALIDATION_ERROR" }` |
| 409    | `{ error: "Email already exists", code: "EMAIL_IN_USE" }` |
| 500    | `{ error: "Failed to create account", code: "INTERNAL_ERROR" }` |

`PATCH /api/admin/users` example responses:

| Status | Body |
| ------ | ---- |
| 200    | `{ data: { id, name, email, role }, message: "Role updated to ADMIN" }` |
| 400    | `{ error: "Cannot change your own role", code: "SELF_CHANGE" }` |
| 403    | `{ error: "Cannot modify a user at or above your authority level", code: "INSUFFICIENT_AUTHORITY" }` |
| 403    | `{ error: "Cannot assign a role at or above your own level", code: "ROLE_ESCALATION" }` |
| 404    | `{ error: "User not found", code: "NOT_FOUND" }` |

### 4.4 Data model (Prisma)

```prisma
enum Role {
  SUPERADMIN
  ADMIN
  USER
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?      // null when user signed up via OAuth only
  image         String?
  emailVerified DateTime?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

> Sessions use JWT strategy, so the `Session` table is not actively written to during normal use — it exists for the PrismaAdapter compatibility / OAuth account linking.

### 4.5 Type augmentation

`src/types/next-auth.d.ts` extends:

- `Session.user` to include `id: string` and `role: UserRole`.
- `User` to include optional `role: UserRole`.
- `JWT` to include optional `id` and `role`.

`UserRole` is `"SUPERADMIN" | "ADMIN" | "USER"`. All fields are populated by the `jwt`/`session` callbacks in `src/lib/auth.ts`. The JWT callback also handles `trigger === "update"` so role changes can propagate via `session.update()`.

---

## 5. Design System

### 5.1 Layout primitives

- **Mobile breakpoint:** designed for ~390 px first; everything fits inside the device viewport.
- **Desktop breakpoint:** `lg:` (≥ 1024 px) — content widens, top nav appears, bottom nav hides.
- Auth pages (`AuthShell`) become a **two-column hero + form** layout on `lg`.
- Protected pages get `px-4 pt-6 lg:px-8 lg:pt-10` and use 2-col grids on mobile, 4-col on `lg`.
- Safe-area utilities in `globals.css`:
  - `.pb-safe` → `padding-bottom: max(0.5rem, env(safe-area-inset-bottom))`
  - `.pt-safe` → `padding-top: max(0rem, env(safe-area-inset-top))`

### 5.2 Color & tone

- Primary brand color: **violet-600** (`#7c3aed`-ish).
- Neutrals: `gray-50` page background, `white` surfaces, `gray-100` placeholders, `gray-700` body text.
- Danger: `red-500/600`. Errors text: `red-500`.
- Profile card uses a **violet-600 → fuchsia-500** gradient.

### 5.3 Components

| Component      | Path                                       | Notes |
| -------------- | ------------------------------------------ | ----- |
| `Button`       | `src/components/ui/Button.tsx`             | `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `loading`, `fullWidth`. Active scale-95, ring focus styles. |
| `Input`        | `src/components/ui/Input.tsx`              | Label above, optional left icon, inline error below. Auto-derives `id` from `name`/`label` if not provided. |
| `BottomNav`    | `src/components/BottomNav.tsx`             | Fixed bottom tab bar, `lg:hidden`. Tabs: Home, Search, Alerts, Profile + Admin (ADMIN+ only). Uses `useSession`. |
| `TopNav`       | `src/components/TopNav.tsx`                | Desktop top nav, `hidden lg:block`. Same destinations + Admin tab (ADMIN+ only). Uses `useSession`. |
| `LogoutButton` | `src/components/LogoutButton.tsx`          | Danger button calling `signOut({ callbackUrl: "/login" })`. |
| `AuthShell`    | `src/components/auth/AuthShell.tsx`        | Shared layout for /login + /signup with hero copy + form card. |
| `LoginForm`    | `src/components/auth/LoginForm.tsx`        | Credentials sign-in; optional Google button rendered only on desktop **and** only when `googleEnabled`. |
| `SignupForm`   | `src/components/auth/SignupForm.tsx`       | Creates user via `/api/user`, then immediately `signIn("credentials")`. |
| `Providers`    | `src/components/Providers.tsx`             | `SessionProvider` with `refetchOnWindowFocus={false}`. |
| `RoleGate`     | `src/components/RoleGate.tsx`              | Client-side role gate. Renders children only when `useSession().user.role` meets `minimumRole`. Optional `fallback`. |
| `UserManagement` | `src/components/admin/UserManagement.tsx` | Client component for admin panel. Role stats cards, user list with role change dropdowns, hierarchy-aware controls. |

---

## 6. Conventions & Rules

These are **non-negotiable** unless explicitly agreed otherwise. They come from `overview.md`/`AGENTS.md`:

1. **Never modify files from a previous phase unless explicitly asked.** Add new code on top.
2. Server components by default; `"use client"` only when needed (event handlers, hooks, browser APIs).
3. **Forms validate with Zod on both client and server.** Re-use schemas from `src/lib/validations.ts`.
4. **Prisma client is a singleton** (`src/lib/db.ts`) — never `new PrismaClient()` elsewhere.
5. **Every protected route checks the session server-side** in addition to the middleware.
6. Secrets only via `process.env.*` — never hardcoded. New env vars must be added to `.env.example`.
7. API routes return the consistent `{ data, message }` / `{ error, code }` shape.
8. **Mobile first.** Design every component for ~390 px first, then scale up with `sm:` / `lg:` modifiers.
9. **Tailwind class strings must be statically analyzable** — no dynamic concatenation Tailwind can't see at build time.
10. No `any` in TypeScript. Use proper types or `unknown`.
11. Keep files under ~150 lines where practical.
12. Prefer `async/await` over `.then()` chains.
13. **No new dependencies** without a clear reason and approval. The locked stack is in §2.
14. **No UI libraries.** Build from Tailwind primitives.

### About Next.js 16

`AGENTS.md` warns: this is **not** the Next.js you may know from training data. Before writing anything that uses framework APIs (route handlers, `headers`, `cookies`, `params`/`searchParams`, image, font, middleware, etc.) consult `node_modules/next/dist/docs/` for the version actually installed.

A concrete example already in the codebase: in `src/app/(auth)/login/page.tsx`, `searchParams` is **awaited** because in this version it is a `Promise`:

```ts
type LoginPageProps = {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
};
const params = (await searchParams) ?? {};
```

---

## 7. Environment & Secrets

`.env` keys (template lives in `.env.example`):

| Var                    | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `DATABASE_URL`         | Postgres connection string (Neon).                     |
| `NEXTAUTH_SECRET`      | Required by NextAuth to sign JWTs/cookies.             |
| `NEXTAUTH_URL`         | Canonical app URL (e.g. `http://localhost:3000` or the Vercel URL). |
| `GOOGLE_CLIENT_ID`     | Optional. If set with the secret, Google sign-in lights up. |
| `GOOGLE_CLIENT_SECRET` | Optional. Pair with `GOOGLE_CLIENT_ID`.                |

Google OAuth toggle is computed at module load in `src/lib/auth.ts` as `isGoogleAuthEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)` and is passed into `LoginForm` so the UI button only shows when it actually works.

`.gitignore` excludes `.env`, `.env.local`, `.env*.local` — only `.env.example` is committed.

---

## 8. Scripts & Local Dev

From `package.json`:

| Script          | Command         | Notes                                     |
| --------------- | --------------- | ----------------------------------------- |
| `npm run dev`   | `next dev`      | Starts the dev server on `:3000`.         |
| `npm run build` | `next build`    | Production build.                         |
| `npm run start` | `next start`    | Run the prod build.                       |
| `npm run lint`  | `eslint`        | Uses `eslint.config.mjs` (flat config).   |

Common Prisma commands (not in `package.json` yet — run with `npx`):

| Command                  | When                                        |
| ------------------------ | ------------------------------------------- |
| `npx prisma generate`    | After editing `schema.prisma`.              |
| `npx prisma db push`     | Push the schema to Neon (dev / hackathon).  |
| `npx prisma studio`      | Inspect/edit data in a local UI.            |

| `npx tsx prisma/promote.ts <email>` | Promote a user to SUPERADMIN (bootstrap). |

### First-time setup

1. `npm install`
2. Copy `.env.example` → `.env` and fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (and Google vars if used).
3. `npx prisma db push` to materialize tables in Neon.
4. `npm run dev`.
5. Sign up via `/signup`, then `npx tsx prisma/promote.ts <your-email>` to become SUPERADMIN.
6. Sign out and back in so the JWT picks up the new role.

---

## 9. Deployment (Vercel)

1. Push to GitHub.
2. Connect the repo to Vercel; set the project root to `web-app/`.
3. Add the env vars from §7 in the Vercel dashboard. `NEXTAUTH_URL` must match the deployed domain.
4. If using Google: add `https://<your-app>.vercel.app/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console.
5. Vercel runs `next build`; Prisma client generates as part of install. Run `npx prisma db push` once against the production `DATABASE_URL` to sync the schema.

---

## 10. Adding Features (Hackathon Playbook)

When the hackathon problem is revealed, **do not refactor the boilerplate**. Build on top:

1. **Model** → add a new `model` block to `prisma/schema.prisma`, then `npx prisma db push`.
2. **Validation** → add zod schemas to `src/lib/validations.ts`.
3. **API** → create `src/app/api/<feature>/route.ts`, returning the standard `{ data, message }` / `{ error, code }` shape. Re-use `db` from `@/lib/db` and validate input with the new zod schema.
4. **UI**
   - Protected page: `src/app/(protected)/<feature>/page.tsx` (server component).
   - Client interactions: extract into `src/components/<feature>/...` with `"use client"`.
   - New tab? Add it to **both** `BottomNav.tsx` (mobile) and `TopNav.tsx` (desktop) and to `src/middleware.ts` `matcher`.
5. **Auth** → if the route is private, it goes inside `(protected)/` (server-side check) and is added to the middleware matcher (cookie/redirect fast path).
6. **Role-gating** → if the route requires a specific role:
   - Add `"/your-prefix": "REQUIRED_ROLE"` to `ROUTE_ROLES` in `src/middleware.ts` and add to `matcher`.
   - Call `requireRole("REQUIRED_ROLE")` in the page’s server component.
   - For API routes, use `checkRole("REQUIRED_ROLE")` and return 403 if unauthorized.
   - For client-side UI, wrap with `<RoleGate minimumRole="REQUIRED_ROLE">`.
7. **Deploy** → push to GitHub; Vercel auto-builds.

---

## 11. Known Gaps / Follow-ups

These are intentional simplifications worth tracking:

- `README.md` is still the default Next.js boilerplate copy.
- `next-dev.log` and `next-dev.err.log` are committed-as-modified artifacts of the local dev server; consider gitignoring them.
- `(auth)/layout.tsx` is currently a pass-through (`return children`). Kept so the route group exists and so styling/layout can be customized later without touching pages.
- Some images-related dependencies are scoped to a single Google avatar host (`lh3.googleusercontent.com`); add more `remotePatterns` in `next.config.ts` as needed.
- `tailwind.config.ts` is largely vestigial under Tailwind v4 — theming lives in `globals.css` via `@theme inline`.
- No tests yet. If/when added, prefer Vitest + React Testing Library for components and lightweight route handler tests.
- Logout currently calls `signOut` from `LogoutButton`; profile page shows static settings rows (Account, Notifications, Privacy, Help) with no destinations wired yet.

---

## 12. Reference Index (Quick Links)

- Spec / phase plan: `web-app/overview.md`
- Agent rules: `web-app/AGENTS.md`
- Auth config: `src/lib/auth.ts`
- DB singleton: `src/lib/db.ts`
- **RBAC utilities: `src/lib/roles.ts`**
- Zod schemas: `src/lib/validations.ts`
- Middleware (role-aware): `src/middleware.ts`
- Root layout: `src/app/layout.tsx`
- Root redirect: `src/app/page.tsx`
- Protected shell: `src/app/(protected)/layout.tsx`
- **Admin panel: `src/app/(protected)/admin/page.tsx`**
- **Admin API: `src/app/api/admin/users/route.ts`**
- Auth shell: `src/components/auth/AuthShell.tsx`
- Login form: `src/components/auth/LoginForm.tsx`
- Signup form: `src/components/auth/SignupForm.tsx`
- Bottom tabs (mobile): `src/components/BottomNav.tsx`
- Top tabs (desktop): `src/components/TopNav.tsx`
- **Role gate (client): `src/components/RoleGate.tsx`**
- **User management: `src/components/admin/UserManagement.tsx`**
- Buttons: `src/components/ui/Button.tsx`
- Inputs: `src/components/ui/Input.tsx`
- Prisma schema: `prisma/schema.prisma`
- **Promote script: `prisma/promote.ts`**
- Type augmentation: `src/types/next-auth.d.ts`
