# Features

## Inventory

| Feature | Status | Entry Point | Description |
|---------|--------|-------------|-------------|
| Design System | `shipped` | `src/styles/globals.scss` | Violet+Stone semantic token system powering all UI color, surface, and status styling |
| Auth Flow | `shipped` | `src/app/auth/page.tsx` | Email/password login and signup with layout-level route guards and a password-reset stub |
| App Shell (Sidebar Layout) | `shipped` | `src/app/(app)/layout.tsx` | Persistent collapsible sidebar with nav and user footer; wraps all authenticated routes |
| Onboarding | `shipped` | `src/app/onboarding/page.tsx` | Multi-step flow for new users: create an organization then optionally invite team members; shown when user has no active organization |
| Organizations Management | `shipped` | `src/app/(app)/settings/page.tsx` | Org settings (rename), members table, invite/remove/role-change; owner/admin only |
| Productions List | `shipped` | `src/app/(app)/productions/page.tsx` | Grid of production cards for the active org; empty state with create CTA |
| Production Detail | `shipped` | `src/app/(app)/productions/[id]/(production)/page.tsx` | Production overview with roles list and inline role creation |
| Create Production | `shipped` | `src/app/(app)/productions/new/page.tsx` | Form to create a new production with optional roles |
| Admin Panel | `shipped` | `src/app/admin/page.tsx` | Internal user management (list, create, change password, delete); bypasses org scope |
| Candidates List | `shipped` | `src/app/(app)/candidates/page.tsx` | Filterable table of all candidates (performers) in the active organization |
| Public Submission Flow | `shipped` | `src/app/s/[orgSlug]/page.tsx` | Public-facing casting call pages where candidates discover orgs, productions, and roles via URL slugs and submit auditions |
| Production Settings | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | Edit production details, manage roles, configure pipeline stages |
| URL Slugs | `shipped` | `src/lib/slug.ts` | Auto-generated URL-friendly identifiers for orgs, productions, and roles; used in public submission URLs |
| Pipeline Stages | `shipped` | `src/lib/pipeline.ts` | Configurable casting pipeline per role with system stages (Applied, Selected, Rejected) and custom user-defined stages; production-level template pipeline inherited by new roles |
| Role Submissions Kanban | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx` | Horizontal Kanban board for reviewing and triaging submissions; drag-and-drop moves candidates between pipeline stages |
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

## Onboarding

**Overview:** A multi-step flow shown to authenticated users who do not yet belong to any organization. Step 1 creates the org; step 2 invites team members (skippable). Exists because a new account is useless without an organization — this flow bridges sign-up and first use.

**Key files:**

| File | Role |
|------|------|
| `src/app/onboarding/layout.tsx` | Server component; calls `getCurrentUser()` (redirect to `/auth` if unauthenticated) and `hasAnyOrganization()` (redirect to `/home` if already in an org); renders the card shell |
| `src/app/onboarding/page.tsx` | Server component; renders `<OnboardingFlow />` |
| `src/components/onboarding/onboarding-flow.tsx` | Client component; owns step state (`create-org` → `invite-team`) and passes `handleOrgCreated` as the `onComplete` callback to `CreateOrgForm` |
| `src/components/onboarding/create-org-form.tsx` | Client component; collects org name and URL slug, auto-derives slug from name; accepts optional `onComplete(organizationId)` callback — when present, calls it instead of navigating to `/home` |
| `src/components/onboarding/invite-team-form.tsx` | Client component; sends invites via `inviteMember` action one at a time; shows a sent-emails list; "Skip for now" / "Continue" button navigates to `/home` |

**How it works:**

```
GET /onboarding
  └── onboarding/layout.tsx    ← getCurrentUser() → /auth if not signed in
                               ← hasAnyOrganization() → /home if already has org
      └── onboarding/page.tsx  ← renders <OnboardingFlow />

OnboardingFlow (client)
  step = "create-org"
    └── <CreateOrgForm onComplete={handleOrgCreated} />
          useHookFormAction(createOrganization, zodResolver(createOrgFormSchema))
          → onComplete(organizationId) → setOrgId; setStep("invite-team")

  step = "invite-team"
    └── <InviteTeamForm organizationId={orgId} />
          inviteMember action (repeatable, one email at a time)
          "Skip for now" / "Continue" → router.push("/home")
```

**Architecture decisions:**

- **Client-side step manager (`OnboardingFlow`) instead of multi-page routes** — step transitions are instant and no intermediate state needs to survive a navigation. A single client component holding `step` and `orgId` in `useState` is simpler than URL-based step routing.

- **`onComplete` callback on `CreateOrgForm`** — the form is also used standalone (e.g. an org-switcher "create new" path). Adding an optional `onComplete` prop lets the onboarding flow intercept the success event without forking the component. When `onComplete` is absent, the form falls back to `router.push("/home")` — the original behavior.

- **Guard in `layout.tsx`, not `page.tsx`** — the redirect logic (no auth, already has org) lives in the layout so it applies to every child route under `/onboarding/`, not just the index page.

**Integration points:** Depends on `hasAnyOrganization` from `src/actions/organizations/get-user-memberships.ts`. On completion, the user lands at `/home`, which is guarded by `(app)/layout.tsx` — see the Auth Flow section. Invites use the same `inviteMember` action as the Organizations Management settings page.

*Updated: 2026-03-02 — Documented multi-step onboarding flow (create org + invite team)*

---

## App Shell (Sidebar Layout)

**Overview:** Persistent collapsible sidebar that wraps every authenticated page. Provides primary navigation (Home, Productions, Candidates), a user identity footer, and a thin top header with a toggle trigger. It exists so that every page inside the app shares a consistent navigation frame without each route needing to manage its own nav.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/layout.tsx` | Server component; auth guard + `SidebarProvider` root; reads `sidebar_state` cookie to restore open/closed state; inlines a mobile-only 48px header with `SidebarTrigger` |
| `src/components/app/app-sidebar.tsx` | Client component; renders the full sidebar — logo header, nav items with active highlighting, org switcher + pending invites footer |

**How it works:**

```
(app)/layout.tsx  (server)
  ├── getCurrentUser() → redirect /auth if unauthenticated
  ├── hasAnyOrganization() → redirect /onboarding if no org
  ├── reads sidebar_state cookie → defaultOpen
  └── <SidebarProvider defaultOpen={defaultOpen}>
        ├── <AppSidebar user={...} />   (client)
        │     ├── SidebarHeader  — logo (expanded) / icon (collapsed) + toggle buttons
        │     ├── SidebarContent — nav items (Home / Productions / Candidates / Settings*)
        │     │     └── isActive() — pathname === href || startsWith(href + "/")
        │     │     * Settings shown only when activeOrgRole is "owner" or "admin"
        │     ├── SidebarFooter  — PendingInvitesButton + OrgSwitcher
        │     └── SidebarRail    — drag-resize handle
        └── <SidebarInset>
              ├── mobile-only 48px header (SidebarTrigger, md:hidden)
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

- **`src/components/app/` directory for shell components** — layout-level components that belong to the authenticated app shell (`AppSidebar`) live here, separate from `src/components/common/` (generic primitives) and `src/components/auth/` (auth-specific). See `docs/ARCHITECTURE.md` for the full component directory conventions.

**Integration points:** All routes under `src/app/(app)/` inherit this layout. Auth enforcement is handled here — see the Auth Flow section above. The `getCurrentUser()` helper lives in `src/lib/auth`.

*Updated: 2026-02-28 — Initial sidebar layout documentation*
*Updated: 2026-03-04 — Removed AppHeader (inlined in layout as mobile-only trigger), corrected sidebar footer (OrgSwitcher + PendingInvitesButton), added Settings nav conditional, added onboarding redirect*

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
| `src/app/s/[orgSlug]/page.tsx` | Lists an org's productions with open roles |
| `src/app/s/[orgSlug]/[productionSlug]/page.tsx` | Lists roles for a specific production |
| `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | Renders the submission form for a specific role |
| `src/actions/submissions/get-public-org.ts` | Unauthenticated fetch: org by slug |
| `src/actions/submissions/get-public-org-profile.ts` | Unauthenticated fetch: org profile (website, description, open status) by org slug |
| `src/actions/submissions/get-public-production.ts` | Unauthenticated fetch: production by org+production slug |
| `src/actions/submissions/get-public-productions.ts` | Unauthenticated fetch: all productions for an org |
| `src/actions/submissions/get-public-role.ts` | Unauthenticated fetch: role by production+role slug |
| `src/actions/submissions/create-submission.ts` | Mutation: creates or reuses Candidate by email, creates Submission |

**How it works:**

Three-tier URL structure:

```
/s/[orgSlug]                                → org page (list productions)
/s/[orgSlug]/[productionSlug]               → production page (list roles)
/s/[orgSlug]/[productionSlug]/[roleSlug]    → role page (submission form)
```

Each page is a server component that calls its corresponding public server function (no auth required). The final page renders the `SubmissionForm` client component. On submit, `SubmissionForm` uses `useHookFormAction(createSubmission, zodResolver(submissionFormSchema))`. The form schema (`submissionFormSchema` in `src/lib/schemas/submission.ts`) captures user-entered fields only; server IDs (`orgId`, `productionId`, `roleId`) are injected in the submit handler via `action.execute({ ...v, orgId, productionId, roleId })`. The `create-submission` action runs via `publicActionClient` — it looks up the role's Applied pipeline stage, upserts a Candidate record keyed by `(organizationId, email)`, then inserts a Submission linked to that stage.

**Architecture decisions:** Uses `publicActionClient` (no auth required — these routes are intentionally open). Candidate deduplication by email means the same person submitting to multiple roles in the same org is treated as one candidate in the database.

**Integration points:** Depends on URL Slugs (see `src/lib/slug.ts`) for resolving org/production/role from path params. Links into the Pipeline Stages system — new submissions always land in the Applied stage. See also `docs/DECISIONS.md` ADR-006 (URL slug rationale) and ADR-007 (pipeline stages rationale).

*Updated: 2026-03-01 — Initial public submission flow documentation*
*Updated: 2026-03-04 — Fixed route prefix /submit/ → /s/, added get-public-org-profile.ts, fixed Applied stage reference*

---

## Pipeline Stages

**Overview:** Each role in a production has its own configurable casting pipeline. Three system stages are created automatically when a role is created: Applied (receives new submissions), Selected (accepted), and Rejected (declined). Production teams can add custom stages between Applied and the terminal stages to model their callback and evaluation process. Productions also get a template pipeline — a production-level set of stages that new roles inherit when created.

**Key files:**

| File | Role |
|------|------|
| `src/lib/pipeline.ts` | Defines `SYSTEM_STAGES`, `DEFAULT_PRODUCTION_STAGES` constants and factory functions: `buildSystemStages()`, `buildProductionStages()`, `buildCustomProductionStages()`, `buildStagesFromTemplate()` |
| `src/actions/productions/add-pipeline-stage.ts` | Mutation: add a custom stage to a role's pipeline |
| `src/actions/productions/remove-pipeline-stage.ts` | Mutation: remove a custom stage (system-type stages are protected) |
| `src/actions/productions/add-production-stage.ts` | Mutation: add a stage to the production-level template pipeline |
| `src/actions/productions/remove-production-stage.ts` | Mutation: remove a stage from the production-level template |
| `src/actions/productions/reorder-production-stages.ts` | Mutation: reorder production template stages |
| `src/actions/productions/reorder-role-stages.ts` | Mutation: reorder a role's pipeline stages |
| `src/actions/submissions/update-submission-status.ts` | Mutation: move a submission to a new stage; creates a PipelineUpdate audit record |

**How it works:**

Stage types are defined by a `pipelineStageTypeEnum` with values `APPLIED`, `SELECTED`, `REJECTED`, `CUSTOM`. System stages seeded at role creation via `buildSystemStages()`:

| Stage | Order | Type |
|-------|-------|------|
| Applied | 0 | `APPLIED` |
| Selected | 1000 | `SELECTED` |
| Rejected | 1001 | `REJECTED` |

Custom stages are inserted at orders between 1 and 999. The `order` integer column determines the visual pipeline sequence. Non-`CUSTOM` stages are protected from removal. Every stage transition writes a `PipelineUpdate` row recording `fromStage`, `toStage`, `submissionId`, and `changeByUserId` for a full audit trail.

**Production-template pipeline:** Each production also carries a set of template stages (`roleId = null`). When a new role is created, it inherits the production's template via `buildStagesFromTemplate()`. The default production template (`DEFAULT_PRODUCTION_STAGES`) is: Applied → Screening → Audition → Callback → Selected → Rejected. Teams can customize this per-production before adding roles.

**Architecture decisions:** Per-role pipelines (rather than per-production) allow different roles in the same production to have different evaluation criteria — a lead role might have three callback stages while an ensemble role goes straight from Applied to Selected. Terminal stage orders (1000/1001) leave a large range (1–999) for custom stages without requiring renumbering. See `docs/DECISIONS.md` ADR-007 for full rationale.

**Integration points:** New submissions from the Public Submission Flow always land in the Applied stage. The Production Settings page (`src/app/(app)/productions/[id]/(production)/settings/page.tsx`) is the UI entry point for managing both role and production-template stages. Role settings (name, description, slug, open/closed) are updated via `src/actions/productions/update-role.ts`.

*Updated: 2026-03-01 — Initial pipeline stages documentation*
*Updated: 2026-03-04 — Note consolidated role action (update-role handles all role mutations including slug)*
*Updated: 2026-03-04 — Corrected stage names (Applied/Selected/Rejected), replaced isSystem/isTerminal with type enum, added production-template pipeline tier, fixed StatusChange → PipelineUpdate, updated entry point paths*

---

## Role Submissions Kanban

**Overview:** The role submissions page (`/productions/[id]/roles/[roleId]`) presents all submissions for a role as a horizontal Kanban board. Each pipeline stage is a column; each submission is a draggable card. Casting directors can triage candidates by dragging cards between columns, which moves the submission to that pipeline stage. Clicking a card opens the `SubmissionDetailSheet` for a full view. This replaced a tabbed list UI because boards make the pipeline state immediately visible — casting directors need to see the whole funnel at once, not one stage at a time.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx` | Server component; fetches role + submissions via `getRoleWithSubmissions`, renders `RoleSubmissions` |
| `src/components/productions/role-submissions.tsx` | Client component; owns Kanban state, `DragDropProvider`, column layout, and `SubmissionDetailSheet` trigger |
| `src/actions/submissions/update-submission-status.ts` | Mutation: moves a submission to a new pipeline stage; writes a `PipelineUpdate` audit record |
| `src/lib/submission-helpers.ts` | Shared types (`PipelineStageData`, `SubmissionWithCandidate`) and badge/label helpers |

**How it works:**

```
RolePage (server)
  └── getRoleWithSubmissions(roleId) → { submissions, pipelineStages }
      └── RoleSubmissions (client)
            ├── buildColumns()  — groups submissions by stageId into a Record<stageId, submissions[]>
            ├── DragDropProvider (@dnd-kit/react v0.3)
            │     ├── onDragStart  — snapshot columns into previousColumns ref
            │     ├── onDragOver   — move() helper updates column state optimistically
            │     └── onDragEnd    — if cross-column, calls updateSubmissionStatus action;
            │                        if canceled or error, restores previousColumns snapshot
            ├── KanbanColumn (one per stage)
            │     └── useDroppable({ type: "column", accept: "item" })
            │           └── KanbanCard (one per submission)
            │                 └── useSortable({ type: "item", group: stageId })
            │                       onClick → setSelectedSubmission (if not dragging)
            └── SubmissionDetailSheet (portal, controlled by selectedSubmission state)
```

**Optimistic updates:** Column state lives entirely in client `useState`. On drag start, the current state is snapshotted. `onDragOver` updates it immediately via dnd-kit's `move()` helper — the card visually moves as soon as it crosses a column boundary. `onDragEnd` fires the server action. If the action errors, `onError` calls `router.refresh()`, which triggers a server re-fetch; the prop-sync guard at the top of `RoleSubmissions` (`if (submissions !== prevSubmissions)`) then resets local state from the fresh server data. Canceling a drag (e.g. Escape key) also restores the snapshot.

**Terminal stages:** All pipeline stages, including Selected and Rejected, are draggable. The previous terminal-stage guard in `update-submission-status.ts` was removed. This was intentional: casting directors need to be able to correct mistakes (e.g., accidentally rejecting someone) without a workaround. The audit trail in `PipelineUpdate` records every stage transition regardless.

**Architecture decisions:**

- **@dnd-kit/react v0.3 (the React-specific package), not @dnd-kit/core.** The `@dnd-kit/react` package provides `DragDropProvider`, `useDroppable`, and `useSortable` as React hooks with built-in collision detection. The `move()` helper from `@dnd-kit/helpers` handles cross-column reordering in one call, eliminating custom bookkeeping.

- **Optimistic UI over server-driven updates.** Moving a card should feel instant. The server action is a fire-and-forget after the visual update. Errors roll back via `router.refresh()` + prop-sync rather than showing an error modal — keeping the interaction fast for the common case (success) while recovering gracefully on failure.

- **Prop-sync pattern instead of `useEffect`.** The `if (submissions !== prevSubmissions)` guard in `RoleSubmissions` synchronizes server-refreshed props back into local column state without triggering an extra render cycle. This is the React team's recommended pattern for derived state that also needs to stay in sync with external data.

- **`isDragSource` click guard on `KanbanCard`.** A click fires on `pointerup` regardless of whether a drag occurred. Checking `isDragSource` ensures `setSelectedSubmission` only runs if the user tapped (not dragged) the card, preventing the detail sheet from opening mid-drag.

**Integration points:** Depends on Pipeline Stages for column structure — stages come from `getRoleWithSubmissions` alongside the submissions. `SubmissionDetailSheet` (existing component, unchanged) is reused for the card detail view. The `updateSubmissionStatus` action writes to the same `PipelineUpdate` table used by all other stage transitions. See the Pipeline Stages section above for stage type definitions and audit trail details.

*Updated: 2026-03-04 — Documented Kanban board replacing tabbed submission list; terminal stage unlock; optimistic drag-and-drop with @dnd-kit/react v0.3*
