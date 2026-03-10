# Features

## Inventory

| Feature | Status | Entry Point | Description |
|---------|--------|-------------|-------------|
| Design System | `shipped` | `src/styles/globals.scss` | Violet+Stone semantic token system powering all UI color, surface, and status styling |
| Auth Flow | `shipped` | `src/app/auth/(guest)/page.tsx` | Email/password login, signup, email verification, and password reset with layout-level route guards |
| App Shell (Sidebar Layout) | `shipped` | `src/app/(app)/layout.tsx` | Persistent collapsible sidebar with nav and user footer; wraps all authenticated routes |
| Onboarding | `shipped` | `src/app/onboarding/page.tsx` | Multi-step flow for new users: create an organization then optionally invite team members; shown when user has no active organization |
| Organizations Management | `shipped` | `src/app/(app)/settings/page.tsx` | Org settings (name, slug, description, website, visibility), members table, invite/remove/role-change, ownership transfer; owner/admin only |
| Productions List | `shipped` | `src/app/(app)/productions/page.tsx` | Grid of production cards for the active org; each card shows submission count; empty state with create CTA |
| Production Detail | `shipped` | `src/app/(app)/productions/[id]/(production)/page.tsx` | Production overview with roles list and submission counts per role; inline role creation |
| Create Production | `shipped` | `src/app/(app)/productions/new/page.tsx` | 5-step wizard to create a new production: Details → Casting Pipeline → Submission Form → Feedback Form → Roles |
| Production Settings | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | Edit production details (name, slug, description, location, open/closed), configure pipeline template stages, and manage the production-level custom application form |
| Role Settings | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx` | Edit role details (name, slug, description, open/closed), configure role-level pipeline stages, and manage the role-level custom application form |
| Admin Panel | `shipped` | `src/app/admin/page.tsx` | Internal user management (list, create, change password, delete); bypasses org scope |
| Candidates List | `shipped` | `src/app/(app)/candidates/page.tsx` | Searchable, sortable, paginated table of all candidates in the active organization |
| Candidate Detail | `shipped` | `src/app/(app)/candidates/[candidateId]/page.tsx` | Individual candidate profile showing personal details and all submissions across roles |
| Home Dashboard | `shipped` | `src/app/(app)/home/page.tsx` | Post-login dashboard showing the user's productions with submission counts; empty state CTA when no productions exist |
| Public Submission Flow | `shipped` | `src/app/s/[orgSlug]/page.tsx` | Public-facing casting call pages where candidates discover orgs, productions, and roles via URL slugs and submit auditions |
| URL Slugs | `shipped` | `src/lib/slug.ts` | Auto-generated URL-friendly identifiers for orgs, productions, and roles; used in public submission URLs |
| Pipeline Stages | `shipped` | `src/lib/pipeline.ts` | Configurable casting pipeline per role with system stages (Applied, Selected, Rejected) and custom user-defined stages; production-level template pipeline inherited by new roles |
| Custom Form Fields | `shipped` | `src/lib/types.ts` | Per-production and per-role custom application form fields (5 types: TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE); configured in settings, rendered in public submission form |
| Role Submissions Kanban | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx` | Horizontal Kanban board for reviewing and triaging submissions; drag-and-drop moves candidates between pipeline stages |
| Organization Switcher | `shipped` | `src/components/organizations/org-switcher.tsx` | Multi-org switching in sidebar footer; lets users switch between organizations they belong to |
| R2 File Storage | `shipped` | `src/lib/r2.ts` | Cloudflare R2 utility for uploading, deleting, and moving files; uses AWS SDK S3-compatible API; used by headshot and resume upload |
| Resume Upload | `shipped` | `src/components/submissions/resume-uploader.tsx` | Candidates upload a PDF resume when submitting for a role; text is extracted server-side and stored for future search/AI use |
| AutocompleteInput | `shipped` | `src/components/common/autocomplete-input.tsx` | Free-form combobox input with keyboard navigation and a filtered dropdown; not constrained to options — users can type any value |
| useCityOptions | `shipped` | `src/hooks/use-city-options.ts` | Hook that lazy-loads and caches US + Canadian city names for use with AutocompleteInput |
| Location Fields | `shipped` | `src/lib/schemas/production.ts`, `src/lib/schemas/submission.ts` | Free-text location on productions (create + settings) and submissions (form + detail view); city autocomplete via useCityOptions |
| Landing Page | `shipped` | `src/app/page.tsx` | Single-screen hero with Castparty branding, tagline, and CTA link to /auth |
| Email Verification | `shipped` | `src/app/auth/verify-email/page.tsx` | Post-signup email verification flow |
| Password Reset | `shipped` | `src/app/auth/reset-password/page.tsx` | Token-based password reset via email link |
| Accept Invitation | `shipped` | `src/app/accept-invitation/[id]/page.tsx` | Token-based invitation acceptance that adds users to an organization |
| Admin Organizations | `shipped` | `src/app/admin/organizations/page.tsx` | Admin-level organization management (list, delete) |
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

**Overview:** Email/password authentication for production team members. Covers sign-in, account creation, email verification, and password reset. Built on Better Auth's `signIn.email` and `signUp.email` methods. Exists because every other feature in the app is behind an auth gate — this is the mandatory entry point before any production data is accessible.

**Key files:**

| File | Role |
|------|------|
| `src/app/auth/layout.tsx` | Reverse guard: calls `getCurrentUser()`; redirects signed-in users to `/home` before rendering the form shell |
| `src/app/auth/(guest)/page.tsx` | Server component; reads `?tab=signup` search param and passes `defaultTab` to `AuthTabs` |
| `src/app/auth/(guest)/forgot-password/page.tsx` | Password-reset request page (server component); renders heading, `ForgotPasswordForm`, and back link |
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

- **`createOrganization` does not call `revalidatePath`** — the action intentionally omits `revalidatePath("/", "layout")` after org creation. Navigation from step 1 to step 2 is handled entirely by the `onComplete` callback in `OnboardingFlow`, which calls `router.refresh()` + `router.push("/home")` at the end. Adding `revalidatePath` here caused the App Router to redirect to `/home` before the invite step could render, skipping step 2.

**Integration points:** Depends on `hasAnyOrganization` from `src/actions/organizations/get-user-memberships.ts`. On completion, the user lands at `/home`, which is guarded by `(app)/layout.tsx` — see the Auth Flow section. Invites use the same `inviteMember` action as the Organizations Management settings page.

*Updated: 2026-03-02 — Documented multi-step onboarding flow (create org + invite team)*
*Updated: 2026-03-10 — Noted why createOrganization omits revalidatePath (invite step skipping bug)*

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

## Create Production

**Overview:** A 5-step wizard for creating a new production. Exists because a single large form would overwhelm directors making their first production — breaking it into focused steps keeps each decision manageable. The wizard is the primary entry point for getting a production live with a pipeline, custom forms, and initial roles in one sitting.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/productions/new/page.tsx` | Server component; renders `<CreateProductionForm orgSlug={...}>` |
| `src/components/productions/create-production-form.tsx` | Client component; owns step state and all field callbacks; calls `createProduction` action on final submit |
| `src/actions/productions/create-production.ts` | Mutation: creates Production, template pipeline stages, and optional Roles in a single server action |
| `src/lib/schemas/production.ts` | `createProductionFormSchema` (form) and `createProductionActionSchema` (action, extends form with `customStages`, `submissionFormFields`, `feedbackFormFields`) |
| `src/components/productions/default-stages-editor.tsx` | `StagesEditor` component — drag-to-reorder custom pipeline stages |
| `src/components/productions/form-fields-editor.tsx` | `FormFieldsEditor` component — shared editor for submission and feedback form fields |

**Wizard steps:**

| Step | Key | What the user configures |
|------|-----|--------------------------|
| 1 | `details` | Name, description, location, URL slug (auto-derived from name; validated for uniqueness) |
| 2 | `stages` | Casting pipeline template (custom stages between system stages Applied/Selected/Rejected) |
| 3 | `submissionForm` | Custom questions on the candidate submission form (default for all roles) |
| 4 | `feedbackForm` | Custom fields for the production team's review notes (default for all roles) |
| 5 | `roles` | Optional initial roles (name + description); additional roles can be added later |

**How it works:**

```
CreateProductionForm (client)
  step state: "details" → "stages" → "submissionForm" → "feedbackForm" → "roles"
  form state: useHookFormAction(createProduction, formResolver(createProductionFormSchema))
  local state: customStages[], submissionFormFields[], feedbackFormFields[]

  Step 1 (details)
    └── validates name/description/location/slug; async slug uniqueness check via checkSlugAvailability action
  Step 2 (stages)
    └── StagesEditor — manages customStages[] in local state; system stages pinned at positions 0/1000/1001
  Step 3 (submissionForm)
    └── FormFieldsEditor — manages submissionFormFields[] in local state
  Step 4 (feedbackForm)
    └── FormFieldsEditor — manages feedbackFormFields[] in local state
  Step 5 (roles)
    └── useFieldArray(roles) — react-hook-form field array; roles with empty names are filtered on submit

  handleSubmit → action.execute({
    name, description, location, slug,
    customStages: [stage names],         ← undefined = use defaults; [] = system stages only
    roles,
    submissionFormFields,
    feedbackFormFields,
  })
```

**Action behavior (`createProduction`):**

- Inserts the `Production` record with `isOpen: true` and the provided form fields.
- `customStages === undefined` → seeds default template pipeline (`buildProductionStages`); `customStages` provided → seeds only the specified custom stages (`buildCustomProductionStages`).
- For each role in `roles`, inserts a `Role` row with `isOpen: true` and copies `submissionFormFields`/`feedbackFormFields` from the production with freshly generated IDs (so each role's fields are independent).
- Inserts pipeline stages for each role derived from the production template via `buildStagesFromTemplate`.
- Calls `revalidatePath("/", "layout")` and returns `{ id: productionId }` — the client redirects to `/productions/[id]`.

**Architecture decisions:**

- **Local state for steps 2–4, react-hook-form for steps 1 and 5.** Steps 2–4 manage arrays that need custom add/remove/reorder callbacks (`StagesEditor`, `FormFieldsEditor`). These don't fit cleanly into react-hook-form's `useFieldArray` API (which requires object arrays with `id` keys). They are kept in plain `useState` and merged into the action payload at submit time. Steps 1 and 5 are standard form fields managed by the `useHookFormAction` form.

- **Slug auto-derived from name, user can override.** A `slugTouchedRef` tracks whether the user has manually edited the slug field. While untouched, the slug auto-updates as the user types the production name via `slugify()`. Once the user types in the slug field (or clears it to reset), the ref flips and auto-fill stops.

- **Form fields set here copy to roles with new IDs.** Giving each role independent field arrays (rather than a foreign key reference to the production template) allows per-role customization later without affecting siblings. See the Custom Form Fields section for full details.

**Integration points:** Depends on Custom Form Fields, Pipeline Stages, and URL Slugs. The wizard uses `checkSlugAvailability` (`src/actions/productions/check-slug.ts`) for real-time uniqueness validation. After creation, the user lands on the Production Detail page.

*Updated: 2026-03-10 — Initial Create Production documentation (5-step wizard with submission/feedback form steps)*

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

Each page is a server component that calls its corresponding public server function (no auth required). The final page renders the `SubmissionForm` client component. On submit, `SubmissionForm` uses `useHookFormAction(createSubmission, zodResolver(submissionFormSchema))`. The form schema (`submissionFormSchema` in `src/lib/schemas/submission.ts`) captures user-entered fields only; server IDs (`orgId`, `productionId`, `roleId`) are injected in the submit handler via `action.execute({ ...v, orgId, productionId, roleId })`. The `create-submission` action runs via `publicActionClient` — it looks up the role's Applied pipeline stage, upserts a Candidate record keyed by `(organizationId, email)`, then inserts a Submission linked to that stage. If a resume was uploaded, the action moves the file from `temp/resumes/` to permanent storage, creates a `File` record with `type="RESUME"`, and extracts the PDF text into `Submission.resumeText` using `unpdf` (see the Resume Upload section).

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

**Role creation defaults:** All roles — whether created via the production creation wizard or added inline on the Production Detail page — are inserted with `isOpen: true`. This means new roles are immediately open for submissions without requiring an explicit activation step. Roles can be closed later via role settings.

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
            │                 ├── useSortable({ type: "item", group: stageId })
            │                 ├── Avatar — headshots[0].url with object-cover crop, or initials fallback
            │                 └── onClick → setSelectedSubmission (if not dragging)
            └── SubmissionDetailSheet (portal, controlled by selectedSubmission state)
```

**Optimistic updates:** Column state lives entirely in client `useState`. On drag start, the current state is snapshotted. `onDragOver` updates it immediately via dnd-kit's `move()` helper — the card visually moves as soon as it crosses a column boundary. `onDragEnd` fires the server action. If the action errors, `onError` calls `router.refresh()`, which triggers a server re-fetch; the prop-sync guard at the top of `RoleSubmissions` (`if (submissions !== prevSubmissions)`) then resets local state from the fresh server data. Canceling a drag (e.g. Escape key) also restores the snapshot.

**Terminal stages:** All pipeline stages, including Selected and Rejected, are draggable. The previous terminal-stage guard in `update-submission-status.ts` was removed. This was intentional: casting directors need to be able to correct mistakes (e.g., accidentally rejecting someone) without a workaround. The audit trail in `PipelineUpdate` records every stage transition regardless.

**Architecture decisions:**

- **@dnd-kit/react v0.3 (the React-specific package), not @dnd-kit/core.** The `@dnd-kit/react` package provides `DragDropProvider`, `useDroppable`, and `useSortable` as React hooks with built-in collision detection. The `move()` helper from `@dnd-kit/helpers` handles cross-column reordering in one call, eliminating custom bookkeeping.

- **Optimistic UI over server-driven updates.** Moving a card should feel instant. The server action is a fire-and-forget after the visual update. Errors roll back via `router.refresh()` + prop-sync rather than showing an error modal — keeping the interaction fast for the common case (success) while recovering gracefully on failure.

- **Prop-sync pattern instead of `useEffect`.** The `if (submissions !== prevSubmissions)` guard in `RoleSubmissions` synchronizes server-refreshed props back into local column state without triggering an extra render cycle. This is the React team's recommended pattern for derived state that also needs to stay in sync with external data.

- **`isDragSource` click guard on `KanbanCard`.** A click fires on `pointerup` regardless of whether a drag occurred. Checking `isDragSource` ensures `setSelectedSubmission` only runs if the user tapped (not dragged) the card, preventing the detail sheet from opening mid-drag.

- **Headshot thumbnail on Kanban cards.** Each `KanbanCard` renders an `Avatar` (size `sm`) using `submission.headshots[0].url` with `object-cover` cropping. If no headshot exists, the Avatar shows the candidate's initials derived from `firstName[0] + lastName[0]`. This makes scanning a packed column faster than name-only cards.

**Integration points:** Depends on Pipeline Stages for column structure — stages come from `getRoleWithSubmissions` alongside the submissions. `SubmissionDetailSheet` (existing component, unchanged) is reused for the card detail view. The `updateSubmissionStatus` action writes to the same `PipelineUpdate` table used by all other stage transitions. See the Pipeline Stages section above for stage type definitions and audit trail details.

*Updated: 2026-03-04 — Documented Kanban board replacing tabbed submission list; terminal stage unlock; optimistic drag-and-drop with @dnd-kit/react v0.3*
*Updated: 2026-03-10 — Added candidate photo thumbnail (Avatar with headshot/initials fallback) on KanbanCard*

---

## Custom Form Fields

**Overview:** Productions and roles can each define a custom application form that candidates fill out when submitting an audition. This supplements the standard submission fields (name, email) with production-specific questions — e.g., "What experience do you have with Shakespeare?" or "Can you attend a Saturday rehearsal?" Configured in production or role settings; rendered dynamically in the public submission form.

**How it works:** Form fields are stored as JSONB in the `Production.submissionFormFields`, `Production.feedbackFormFields`, `Role.submissionFormFields`, and `Role.feedbackFormFields` columns. The `CustomForm` type in `src/lib/types.ts` defines the field shape: `id`, `type`, `label`, `description`, `required`, and `options` (for SELECT/CHECKBOX_GROUP). Responses are stored as JSONB in `Submission.answers` using the `CustomFormResponse` type: `{ fieldId, textValue, booleanValue, optionValues }`.

There are two distinct form field contexts:

- **Submission form fields** — questions candidates answer when submitting (rendered in the public `SubmissionForm`).
- **Feedback form fields** — structured scoring/notes for the production team to fill in when reviewing a candidate (rendered in `SubmissionDetailSheet`).

**Supported field types** (`CustomFormFieldType` in `src/lib/types.ts`):

| Type | Use |
|------|-----|
| `TEXT` | Short single-line answer |
| `TEXTAREA` | Long multi-line answer |
| `SELECT` | Pick one from a list |
| `CHECKBOX_GROUP` | Pick multiple from a list |
| `TOGGLE` | Boolean yes/no |

**Key files:**

| File | Role |
|------|------|
| `src/lib/types.ts` | `CustomForm`, `CustomFormFieldType`, `CustomFormResponse` types |
| `src/lib/schemas/form-fields.ts` | `customFormItemSchema` (shared field shape) + Zod schemas for all CRUD actions |
| `src/components/productions/form-fields-editor.tsx` | Generic editor UI used in both the creation wizard and production/role settings |
| `src/actions/productions/` | Actions for add/remove/reorder form fields on productions and roles |

**Where form fields are configured:**

1. **During production creation** — the 5-step wizard (`src/components/productions/create-production-form.tsx`) includes a Submission Form step and a Feedback Form step. Fields set here are stored on the `Production` record and copied (with regenerated IDs) to every role created in the same wizard run.
2. **In production settings** — after creation, fields can be added/edited/removed/reordered via the settings page (`src/app/(app)/productions/[id]/(production)/settings/page.tsx`). Changes here do not retroactively update existing roles.
3. **In role settings** — each role can independently override its inherited fields via `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`.

**Role field inheritance:** When a role is created (via the wizard or inline on the Production Detail page), its `submissionFormFields` and `feedbackFormFields` are copied from the parent production with freshly generated IDs. This keeps role fields decoupled — editing a role's fields later doesn't affect other roles or the production template, and vice versa.

**Architecture decisions:** JSONB is used for form field storage rather than a normalized `form_fields` table because the field shape is schema-on-read (typed via `CustomForm`), the data is always fetched with its parent production/role, and the flexibility to add new field types without migrations outweighs the join overhead. The shared `customFormItemSchema` in `src/lib/schemas/form-fields.ts` validates both the inline creation wizard payload and individual CRUD action inputs.

**Integration points:** The `SubmissionForm` in `src/components/submissions/submission-form.tsx` reads `submissionFormFields` from the role and renders the appropriate input for each field type. Responses are submitted alongside standard fields via the `create-submission` action. The feedback form is rendered in `SubmissionDetailSheet` for the production team.

*Updated: 2026-03-06 — Initial custom form fields documentation*
*Updated: 2026-03-10 — Split submission vs. feedback field contexts; documented creation wizard integration and role field inheritance; noted customFormItemSchema as shared schema; updated key files table*

---

## AutocompleteInput

**Overview:** A generic free-form combobox primitive. It combines the standard `Input` with a filtered dropdown list but does not constrain the user to the suggested options — any typed value is valid. Built as a reusable common component so any feature that needs typeahead (currently location fields) can use it without re-implementing keyboard handling.

**How it works:** The component is fully controlled: the parent owns `value` and supplies an `onChange` callback. It accepts a flat `options: string[]` array and filters client-side by prefix match (`startsWith`). Dropdown visibility and keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`) are managed in local state. A module-level `mousedown` listener closes the dropdown on outside click. The dropdown renders as a `role="listbox"` element with `role="option"` items and `aria-selected` tracking, wired to the input via `aria-controls` and `aria-expanded`.

**Key props:**

| Prop | Default | Description |
|------|---------|-------------|
| `value` / `onChange` | — | Controlled value |
| `options` | — | Full list to filter from |
| `minChars` | `2` | Minimum characters before dropdown opens |
| `maxResults` | `20` | Cap on visible options |
| `emptyMessage` | `"No results"` | Shown when filter produces nothing |

**Architecture decisions:** Free-form rather than constrained so that users can enter a city not in the dataset (e.g. international locations, custom venues). The dropdown does not appear until `minChars` characters are typed — keeps the initial experience clean when the option list is large (30,000+ entries). `onMouseDown` + `e.preventDefault()` on each option prevents the input's `onBlur` from firing before the selection registers (a standard combobox gotcha).

**Integration points:** Currently used exclusively through the `useCityOptions` hook for location fields. Import from `@/components/common/autocomplete-input`.

*Updated: 2026-03-06 — Initial documentation*

---

## useCityOptions

**Overview:** A hook that provides a combined US + Canadian city name list for use with `AutocompleteInput`. Lazy-loads on first use and caches the result for the lifetime of the page so that multiple location fields on the same page share one fetch.

**How it works:** Two static JSON files in `public/` are fetched in parallel on first call:

| File | Entries |
|------|---------|
| `public/us-cities.json` | 30,988 US cities |
| `public/can-cities.json` | 1,736 Canadian cities |

A module-level `cachedPromise` variable holds the in-flight or resolved `Promise<string[]>`. Every hook instance shares this reference, so subsequent `useCityOptions()` calls never trigger a second fetch — they just attach to the same promise. The resolved array is `[...us, ...can]` (US first). While loading, the hook returns `[]`, so `AutocompleteInput` shows no suggestions until the data arrives.

**Architecture decisions:** Module-level cache rather than React context because there is no state to share — only a fetched array. Context would require a provider in the tree; a module-level variable is simpler and achieves the same deduplication. Data lives in `public/` rather than a database or API because city names are static, large-ish (~1 MB combined), and benefit from CDN caching. The constraint to US + Canadian cities is intentional for the current target audience (community theatre, North American focus).

**Integration points:** Used in `src/components/productions/create-production-form.tsx`, `src/components/productions/production-settings-form.tsx`, and `src/components/submissions/submission-form.tsx`. See AutocompleteInput section above.

*Updated: 2026-03-06 — Initial documentation*

---

## Location Fields

**Overview:** Productions and submissions both carry a free-text `location` field. On productions, location describes where the production is based or will be performed. On submissions, location is the candidate's city, letting the production team filter candidates by geography. Both fields use city autocomplete but accept any value, so entries like "Toronto, ON" from the suggestion list and "London, UK" typed manually are equally valid.

**How it works:**

| Surface | Field status | UI entry point | Display point |
|---------|-------------|----------------|---------------|
| Production (create) | Optional | Step 1 of `CreateProductionForm`, after description | Not currently displayed on production cards |
| Production (settings) | Optional | `ProductionSettingsForm`, after name | Not currently displayed |
| Submission (submit form) | Optional | `SubmissionForm`, after phone | `SubmissionDetailSheet`, Contact section with `MapPinIcon` |

**Key files:**

| File | Role |
|------|------|
| `src/lib/schemas/production.ts` | `location: z.string().trim().max(200).optional()` in create schemas; required (no `.optional()`) in update schemas |
| `src/lib/schemas/submission.ts` | `location: z.string().trim().max(200).optional()` in form schema |
| `src/actions/productions/create-production.ts` | Passes `location` to DB insert |
| `src/actions/productions/update-production.ts` | Passes `location` to DB update |
| `src/actions/submissions/create-submission.ts` | Passes `location` to Submission insert, Candidate insert, and Candidate update |
| `src/actions/candidates/get-candidate.ts` | Includes `location` in the shaped submission object |
| `src/lib/submission-helpers.ts` | `location: string` field on `SubmissionWithCandidate` interface |
| `src/components/productions/create-production-form.tsx` | Location field with city autocomplete |
| `src/components/productions/production-settings-form.tsx` | Location field with city autocomplete; accepts `currentLocation` prop |
| `src/components/submissions/submission-form.tsx` | Location field with city autocomplete |
| `src/components/productions/submission-detail-sheet.tsx` | Renders location with `MapPinIcon` in Contact section |
| `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | Passes `currentLocation={production.location}` to settings form |

**Architecture decisions:** Location is optional on create (teams may not know the venue yet) but the update schema accepts it without `.optional()` — an empty string is valid, meaning the field can be cleared. Submission location is optional throughout because not all candidates will supply it. The field is free-text (max 200 chars) rather than a foreign key to a cities table so that non-standard values (neighborhoods, venues, international cities) don't require schema changes.

**Integration points:** Depends on AutocompleteInput and useCityOptions for the city suggestion UI. The `SubmissionWithCandidate` type in `src/lib/submission-helpers.ts` is the shared contract between server actions and the Kanban / detail sheet display layer.

*Updated: 2026-03-06 — Initial documentation*

---

## R2 File Storage

**Overview:** A utility layer for storing binary files (headshots, résumés, etc.) in Cloudflare R2 via the S3-compatible API. The utility exists because R2 offers egress-free reads (unlike S3), which matters for a product where candidates upload media that gets viewed repeatedly by the production team.

**How it works:** `src/lib/r2.ts` wraps the AWS SDK `S3Client` pointed at Cloudflare's endpoint. Files are keyed as `{dev|prod}/{folder}/{id}.{ext}` — the `dev`/`prod` prefix keeps development uploads isolated from production data in the same bucket. `uploadFile` takes a `File` and a folder name; `deleteFile` and `moveFile` operate on public URLs using `getKeyFromUrl` to extract the storage key.

**Key files:**

| File | Role |
|------|------|
| `src/lib/r2.ts` | `uploadFile`, `deleteFile`, `moveFile`, `getKeyFromUrl` |
| `src/lib/util.ts` | `generateId` (used to generate unique file keys) and `IS_DEV` (determines bucket prefix) |

**Environment variables required:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

**Current consumers:** Headshot upload (via `src/actions/submissions/presign-headshot-upload.ts`) and resume upload (via `src/actions/submissions/presign-resume-upload.ts`). Both follow the same two-phase pattern: presign to `temp/`, upload from the client, then move to the permanent prefix inside `create-submission`.

*Updated: 2026-03-06 — Initial R2 file storage documentation*
*Updated: 2026-03-07 — Removed "not wired" note; headshot and resume upload now consume this utility*

---

## Resume Upload

**Overview:** Candidates can attach a PDF resume when submitting for a role. The file is stored in R2, and its text content is extracted server-side and stored in the `Submission` record. Storing the text alongside the binary makes it available for future search or AI-based screening without re-fetching and re-parsing the PDF on demand.

**How it works:**

```
SubmissionForm (client)
  └── ResumeUploader  ← controlled by resumeFile state
        ↓ on form submit
  presignResumeUpload action  ← publicActionClient, validates PDF + 10MB limit
        ↓ returns { key, presignedUrl }
  PUT presignedUrl  ← client uploads directly to R2 temp/resumes/
        ↓
  createSubmission action  ← receives { resume: { key, filename, … } }
        ├── validates key starts with temp/resumes/
        ├── moveFileByKey(key, "resumes")  ← moves to permanent resumes/ prefix
        ├── db.insert(File) with type="RESUME"
        └── fetch(moved.url) → getDocumentProxy → extractText (unpdf)
              └── db.update(Submission).set({ resumeText })  ← best-effort, never blocks submit
```

The PDF parsing step is wrapped in try/catch and does not fail the submission if extraction fails. `resumeText` stays `null` for unreadable PDFs.

**Key files:**

| File | Role |
|------|------|
| `src/components/submissions/resume-uploader.tsx` | Controlled PDF file picker; shows filename + remove button when a file is selected; accepts PDF only, max 10 MB |
| `src/actions/submissions/presign-resume-upload.ts` | `publicActionClient` action; validates `contentType === "application/pdf"` and `size <= 10MB`; returns a presigned PUT URL and the temp R2 key |
| `src/actions/submissions/create-submission.ts` | Moves file from `temp/resumes/` to `resumes/`, inserts a `File` row with `type="RESUME"`, parses text with `unpdf`, stores result in `Submission.resumeText` |
| `src/lib/schemas/submission.ts` | `resumeFileSchema` (key, filename, contentType, size); `submissionActionSchema` includes `resume: resumeFileSchema.optional()` |
| `src/lib/submission-helpers.ts` | `ResumeData` interface (`{ id, url, filename }`); `resume: ResumeData | null` field on `SubmissionWithCandidate` |
| `src/lib/db/schema.ts` | `Submission.resumeText: text()` (nullable); `File` relation renamed from `headshots` to `files` on both `Submission` and `Candidate` |
| `src/components/productions/submission-detail-sheet.tsx` | Renders a download link for `submission.resume` in the detail panel |
| `src/actions/productions/get-role-with-submissions.ts` | Separates `files` by `type` — headshots filtered to `HEADSHOT`, resume selected as the first `RESUME` file |
| `src/actions/candidates/get-candidate.ts` | Same `type` filtering as above |

**Schema changes (migration `0004_jittery_korg.sql`):**
- Added `resumeText text` column to `Submission` table (nullable)
- `File.fileTypeEnum` already included `"RESUME"` — no enum change needed

**Architecture decisions:**

- **`unpdf` over `pdf-parse`** — `pdf-parse` requires a bundler workaround for its worker file (`pdf-parse/build/pdf.worker.entry.js`) that conflicts with the Next.js bundler. `unpdf` is zero-dependency and resolves cleanly in a serverless/edge-compatible environment. See ADR-008 in `docs/DECISIONS.md`.

- **Two-phase upload (presign then move)** — the client never sends the file through the Next.js server, so there is no 4 MB request body limit and no serverless cold-start cost from large binary uploads. The `temp/` prefix acts as a staging area; files that never reach `create-submission` are effectively orphaned (future cleanup job candidate).

- **`files` relation instead of `headshots`** — renaming the Drizzle relation from `headshots` to `files` on `Submission` and `Candidate` keeps the model extensible: new file types (audio clips, video reels) slot in without another relation rename. Consumers filter by `type` to separate headshots from resumes.

- **`resumeText` stored on `Submission`, not `File`** — a submission has at most one resume, and the text is a property of the application (what they submitted) rather than the file asset itself. Storing it on `Submission` avoids an extra join for any future screening query.

**Integration points:** Depends on R2 File Storage (`src/lib/r2.ts`) for presign and move operations. The `File` table (defined in `src/lib/db/schema.ts`) stores the permanent record. The `SubmissionDetailSheet` in `src/components/productions/submission-detail-sheet.tsx` is the display surface for the download link. `SubmissionWithCandidate` in `src/lib/submission-helpers.ts` is the shared data contract between the server actions and the Kanban/detail sheet layer — see the Role Submissions Kanban section.

*Added: 2026-03-07 — Initial resume upload documentation*
