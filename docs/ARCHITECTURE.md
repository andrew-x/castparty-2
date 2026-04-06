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
│   └── [feature]/       # productions/, submissions/, organizations/, candidates/, admin/, feedback/, comments/
├── app/
│   ├── (app)/           # Authenticated route group — guarded by (app)/layout.tsx
│   │   ├── layout.tsx   # Auth guard + TopNav shell
│   │   ├── home/        # Post-login landing
│   │   ├── candidates/  # Candidates grid + candidate detail page
│   │   ├── settings/    # Org settings (admin/owner only)
│   │   └── productions/
│   │       └── [id]/
│   │           └── (production)/  # Route group: shared production layout + sub-nav
│   │               ├── page.tsx   # Production detail (Kanban board — all roles)
│   │               ├── roles/page.tsx             # Role list + inline role settings (name, description, slug, status)
│   │               └── settings/
│   │                   ├── page.tsx               # General settings (name, slug, location, status)
│   │                   ├── pipeline/page.tsx       # Pipeline editor (all roles in production)
│   │                   ├── submission-form/        # Submission form builder
│   │                   ├── feedback-form/          # Feedback form builder
│   │                   ├── reject-reasons/         # Reject reasons editor
│   │                   └── emails/                 # Email template editor
│   ├── accept-invitation/[id]/  # Accept org invitation by link (unauthenticated-ok)
│   ├── api/             # API route handlers
│   ├── auth/            # Login / signup / forgot-password / verify-email / reset-password pages
│   ├── onboarding/      # First-time setup (check pending invites → create org → invite team)
│   ├── admin/           # Internal user/org management (dev-only)
│   ├── s/               # Public submission flow (unauthenticated)
│   │   ├── [orgSlug]/   # Org public page (open productions list)
│   │   └── [orgSlug]/[productionSlug]/[roleSlug]/  # Submission form
│   ├── layout.tsx       # Root layout — fonts, <html>/<body> wrapper
│   └── page.tsx         # Landing page (/)
├── components/
│   ├── app/             # App shell — TopNav (sticky top nav with org switcher + mobile drawer)
│   ├── auth/            # Auth-specific form components
│   ├── common/          # Generic shadcn/ui primitives — no feature logic
│   ├── productions/     # Production-scoped components (kanban, settings, form builders, etc.)
│   ├── organizations/   # Org-scoped components (settings, invite, switcher, accept invitation)
│   ├── candidates/      # Candidate-scoped components
│   ├── submissions/     # Submission form (public flow) + file uploaders
│   ├── admin/           # Admin panel components
│   └── onboarding/      # Onboarding flow components
├── hooks/               # Shared custom React hooks
├── lib/
│   ├── schemas/         # Centralized Zod schemas — form schemas + action schemas per feature
│   └── ...              # Other server-side utilities (auth, db, slug, pipeline, etc.)
└── styles/
    └── globals.scss     # Tailwind import + theme tokens (CSS custom properties)
```

**Component directory conventions:**

| Directory | Contents |
|-----------|----------|
| `src/components/common/` | shadcn/ui primitives — no feature logic; styling, variants, and accessibility only |
| `src/components/app/` | Authenticated app shell — `TopNav` (sticky top nav, org switcher, pending-invite badge, mobile drawer) |
| `src/components/auth/` | Auth form components — client components that call the Better Auth SDK |
| `src/components/productions/` | Production-scoped components (kanban board, submission detail sheet, feedback panel, form builders, pipeline editors, comparison view, lightbox) |
| `src/components/organizations/` | Org-scoped components (settings form, invite dialog, member management, org switcher, accept invitation) |
| `src/components/candidates/` | Candidate-scoped components (candidates grid, candidate card, candidate detail) |
| `src/components/submissions/` | Submission-scoped components (public submission form, headshot uploader, resume uploader, links editor) |
| `src/components/admin/` | Admin panel components (user CRUD dialogs, org management, dev-only email emulator list and detail views) |
| `src/components/onboarding/` | Onboarding flow (create org form, invite team form, pending invitations list) |

## Key Patterns

- **Server components by default** — only add `"use client"` when you need browser APIs or state.
- **React Compiler** — no manual `useMemo`, `useCallback`, or `React.memo`. The compiler handles it.
- **Path alias** — `@/*` maps to `./src/*` (configured in `tsconfig.json`).
- **Fonts** — DM Sans (body/UI) + DM Serif Display (headings/display) + DM Mono loaded via `next/font/google` in root layout. Exposed as CSS variables `--font-dm-sans`, `--font-dm-serif-display`, and `--font-dm-mono`. Use Tailwind's `font-serif` class for heading/display text.
- **Theme tokens** — CSS custom properties in `src/styles/globals.scss` with `@theme inline` block for Tailwind integration. No dark mode support.
- **App shell** — The authenticated shell uses a sticky top nav (`src/components/app/top-nav.tsx`) instead of a sidebar. The nav includes org switcher, pending-invite badge, and a hamburger menu for mobile. Auth is enforced in `(app)/layout.tsx` via `getCurrentUser()` redirect.

## Data Flow

```
Browser
  └── Next.js App Router (RSC)
        ├── Server components → plain async functions in src/actions/
        │     └── checkAuth() + Drizzle queries → Neon (PostgreSQL)
        ├── Client form components
        │     └── useHookFormAction (adapter layer)
        │           ├── react-hook-form (local form state, validation via zodResolver)
        │           └── next-safe-action actions in src/actions/
        │                 └── secureActionClient (auth + validation + logging) → Neon
        └── Client components → authClient.* (Better Auth browser SDK)
              └── → /api/auth/[...all] route handler
```

**Form / action schema split:** Every feature in `src/lib/schemas/` exports two Zod schemas — a form schema (user-input fields only, used by `zodResolver`) and an action schema (extends with IDs and server refinements, used by `next-safe-action`). The adapter hook `useHookFormAction` bridges the two without manual wiring. See `docs/CONVENTIONS.md#form-patterns` for the full pattern.

- `src/actions/` — Backend business logic organized by feature area; the boundary between UI and data. Directories: `productions/`, `submissions/`, `organizations/`, `candidates/`, `admin/`, `feedback/`, `comments/`
- `src/lib/schemas/` — Centralized Zod schemas: `slug.ts`, `organization.ts`, `production.ts`, `role.ts`, `submission.ts`, `candidate.ts`, `form-fields.ts`, `feedback.ts`, `comment.ts`, `auth.ts`; barrel at `index.ts` re-exports all except `auth.ts` (see Conventions for why)
- `src/lib/constants/reserved-slugs.ts` — `RESERVED_SLUGS` set shared by `src/lib/slug.ts` and `src/lib/schemas/slug.ts`; single source of truth for slugs blocked from org/production/role use
- `src/lib/action.ts` — next-safe-action client setup (`publicActionClient`, `secureActionClient`)
- `src/lib/auth.ts` — Better Auth server instance; `getCurrentUser()` reads the session from request headers
- `src/lib/types.ts` — Shared domain types: `CustomForm`, `CustomFormFieldType` (TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE), `CustomFormResponse`, `SystemFieldConfig`, `SystemFieldVisibility`, `DEFAULT_SYSTEM_FIELD_CONFIG`, `SYSTEM_FIELD_LABELS`
- `src/lib/constants.ts` — `DEFAULT_PIPELINE_STAGES`, `MAX_PIPELINE_STAGES`
- `src/lib/r2.ts` — Cloudflare R2 file storage: `uploadFile`, `deleteFile`, `moveFile`, `getKeyFromUrl`; uses AWS SDK S3-compatible API
- `src/lib/auth/auth-util.ts` — Auth utility: `checkAuth()` reads the session and throws if unauthenticated; used by all server-side read functions
- `src/lib/auth/auth-client.ts` — Better Auth browser client; used in form components
- `src/lib/email.ts` — `sendEmail()` async entry point; dev branch stores emails via `email-dev-store.ts`, production branch calls Resend; errors are logged and re-thrown so failures propagate to callers (all call sites in `src/lib/auth.ts` `await` it)
- `src/lib/email-dev-store.ts` — Dev-only in-memory email store (`globalThis.__devEmails`, HMR-safe, capped at 200); all functions guard on `IS_DEV`
- `src/lib/db/db.ts` — Drizzle ORM instance; Neon `neon-serverless` driver with `Pool` (enables transactions); `snake_case` column casing
- `src/lib/db/schema.ts` — Drizzle schema (source of truth for DB shape)
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all API handler

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Neon (PostgreSQL) | Primary database | `DATABASE_URL` env var |
| Better Auth | Authentication (sessions, orgs) | Configured in `src/lib/auth.ts` |
| Cloudflare R2 | File storage (headshots, résumés, etc.) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` env vars; utility in `src/lib/r2.ts` |

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
| `UserProfile` | User | `id` (FK → user, PK) — extended user metadata; currently empty (reserved for future fields) |
| `OrganizationProfile` | Organization | `id` (FK → organization, PK), `websiteUrl`, `description`, `isOrganizationProfileOpen` — public-facing org info |
| `Production` | Organization | `organizationId`, `name`, `slug` (unique per org), `status` enum (`"open"/"closed"/"archive"`), `location`, `submissionFormFields` (JSONB), `feedbackFormFields` (JSONB), `systemFieldConfig` (JSONB — visibility of system fields: phone, location, headshots, resume, links), `rejectReasons` (JSONB string[]), `emailTemplates` (JSONB or null) |
| `Role` | Production | `productionId`, `name`, `slug` (unique per production), `status` enum (`"open"/"closed"/"archive"`), `description` — no form fields, system field config, or reject reasons; all config lives on the parent `Production` |
| `PipelineStage` | Production | `organizationId`, `productionId`, `name`, `order`, `type` enum (`APPLIED`/`SELECTED`/`REJECTED`/`CUSTOM`) — all stages are production-scoped; no `roleId` column |
| `Candidate` | Organization | `organizationId`, `firstName`, `lastName`, `email` (unique per org), `phone`, `location` |
| `Submission` | Role + Candidate | `productionId`, `roleId`, `candidateId`, `stageId` (FK → PipelineStage, `onDelete: "restrict"`), `rejectionReason` (nullable), `firstName`, `lastName`, `email`, `phone`, `location` (denormalized snapshot), `answers` (JSONB), `links` (text[]), `resumeText` (nullable) |
| `PipelineUpdate` | Submission | `submissionId`, `fromStage`, `toStage`, `changeByUserId` — full audit trail of stage transitions |
| `File` | Submission or Candidate | `submissionId` (nullable), `candidateId` (nullable), `type` enum (`HEADSHOT`/`RESUME`/`VIDEO`), `url`, `key`, `path`, `filename`, `contentType`, `size`, `order` |
| `Feedback` | Submission + Stage | `submissionId`, `submittedByUserId`, `stageId` (FK → PipelineStage, `onDelete: "restrict"`), `rating` enum (`STRONG_NO`/`NO`/`YES`/`STRONG_YES`), `notes`, `formFields` (JSONB snapshot), `answers` (JSONB) |
| `Comment` | Submission | `submissionId`, `submittedByUserId`, `content` (text, max 5000 chars) — freetext notes on a submission, not tied to a pipeline stage |

Candidate records are deduplicated by `(organizationId, email)` — the same person applying to multiple roles in the same org shares one Candidate row.

`PipelineStage` rows are production-scoped only — all roles in a production share the same pipeline stages. There is no per-role pipeline.

`SystemFieldConfig` controls whether each system submission field (phone, location, headshots, resume, links) is `"hidden"`, `"optional"`, or `"required"`. Stored as JSONB on `Production`; defaults to all `"optional"`. All roles in a production use the same config.

**Submission denormalization:** `Submission` stores `firstName`, `lastName`, `email`, `phone`, `location` as a snapshot at submission time — independent of the linked `Candidate` row. This means the submission record reflects what the candidate entered on that specific form, even if their Candidate profile is later updated.

**Stage deletion constraint:** Both `Submission.stageId` and `Feedback.stageId` use `onDelete: "restrict"`. The `removePipelineStage` action blocks deletion if submissions exist on the stage. If feedback rows exist but no submissions, it returns `{ confirmRequired: true, feedbackCount }` — the UI shows a confirmation dialog and re-calls with `force: true`, which cascade-deletes the feedback rows before removing the stage.

---

## Known Issues

These were identified in a codebase audit (2026-03-18). They are documented here so future developers understand the limitations and don't build on top of broken assumptions.

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 1 | `src/actions/candidates/get-candidate.ts` | `getCandidate` fetches the candidate row before checking `candidate.organizationId !== orgId` — so data is loaded then discarded if the check fails. No security bug (returns null), but wasteful. | Performance |
| 2 | ~~`src/actions/productions/get-role-stages-with-counts.ts`~~ | ~~The `submissionCountSq` subquery aggregates submissions across **all** roles (no `WHERE roleId = ?`)~~ **Fixed (2026-03-22):** The subquery now filters by `roleId` (`.where(eq(Submission.roleId, roleId))`). Additionally, `PipelineStage` no longer has a `roleId` column — all stages are production-scoped. | ~~Performance~~ |
| 3 | `src/actions/submissions/create-submission.ts` | Required-field validation for `TOGGLE` and `CHECKBOX_GROUP` custom fields uses `!value || !value.trim()`. For `TOGGLE`, the value is `"true"` or `"false"` (always truthy); for `CHECKBOX_GROUP`, an empty selection is `""` (falsy) but multi-select sends a comma-joined string. The `TOGGLE` case means a required toggle cannot be enforced. | Bug |
| 4 | ~~`src/lib/email.ts`~~ | ~~`sendEmail` is fire-and-forget~~ **Fixed (2026-03-22):** `sendEmail` is now `async`; errors are logged and re-thrown, propagating to all callers. | ~~Reliability~~ |
| 5 | ~~`src/actions/productions/remove-pipeline-stage.ts`~~ | ~~Blocks deletion if Submission count > 0, but does not check for Feedback rows~~ **Fixed (2026-03-22):** `removePipelineStage` now checks `Feedback` count. When `feedbackCount > 0` and `force` is not set it returns `{ confirmRequired: true, feedbackCount }`. The UI shows an `AlertDialog`; re-calling with `force: true` cascade-deletes the feedback rows before removing the stage. | ~~Bug~~ |
| 6 | ~~`src/actions/submissions/create-submission.ts`~~ | ~~`createSubmission` is not wrapped in a transaction. The `Candidate` upsert, `Submission` insert, `File` inserts, and resume-text update are separate statements. A crash mid-way leaves partial state.~~ **Fixed (2026-03-22):** Switched from `neon-http` to `neon-serverless` driver with `Pool`. All 9 multi-mutation actions now use `db.transaction()`. | ~~Data integrity~~ |
| 7 | ~~`src/actions/productions/reorder-role-stages.ts`~~ | ~~Stage reorder uses `Promise.all` with individual `UPDATE` statements — non-atomic. A partial failure leaves stages in an inconsistent order. Same pattern in `reorder-production-stages.ts`.~~ **Fixed (2026-03-22):** Switched from `neon-http` to `neon-serverless` driver with `Pool`. All 9 multi-mutation actions now use `db.transaction()`. | ~~Data integrity~~ |
| 8 | ~~`src/actions/submissions/get-public-production.ts`~~ | ~~`getPublicProduction` does not filter by `production.isOpen`.~~ **Fixed (2026-03-29):** `getPublicProduction` now checks `production.status !== "open"` and returns `null` for closed productions. | ~~UX inconsistency~~ |
| 9 | ~~`src/lib/slug.ts`~~ | ~~`RESERVED_SLUGS` does not include `"s"`, `"onboarding"`, etc.~~ **Fixed (2026-03-22):** `RESERVED_SLUGS` moved to `src/lib/constants/reserved-slugs.ts` and now includes `"settings"`, `"admin"`, `"api"`, `"auth"`, `"home"`, `"new"`, `"create"`, `"edit"`, `"delete"`, `"submit"`. Both `src/lib/slug.ts` and `src/lib/schemas/slug.ts` import from the shared constant. | ~~Data integrity~~ |
| 10 | ~~Various~~ | ~~`zod` and `zod/v4` were both imported across the codebase.~~ **Fixed (2026-04-05):** All schemas now use `"zod/v4"`. Form resolver switched from `zodResolver` to `standardSchemaResolver` which works natively with Zod v4's Standard Schema V1 implementation. | ~~Code quality~~ |
| 11 | ~~`src/lib/db/schema.ts`~~ | ~~`Production.updatedAt` and others do not use `.$onUpdate()`~~ **Fixed (2026-03-22):** All 8 application data tables (`UserProfile`, `OrganizationProfile`, `Production`, `Role`, `PipelineStage`, `Candidate`, `Submission`, `Feedback`) now have `.$onUpdate(() => new Date())` on their `updatedAt` column. | ~~Data quality~~ |

*Updated: 2026-02-28 — Replaced stale placeholders with actual data flow and external services*
*Updated: 2026-03-01 — Added Better Auth plugins, expanded directory layout, fixed component directories, added Data Model section*
*Updated: 2026-03-04 — Added useHookFormAction adapter layer to data flow; added src/lib/schemas/ to directory layout and key files*
*Updated: 2026-03-04 — Fixed submit/ → s/ route, added (production) route group, corrected PipelineStage columns (order/type enum, no slug/isSystem/isTerminal), StatusChange → PipelineUpdate with correct column names, added UserProfile and OrganizationProfile tables, noted production-template stages (roleId = null)*
*Updated: 2026-03-06 — Added Cloudflare R2 to External Services; added src/lib/types.ts, src/lib/constants.ts, src/lib/r2.ts to key files; added candidate.ts and form-fields.ts to schemas list; added role settings route and admin/onboarding to directory layout*
*Updated: 2026-03-16 — Fixed route tree: (role) route group, settings sub-routes, stages/[stageId] route; added feedback/ to actions; added feedback.ts to schemas; expanded types.ts entry (SystemFieldConfig); updated Production/Role/Submission/Candidate data model columns; added File, Feedback tables; added SystemFieldConfig note; added Feedback.stageId restrict constraint warning*
*Updated: 2026-03-18 — Sidebar → TopNav; added Comment table and comments/ actions; added reject-reasons routes; added accept-invitation route; corrected Submission columns (denormalized fields, rejectionReason, productionId); corrected File columns (contentType, size); added rejectReasons to Production/Role; updated actions directory list and schemas list; added Known Issues section; expanded component directory notes*
*Updated: 2026-03-22 — Added src/lib/constants/reserved-slugs.ts to key files; updated sendEmail description (now async, errors propagate); updated stage deletion constraint note (force param + feedback cascade); closed Known Issues #4, #5, #9, #11; added TODO notes to #6 and #7 (transaction blocker); clarified zod/zod-v4 status in #10*
*Updated: 2026-03-22 — Switched database driver from `neon-http` to `neon-serverless` with `Pool`; all 9 multi-mutation actions now wrapped in `db.transaction()`; closed Known Issues #6 and #7; updated src/lib/db/db.ts key file entry*
*Updated: 2026-03-22 — Production/role config lifted to production level: Role table no longer stores location, submissionFormFields, systemFieldConfig, feedbackFormFields, or rejectReasons; PipelineStage no longer has a roleId column (all stages are production-scoped); role settings sub-routes for pipeline/submission-form/feedback-form/reject-reasons removed; directory layout updated; closed Known Issue #2*
*Updated: 2026-03-29 — Updated route tree (removed stale per-role routes, added emails/ settings route); updated data model (isOpen boolean → status enum on Production and Role, added emailTemplates column); closed Known Issue #8 (getPublicProduction now filters closed productions)*
