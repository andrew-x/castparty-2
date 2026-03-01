# Architecture

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | RSC-first, file-based routing, built-in optimizations |
| UI | React 19 | Latest concurrent features, RSC support |
| Language | TypeScript 5 | Type safety, IDE tooling, catch errors at compile time |
| Styling | Tailwind CSS v4 (PostCSS) | Utility-first, no runtime cost, v4 CSS-native config |
| Linting/Formatting | Biome 2 | Single tool replaces ESLint + Prettier, faster |
| Package Manager | Bun | Faster installs and scripts than npm/yarn/pnpm |
| Compiler | React Compiler (experimental) | Auto-memoization — skip manual useMemo/useCallback |

## Directory Layout

```
src/
├── actions/             # Backend business logic, organized by feature area
│   └── [feature]/       # e.g., productions/, auditions/, casting/
├── app/
│   ├── (app)/           # Authenticated route group — guarded by (app)/layout.tsx
│   │   ├── layout.tsx   # Auth guard + SidebarProvider shell
│   │   └── home/        # Post-login landing
│   ├── api/             # API route handlers
│   ├── auth/            # Login / signup / forgot-password pages
│   ├── submit/          # Public submission flow (unauthenticated)
│   ├── layout.tsx       # Root layout — fonts, <html>/<body> wrapper
│   └── page.tsx         # Landing page (/)
├── components/
│   ├── app/             # App shell components — sidebar, header, layout-level UI
│   ├── auth/            # Auth-specific form components
│   ├── common/          # Generic shadcn/ui primitives — no feature logic
│   ├── productions/     # Production-scoped components
│   ├── organizations/   # Org-scoped components (settings, invite, switcher)
│   ├── candidates/      # Candidate-scoped components
│   ├── submissions/     # Submission form (public flow)
│   ├── admin/           # Admin panel components
│   └── onboarding/      # Onboarding flow components
├── hooks/               # Shared custom React hooks
├── lib/                 # Server-side utilities (auth, db, slug, pipeline, etc.)
└── styles/
    └── globals.scss     # Tailwind import + theme tokens (CSS custom properties)
```

**Component directory conventions:**

| Directory | Contents |
|-----------|----------|
| `src/components/common/` | shadcn/ui primitives — no feature logic; styling, variants, and accessibility only |
| `src/components/app/` | Authenticated app shell components (sidebar, header) — shared across all `(app)/` routes |
| `src/components/auth/` | Auth form components — client components that call the Better Auth SDK |
| `src/components/productions/` | Production-scoped components (cards, forms, roles accordion, settings) |
| `src/components/organizations/` | Org-scoped components (settings form, invite dialog, member management, org switcher) |
| `src/components/candidates/` | Candidate-scoped components (candidates table) |
| `src/components/submissions/` | Submission-scoped components (submission form for public flow) |
| `src/components/admin/` | Admin panel components (add/delete user, change password dialogs) |
| `src/components/onboarding/` | Onboarding flow (create organization form) |

## Key Patterns

- **Server components by default** — only add `"use client"` when you need browser APIs or state.
- **React Compiler** — no manual `useMemo`, `useCallback`, or `React.memo`. The compiler handles it.
- **Path alias** — `@/*` maps to `./src/*` (configured in `tsconfig.json`).
- **Fonts** — DM Sans (body/UI) + DM Serif Display (headings/display) + DM Mono loaded via `next/font/google` in root layout. Exposed as CSS variables `--font-dm-sans`, `--font-dm-serif-display`, and `--font-dm-mono`. Use Tailwind's `font-serif` class for heading/display text.
- **Theme tokens** — CSS custom properties in `src/styles/globals.scss` with `@theme inline` block for Tailwind integration. No dark mode support — the `.dark` class in `globals.scss` contains only sidebar variables inherited from shadcn defaults.

## Data Flow

```
Browser
  └── Next.js App Router (RSC)
        ├── Server components → plain async functions in src/actions/
        │     └── checkAuth() + Drizzle queries → Neon (PostgreSQL)
        ├── Client components → next-safe-action actions in src/actions/
        │     └── secureActionClient (auth + validation + logging) → Neon
        └── Client components → authClient.* (Better Auth browser SDK)
              └── → /api/auth/[...all] route handler
```

- `src/actions/` — Backend business logic organized by feature area; the boundary between UI and data
- `src/lib/action.ts` — next-safe-action client setup (`publicActionClient`, `secureActionClient`)
- `src/lib/auth.ts` — Better Auth server instance; `getCurrentUser()` reads the session from request headers
- `src/lib/auth/auth-client.ts` — Better Auth browser client; used in form components
- `src/lib/db/db.ts` — Drizzle ORM instance; Neon serverless HTTP driver; `snake_case` column casing
- `src/lib/db/schema.ts` — Drizzle schema (source of truth for DB shape)
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all API handler

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Neon (PostgreSQL) | Primary database | `DATABASE_URL` env var |
| Better Auth | Authentication (sessions, orgs) | Configured in `src/lib/auth.ts` |

**Better Auth plugins** (configured in `src/lib/auth.ts`):

| Plugin | Purpose |
|--------|---------|
| `adminPlugin()` | Admin user management (list, ban, change password, delete users) |
| `organizationPlugin({ creatorRole: "owner" })` | Multi-org support with owner/admin/member roles; creator becomes owner |
| `nextCookies()` | Session persistence via cookies for Next.js server components |

A `databaseHooks.session.create.before` hook auto-sets `activeOrganizationId` on new sessions so users land in the correct org context without an extra redirect.

---

## Data Model

Schema lives in `src/lib/db/schema.ts`. Drizzle relational API (`db.query`) is the default for reads.

**Better Auth tables** (managed by Better Auth; use PascalCase aliases in Drizzle code):

| Table | Alias | Key columns |
|-------|-------|-------------|
| `user` | `User` | `id`, `email`, `role`, `banned` |
| `session` | `Session` | `userId`, `activeOrganizationId` |
| `account` | `Account` | `userId`, `providerId`, `password` |
| `organization` | `Organization` | `id`, `name`, `slug` (globally unique) |
| `member` | `Member` | `organizationId`, `userId`, `role` |
| `invitation` | `Invitation` | `organizationId`, `email`, `status` |

**Application tables:**

| Table | Scoped to | Key columns / constraints |
|-------|-----------|--------------------------|
| `Production` | Organization | `organizationId`, `name`, `slug` (unique per org) |
| `Role` | Production | `productionId`, `name`, `slug` (unique per production) |
| `PipelineStage` | Role | `roleId`, `name`, `slug`, `position`, `isSystem`, `isTerminal` |
| `Candidate` | Organization | `organizationId`, `firstName`, `lastName`, `email` (unique per org) |
| `Submission` | Role + Candidate | `roleId`, `candidateId`, `stageId` — links a candidate to a role at a pipeline stage |
| `StatusChange` | Submission | `submissionId`, `fromStageId`, `toStageId`, `changedById` — full audit trail |

Candidate records are deduplicated by `(organizationId, email)` — the same person applying to multiple roles in the same org shares one Candidate row.

*Updated: 2026-02-28 — Replaced stale placeholders with actual data flow and external services*
*Updated: 2026-03-01 — Added Better Auth plugins, expanded directory layout, fixed component directories, added Data Model section*
