# Production Tweaks Plan

## Context

Several UX improvements to the production creation and management flow:
1. Slug uniqueness should be validated early (step 1) instead of failing at final submission
2. New productions and roles should default to open (`isOpen: true`)
3. Role page needs a better empty state when no submissions exist
4. Admin needs a view to see and delete orphaned organizations (no members)
5. Production card needs a visual refresh

---

## 1. Consistent per-step validation + slug uniqueness check

**Why:** Currently step 1 validates `["name", "description", "slug"]` but misses `location`. Step 2 has no validation at all. Slug uniqueness is only checked server-side at final submit (step 3), causing late-stage failures. We need consistent validation at every step transition and early slug uniqueness feedback.

**Approach:**
1. Create a server action `checkSlugAvailability` for async slug uniqueness checking
2. Validate **all step-1 fields** (including `location`) via `form.trigger()` before advancing
3. After schema validation passes, if slug is non-empty, call the server to check uniqueness
4. Show loading state on Continue button during the async check

React Hook Form's `trigger(fieldNames[])` returns `Promise<boolean>` and works perfectly for per-step validation. For the async slug check, we call it manually after `trigger()` passes (not as a registered async validator, to avoid re-running on every keystroke).

**Files to create:**
- `src/actions/productions/check-slug.ts` — `checkSlugAvailability` action using `secureActionClient`, input: `{ slug: string }`, returns `{ available: boolean }`. Reuses the same DB query pattern from `create-production.ts` lines 40-49.

**Files to modify:**
- `src/components/productions/create-production-form.tsx`
  - `handleNextToStages()`: validate `["name", "description", "location", "slug"]` (add `location`)
  - After `trigger()` passes: if slug is non-empty, call `checkSlugAvailability` via `useAction`. If not available, `form.setError("slug", { message: "This URL ID is already taken." })` and return
  - Add loading state (`isChecking` or use action.isPending) to the Continue button
  - No changes needed for step 2→3 transition (stages step has no form fields to validate)

---

## 2. Default `isOpen: true` for new productions and roles

**Why:** When creating a production, `isOpen` defaults to `false` in the DB schema, so newly created productions aren't accepting submissions until manually toggled. The user expectation is that new productions are open by default.

**Files to modify:**
- `src/actions/productions/create-production.ts` (line 67-74)
  - Add `isOpen: true` to the `Production` insert values
- `src/actions/productions/create-production.ts` (line 97-103)
  - Add `isOpen: true` to each `Role` insert value in `roleValues`

---

## 3. Better empty state on role submissions page

**Why:** Currently shows just `"No candidates yet."` as a plain text paragraph. Should use the existing `Empty` component pattern for consistency and better visual weight.

**Files to modify:**
- `src/components/productions/role-submissions.tsx` (lines 75-79)
  - Replace the `<p>` with the `Empty` / `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` pattern
  - Icon: `UsersIcon` from lucide-react
  - Title: "No candidates yet"
  - Description: "Candidates will appear here once they submit an audition for this role."

---

## 4. Admin orphaned organizations view

**Why:** Organizations with zero members (orphaned) accumulate over time. Need a way to discover and delete them along with their productions for cleanup.

**Approach:** Add a new admin sub-page at `/admin/organizations` showing organizations that have no members. Uses a left-join query on `organization` → `member` to find orgs where member count is 0.

**Query logic (pure Drizzle, no raw SQL):**
```ts
import { count, eq, sql } from "drizzle-orm"

const result = await db
  .select({
    id: Organization.id,
    name: Organization.name,
    slug: Organization.slug,
    createdAt: Organization.createdAt,
    productionCount: sql<number>`cast(count(${Production.id}) as int)`,
  })
  .from(Organization)
  .leftJoin(Member, eq(Member.organizationId, Organization.id))
  .leftJoin(Production, eq(Production.organizationId, Organization.id))
  .groupBy(Organization.id)
  .having(sql`count(${Member.id}) = 0`)
  .orderBy(Organization.createdAt)
```

**Files to create:**
- `src/actions/admin/get-orphaned-orgs.ts` — server function `getOrphanedOrgs()` using the Drizzle select API as shown above. Returns org id, name, slug, createdAt, production count.
- `src/actions/admin/delete-organization.ts` — `deleteOrganizationAction` using `adminActionClient`, takes `organizationId: string`, deletes the org (cascade handles productions, members, etc.)
- `src/app/admin/organizations/page.tsx` — server page that fetches orphaned orgs and renders client component
- `src/components/admin/admin-orgs-client.tsx` — table with columns: Name, Slug, Productions, Created, Delete button
- `src/components/admin/delete-org-dialog.tsx` — confirmation dialog following the `delete-user-dialog.tsx` pattern

**Files to modify:**
- `src/app/admin/layout.tsx` — add nav links between admin sub-pages (Users, Organizations)

**Pattern to follow:** Mirror the existing `admin-users-client.tsx` table structure and `delete-user-dialog.tsx` confirmation pattern.

---

## 5. Production card visual refresh

**Why:** The current card looks plain — small icon, minimal hierarchy, badge feels disconnected.

**Files to modify:**
- `src/components/productions/production-card.tsx`

**Design direction:**
- Larger, more prominent production name (bump from `text-label` to `text-heading` or `font-medium text-body`)
- Add an `isOpen` status indicator (colored dot or subtle badge) — requires adding `isOpen` to the card's Props interface and passing it from parent pages
- More visual separation: add a subtle top accent/border or background gradient on hover
- Move the submission count into a more integrated position rather than a floating badge
- Show the description more prominently if present
- Consider showing location if available

**Props to add to `ProductionCard`:**
- `isOpen: boolean` — to show open/closed status
- `location: string | null` — to display location

**Parent files to update (pass new props):**
- `src/app/(app)/productions/page.tsx` — ensure query returns `isOpen` and `location`
- `src/app/(app)/home/page.tsx` — same
- `src/actions/productions/get-productions.ts` — ensure these fields are returned

---

## Verification

1. **Slug check:** Create a production with a slug, then try creating another with the same slug — error should show on step 1
2. **Default open:** Create a production → check that `isOpen` is true in the production settings and the public page works immediately
3. **Empty state:** Navigate to a role with no submissions → should see the styled empty state
4. **Admin orphaned orgs:** Visit `/admin/organizations` → should see table of orgs with zero members, be able to delete one
5. **Production card:** Visit `/productions` → cards should look refreshed with open status and any new fields
6. **Build check:** `bun run build` should pass with no errors

---

## Subagent Plan

These tasks are mostly independent and can be parallelized:

| Group | Tasks | Agent |
|-------|-------|-------|
| A | 1 (slug check) + 2 (default isOpen) | Creation flow agent |
| B | 3 (empty state) + 5 (card refresh) | UI polish agent |
| C | 4 (admin orphaned orgs) | Admin page agent |
