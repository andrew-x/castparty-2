# Codebase Audit Fixes

## Context

A comprehensive 5-agent audit of the Castparty codebase identified security vulnerabilities, UX gaps, terminology issues, accessibility problems, stale documentation, and minor code quality issues. This plan addresses the selected findings across all categories.

---

## Phase 1: Security Fixes (S1-S4)

### S1: `getProduction` — add org scoping

**File:** `src/actions/productions/get-production.ts`

Change `await checkAuth()` to `const user = await checkAuth()`, extract `orgId`, and add `eq(p.organizationId, orgId)` to the WHERE clause via `and()`.

```ts
export async function getProduction(id: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  return (
    (await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, id), eq(p.organizationId, orgId)),
      with: { organization: { columns: { slug: true } } },
    })) ?? null
  )
}
```

Add `and` to the drizzle-orm import.

### S2: `getRoles` — add org scoping

**File:** `src/actions/productions/get-roles.ts`

Same pattern: verify production belongs to org before returning roles. Since `getRoles` takes a `productionId`, first verify the production belongs to the user's org.

```ts
export async function getRoles(productionId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  // Verify production belongs to the user's org
  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
    columns: { id: true },
  })
  if (!production) return []

  return db.query.Role.findMany({
    where: (r) => eq(r.productionId, productionId),
  })
}
```

Add `and` to imports.

### S3: `setActiveOrganization` — verify membership

**File:** `src/actions/organizations/set-active-organization.ts`

Add a membership check before calling Better Auth. The action uses `secureActionClient` which provides `ctx.user`. Add a DB query to verify membership.

```ts
.action(async ({ parsedInput: { organizationId }, ctx: { user } }) => {
  // Verify user is a member of this org
  const membership = await db.query.member.findFirst({
    where: (m) => and(eq(m.organizationId, organizationId), eq(m.userId, user.id)),
    columns: { id: true },
  })
  if (!membership) throw new Error("You don't have access to this organization.")

  await auth.api.setActiveOrganization({
    body: { organizationId },
    headers: await headers(),
  })
  revalidatePath("/", "layout")
  return { success: true }
})
```

Add imports: `and, eq` from `drizzle-orm`, `db` from `@/lib/db/db`, `member` from `@/lib/db/schema`.

### S4: `createSubmission` — check `isOpen` server-side

**File:** `src/actions/submissions/create-submission.ts`

The role query already fetches `production`. Expand the columns selected to include `isOpen` on both role and production, then add guards.

```ts
const role = await db.query.Role.findFirst({
  where: (r) => eq(r.id, roleId),
  with: { production: { columns: { id: true, organizationId: true, isOpen: true } } },
  columns: { id: true, productionId: true, isOpen: true },
})

if (
  !role ||
  role.productionId !== productionId ||
  role.production.organizationId !== orgId
) {
  throw new Error("This role is not available for submissions.")
}

if (!role.production.isOpen) {
  throw new Error("This production is not accepting auditions right now.")
}

if (!role.isOpen) {
  throw new Error("This role is not open for auditions right now.")
}
```

---

## Phase 2: UX Fixes (U1, U8)

### U1: Home page empty state

**File:** `src/app/(app)/home/page.tsx`

Add an `else` branch when `productions.length === 0` using the existing `Empty` component pattern (already used on the productions page).

```tsx
import { Empty, EmptyAction, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/common/empty"
import { TheaterIcon } from "lucide-react" // or similar icon
import { Button } from "@/components/common/button"

// After the productions.length > 0 block:
{productions.length === 0 && (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <TheaterIcon />
      </EmptyMedia>
      <EmptyTitle>No productions yet</EmptyTitle>
      <EmptyDescription>
        Create your first production to start casting.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyAction>
      <Button href="/productions/new">Create production</Button>
    </EmptyAction>
  </Empty>
)}
```

Check what icon the productions page uses for its empty state and reuse the same one.

### U8: Step indicator in production wizard

**File:** `src/components/productions/create-production-form.tsx`

Add a step indicator below the form heading area. The step state is already tracked as `step: "details" | "stages" | "roles"`. Add a simple step counter.

```tsx
const STEPS = ["details", "stages", "roles"] as const
const stepIndex = STEPS.indexOf(step) + 1

// Render above the step content:
<p className="text-caption text-muted-foreground">
  Step {stepIndex} of {STEPS.length}
</p>
```

Place this at the top of the form, before the step-specific `FieldGroup`.

---

## Phase 3: Terminology Fixes (T1-T5)

### T1: "Pipeline stages" → "Casting pipeline"

**Files to update:**
- `src/components/productions/create-production-form.tsx` line 254: `"Pipeline stages"` → `"Casting pipeline"`
- `src/components/productions/create-production-form.tsx` line 256: description → `"Define the steps candidates move through during your casting process. You can customize these later, or set up different stages per role."`
- `src/components/productions/default-stages-editor.tsx` line 264: `"These are the default pipeline stages for new roles..."` → `"These are the default casting stages for new roles. Updating them will not change any role pipelines that have already been created."`

### T2: "URL ID" → "URL slug"

**Files to update:**
- `src/components/productions/production-settings-form.tsx` line 107: `"URL ID"` → `"URL slug"`
- `src/components/productions/role-settings-form.tsx` line 127: `"URL ID"` → `"URL slug"`
- `src/components/organizations/org-settings-form.tsx` line 131: `"URL ID"` → `"URL slug"`
- `src/components/productions/create-production-form.tsx` line 218: `"URL ID (optional)"` → `"URL slug (optional)"`

### T3: "Organization profile open" → plain language

**File:** `src/components/organizations/org-settings-form.tsx` line 179

Change `"Organization profile open"` → `"Show audition page publicly"`

### T4: "Get Started" → "Get started"

**File:** `src/app/page.tsx` line 29

Change `"Get Started"` → `"Get started"`

### T5: "Accepting submissions" → "Open for auditions"

**Files to update:**
- `src/components/productions/production-settings-form.tsx` line 131: `"Accepting submissions"` → `"Open for auditions"`
- `src/components/productions/production-settings-form.tsx` line 133: `"When on, candidates can find and submit to this production."` → `"When on, candidates can find and audition for this production."`
- `src/components/productions/role-settings-form.tsx` line 151: `"Accepting submissions"` → `"Open for auditions"`
- `src/components/productions/role-settings-form.tsx` line 153: `"When on, candidates can find and submit to this role."` → `"When on, candidates can find and audition for this role."`

---

## Phase 4: Accessibility Fixes (A1, A2)

### A1: Drag handle `aria-label`

**File:** `src/components/productions/default-stages-editor.tsx` lines 48-53

Add `aria-label="Drag to reorder"` to the drag handle `<button>`:

```tsx
<button
  ref={handleRef}
  type="button"
  aria-label="Drag to reorder"
  className="flex cursor-grab items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
>
```

### A2: `FixedStage` tooltip — make trigger focusable

**File:** `src/components/productions/default-stages-editor.tsx` lines 69-82

Change the `TooltipTrigger` wrapper from a `<div>` to a focusable `<span>`:

```tsx
function FixedStage({ stage }: { stage: StageData }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="flex items-center gap-element px-3 py-1.5">
          <span className="flex-1 text-label text-muted-foreground">
            {stage.name}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>Required for all roles</TooltipContent>
    </Tooltip>
  )
}
```

---

## Phase 5: Documentation Updates

Dispatch a **librarian subagent** with all 28 findings from the docs audit. The librarian will edit all files in `docs/`.

### Critical doc fixes:
1. **FEATURES.md**: `/submit/` → `/s/` in all paths; add `get-public-org-profile.ts`; add `(production)` route groups to entry points; fix stage names "Inbound"→"Applied", "Cast"→"Selected"; replace `StatusChange` → `PipelineUpdate`; add production-template pipeline tier; update App Shell (remove AppHeader, update sidebar footer); add Role Settings inventory row; update Organizations Management description
2. **ARCHITECTURE.md**: Fix `PipelineStage` columns (`position`→`order`, remove `slug`/`isSystem`/`isTerminal`, add `type` enum); fix `StatusChange`→`PipelineUpdate` with correct column names; add `UserProfile` and `OrganizationProfile` tables; add `(production)` route group; update `submit/` → `s/` in directory layout
3. **CONVENTIONS.md**: Replace `zodResolver(myFormSchema) as any` with `formResolver(myFormSchema)` example; update backend directory example to show actual dirs (`admin/`, `candidates/`, `organizations/`, `productions/`, `submissions/`); remove the "as any cast" subsection
4. **DECISIONS.md**: ADR-007: "Inbound"→"Applied", remove `isTerminal`/`isSystem` references, note `type` enum; add production-template design rationale
5. **INDEX.md**: Update status blurb to include pipeline stages, Kanban

### MEMORY.md fix:
**File:** `/Users/andrew/.claude/projects/-Users-andrew-Documents-Work-projects-castparty/memory/MEMORY.md`

Change `src/app/globals.css` → `src/styles/globals.scss`

---

## Phase 6: Minor Fixes

### Stage remove loading state

**Files:** `src/components/productions/default-stages-editor.tsx`, `src/components/productions/role-stages-editor.tsx`

Track `isPending` for the remove action and pass it through to disable the remove button during the operation. In `DefaultStagesEditor`:

```tsx
const { execute: executeRemove, isPending: isRemoving } = useAction(removeProductionStage, { ... })
```

Pass `isRemoving` and the `removingId` to `SortableStage` to disable that specific button. Use a `removingStageId` state to track which stage is being removed.

Same pattern in `RoleStagesEditor`.

In `StagesEditor`, add an `isRemovingId` prop and disable the X button when it matches:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="size-6"
  onClick={() => onRemove(stage.id)}
  disabled={isRemovingId === stage.id}
  tooltip="Remove stage"
>
```

### ChangeRoleDialog root error clear

**File:** `src/components/organizations/change-role-dialog.tsx` line 57-61

Add `form.clearErrors("root")` in the `useEffect` that resets the form:

```tsx
useEffect(() => {
  if (targetMember && targetMember.role !== "owner") {
    form.reset({ role: targetMember.role as "admin" | "member" })
    form.clearErrors("root")
  }
}, [targetMember, form])
```

### OrgSwitcher loading state

**File:** `src/components/organizations/org-switcher.tsx`

Track `isPending` from the action and show a visual indicator (e.g., spinner or disabled state on the switcher button):

```tsx
const { execute: switchOrg, isPending: isSwitching } = useAction(setActiveOrganization, { ... })
```

Show loading state on the active org button while switching:

```tsx
<SidebarMenuButton size="lg" className="w-full" tooltip={user.name} disabled={isSwitching}>
```

### Cancel button using `<a>`

**File:** `src/components/productions/create-production-form.tsx` line 240-242

Replace the `asChild` + `<a href>` with `Button`'s `href` prop for client-side navigation:

```tsx
<Button type="button" variant="outline" href="/productions">
  Cancel
</Button>
```

Remove the `asChild` wrapper entirely.

### Multiple H1 in auth tabs

**File:** `src/components/auth/auth-tabs.tsx` lines 24, 28

Change `<h1>` to `<h2>` for both tab headings:

```tsx
<h2 className="font-serif text-heading">Welcome back</h2>
// ...
<h2 className="font-serif text-heading">Create your account</h2>
```

### Kanban columns aria

**File:** `src/components/productions/role-submissions.tsx` line 149

Add `role="group"` and `aria-label` to the column div:

```tsx
<div
  ref={ref}
  role="group"
  aria-label={`${stage.name} column`}
  className={cn(...)}
>
```

### Pipeline stages label in settings forms

Already covered in T1 above. The `default-stages-editor.tsx` description prop update handles this.

Additionally, in `role-settings-form.tsx`, if there's a "Pipeline stages" heading visible, update it to "Casting pipeline". (The role settings page heading for the stages section is in the page file, not the form component — check and update if needed.)

### getPublicRole and getPublicProduction overfetching + filtering

**File:** `src/actions/submissions/get-public-role.ts`

1. Add `isOpen` check — return null if role is not open
2. Restrict production columns to only what's needed
3. Add `isOpen` check on production too

```ts
export async function getPublicRole(productionId: string, roleSlug: string) {
  const role = await db.query.Role.findFirst({
    where: (r) => and(eq(r.productionId, productionId), eq(r.slug, roleSlug)),
    with: {
      production: {
        columns: { id: true, name: true, isOpen: true, organizationId: true },
      },
    },
  })
  if (!role || !role.isOpen || !role.production.isOpen) return null
  return role
}
```

**File:** `src/actions/submissions/get-public-production.ts`

1. Filter roles to only include open ones
2. Remove unnecessary `with: { roles: true }` over-fetch — only select needed role columns

```ts
export async function getPublicProduction(orgId: string, productionSlug: string) {
  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.slug, productionSlug)),
    with: {
      roles: {
        where: (r) => eq(r.isOpen, true),
        columns: { id: true, name: true, slug: true, description: true, isOpen: true },
      },
    },
  })
  return production ?? null
}
```

Note: Drizzle's relational `with` supports `where` for filtering related records.

**File:** `src/actions/submissions/get-public-productions.ts`

Already filters productions by `isOpen: true`. Add filtering for roles:

```ts
export async function getPublicProductions(orgId: string) {
  return db.query.Production.findMany({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.isOpen, true)),
    orderBy: (p) => desc(p.createdAt),
    with: {
      roles: {
        where: (r) => eq(r.isOpen, true),
        columns: { id: true, name: true, slug: true, description: true, isOpen: true },
      },
    },
  })
}
```

**Downstream impact:** The public production page (`src/app/s/[orgSlug]/[productionSlug]/page.tsx`) renders `production.roles` — with the filtering above, closed roles will no longer appear in the list. The role submission page (`src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`) calls `getPublicRole` which will now return null for closed roles, triggering the existing `NotFoundEntity` display.

### getOrganizationProfile — use `.returning()`

**File:** `src/actions/organizations/get-organization-profile.ts`

Replace the insert-then-refetch with `.returning()`:

```ts
export async function getOrganizationProfile(organizationId: string) {
  await checkAuth()

  const profile = await db.query.OrganizationProfile.findFirst({
    where: (p) => eq(p.id, organizationId),
  })

  if (profile) return profile

  const [inserted] = await db
    .insert(OrganizationProfile)
    .values({ id: organizationId, isOrganizationProfileOpen: true })
    .onConflictDoNothing()
    .returning()

  return inserted ?? {
    id: organizationId,
    websiteUrl: "",
    description: "",
    isOrganizationProfileOpen: true,
    createdAt: day().toDate(),
    updatedAt: day().toDate(),
  }
}
```

Also fix the `new Date()` usage in the fallback to use `day().toDate()`.

---

## Execution Strategy

Use **subagent-driven-development** to parallelize independent work streams:

1. **Agent A** — Security fixes (S1-S4): 4 files in `src/actions/`
2. **Agent B** — UX + Terminology + Accessibility (U1, U8, T1-T5, A1, A2): ~8 UI files
3. **Agent C** — Minor fixes: stage loading, dialog error, org switcher, cancel button, auth tabs, kanban aria, public query filtering, org profile
4. **Agent D (librarian)** — Documentation updates: all 5 docs + MEMORY.md

---

## Verification

After implementation:

1. `bun run lint` — no Biome errors introduced
2. `bun run build` — production build succeeds
3. Manual checks:
   - Visit `/productions/[id]` while logged into a different org — should return null/404
   - Visit `/s/[org]/[prod]` — closed roles should not appear
   - Visit `/s/[org]/[prod]/[role]` where role is closed — should show not-found
   - Home page with no productions — should show empty state with CTA
   - Production creation wizard — should show "Step X of 3"
   - Settings forms — should show "URL slug", "Open for auditions", "Casting pipeline"
   - Drag handles in stage editors — should be keyboard-focusable
   - Org switcher — should show loading while switching
