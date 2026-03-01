# Features

## Inventory

| Feature | Status | Entry Point | Description |
|---------|--------|-------------|-------------|
| Design System | `shipped` | `src/styles/globals.scss` | Violet+Stone semantic token system powering all UI color, surface, and status styling |
| Auth Flow | `shipped` | `src/app/auth/page.tsx` | Email/password login and signup with layout-level route guards and a password-reset stub |
| App Shell (Sidebar Layout) | `shipped` | `src/app/(app)/layout.tsx` | Persistent collapsible sidebar with nav and user footer; wraps all authenticated routes |
| Onboarding | `shipped` | `src/app/(onboarding)/onboarding/page.tsx` | Organization creation flow for new users; shown when user has no active organization |
| Organizations Management | `shipped` | `src/app/(app)/settings/page.tsx` | Org settings (rename), members table, invite/remove/role-change; owner/admin only |
| Productions List | `shipped` | `src/app/(app)/productions/page.tsx` | Grid of production cards for the active org; empty state with create CTA |
| Production Detail | `shipped` | `src/app/(app)/productions/[id]/page.tsx` | Production overview with roles list and inline role creation |
| Create Production | `shipped` | `src/app/(app)/productions/new/page.tsx` | Form to create a new production with optional roles |
| Admin Panel | `shipped` | `src/app/admin/page.tsx` | Internal user management (list, create, change password, delete); bypasses org scope |
| Candidates List | `shipped` | `src/app/(app)/candidates/page.tsx` | Filterable table of all candidates (performers) in the active organization |
| Public Submission Flow | `shipped` | `src/app/submit/[orgSlug]/page.tsx` | Public-facing casting call pages where candidates discover orgs, productions, and roles via URL slugs and submit auditions |
| Production Settings | `shipped` | `src/app/(app)/productions/[id]/settings/page.tsx` | Edit production details, manage roles, configure pipeline stages |
| URL Slugs | `shipped` | `src/lib/slug.ts` | Auto-generated URL-friendly identifiers for orgs, productions, and roles; used in public submission URLs |
| Pipeline Stages | `shipped` | `src/lib/pipeline.ts` | Configurable casting pipeline per role with system stages (Inbound, Cast, Rejected) and custom user-defined stages |
| Organization Switcher | `shipped` | `src/components/organizations/org-switcher.tsx` | Multi-org switching in sidebar footer; lets users switch between organizations they belong to |
| Landing Page | `shipped` | `src/app/page.tsx` | Single-screen hero with Castparty branding, tagline, and CTA link to /auth |
| 404 Page | `shipped` | `src/app/not-found.tsx` | Theatrical "didn't make the callback list" copy with decorative 404 display |
| Route Error Page | `shipped` | `src/app/error.tsx` | "Something went wrong backstage" — try again + back to home; client component |
| Global Error Page | `shipped` | `src/app/global-error.tsx` | Same content as error page; includes own `<html>/<body>` for root layout failures |

## Adding a Feature Entry

When you ship a feature, add a row to the table above:

- **Feature**: Short name (e.g., "User auth")
- **Status**: `shipped` · `in-progress` · `planned`
- **Entry Point**: Primary file path (e.g., `src/app/auth/page.tsx`)
- **Description**: One sentence — what it does

For complex features, add a subsection below the table with implementation details, data flow, and key files.

---

## Design System

**Overview:** A semantic CSS custom-property token system that defines the Violet+Stone visual language. All UI colors — brand, surfaces, borders, and status states — are expressed as tokens rather than raw Tailwind palette values, so component code stays decoupled from specific color choices.

**How it works:** Tokens are declared inside a single `@theme inline` block in `src/styles/globals.scss`, which makes them available to Tailwind v4 as utility classes (e.g., `bg-brand`, `text-brand-text`, `border-border-brand`). The file also sets three global base styles on `body` (background, text color, font smoothing) and a `::selection` highlight using brand tokens.

**Token groups:**

| Group | Root variable | Color basis | Purpose |
|-------|--------------|-------------|---------|
| Brand | `--color-brand` | violet-600 (#7c3aed) | Primary actions, focus rings, active nav |
| Accent | `--color-accent` | orange-500 (#f97316) | CTAs, highlights, notification badges |
| Surfaces | `--color-surface` | stone-50 (#fafaf9) | Page, card, input, and depressed backgrounds |
| Borders | `--color-border` | stone-200 (#e7e5e4) | Dividers, outlines, focus borders |
| Success | `--color-success` | green-600 (#16a34a) | Positive status indicators |
| Error | `--color-error` | red-600 (#dc2626) | Destructive actions, validation errors |
| Warning | `--color-warning` | amber-500 (#f59e0b) | Cautionary states |

Each group follows a consistent suffix pattern:

| Suffix | Meaning |
|--------|---------|
| *(none)* | Main interactive color |
| `-hover` | Hover state |
| `-pressed` | Active/pressed state (brand only) |
| `-light` | Badge and chip backgrounds |
| `-subtle` | Hover surface tints |
| `-fg` | Text/icon color on top of the main color |
| `-text` | Inline text links and labels |

**Architecture decisions:** Tokens live in `@theme inline` rather than `:root` so that Tailwind v4 can generate utility classes directly from them without a separate configuration file. See `docs/DECISIONS.md` for rationale on Tailwind v4 adoption. Dark mode is not actively supported. The `.dark` class in `globals.scss` contains only sidebar variables inherited from shadcn defaults — it is not a complete dark theme.

**Integration points:** Every component that needs color should use these tokens via Tailwind utility classes. Component class patterns (buttons, inputs, badges, etc.) are documented in `docs/CONVENTIONS.md` under "Component Patterns — Design Token Usage".

*Updated: 2026-02-27 — Initial design system documentation (Violet+Stone token system)*

---

## Auth Flow

**Overview:** Email/password authentication for production team members. Covers sign-in, account creation, and a password-reset stub. Built on Better Auth's `signIn.email` and `signUp.email` methods. Exists because every other feature in the app is behind an auth gate — this is the mandatory entry point before any production data is accessible.

**Key files:**

| File | Role |
|------|------|
| `src/app/auth/layout.tsx` | Reverse guard: calls `getCurrentUser()`; redirects signed-in users to `/home` before rendering the form shell |
| `src/app/auth/page.tsx` | Server component; reads `?tab=signup` search param and passes `defaultTab` to `AuthTabs` |
| `src/app/auth/forgot-password/page.tsx` | Password-reset page (server component); renders heading, `ForgotPasswordForm`, and back link |
| `src/app/(app)/layout.tsx` | Auth guard for all protected routes: calls `getCurrentUser()`; redirects unauthenticated users to `/auth` |
| `src/app/(app)/home/page.tsx` | Post-login landing; fetches the current user server-side and renders "Welcome, {name}." |
| `src/components/auth/auth-tabs.tsx` | Client component; wraps `LoginForm` and `SignUpForm` in shadcn `Tabs` |
| `src/components/auth/login-form.tsx` | Client component; calls `authClient.signIn.email`, pushes to `/home` on success |
| `src/components/auth/signup-form.tsx` | Client component; calls `authClient.signUp.email`, pushes to `/home` on success |
| `src/components/auth/forgot-password-form.tsx` | Client component; stub only — simulates a 500ms delay and shows a success `Alert`; no email is sent |

**How it works:**

```
GET /auth
  └── auth/layout.tsx      ← getCurrentUser() → redirect /home if signed in
      └── auth/page.tsx    ← reads ?tab param → <AuthTabs defaultTab="login|signup">
          ├── LoginForm    ← authClient.signIn.email → router.push("/home")
          └── SignUpForm   ← authClient.signUp.email → router.push("/home")

GET /auth/forgot-password
  └── auth/layout.tsx      ← same reverse guard
      └── forgot-password/page.tsx → <ForgotPasswordForm> (stub)

GET /(app)/*
  └── (app)/layout.tsx     ← getCurrentUser() → redirect /auth if not signed in
      └── home/page.tsx    ← getCurrentUser() again for display
```

**Architecture decisions:**

- **Layout-based guards, no middleware.** Auth checks live in `src/app/auth/layout.tsx` (reverse guard) and `src/app/(app)/layout.tsx` (forward guard) rather than `middleware.ts`. This keeps auth logic co-located with the route tree it protects, avoids Edge Runtime constraints, and lets the guard call `getCurrentUser()` — which uses Better Auth's server-side session fetch — without any runtime restrictions.

- **`router.push('/home')` instead of `callbackUrl`.** After a successful sign-in or sign-up, forms navigate explicitly with `router.push('/home')`. This avoids open-redirect risks from an unvalidated `callbackUrl` param and keeps the post-auth destination predictable while the app is early-stage.

- **Server components for pages, client components for forms.** Pages (`auth/page.tsx`, `home/page.tsx`) are server components — they handle metadata and any server-side data fetching. Forms are client components because they manage local state (pending, error) and call the Better Auth client SDK directly.

- **Forgot password as a stub.** The form shows a success message unconditionally after a simulated delay. No email is sent yet. The UX is intentionally non-revealing: "If an account exists for that email, we sent a reset link." This prevents account enumeration even in stub form.

**Integration points:** All routes under `src/app/(app)/` depend on `(app)/layout.tsx` for auth enforcement. The `getCurrentUser()` helper lives in `src/lib/auth` — see `docs/ARCHITECTURE.md` for the Better Auth setup.

*Updated: 2026-02-28 — Initial auth flow documentation*

---

## App Shell (Sidebar Layout)

**Overview:** Persistent collapsible sidebar that wraps every authenticated page. Provides primary navigation (Home, Productions, Candidates), a user identity footer, and a thin top header with a toggle trigger. It exists so that every page inside the app shares a consistent navigation frame without each route needing to manage its own nav.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/layout.tsx` | Server component; auth guard + `SidebarProvider` root; reads `sidebar_state` cookie to restore open/closed state |
| `src/components/app/app-sidebar.tsx` | Client component; renders the full sidebar — logo header, nav items with active highlighting, user footer |
| `src/components/app/app-header.tsx` | Client component; thin 48px top bar with `SidebarTrigger` and a vertical `Separator` |

**How it works:**

```
(app)/layout.tsx  (server)
  ├── getCurrentUser() → redirect /auth if unauthenticated
  ├── reads sidebar_state cookie → defaultOpen
  └── <SidebarProvider defaultOpen={defaultOpen}>
        ├── <AppSidebar user={...} />   (client)
        │     ├── SidebarHeader  — logo + "Castparty" link to /home
        │     ├── SidebarContent — nav items (Home / Productions / Candidates)
        │     │     └── isActive() — pathname === href || startsWith(href + "/")
        │     ├── SidebarFooter  — Avatar + name + email (non-interactive)
        │     └── SidebarRail    — drag-resize handle
        └── <SidebarInset>
              ├── <AppHeader />   (client) — SidebarTrigger + Separator
              └── {children}
```

**Sidebar behavior:**

| Behavior | Detail |
|----------|--------|
| Collapsed width | 48px (icon-only mode) |
| Expanded width | 256px |
| Collapse mode | `collapsible="icon"` — icons remain visible when collapsed; tooltips show on hover |
| State persistence | `sidebar_state` cookie; read server-side on initial load, written client-side by shadcn's `SidebarProvider` on toggle |
| Keyboard shortcut | Cmd+B (Mac) / Ctrl+B (Windows) — built into shadcn `SidebarProvider` |
| Mobile | Renders as a `Sheet` drawer instead of an inline sidebar |
| Active state | `isActive(href)` returns true when `pathname === href` or `pathname.startsWith(href + "/")`, so nested routes also highlight the parent nav item |

**Architecture decisions:**

- **`collapsible="icon"` over `collapsible="offcanvas"`** — icon mode keeps nav items discoverable when collapsed (icons remain visible with tooltips), which suits the expected nav depth. Offcanvas would fully hide the sidebar, requiring an explicit open gesture even on desktop.

- **Cookie read in the server layout, not client-only state** — reading `sidebar_state` on the server means the initial HTML render matches the user's last preference, avoiding a layout shift on load. The shadcn `SidebarProvider` then takes over client-side writes.

- **User data flows top-down from the layout** — `(app)/layout.tsx` fetches the current user once and passes `{ name, email, image }` as props to `AppSidebar`. This avoids a second `getCurrentUser()` call inside the sidebar and keeps the client component free of server-side data fetching.

- **`src/components/app/` directory for shell components** — layout-level components that belong to the authenticated app shell live here, separate from `src/components/common/` (generic primitives) and `src/components/auth/` (auth-specific). See `docs/ARCHITECTURE.md` for the full component directory conventions.

**Integration points:** All routes under `src/app/(app)/` inherit this layout. Auth enforcement is handled here — see the Auth Flow section above. The `getCurrentUser()` helper lives in `src/lib/auth`.

*Updated: 2026-02-28 — Initial sidebar layout documentation*

---

## Landing Page

**Overview:** Single-screen hero that introduces Castparty and routes new users toward the product. It exists because every cold visitor needs a clear entry point before hitting the authenticated dashboard.

**How it works:** `src/app/page.tsx` is a server component (no `"use client"`). It renders a centered full-viewport layout — `flex min-h-svh flex-col items-center justify-center px-page` — with a radial brand-subtle gradient applied via inline `style` (runtime value, can't be a static Tailwind class). The CTA uses `<Button href="/auth">`, which renders as a Next.js `Link` via the Button component's `href` prop. See `docs/CONVENTIONS.md#component-patterns` for the `href` prop note.

**Integration points:** Links to `/auth`. No data dependencies.

---

## Error & Not-Found Pages

**Overview:** Next.js App Router special files that intercept 404s and runtime errors. They use theatrical copy to keep the brand voice consistent even in failure states.

**How it works:**

| File | Next.js role | Component type | Key detail |
|------|-------------|----------------|------------|
| `src/app/not-found.tsx` | Handles all unmatched routes | Server component | Uses styled `Link` (not `Button`) — see gotcha in `docs/CONVENTIONS.md#gotchas` |
| `src/app/error.tsx` | Catches errors within a route segment | Client component (`"use client"`) | Receives `reset` callback from Next.js; uses `Button` component safely |
| `src/app/global-error.tsx` | Catches errors in the root layout/template | Client component (`"use client"`) | Must render its own `<html>` and `<body>` tags; imports `@/styles/globals.scss` directly since the root layout is bypassed |

All three pages share the same centered full-viewport layout pattern (see Architecture note below) and the same "Something went wrong backstage" / "This page didn't make the callback list" theatrical copy.

**Architecture decisions:** `global-error.tsx` is the only page that imports styles directly (`@/styles/globals.scss`) because the root layout — which normally injects global styles — does not run when a global error occurs. See `docs/CONVENTIONS.md#gotchas` for the `Button`-in-server-component constraint.

**Integration points:** Error pages link back to `/`. The 404 page also links to `/`. No data dependencies.

*Updated: 2026-02-28 — Added landing, 404, route error, and global error page documentation*

---

## Public Submission Flow

**Overview:** Public-facing flow for candidates to discover and apply to casting calls. Uses URL slugs for clean, shareable URLs that require no login. Exists so anyone — even without an account — can find a production's open roles and submit an audition from a link the production team shares.

**Key files:**

| File | Role |
|------|------|
| `src/app/submit/[orgSlug]/page.tsx` | Lists an org's productions with open roles |
| `src/app/submit/[orgSlug]/[productionSlug]/page.tsx` | Lists roles for a specific production |
| `src/app/submit/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | Renders the submission form for a specific role |
| `src/actions/submissions/get-public-org.ts` | Unauthenticated fetch: org by slug |
| `src/actions/submissions/get-public-production.ts` | Unauthenticated fetch: production by org+production slug |
| `src/actions/submissions/get-public-productions.ts` | Unauthenticated fetch: all productions for an org |
| `src/actions/submissions/get-public-role.ts` | Unauthenticated fetch: role by production+role slug |
| `src/actions/submissions/create-submission.ts` | Mutation: creates or reuses Candidate by email, creates Submission |

**How it works:**

Three-tier URL structure:

```
/submit/[orgSlug]                                → org page (list productions)
/submit/[orgSlug]/[productionSlug]               → production page (list roles)
/submit/[orgSlug]/[productionSlug]/[roleSlug]    → role page (submission form)
```

Each page is a server component that calls its corresponding public server function (no auth required). The final page renders the `SubmissionForm` client component. On submit, `create-submission` runs via `publicActionClient` — it looks up the role's Inbound pipeline stage, upserts a Candidate record keyed by `(organizationId, email)`, then inserts a Submission linked to that stage.

**Architecture decisions:** Uses `publicActionClient` (no auth required — these routes are intentionally open). Candidate deduplication by email means the same person submitting to multiple roles in the same org is treated as one candidate in the database.

**Integration points:** Depends on URL Slugs (see `src/lib/slug.ts`) for resolving org/production/role from path params. Links into the Pipeline Stages system — new submissions always land in the Inbound stage. See also `docs/DECISIONS.md` ADR-006 (URL slug rationale) and ADR-007 (pipeline stages rationale).

*Updated: 2026-03-01 — Initial public submission flow documentation*

---

## Pipeline Stages

**Overview:** Each role in a production has its own configurable casting pipeline. Three system stages are created automatically when a role is created: Inbound (receives new submissions), Cast (terminal — accepted), and Rejected (terminal — declined). Production teams can add custom stages between Inbound and the terminal stages to model their callback and evaluation process.

**Key files:**

| File | Role |
|------|------|
| `src/lib/pipeline.ts` | Defines system stage constants and `buildSystemStages()` factory |
| `src/actions/productions/add-pipeline-stage.ts` | Mutation: add a custom stage to a role's pipeline |
| `src/actions/productions/remove-pipeline-stage.ts` | Mutation: remove a custom stage (system stages are protected) |
| `src/actions/submissions/update-submission-status.ts` | Mutation: move a submission to a new stage; creates a StatusChange audit record |

**How it works:**

System stages are seeded at role creation via `buildSystemStages(roleId)` from `src/lib/pipeline.ts`:

| Stage | Position | isTerminal | isSystem |
|-------|----------|-----------|---------|
| Inbound | 0 | false | true |
| Cast | 1000 | true | true |
| Rejected | 1001 | true | true |

Custom stages are inserted at positions between 1 and 999. Position ordering determines the visual pipeline sequence. Terminal stages cannot be removed (`isSystem` flag enforced in the remove action). Every stage transition writes a `StatusChange` row recording `fromStageId`, `toStageId`, `changedById`, and `changedAt` for a full audit trail.

**Architecture decisions:** Per-role pipelines (rather than per-production) allow different roles in the same production to have different evaluation criteria — a lead role might have three callback rounds while an ensemble role goes straight from Inbound to Cast. Terminal stage positions (1000/1001) leave a large range (1–999) for custom stages without requiring renumbering. See `docs/DECISIONS.md` ADR-007 for full rationale.

**Integration points:** New submissions from the Public Submission Flow always land in Inbound. The Production Settings page (`src/app/(app)/productions/[id]/settings/page.tsx`) is the UI entry point for managing stages.

*Updated: 2026-03-01 — Initial pipeline stages documentation*
