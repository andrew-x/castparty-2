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
│   ├── globals.scss     # Tailwind import + theme tokens (CSS custom properties)
│   ├── layout.tsx       # Root layout — fonts, <html>/<body> wrapper
│   └── page.tsx         # Landing page (/)
├── components/
│   ├── app/             # App shell components — sidebar, header, layout-level UI
│   ├── auth/            # Auth-specific form components
│   └── common/          # Generic shadcn/ui primitives — no feature logic
├── hooks/               # Shared custom React hooks
├── lib/                 # Server-side utilities (auth, db, etc.)
└── styles/              # Global stylesheets (imported by app/layout.tsx)
```

**Component directory conventions:**

| Directory | Contents | Rule |
|-----------|----------|------|
| `src/components/common/` | shadcn/ui primitives | No feature logic; styling, variants, and accessibility only |
| `src/components/app/` | Authenticated app shell components (sidebar, header) | Shared across all `(app)/` routes; may accept user/session data as props |
| `src/components/auth/` | Auth form components | Auth-specific; client components that call Better Auth SDK |
| Feature directories (future) | e.g., `src/components/productions/` | Scoped to a single feature area |

## Key Patterns

- **Server components by default** — only add `"use client"` when you need browser APIs or state.
- **React Compiler** — no manual `useMemo`, `useCallback`, or `React.memo`. The compiler handles it.
- **Path alias** — `@/*` maps to `./src/*` (configured in `tsconfig.json`).
- **Fonts** — DM Sans (body/UI) + DM Serif Display (headings/display) + DM Mono loaded via `next/font/google` in root layout. Exposed as CSS variables `--font-dm-sans`, `--font-dm-serif-display`, and `--font-dm-mono`. Use Tailwind's `font-serif` class for heading/display text.
- **Theme tokens** — CSS custom properties in `globals.scss` with `@theme inline` block for Tailwind integration. Dark mode via `prefers-color-scheme`.

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

*Updated: 2026-02-28 — Replaced stale placeholders with actual data flow and external services*
