# Features

## Inventory

| Feature | Status | Entry Point | Description |
|---------|--------|-------------|-------------|
| Design System | `shipped` | `src/styles/globals.scss` | Violet+Stone semantic token system powering all UI color, surface, and status styling |
| Auth Flow | `shipped` | `src/app/auth/(guest)/page.tsx` | Email/password login, signup, email verification, and password reset with layout-level route guards |
| App Shell (Top Nav) | `shipped` | `src/app/(app)/layout.tsx` | Sticky top navigation bar with org switcher, pending-invite badge, and mobile hamburger drawer; wraps all authenticated routes |
| Onboarding | `shipped` | `src/app/onboarding/page.tsx` | Multi-step flow for new users: check pending invites → create org → invite team; shown when user has no active organization |
| Organizations Management | `shipped` | `src/app/(app)/settings/page.tsx` | Org settings (name, slug, description, website, visibility), members table, invite/remove/role-change, ownership transfer; owner/admin only |
| Accept Invitation | `shipped` | `src/app/accept-invitation/[id]/page.tsx` | Accept an org invitation by link (token-based); works when not logged in — redirects to auth with return URL |
| Productions List | `shipped` | `src/app/(app)/productions/page.tsx` | Grid of production cards for the active org; each card shows submission count; empty state with create CTA |
| Production Detail | `shipped` | `src/app/(app)/productions/[id]/(production)/page.tsx` | Production overview with roles list and submission counts per role; inline role creation plus header share tools for the public link and QR code |
| Create Production | `shipped` | `src/app/(app)/productions/new/page.tsx` | 5-step wizard to create a new production: Details → Casting Pipeline → Submission Form → Feedback Form → Roles |
| Production Settings | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | General settings (name, slug, location, open/closed); sub-routes for pipeline template, submission form, feedback form, and reject reasons |
| Role Settings | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/page.tsx` | General settings only (name, slug, description, open/closed); pipeline, forms, and reject reasons are configured at the production level |
| Reject Reasons | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` | Configurable list of rejection reason labels at the production level; shown when moving a submission to Rejected stage |
| Email Templates | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/emails/page.tsx` | Per-production customizable email templates (submission received, rejected, selected) with variable insertion; auto-sends on submission, preview-and-confirm for rejected/selected |
| Email Storage | `shipped` | `src/lib/db/schema.ts` (`Email` table) | All submission emails — outbound (sent by Castparty) and inbound (replies from performers) — are persisted to a dedicated `Email` table and surfaced in the activity log |
| Inbound Email | `shipped` | `src/app/api/webhooks/resend/route.ts` | Performers can reply to any Castparty email; replies are routed back via a Resend inbound webhook, parsed by submission ID from the reply-to address, and stored as inbound `Email` rows |
| Admin Panel | `shipped` | `src/app/admin/page.tsx` | Internal user management (list, create, change password, delete); bypasses org scope |
| Candidates List | `shipped` | `src/app/(app)/candidates/page.tsx` | Paginated grid of candidates with search and filters (production, role); each card shows a headshot thumbnail |
| Candidate Detail | `shipped` | `src/app/(app)/candidates/[candidateId]/page.tsx` | Individual candidate profile showing personal details and all submissions across roles |
| Home Dashboard | `shipped` | `src/app/(app)/home/page.tsx` | Post-login dashboard showing the user's productions with submission counts; empty state CTA when no productions exist |
| Public Submission Flow | `shipped` | `src/app/s/[orgSlug]/page.tsx` | Public-facing casting call pages where candidates discover orgs, productions, and roles via URL slugs and submit auditions |
| URL Slugs | `shipped` | `src/lib/slug.ts` | Auto-generated URL-friendly identifiers for orgs, productions, and roles; used in public submission URLs |
| Pipeline Stages | `shipped` | `src/lib/pipeline.ts` | Configurable casting pipeline per production with system stages (Applied, Selected, Rejected) and custom user-defined stages; all roles in a production share the same pipeline |
| Custom Form Fields | `shipped` | `src/lib/types.ts` | Custom form fields in 2 contexts: production-submission and production-feedback (5 types: TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE); configured in production settings, rendered in public submission form and feedback panel |
| Role Submissions Kanban | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` | Horizontal Kanban board for reviewing and triaging submissions; drag-and-drop, bulk selection, comparison view, search, and compact/default view toggle |
| Stage Browse | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx` | Grid view of all submissions in one pipeline stage with sortable cards; bulk selection supported |
| Submission Detail Sheet | `shipped` | `src/components/productions/submission-detail-sheet.tsx` | Right-side sheet showing full submission details (headshots, resume, links, custom field answers), feedback panel, and comments; prev/next navigation; ellipsis actions menu with "Edit submission" and "Consider for another role" |
| Submission Editing | `shipped` | `src/components/productions/submission-edit-form.tsx` | In-sheet edit mode for updating contact info, links, headshots, and resume; custom form responses are read-only; changes sync to the Candidate record transactionally |
| Headshot Lightbox | `shipped` | `src/components/productions/headshot-lightbox.tsx` | Full-screen headshot viewer with zoom; uses `yet-another-react-lightbox`; dynamically imported (no SSR) from SubmissionDetailSheet |
| Bulk Submission Status | `shipped` | `src/actions/submissions/bulk-update-submission-status.ts` | Move up to 100 selected submissions to a target pipeline stage in one action; optimistic UI via BulkActionBar; full PipelineUpdate audit trail |
| Comparison View | `shipped` | `src/components/productions/comparison-view.tsx` | Side-by-side headshot comparison for multiple submissions within the same Kanban column; toggle from the stage controls |
| Comments | `shipped` | `src/actions/comments/create-comment.ts` | Freetext comments on submissions (not stage-specific); shown in submission detail sheet alongside feedback history |
| Organization Switcher | `shipped` | `src/components/organizations/org-switcher.tsx` | Multi-org switching in the top nav; lets users switch between organizations they belong to |
| R2 File Storage | `shipped` | `src/lib/r2.ts` | Cloudflare R2 utility for uploading, deleting, and moving files; uses AWS SDK S3-compatible API; used by headshot and resume upload |
| Resume Upload | `shipped` | `src/components/submissions/resume-uploader.tsx` | Candidates upload a PDF resume when submitting for a role; text is extracted server-side and stored for future search/AI use |
| Feedback Panel | `shipped` | `src/components/productions/feedback-panel.tsx` | Production team members rate submissions (4-point scale: Strong No/No/Yes/Strong Yes) and add notes + custom field answers per pipeline stage; history shown as cards |
| AutocompleteInput | `shipped` | `src/components/common/autocomplete-input.tsx` | Free-form combobox input with keyboard navigation and a filtered dropdown; not constrained to options — users can type any value |
| Drawer | `shipped` | `src/components/common/drawer.tsx` | `vaul`-based drawer primitive supporting all four directions (top/bottom/left/right); includes handle indicator for bottom drawers; shadcn-compatible API |
| useCityOptions | `shipped` | `src/hooks/use-city-options.ts` | Hook that lazy-loads and caches US + Canadian city names for use with AutocompleteInput |
| Location Fields | `shipped` | `src/lib/schemas/production.ts`, `src/lib/schemas/submission.ts` | Free-text location on productions (create + settings) and submissions (form + detail view); city autocomplete via useCityOptions |
| Landing Page | `shipped` | `src/app/page.tsx` | Single-screen hero with Castparty branding, tagline, and CTA link to /auth |
| Email Verification | `shipped` | `src/app/auth/verify-email/page.tsx` | Post-signup email verification flow |
| Password Reset | `shipped` | `src/app/auth/reset-password/page.tsx` | Token-based password reset via email link |
| Admin Organizations | `shipped` | `src/app/admin/organizations/page.tsx` | Admin-level organization management (list, delete) |
| Email Emulator | `dev-only` | `src/app/admin/emails/page.tsx` | Dev-only inbox that captures outbound emails in memory and renders them as they'd appear in a real email client; replaces console HTML dumps |
| Admin: Simulate Inbound Email | `dev-only` | `src/app/admin/simulate-email/page.tsx` | Dev-only form that inserts a synthetic inbound `Email` row for a given submission ID, enabling testing of the inbound email activity log without a live Resend webhook |
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
| `src/components/auth/forgot-password-form.tsx` | Client component; calls `authClient.requestPasswordReset({ email, redirectTo: "/auth/reset-password" })`; shows a non-revealing success alert regardless of whether the email exists |

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

- **Non-revealing forgot-password response.** The form calls `authClient.requestPasswordReset` and shows a success message unconditionally, regardless of whether the email exists in the system. This prevents account enumeration while still sending a real reset link when the address matches an account.

**Integration points:** All routes under `src/app/(app)/` depend on `(app)/layout.tsx` for auth enforcement. The `getCurrentUser()` helper lives in `src/lib/auth` — see `docs/ARCHITECTURE.md` for the Better Auth setup.

*Updated: 2026-02-28 — Initial auth flow documentation*
*Updated: 2026-03-18 — Forgot-password form is no longer a stub; now calls authClient.requestPasswordReset*

---

## Onboarding

**Overview:** A multi-step flow shown to authenticated users who do not yet belong to any organization. If the user has pending invitations, those are shown first; otherwise the flow goes directly to org creation then team invite. Exists because a new account is useless without an organization — this flow bridges sign-up and first use.

**Key files:**

| File | Role |
|------|------|
| `src/app/onboarding/layout.tsx` | Server component; calls `getCurrentUser()` (redirect to `/auth` if unauthenticated) and `hasAnyOrganization()` (redirect to `/home` if already in an org); renders the card shell |
| `src/app/onboarding/page.tsx` | Server component; fetches `getUserInvitations()` and passes them to `<OnboardingFlow />` |
| `src/components/onboarding/onboarding-flow.tsx` | Client component; owns step state with 4 possible steps: `pending-invites`, `create-org`, `invite-team`, `accept-remaining` |
| `src/components/onboarding/onboarding-invitation-list.tsx` | Client component; renders pending invitations with accept/ignore per-row actions |
| `src/components/onboarding/create-org-form.tsx` | Client component; collects org name and URL slug, auto-derives slug from name; `onComplete(organizationId)` callback advances to invite step |
| `src/components/onboarding/invite-team-form.tsx` | Client component; sends invites via `inviteMember` action one at a time; shows a sent-emails list; continues to home or remaining invites |

**How it works:**

```
GET /onboarding
  └── onboarding/layout.tsx    ← getCurrentUser() → /auth if not signed in
                               ← hasAnyOrganization() → /home if already has org
      └── onboarding/page.tsx  ← getUserInvitations()
          └── <OnboardingFlow pendingInvitations={...} />

OnboardingFlow (client)
  if pendingInvitations.length > 0:
    step = "pending-invites"
      └── <OnboardingInvitationList> — accept/ignore per invitation
          → "Continue" (requires ≥1 accepted) → router.refresh() + /home
          → "Create your own" → step = "create-org"

  step = "create-org"
    └── <CreateOrgForm onComplete={handleOrgCreated} />
          → onComplete(orgId) → step = "invite-team"

  step = "invite-team"
    └── <InviteTeamForm organizationId={orgId} />
          → if unresolved invitations remain: step = "accept-remaining"
          → else: router.refresh() + /home

  step = "accept-remaining"
    └── <OnboardingInvitationList> — resolve remaining invitations
        → "Continue" / "Skip" → router.refresh() + /home
```

**Architecture decisions:**

- **Client-side step manager (`OnboardingFlow`) instead of multi-page routes** — step transitions are instant and no intermediate state needs to survive a navigation. A single client component holding `step` and `orgId` in `useState` is simpler than URL-based step routing.

- **`onComplete` callback on `CreateOrgForm`** — the form is also used standalone (e.g. an org-switcher "create new" path). Adding an optional `onComplete` prop lets the onboarding flow intercept the success event without forking the component. When `onComplete` is absent, the form falls back to `router.push("/home")`.

- **Guard in `layout.tsx`, not `page.tsx`** — the redirect logic (no auth, already has org) lives in the layout so it applies to every child route under `/onboarding/`, not just the index page.

- **`createOrganization` does not call `revalidatePath`** — the action intentionally omits `revalidatePath("/", "layout")` after org creation. Navigation from step 1 to step 2 is handled entirely by the `onComplete` callback in `OnboardingFlow`, which calls `router.refresh()` + `router.push("/home")` at the end. Adding `revalidatePath` here caused the App Router to redirect to `/home` before the invite step could render, skipping step 2.

- **Pending invitations shown before org creation** — if a user was invited to an existing org, offering org creation first creates a confusing branch: they create a new org, then still see the old invite. Showing invitations first lets them join without creating unnecessary orgs.

**Integration points:** Depends on `hasAnyOrganization` from `src/actions/organizations/get-user-memberships.ts`. On completion, the user lands at `/home`, which is guarded by `(app)/layout.tsx` — see the Auth Flow section. Invites use the same `inviteMember` action as the Organizations Management settings page.

*Updated: 2026-03-02 — Documented multi-step onboarding flow (create org + invite team)*
*Updated: 2026-03-10 — Noted why createOrganization omits revalidatePath (invite step skipping bug)*
*Updated: 2026-03-18 — Added pending-invites step and accept-remaining step; updated flow diagram and key files*

---

## App Shell (Top Nav)

**Overview:** A sticky top navigation bar that wraps every authenticated page. Provides primary navigation links (Home, Productions, Candidates, Settings), an org switcher, and a pending-invite badge. On mobile it collapses to a hamburger button that opens a slide-in Sheet drawer. Replaced the previous sidebar layout in March 2026 — the top nav gives more horizontal content space, which matters for the Kanban board and other wide layouts.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/layout.tsx` | Server component; auth guard + data fetch; renders `TopNav` + `<main>` wrapper |
| `src/components/app/top-nav.tsx` | Client component; sticky 56px bar — logo, nav links, org switcher, pending-invite button; mobile hamburger + Sheet drawer |

**How it works:**

```
(app)/layout.tsx  (server)
  ├── getCurrentUser() → redirect /auth if unauthenticated
  ├── hasAnyOrganization() → redirect /onboarding if no org
  ├── getUserOrganizations() + getUserInvitations()
  └── <TopNav user={...} organizations={...} activeOrgId={...} pendingInvitations={...} />
        ├── Desktop: horizontal nav links (Home / Productions / Candidates / Settings*)
        │     └── isActive(href) — pathname === href || startsWith(href + "/")
        │     * Settings shown only when activeOrgRole is "owner" or "admin"
        ├── OrgSwitcher (right side)
        ├── PendingInvitesButton (right side, badge count)
        └── Mobile: hamburger → Sheet (left side) with same nav items + icons
      <main> {children} </main>
```

**Nav behavior:**

| Behavior | Detail |
|----------|--------|
| Height | 56px (`h-14`) |
| Position | `sticky top-0 z-30` |
| Active state | `isActive(href)` — true when pathname matches exactly or starts with `href/` |
| Settings visibility | Only rendered when `activeOrgRole` is `"owner"` or `"admin"` |
| Mobile nav | Sheet drawer (left side) via shadcn `Sheet`; closes automatically on route change |

**Architecture decisions:**

- **Top nav over sidebar** — Kanban boards, form builders, and candidate grids are all horizontally wide. A sidebar permanently occupies 256px of width that these layouts need. The top nav sacrifices vertical space (56px) for horizontal freedom, which suits the content better.

- **All data fetched in the server layout, passed as props to the client component** — `TopNav` is a client component (it needs `usePathname` for active link detection), but its data (orgs, invitations) comes from the server layout via props. This avoids a redundant client-side fetch and keeps the client component free of `async` data dependencies.

- **Settings nav conditional on role** — Settings is an owner/admin route. Hiding the link for members prevents confusion without adding a separate guard — the settings page itself also checks membership role.

**Integration points:** All routes under `src/app/(app)/` inherit this layout. Auth enforcement is here — see the Auth Flow section above. The `getCurrentUser()` and `getSession()` helpers live in `src/lib/auth`.

*Updated: 2026-03-18 — Replaced sidebar layout documentation with top nav (switched in commit bf4218e)*

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
| 3 | `submissionForm` | Custom questions on the candidate submission form (applies to all roles in the production) |
| 4 | `feedbackForm` | Custom fields for the production team's review notes (applies to all roles in the production) |
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
- `customStages === undefined` → seeds default production pipeline (`buildProductionStages`); `customStages` provided → seeds only the specified custom stages (`buildCustomProductionStages`).
- For each role in `roles`, inserts a `Role` row with `isOpen: true`. Roles do not receive their own form fields or pipeline — they inherit everything from the production.
- Calls `revalidatePath("/", "layout")` and returns `{ id: productionId }` — the client redirects to `/productions/[id]`.

**Architecture decisions:**

- **Local state for steps 2–4, react-hook-form for steps 1 and 5.** Steps 2–4 manage arrays that need custom add/remove/reorder callbacks (`StagesEditor`, `FormFieldsEditor`). These don't fit cleanly into react-hook-form's `useFieldArray` API (which requires object arrays with `id` keys). They are kept in plain `useState` and merged into the action payload at submit time. Steps 1 and 5 are standard form fields managed by the `useHookFormAction` form.

- **Slug auto-derived from name, user can override.** A `slugTouchedRef` tracks whether the user has manually edited the slug field. While untouched, the slug auto-updates as the user types the production name via `slugify()`. Once the user types in the slug field (or clears it to reset), the ref flips and auto-fill stops.

- **Form fields are stored on the production; roles inherit them directly.** All roles in the production share the same `submissionFormFields` and `feedbackFormFields` from the parent `Production` row — there are no per-role copies. See the Custom Form Fields section for full details.

**Integration points:** Depends on Custom Form Fields, Pipeline Stages, and URL Slugs. The wizard uses `checkSlugAvailability` (`src/actions/productions/check-slug.ts`) for real-time uniqueness validation. After creation, the user lands on the Production Detail page. Form fields and pipeline configured in the wizard apply to all roles subsequently created.

See the Feedback Panel section for how feedback form fields are rendered and validated at review time.

*Updated: 2026-03-10 — Initial Create Production documentation (5-step wizard with submission/feedback form steps)*
*Updated: 2026-03-22 — Removed role field-copy note; roles no longer receive independent field copies; pipeline is production-level*

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
*Updated: 2026-03-10 — Links field now surfaces validation errors via FieldError; root errors cleared on each submit attempt*

---

## Pipeline Stages

**Overview:** Each production has one configurable casting pipeline shared by all of its roles. Three system stages are created automatically when a production is created: Applied (receives new submissions), Selected (accepted), and Rejected (declined). Production teams can add custom stages between Applied and the terminal stages to model their callback and evaluation process.

**Key files:**

| File | Role |
|------|------|
| `src/lib/pipeline.ts` | Defines `SYSTEM_STAGES`, `DEFAULT_PRODUCTION_STAGES` constants and factory functions: `buildSystemStages()`, `buildProductionStages()`, `buildCustomProductionStages()` |
| `src/actions/productions/add-production-stage.ts` | Mutation: add a custom stage to the production pipeline |
| `src/actions/productions/remove-production-stage.ts` | Mutation: remove a custom stage (system-type stages are protected) |
| `src/actions/productions/reorder-production-stages.ts` | Mutation: reorder production pipeline stages |
| `src/actions/productions/get-production-stages.ts` | Read: fetch all stages for a production in order |
| `src/actions/productions/get-role-stages-with-counts.ts` | Read: fetch production stages with per-role submission counts (for Kanban column headers) |
| `src/actions/submissions/update-submission-status.ts` | Mutation: move a submission to a new stage; creates a PipelineUpdate audit record |

**How it works:**

Stage types are defined by a `pipelineStageTypeEnum` with values `APPLIED`, `SELECTED`, `REJECTED`, `CUSTOM`. System stages seeded at production creation via `buildSystemStages()`:

| Stage | Order | Type |
|-------|-------|------|
| Applied | 0 | `APPLIED` |
| Selected | 1000 | `SELECTED` |
| Rejected | 1001 | `REJECTED` |

Custom stages are inserted at orders between 1 and 999. The `order` integer column determines the visual pipeline sequence. Non-`CUSTOM` stages are protected from removal. Every stage transition writes a `PipelineUpdate` row recording `fromStage`, `toStage`, `submissionId`, and `changeByUserId` for a full audit trail.

**Why production-level pipeline:** All roles in a production share the same evaluation process — the casting director uses identical stages whether they're reviewing the lead or ensemble submissions. A single production-level pipeline eliminates the previous overhead of configuring the same pipeline for every role independently. The default production pipeline (`DEFAULT_PRODUCTION_STAGES`) is: Applied → Screening → Audition → Callback → Selected → Rejected. Teams configure it once before creating roles.

**Role creation defaults:** All roles — whether created via the production creation wizard or added inline on the Production Detail page — are inserted with `isOpen: true`. This means new roles are immediately open for submissions without requiring an explicit activation step. Roles can be closed later via role settings.

**Architecture decisions:** Production-scoped pipelines replace the previous two-tier design (production template + per-role override). The per-role override was removed because it created configuration confusion — directors had to maintain the same pipeline in multiple places. Terminal stage orders (1000/1001) leave a large range (1–999) for custom stages without requiring renumbering. See `docs/DECISIONS.md` ADR-007 for full rationale.

**Integration points:** New submissions from the Public Submission Flow always land in the Applied stage. Pipeline settings live at `src/app/(app)/productions/[id]/(production)/settings/pipeline/page.tsx`. Role general settings (name, description, slug, open/closed) are updated via `src/actions/productions/update-role.ts`. The `ProductionStagesEditor` component (`src/components/productions/default-stages-editor.tsx`) powers both the creation wizard step and the settings page.

**Stage deletion with feedback:** `removeProductionStage` (`src/actions/productions/remove-production-stage.ts`) accepts an optional `force: boolean` param. If submissions exist on the stage, deletion is blocked outright. If only feedback rows exist (no submissions), the action returns `{ confirmRequired: true, feedbackCount }` instead of deleting. `ProductionStagesEditor` (`src/components/productions/default-stages-editor.tsx`) intercepts this response and shows an `AlertDialog` listing the feedback count; confirming re-calls with `force: true`, which cascade-deletes the feedback rows before removing the stage.

*Updated: 2026-03-01 — Initial pipeline stages documentation*
*Updated: 2026-03-04 — Note consolidated role action (update-role handles all role mutations including slug)*
*Updated: 2026-03-04 — Corrected stage names (Applied/Selected/Rejected), replaced isSystem/isTerminal with type enum, added production-template pipeline tier, fixed StatusChange → PipelineUpdate, updated entry point paths*
*Updated: 2026-03-16 — Fixed settings entry point paths to sub-routes; documented Feedback.stageId restrict constraint bug*
*Updated: 2026-03-22 — Replaced known issue note with fixed behavior: removeProductionStage force param + AlertDialog confirmation for feedback-only stage deletes*
*Updated: 2026-03-22 — Pipeline lifted to production level: removed per-role pipeline tier; all stages are production-scoped; removed role-scoped stage actions; updated key files and architecture decisions*

---

## Role Submissions Kanban

**Overview:** The role submissions page (`/productions/[id]/roles/[roleId]`) presents all submissions for a role as a horizontal Kanban board. Each pipeline stage is a column; each submission is a draggable card. Casting directors can triage candidates by dragging cards between columns, which moves the submission to that pipeline stage. Clicking a card opens the `SubmissionDetailSheet` for a full view. This replaced a tabbed list UI because boards make the pipeline state immediately visible — casting directors need to see the whole funnel at once, not one stage at a time.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` | Server component; fetches role + submissions via `getRoleWithSubmissions`, renders `RoleSubmissions` |
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

**Bulk selection:** Cards have a checkbox (visible on hover). Selecting one or more cards shows `BulkActionBar` (`src/components/productions/bulk-action-bar.tsx`) — a fixed bottom bar with a "Move to" popover. On confirm, the `bulkUpdateSubmissionStatus` action moves all selected submissions at once and writes a `PipelineUpdate` row for each. The same optimistic pattern applies: column state is updated immediately, with rollback on error. Selection is capped at 100 submissions and auto-pruned when server data changes.

**Search:** A search input at the top of the board filters visible cards across all columns in real time by `firstName`, `lastName`, and `email`. Filtering happens entirely client-side — no server round-trip.

**Compact view:** A `ToggleGroup` in the board header switches between `default` and `compact` card sizes. Compact mode reduces each card to a single name line with headshot avatar, allowing more cards to be visible at once in a column without scrolling. The view preference is stored in a `?view=compact` URL search param so it survives navigation.

**Comparison view:** A "Compare" button in `StageControls` (`src/components/productions/stage-controls.tsx`) opens `ComparisonView` (`src/components/productions/comparison-view.tsx`). The comparison view renders headshots side-by-side for all selected submissions (or all in the column when nothing is selected) in a full-width overlay, letting the casting director evaluate headshots at a glance without opening each submission individually.

**Reject reason dialog:** Moving a submission to the Rejected stage triggers `RejectReasonDialog` (`src/components/productions/reject-reason-dialog.tsx`), which prompts the user to optionally select a configured reject reason before confirming the stage move. The selection is stored in `Submission.rejectionReason`.

**Integration points:** Depends on Pipeline Stages for column structure — stages come from `getRoleWithSubmissions` alongside the submissions. `SubmissionDetailSheet` is rendered as a portal controlled by `selectedSubmission` state. The `updateSubmissionStatus` and `bulkUpdateSubmissionStatus` actions both write to the `PipelineUpdate` table. See the Pipeline Stages section above for stage type definitions and audit trail details.

*Updated: 2026-03-04 — Documented Kanban board replacing tabbed submission list; terminal stage unlock; optimistic drag-and-drop with @dnd-kit/react v0.3*
*Updated: 2026-03-10 — Added candidate photo thumbnail (Avatar with headshot/initials fallback) on KanbanCard*
*Updated: 2026-03-16 — Fixed entry point path to (role) route group; documented bulk selection and BulkActionBar*
*Updated: 2026-03-18 — Added search, compact view, comparison view, and reject reason dialog*

---

## Custom Form Fields

**Overview:** Productions define a custom application form that candidates fill out when submitting an audition. This supplements the standard submission fields (name, email) with production-specific questions — e.g., "What experience do you have with Shakespeare?" or "Can you attend a Saturday rehearsal?" Configured in production settings; rendered dynamically in the public submission form and feedback panel. All roles in a production share the same configured forms.

**How it works:** Form fields are stored as JSONB in two columns on `Production`:

| Column | Table | Rendered in |
|--------|-------|------------|
| `submissionFormFields` | `Production` | Public submission form for all roles |
| `feedbackFormFields` | `Production` | Feedback panel for all roles |

This creates **two contexts**: production-submission and production-feedback. Each context has its own set of server actions (`add-*`, `update-*`, `remove-*`, `reorder-*`) and its own editor component.

The `CustomForm` type in `src/lib/types.ts` defines the field shape: `id`, `type`, `label`, `description`, `required`, and `options` (for SELECT/CHECKBOX_GROUP). Responses are stored as JSONB in `Submission.answers` and `Feedback.answers` using the `CustomFormResponse` type: `{ fieldId, textValue, booleanValue, optionValues }`.

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
| `src/lib/schemas/form-fields.ts` | `customFormItemSchema` (shared field shape) + CRUD schemas for each context + `systemFieldConfigSchema` |
| `src/components/productions/form-fields-editor.tsx` | `FormFieldsEditor` — generic editor sub-component; also exports a `ProductionFormFieldsEditor` wrapper wired to production actions |
| `src/components/productions/default-feedback-form-fields-editor.tsx` | `ProductionFeedbackFormFieldsEditor` — production feedback form editor wired to production actions |
| `src/components/productions/form-builder.tsx` | `FormBuilder` — layout shell for submission editors (system field toggles + custom field editor side-by-side with a preview) |
| `src/components/productions/feedback-form-builder.tsx` | `FeedbackFormBuilder` — layout shell for feedback editors (custom field editor + feedback preview) |
| `src/actions/productions/` | 8 action files: `add/update/remove/reorder` × 2 contexts (submission + feedback) |

**Where form fields are configured:**

1. **During production creation** — the 5-step wizard (`src/components/productions/create-production-form.tsx`) includes a Submission Form step and a Feedback Form step. Fields are stored on the `Production` record and apply to all roles.
2. **In production settings** — after creation, fields are managed via dedicated sub-routes: `settings/submission-form/` and `settings/feedback-form/`.

**Architecture decisions:** All configuration lives on `Production` rather than per-role. This removes the previous need for roles to store (and diverge from) their own form field copies. A casting director configures the submission questionnaire once and it applies uniformly to every role in the production. JSONB is used for form field storage rather than a normalized `form_fields` table because the field shape is schema-on-read (typed via `CustomForm`), the data is always fetched with its parent production, and the flexibility to add new field types without migrations outweighs the join overhead.

**Client-side required-field validation:** The `SubmissionForm` and `FeedbackPanel` both validate required custom fields client-side before the server action fires. The Zod schema for `answers` uses `z.record(z.string(), z.string())`, which accepts empty strings, so empty required fields pass schema validation. Both forms walk `submissionFormFields` / `feedbackFormFields` before calling `action.execute`, set per-field errors via `form.setError(\`answers.${field.id}\`, ...)`, and abort if any required field is blank. `form.clearErrors("root")` is called at the start of each submission attempt to clear stale server errors.

**defaultValues for `answers`:** Both forms initialize `defaultValues.answers` by iterating the field list — text-type fields get `""`, TOGGLE fields get `"false"`. This ensures `form.reset(defaultValues)` properly clears custom fields after a successful submission (an empty `{}` left stale values in place).

**Integration points:** The `SubmissionForm` in `src/components/submissions/submission-form.tsx` reads `submissionFormFields` from the production (via the role's production relation) and renders the appropriate input for each field type. Responses are submitted alongside standard fields via the `create-submission` action. The feedback form is rendered via `FeedbackPanel` in `src/components/productions/feedback-panel.tsx` — see the Feedback Panel section.

*Updated: 2026-03-06 — Initial custom form fields documentation*
*Updated: 2026-03-10 — Split submission vs. feedback field contexts; documented creation wizard integration and role field inheritance; noted customFormItemSchema as shared schema; updated key files table*
*Updated: 2026-03-10 — Documented client-side required-field validation and defaultValues.answers initialization (both SubmissionForm and FeedbackPanel)*
*Updated: 2026-03-16 — Documented all 4 contexts explicitly; expanded key files table; added technical debt note (24 action files, 4 editor components, 4 schema groups); fixed settings entry point paths to sub-routes*
*Updated: 2026-03-22 — Config lifted to production level: role-level form field contexts removed; 4 contexts → 2; role sub-routes for forms removed; key files and architecture decisions updated; technical debt section removed (role duplication eliminated)*

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

---

## Feedback Panel

**Overview:** The feedback panel lets production team members record a structured rating and notes for each submission while reviewing it. It lives inside `SubmissionDetailSheet` and renders as an expandable accordion section below the feedback history list. Every submission review produces a `Feedback` record linked to the submission's current pipeline stage, creating a per-stage audit trail of team opinions.

**Key files:**

| File | Role |
|------|------|
| `src/components/productions/feedback-panel.tsx` | Client component; renders feedback history list + collapsible feedback form |
| `src/actions/feedback/create-feedback.ts` | Mutation: inserts a `Feedback` row linked to submission + pipeline stage |
| `src/lib/schemas/feedback.ts` | `createFeedbackFormSchema` (form) + `createFeedbackActionSchema` (extends with `submissionId`, `stageId`) |
| `src/lib/submission-helpers.ts` | `FeedbackData` interface; `feedback` array on `SubmissionWithCandidate` |

**How it works:**

```
FeedbackPanel (client)
  ├── Feedback list (scrollable, top section)
  │     └── Each entry: card/comment bubble (border, bg-muted/30, rounded, padding)
  │           ├── Header row: Avatar + name + timestamp (left) | rating badge + stage badge (right)
  │           ├── Notes paragraph (if present)
  │           └── Custom field answers (label + value pairs, filtered for non-empty)
  │
  └── Accordion ("Add feedback") — collapsible, anchored to bottom
        └── form onSubmit → form.handleSubmit(handler)
              ├── form.clearErrors("root")
              ├── Client-side required custom field validation (see Custom Form Fields section)
              ├── [abort if any required field is blank]
              └── action.execute({ rating, notes, answers, submissionId, stageId })
                    onSuccess → form.reset(defaultValues); router.refresh()
                    onError   → form.setError("root", serverError)
```

**Rating system:**

Ratings are stored as an enum (`feedbackRatingEnum`) and carry a numeric association for sorting and display. All labels include their number so reviewers can mentally rank them without re-reading definitions.

| Enum value | Numeric | Label |
|-----------|---------|-------|
| `STRONG_YES` | 4 | "4 — Strong yes" |
| `YES` | 3 | "3 — Yes" |
| `NO` | 2 | "2 — No" |
| `STRONG_NO` | 1 | "1 — Strong no" |

Radio buttons in the form are ordered 4 → 1 (top to bottom). The rating field is required — the Zod schema uses a custom error message (`"Select a rating."`) rather than the default enum error. The submit button is never disabled; schema validation surfaces the error message inline on submit if no rating is selected.

**Rating badge styling:** `STRONG_YES` and `YES` render with a green success badge; `NO` and `STRONG_NO` render with the destructive (red) badge variant.

**Form reset after success:** `defaultValues.answers` is built from `feedbackFormFields` at component render time — text fields initialize to `""`, TOGGLE fields to `"false"`. `form.reset(defaultValues)` is called in `onSuccess`, which correctly clears all custom fields. Passing an empty `{}` as default would leave stale values after reset.

**Architecture decisions:**

- **Stage captured at submit time, not display time.** The `stageId` is read from `submission.stageId` when the form submits, not when the panel opens. This means feedback is always tagged to the stage the submission was in at review time — important for understanding how a candidate was rated at each pipeline step.

- **Submit button always enabled.** Disabling the button until a rating is selected adds friction for a common path (rating is almost always selected first). Instead, the error appears inline only if the user actually tries to submit without one — the schema's custom message ("Select a rating.") is clear enough.

- **Feedback list as cards, not a flat list.** Each entry uses a bordered, muted-background card to visually group all the data for one reviewer's opinion (header, notes, custom field answers) before the next entry starts. A flat list would require extra separators and makes it harder to scan who said what at a glance.

**Integration points:** `FeedbackPanel` is rendered inside `SubmissionDetailSheet` (`src/components/productions/submission-detail-sheet.tsx`). It receives `submission` (the `SubmissionWithCandidate` object, which includes the `feedback` array) and `feedbackFormFields` (the role's feedback form configuration). Depends on Custom Form Fields for the structured fields section — see that section for the shared `defaultValues.answers` initialization and required-field validation pattern. The `createFeedback` action is a `secureActionClient` action that requires an authenticated session.

*Added: 2026-03-10 — Initial feedback panel documentation (rating system, form validation, card list UI)*

---

## Comments

**Overview:** Production team members can leave freetext comments on any submission. Unlike feedback, comments are not tied to a pipeline stage and have no rating or structured fields — they are a lightweight thread of notes visible to everyone on the team. Exists because feedback is stage-anchored (it records "how I felt at this stage"), while comments serve a different purpose: quick coordination notes like "follow up with this person" or "check availability before advancing."

**Key files:**

| File | Role |
|------|------|
| `src/actions/comments/create-comment.ts` | Mutation: inserts a `Comment` row; validates that the submission belongs to the user's active org |
| `src/lib/schemas/comment.ts` | `createCommentFormSchema` (content, max 5000 chars) + `createCommentActionSchema` (extends with `submissionId`) |
| `src/lib/db/schema.ts` | `Comment` table: `submissionId`, `submittedByUserId`, `content`, `createdAt`, `updatedAt` |
| `src/lib/submission-helpers.ts` | `CommentData` interface; `comments` array on `SubmissionWithCandidate` |

**How it works:**

Comments are displayed inside `SubmissionDetailSheet` alongside feedback history. The `create-comment` action is a standard `secureActionClient` action. It loads the submission to verify org ownership via the ownership chain `submission → role → production → organizationId`, then inserts the `Comment` row. After insert, `revalidatePath("/", "layout")` refreshes the sheet.

**Architecture decisions:**

- **No stage context on comments** — feedback is explicitly stage-anchored (casting directors want to know "what did we think at the callback stage?"). Comments have no stage context, making them suitable for operational notes that aren't tied to evaluation ("she confirmed availability for July"). Mixing these into feedback would pollute the per-stage history.

- **5000 char limit on content** — long enough for a detailed note, short enough to stay readable as a chat-style thread. No markdown, no mentions, no threading — intentionally minimal for the community theatre persona.

**Integration points:** Comments are fetched as part of `getCandidate` (`src/actions/candidates/get-candidate.ts`) and the role-with-submissions query, making them available in both the Kanban submission detail sheet and the candidate detail page. The `Comment` table is defined alongside `Feedback` in `src/lib/db/schema.ts`.

*Added: 2026-03-18 — Initial comments documentation*

---

## Submission Editing

**Overview:** Casting directors can edit a submission's contact details, links, headshots, and resume from inside the submission detail sheet without navigating away. Exists because performers frequently share outdated contact information at audition sign-in, and casting directors need a quick path to correct it without creating a new submission.

**Key files:**

| File | Role |
|------|------|
| `src/components/productions/submission-edit-form.tsx` | Client form component; pre-populates fields from `SubmissionWithCandidate`; uses `useHookFormAction` to wire `updateSubmission` to react-hook-form |
| `src/components/productions/submission-actions-menu.tsx` | Popover menu triggered by the ellipsis button in the sheet header; exposes "Edit submission" and "Consider for another role" |
| `src/components/productions/submission-detail-sheet.tsx` | Owns the `isEditing` boolean; swaps between the info panel and `SubmissionEditForm` |
| `src/components/productions/submission-info-panel.tsx` | View mode info panel; form responses section now iterates all configured questions, showing "Not answered" in italics for unanswered ones |
| `src/actions/submissions/update-submission.ts` | `secureActionClient` action; moves new headshots and resume from `temp/` to permanent R2 paths, enforces max-10-headshot cap, blocks resume upload if one already exists, runs the submission + candidate update in a single Drizzle transaction |
| `src/components/submissions/headshot-uploader.tsx` | `maxFiles` prop added; edit form passes the remaining headshot slots as the cap |
| `src/lib/schemas/submission.ts` | `updateSubmissionFormSchema` + `updateSubmissionActionSchema` |

**How it works:**

```
SubmissionDetailSheet
  ├── Header: SubmissionActionsMenu (ellipsis popover)
  │     ├── "Edit submission"         → setIsEditing(true)
  │     └── "Consider for another role" → opens existing consider-for-role flow
  │
  ├── [isEditing = false] → SubmissionInfoPanel (read-only)
  │
  └── [isEditing = true]  → SubmissionEditForm
        ├── Contact fields: firstName, lastName, email, phone, location
        ├── Links editor (existing LinksEditor component)
        ├── HeadshotUploader — adds new headshots only (max 10 total); existing headshots not removable
        ├── ResumeUploader   — only shown when submission has no resume; hides once one exists
        ├── Form responses   — read-only display (all questions, "Not answered" for blanks)
        └── Save → updateSubmission action
              ├── Move new headshots from temp/ → headshots/ in R2; insert File rows
              ├── Move new resume from temp/ → resumes/ in R2; insert File row + extract PDF text
              ├── Email conflict check (if email changed)
              └── db.transaction: UPDATE Submission + UPDATE Candidate
```

**Edit constraints (intentional):**

- **Headshots and resumes cannot be removed** — deletion would require a separate confirmation and R2 cleanup flow. The add-only path covers the common case (adding a better headshot) without the complexity of removal.
- **Resume upload only when none exists** — a casting director should not silently overwrite a resume the performer submitted. If a replacement is needed, the old one must be deleted first (not yet supported in the UI).
- **Custom form responses are read-only** — form answers are part of the performer's original submission record. Allowing edits would obscure what the candidate actually submitted, undermining audit integrity.

**Architecture decisions:**

- **Submission and Candidate updated in the same transaction** — a `Candidate` row is the cross-production identity record for a performer. When contact details change on a submission, the canonical candidate record must stay in sync. Doing both in a single transaction prevents a partial update where the submission email differs from the candidate email.
- **Email conflict check inside the transaction** — checking for a conflicting candidate email and applying the update in the same transaction prevents a race condition where another concurrent update could insert a duplicate email between check and write.
- **`maxFiles` prop on `HeadshotUploader`** — the uploader previously had a hardcoded cap. Exposing it as a prop lets the edit form pass `10 - existingCount` as the limit, keeping the enforced cap consistent between client UX and the server action's `existingCount + newHeadshots.length > 10` check.

**Integration points:** `updateSubmission` uses the same two-phase R2 upload pattern (presign → move from `temp/`) as `create-submission.ts` — see the Resume Upload section. The `SubmissionActionsMenu` replaces the standalone "Consider for role" button that previously sat in the sheet header, so the consider-for-role flow is unchanged but now accessed through the menu. Both view mode (`SubmissionInfoPanel`) and edit mode show all form questions including unanswered ones — this change to `submission-info-panel.tsx` makes the empty-question display consistent across both modes.

*Added: 2026-03-24 — Initial submission editing documentation*

---

## Reject Reasons

**Overview:** Productions and roles can define a list of configurable rejection reason labels (e.g. "Not the right fit", "Schedule conflict"). When a submission is moved to the Rejected stage via the Kanban board, the user is prompted to optionally select one of these reasons. The chosen reason is stored in `Submission.rejectionReason`. Exists because a blank rejection gives the team no recall later when reviewing decisions.

**Key files:**

| File | Role |
|------|------|
| `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` | Production-level reject reasons editor page |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/reject-reasons/page.tsx` | Role-level reject reasons editor page |
| `src/actions/productions/update-production-reject-reasons.ts` | Mutation: updates `Production.rejectReasons` JSONB array |
| `src/actions/productions/update-role-reject-reasons.ts` | Mutation: updates `Role.rejectReasons` JSONB array |
| `src/components/productions/reject-reasons-editor.tsx` | Shared editor component for adding/removing reason strings; used at both production and role level |
| `src/components/productions/reject-reason-dialog.tsx` | Dialog shown when moving a submission to Rejected; lists the role's (or production's) reasons for selection |

**How it works:** Reject reasons are stored as a `string[]` in the `rejectReasons` JSONB column on both `Production` and `Role` tables. The editor is a simple list with add/remove. When a submission is dragged (or moved via BulkActionBar) to a Rejected-type stage, `RejectReasonDialog` opens. The user can select a pre-configured reason or skip. On confirm, `updateSubmissionStatus` is called with an optional `rejectionReason` field, which is written to `Submission.rejectionReason`.

**Integration points:** `RejectReasonDialog` is rendered inside `RoleSubmissions`. It receives the `rejectReasons` array from the role (falling back to the production's reasons when the role has none — the fallback logic follows the same form-inheritance pattern as submission/feedback forms). The reason is stored on `Submission.rejectionReason` and displayed in `SubmissionDetailSheet`.

*Added: 2026-03-18 — Initial reject reasons documentation*

---

## Email Emulator

**Overview:** A development-only inbox that intercepts outbound emails and stores them in memory instead of sending them via Resend. The production team can browse captured emails at `/admin/emails` and preview rendered HTML exactly as an email client would display it. Exists because the old approach (logging the full HTML string to the console) was unreadable for styled transactional emails.

**How it works:**

```
sendEmail() called (dev only)
  └── render(react) → HTML string   ← @react-email/components
  └── addEmail({ to, subject, html, text })
        └── globalThis.__devEmails.unshift(email)   ← capped at 200
  └── logger.info("[Email] To: … | Subject: …")    ← short console line only

GET /admin/emails
  └── AdminEmailsPage (server)
        └── getEmails() → StoredEmail[]
        └── <AdminEmailsClient emails={...} />
              └── Table of emails, each row links to /admin/emails/[id]

GET /admin/emails/[id]
  └── AdminEmailDetailPage (server)
        └── getEmailById(id) → StoredEmail | undefined → notFound()
        └── <AdminEmailDetailClient email={...} />
              └── Metadata (subject, to, sent time)
              └── <iframe srcDoc={email.html} sandbox="…" />
                    └── JS resize listener sets iframe height to body.scrollHeight
```

**Key files:**

| File | Role |
|------|------|
| `src/lib/email-dev-store.ts` | In-memory store: `addEmail`, `getEmails`, `getEmailById`; backed by `globalThis.__devEmails` (survives HMR); all functions guard on `IS_DEV` |
| `src/lib/email.ts` | `sendEmail()` entry point; dev branch renders React to HTML and calls `addEmail`; production branch calls Resend |
| `src/app/admin/emails/page.tsx` | Server page; reads `getEmails()` and passes array to `AdminEmailsClient`; `force-dynamic` so the list refreshes on every request |
| `src/app/admin/emails/[id]/page.tsx` | Server page; resolves email by ID, calls `notFound()` if missing, passes to `AdminEmailDetailClient` |
| `src/components/admin/admin-emails-client.tsx` | Client component; renders the email table or an empty state; each subject cell links to the detail route |
| `src/components/admin/admin-email-detail-client.tsx` | Client component; renders metadata and a sandboxed iframe; a `load` event listener resizes the iframe to its content height |
| `src/app/admin/layout.tsx` | Admin shell; restricted to `IS_DEV` via `notFound()`; "Emails" nav link added alongside "Users" and "Organizations" |

**Architecture decisions:**

- **`globalThis` for storage, not React state or a module variable.** Next.js dev mode re-imports modules on HMR, which would reset a module-level array between saves. `globalThis.__devEmails` persists across module reloads for the lifetime of the Node process, so in-flight emails survive hot reloads.

- **Capped at 200 entries.** The store trims itself after every `addEmail` call. This prevents unbounded memory growth during a long dev session without adding any cleanup ceremony for the developer.

- **`IS_DEV` guards on every store function, not just the call sites.** Each of `addEmail`, `getEmails`, and `getEmailById` returns early (empty/undefined) when `IS_DEV` is false. This makes it safe to import the store anywhere without risking a production code path writing to or reading from the in-memory store.

- **Sandboxed iframe for HTML preview.** `sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"` allows links to open (email CTAs need to be testable) while blocking script execution. This prevents React Email's inline scripts from running in the admin panel's DOM context.

- **`force-dynamic` on the list page.** Email sends write to the in-memory store as a side effect, not to the database, so the Next.js cache would serve a stale snapshot. `force-dynamic` ensures the page always reads the live store on request.

**Integration points:** `sendEmail()` in `src/lib/email.ts` is the sole write path. The admin layout at `src/app/admin/layout.tsx` gates access to `IS_DEV` — this feature is unreachable in production by the same mechanism that hides the entire admin panel. No database, no migrations, no external service dependency.

*Added: 2026-03-11 — Initial email emulator documentation*
*Updated: 2026-03-22 — Removed stale "fire-and-forget" phrasing (sendEmail is now async and propagates errors)*

---

## Email Templates

**Overview:** Casting directors can customise three per-production email templates — Submission Received, Rejected, and Selected — each with a subject line and plain-text body. Templates support four variables (`{{first_name}}`, `{{last_name}}`, `{{production_name}}`, `{{role_name}}`). The Submission Received email is auto-sent whenever a performer submits. Rejected and Selected emails show the casting director an interpolated preview before they confirm the send. Exists because performers had no acknowledgement loop after submitting or being decided on, which is table-stakes communication for any casting process.

**Key files:**

| File | Role |
|------|------|
| `src/lib/email-template.ts` | `interpolateTemplate()`, `DEFAULT_EMAIL_TEMPLATES`, `TEMPLATE_VARIABLES`, `TEMPLATE_VARIABLE_LABELS` |
| `src/lib/emails/template-email.tsx` | React Email component; wraps interpolated body in `EmailLayout`; splits on `\n\n` for paragraphs |
| `src/lib/schemas/email-template.ts` | Zod schemas for template validation (`.trim()` before `.min(1)` on subject/body) |
| `src/actions/productions/update-email-templates.ts` | `secureActionClient` action to save all three templates at once |
| `src/actions/submissions/send-submission-email.tsx` | `sendSubmissionEmail(submissionId, templateType, customSubject?, customBody?, sentByUserId?)` — plain async function; calls `sendEmail()`, then inserts an `Email` row regardless of send outcome; `sendSubmissionEmailAction` — `secureActionClient` wrapper for client use (rejected/selected) |
| `src/components/productions/email-templates-form.tsx` | Accordion form with three collapsible sections; `useHookFormAction`; "Submission Received" open by default |
| `src/components/productions/variable-insert-buttons.tsx` | Row of small buttons that insert `{{variable_name}}` at the cursor position (appends to end when unfocused) |
| `src/components/productions/email-preview-dialog.tsx` | Reusable preview dialog: shows interpolated subject + body, "Confirm & send email" / "Confirm without email" / "Cancel" |
| `src/app/(app)/productions/[id]/(production)/settings/emails/page.tsx` | Settings page; passes production id and stored `emailTemplates` to `EmailTemplatesForm` |

**Data model:** `emailTemplates` is a JSONB column on the `Production` table typed as `EmailTemplates` (defined in `src/lib/types.ts`). The column defaults to `DEFAULT_EMAIL_TEMPLATES` so every new production arrives pre-configured. Pre-migration rows that have `null` in this column fall back to `DEFAULT_EMAIL_TEMPLATES` at runtime inside `sendSubmissionEmail`.

**How it works:**

```
Submission Received (auto-send):
  createSubmission action
    └── after files are stored, try {
          sendSubmissionEmail(submissionId, "submissionReceived")
            └── fetch submission + role + production from DB
            └── interpolateTemplate(template, variables)
            └── sendEmail({ to, subject, react: <TemplateEmail />, text }) → { html }
            └── db.insert(Email) with status="sent"|"failed"  ← always recorded
        } catch { logger.error(...) }  ← email failure never breaks the submission

Rejected (preview & confirm):
  SubmissionDetailSheet detects stage type === REJECTED
    └── opens enhanced RejectReasonDialog
          ├── top: rejection reason radio group (existing)
          └── bottom: read-only interpolated email preview
          └── "Reject & send email" → onConfirm(reason, true)
                └── updateSubmissionStatus → then sendSubmissionEmailAction("rejected")
          └── "Reject without email" → onConfirm(reason, false)

Selected (preview & confirm):
  SubmissionDetailSheet detects stage type === SELECTED
    └── opens EmailPreviewDialog (client-side interpolation for preview)
          └── "Select & send email" → onConfirm(true)
                └── updateSubmissionStatus → then sendSubmissionEmailAction("selected")
          └── "Select without email" → onConfirm(false)

Error handling (rejected/selected):
  If sendSubmissionEmailAction fails after a successful status update →
    show error toast; status change is NOT rolled back
```

**Architecture decisions:**

- **Two exports from `send-submission-email.tsx`: plain function + action wrapper.** The submission-received email is sent inside `create-submission.ts` (a server function, no auth required), so it needs a plain `async function` it can `await` directly. Rejected/selected emails are triggered from client components, so they need a `secureActionClient` action. Rather than duplicating the DB query and interpolation logic, the action is a thin wrapper around the same plain function.

- **Fire-and-forget with try/catch for submission-received.** Email delivery is secondary to the submission being recorded. Wrapping the call in try/catch and logging the error (never rethrowing) means a transient Resend failure cannot block a performer's audition from being saved. Rejected/selected emails follow a different pattern: they are initiated explicitly by the casting director, so the client receives the error and shows a toast.

- **Client-side interpolation for preview, server-side for actual send.** The preview in the dialog is rendered by calling `interpolateTemplate` directly in the browser (using the variables available in client state). The actual `sendEmail` call always goes through the server action, which re-fetches the submission data and re-interpolates — ensuring the email content matches DB state even if the client variables are stale.

- **`EmailPreviewDialog` is generic, not coupled to selection.** The dialog accepts `actionLabel`, `previewSubject`, `previewBody`, and `onConfirm(sendEmail: boolean)` — no assumption about which template type is being previewed. This makes it reusable if additional preview-before-send flows are added (e.g., a manual "Send update" button).

**Integration points:** The `Production` schema change (`emailTemplates` JSONB column) is in `src/lib/db/schema.ts`. `RejectReasonDialog` (`src/components/productions/reject-reason-dialog.tsx`) gained `emailTemplate`, `submissionData`, and an updated `onConfirm(reason, sendEmail)` signature. `SubmissionDetailSheet` (`src/components/productions/submission-detail-sheet.tsx`) is the coordinator for both the rejection and selection email flows — it intercepts stage moves, opens the appropriate dialog, and fires the send action on confirmation. `create-submission.ts` is the only caller of the plain `sendSubmissionEmail` function. The Email Emulator (`/admin/emails` in dev) captures all outbound emails, including template emails — see the Email Emulator section above. Every successful or failed send is also persisted to the `Email` table — see the Email Storage section below.

*Added: 2026-03-23 — Initial email templates documentation*
*Updated: 2026-03-24 — Reflect Email Storage integration: sendSubmissionEmail now inserts an Email row; updated signature and flow diagram*

---

## Email Storage

**Overview:** All submission emails — both outbound (sent by Castparty to performers) and inbound (performer replies) — are persisted to a dedicated `Email` table. Stored emails surface in the submission detail sheet's activity log alongside comments, feedback, and stage changes, giving casting directors a full chronological record of all two-way communication with a performer. Exists because zero production persistence meant there was no audit trail of what was sent or when, and because inbound replies had nowhere to land until the inbound email feature was added.

**Key files:**

| File | Role |
|------|------|
| `src/lib/db/schema.ts` (`Email` table) | Schema: id, organizationId, submissionId (nullable), sentByUserId (nullable), direction (`"outbound"` / `"inbound"`), fromEmail (nullable), toEmail, subject, bodyText, bodyHtml, templateType (nullable), sentAt |
| `src/lib/submission-helpers.ts` | `EmailData` interface (includes `direction` and `fromEmail`); `ActivityItem` union type; `buildActivityList()` merges and sorts all activity by timestamp |
| `src/actions/submissions/send-submission-email.tsx` | Inserts an outbound `Email` row after every send; `direction` defaults to `"outbound"`, `fromEmail` is `null` for outbound |
| `src/app/api/webhooks/resend/route.ts` | Inserts inbound `Email` rows via the Resend webhook; sets `direction="inbound"` and `fromEmail` to the sender's address |
| `src/actions/productions/get-production-submissions.ts` | Includes `emails` in the Submission query via Drizzle `with`; maps to `EmailData[]` |
| `src/actions/candidates/get-candidate.ts` | Same `emails` inclusion for the candidate detail view |
| `src/components/productions/feedback-panel.tsx` | Renders `EmailItem` in the activity feed; inbound items show a blue left border and a "Reply" badge; outbound items show the sender's name or "System" |

**Data model:**

```
Email
  id              text PK          (generateId("eml") prefix)
  organizationId  text NOT NULL     FK → Organization (cascade delete)
  submissionId    text NULL         FK → Submission (cascade delete) — nullable for future org-level emails
  sentByUserId    text NULL         FK → User (set null on delete) — null for system sends and all inbound
  direction       text NOT NULL     "outbound" | "inbound"  default "outbound"
  fromEmail       text NULL         sender address — populated for inbound only
  toEmail         text NOT NULL
  subject         text NOT NULL
  bodyText        text NOT NULL
  bodyHtml        text NOT NULL
  templateType    text NULL         e.g. "submissionReceived", "rejected", "selected" — null for inbound and free-form
  sentAt          timestamp         default now()
```

Indexes: `email_submissionId_idx`, `email_organizationId_idx`.

**How it works:**

```
Outbound:
  sendSubmissionEmail(submissionId, templateType, ...)
    └── fetch submission + interpolate template (or use customSubject/customBody)
    └── sendEmail({ to, subject, react, text, replyTo: "reply+{id}@{INBOUND_EMAIL_DOMAIN}" })
    └── db.insert(Email).values({ direction: "outbound", fromEmail: null, ... })

Inbound (via Resend webhook):
  POST /api/webhooks/resend
    └── verify Svix signature (RESEND_WEBHOOK_SECRET)
    └── filter to "email.received" events only
    └── parse submissionId from to address: reply+{submissionId}@{domain}
    └── verify submission exists in DB
    └── db.insert(Email).values({ direction: "inbound", fromEmail: sender, ... })

Activity log (FeedbackPanel):
  buildActivityList(submission)
    └── merges feedback + comments + stageChanges + emails + submitted
    └── sorted descending by sentAt / createdAt
    └── EmailItem:
          inbound → blue left border, "Reply" badge, fromEmail as sender name
          outbound → sentBy.name or "System", no badge
```

**Architecture decisions:**

- **`direction` column instead of a separate table.** Inbound and outbound emails share the same `Email` table because they represent the same conceptual thing — a piece of correspondence attached to a submission. A `direction` column is cheaper than a join and keeps the activity log query simple.

- **`fromEmail` is nullable and only set for inbound.** For outbound emails, Castparty is always the sender — storing the from address would be redundant and misleading (it would vary by environment). For inbound, `fromEmail` is the performer's address and is the only source of sender identity since there is no `sentByUserId` for incoming mail.

- **`sentByUserId` is nullable for inbound rows.** Inbound emails arrive via webhook, not from an authenticated session. The column stays null for all inbound rows. The UI handles this: for inbound, the sender is shown as `fromEmail ?? "Candidate"`.

- **`submissionId` and `templateType` are nullable to support future use cases.** `submissionId` being nullable allows org-level emails (e.g., a broadcast to all applicants) to be stored without a specific submission. `templateType` being nullable handles both inbound emails and free-form outbound emails.

- **`bodyHtml` is stored even though only `bodyText` is shown in the UI.** The rendered HTML is available for a future "view full email" detail view without re-rendering. Storing it at send/receive time ensures the preview always matches what was actually sent or received, even if the template changes later.

**Integration points:** `sendSubmissionEmail()` in `src/actions/submissions/send-submission-email.tsx` is the outbound write path. The Resend webhook at `src/app/api/webhooks/resend/route.ts` is the inbound write path. `get-production-submissions.ts` and `get-candidate.ts` are the read paths. The `Email` table relations are defined in `src/lib/db/schema.ts`. The activity log in `src/lib/submission-helpers.ts` is shared by the production submission board and the candidate detail view. See the Inbound Email section below for the full inbound flow; see the Email Templates section above for the outbound send logic; see the Email Emulator section for the dev-mode inbox.

*Added: 2026-03-24 — Initial email storage documentation*
*Updated: 2026-03-28 — Reflect inbound email support: added direction/fromEmail columns, removed status column, updated data model and how-it-works flow*

---

## Inbound Email

**Overview:** Performers can reply directly to any email Castparty sends them. Each outbound email includes a `replyTo` address in the format `reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}`. When a performer replies, Resend receives the message, fires an `email.received` webhook, and Castparty stores the reply as an inbound `Email` row linked to the correct submission. The reply surfaces immediately in the submission activity log alongside outbound emails, comments, and stage changes — giving casting directors a complete two-way conversation thread without leaving the app.

**Key files:**

| File | Role |
|------|------|
| `src/app/api/webhooks/resend/route.ts` | Webhook handler: verifies Svix signature, parses `submissionId` from the `to` address, looks up the submission, and inserts an inbound `Email` row |
| `src/actions/submissions/send-submission-email.tsx` | Sets `replyTo: "reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}"` on every outbound send |
| `src/lib/db/schema.ts` (`Email` table) | `direction` and `fromEmail` columns support inbound storage; see Email Storage section |
| `src/components/productions/feedback-panel.tsx` | `EmailItem` renders inbound rows with a blue left border and a "Reply" badge; `fromEmail ?? "Candidate"` is shown as the sender |
| `src/actions/admin/simulate-inbound-email.ts` | Dev/admin action to insert a synthetic inbound row — for testing without a live webhook |
| `src/app/admin/simulate-email/page.tsx` | Admin UI for the simulate action (dev-only) |

**How it works:**

```
Outbound send:
  sendSubmissionEmail(submissionId, ...)
    └── replyTo = "reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}"
    └── sendEmail({ ..., replyTo })    ← Resend delivers to performer with reply-to set

Performer replies:
  Resend receives the reply on the inbound domain
    └── fires POST /api/webhooks/resend with "email.received" payload

POST /api/webhooks/resend:
  1. Read raw body + svix-id / svix-timestamp / svix-signature headers
  2. new Webhook(RESEND_WEBHOOK_SECRET).verify(body, headers)   ← Svix
  3. Filter: payload.type !== "email.received" → 200 OK (ignore)
  4. Scan payload.data.to[] for /^reply\+([^@]+)@/ → extract submissionId
  5. db.query.Submission.findFirst({ where: eq(id, submissionId) })
     └── 404-like: log + 200 OK (do not expose 404 to Resend)
  6. db.insert(Email).values({
       direction: "inbound",
       fromEmail: payload.data.from,
       toEmail: payload.data.to.join(", "),
       subject, bodyText, bodyHtml,
       sentByUserId: null, templateType: null
     })
  7. Return 200 OK

Activity log:
  EmailItem({ email }) where email.direction === "inbound"
    → blue left border (border-l-4 border-l-blue-400/40 bg-blue-50/30)
    → "Reply" badge (border-blue-300 text-blue-600)
    → headline: "{fromEmail ?? 'Candidate'} replied"
    → collapsible body preview (100-char truncation)
```

**Architecture decisions:**

- **Submission ID embedded in the reply-to address.** The `reply+{submissionId}@{domain}` scheme lets the webhook handler identify which submission a reply belongs to without any external lookup table or OAuth redirect. The submission ID is extracted from the `to` address with a simple regex (`/^reply\+([^@]+)@/`). This approach is the same pattern used by Intercom, Zendesk, and other tools that route inbound email to application records.

- **Svix for webhook signature verification.** Resend uses Svix under the hood to deliver webhooks. The `svix` npm package provides a single `new Webhook(secret).verify(body, headers)` call that validates the `svix-id`, `svix-timestamp`, and `svix-signature` headers. This prevents spoofed webhook payloads from injecting arbitrary inbound email records. See ADR-010 in `docs/DECISIONS.md`.

- **Return 200 OK on soft failures.** When a submission ID is not found in the `to` addresses, or when the submission doesn't exist in the database, the handler logs an error and returns `200 OK`. Returning a 4xx would cause Resend to retry the webhook indefinitely. Since there is nothing to do with an unroutable email, a quiet 200 is the correct response.

- **`fromEmail` is the only sender identity for inbound.** There is no `sentByUserId` for inbound rows — the email arrives from an unauthenticated performer, not a Castparty user. The `fromEmail` column captures the sender's address; the UI displays it as `fromEmail ?? "Candidate"` as a safe fallback if the header is missing.

**Integration points:** Outbound emails must be sent through `sendSubmissionEmail()` in `src/actions/submissions/send-submission-email.tsx` to get the correct `replyTo` header — any outbound send that bypasses this function will not enable replies. The inbound route at `src/app/api/webhooks/resend/route.ts` shares the `Email` table with the outbound write path; the `direction` column distinguishes the two. The `EmailData` interface in `src/lib/submission-helpers.ts` exposes both `direction` and `fromEmail` to the UI. The dev-only simulate page at `src/app/admin/simulate-email/page.tsx` allows testing without configuring a live Resend inbound domain. Required env vars: `RESEND_WEBHOOK_SECRET`, `INBOUND_EMAIL_DOMAIN`.

*Added: 2026-03-28 — Initial inbound email documentation*
