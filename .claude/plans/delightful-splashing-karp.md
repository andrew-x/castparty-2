# Plan: Production Settings Tab + Default Stage Template

## Context

The production settings page is a separate route but only manages URL slugs. This change:
1. Makes settings look like a tab on the production page (URL-based routing, tab-style UI)
2. Adds production name editing
3. Adds a production-level pipeline stage template using real `PipelineStage` rows (`roleId = NULL`)
4. New roles inherit the production's template stages on creation

Default pipeline: Applied, Screening, Audition, Callback, Selected, Rejected.

The user handles all database migrations manually — this plan covers schema definition changes and application code only.

---

## Step 1: Schema changes (code only, no migration)

**File:** `src/lib/db/schema.ts`

1. Make `PipelineStage.roleId` nullable (remove `.notNull()` on line 312)
2. Remove the unused `stages` JSONB column from Production (line 260)

The user will generate and apply the DB migration separately.

---

## Step 2: Update pipeline utilities

**File:** `src/lib/pipeline.ts`

1. Rename defaults: "Inbound" → "Applied", "Cast" → "Selected"
2. Add `DEFAULT_PRODUCTION_STAGES` constant:
   ```
   Applied (APPLIED, 0) → Screening (CUSTOM, 1) → Audition (CUSTOM, 2) →
   Callback (CUSTOM, 3) → Selected (SELECTED, 1000) → Rejected (REJECTED, 1001)
   ```
3. Add `buildProductionStages(productionId, orgId)` — creates insert values with `roleId: null`
4. Add `buildStagesFromTemplate(templateStages, roleId, productionId, orgId)` — copies template into role-level stages
5. Keep `buildSystemStages` as fallback for legacy productions

---

## Step 3: Seed production-level stages on creation

**File:** `src/actions/productions/create-production.ts`

After inserting the production, call `buildProductionStages(productionId, orgId)` and insert those rows. When creating roles in the same action, use `buildStagesFromTemplate(...)` sourced from the production's template.

---

## Step 4: Use template on role creation

**File:** `src/actions/productions/create-role.ts`

Query production-level stages (`roleId IS NULL`). If found, copy them with `buildStagesFromTemplate`. Otherwise fall back to `buildSystemStages`.

---

## Step 5: New server actions

| File | Type | Purpose |
|------|------|---------|
| `src/actions/productions/update-production-name.ts` | safe-action | Update production name |
| `src/actions/productions/get-production-stages.ts` | plain read | Get stages where `roleId IS NULL` |
| `src/actions/productions/add-production-stage.ts` | safe-action | Add CUSTOM stage (`roleId: null`) |
| `src/actions/productions/remove-production-stage.ts` | safe-action | Remove CUSTOM stage from template |
| `src/actions/productions/reorder-production-stages.ts` | safe-action | Reorder custom stages by ID list |

`reorder-production-stages` receives `{ productionId, stageIds: string[] }` (ordered custom stage IDs). Updates `order` values sequentially (1, 2, 3...). System stages keep fixed orders.

---

## Step 6: Install @dnd-kit

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Step 7: Route-based tab navigation

The tabs are URL routes that share a layout with tab-style navigation:

```
src/app/(app)/productions/[id]/
  layout.tsx       ← NEW: header + tab nav
  page.tsx         ← submissions (existing, slimmed down)
  settings/
    page.tsx       ← settings (redesigned)
```

**New file:** `src/app/(app)/productions/[id]/layout.tsx`

Server component that:
1. Fetches production data
2. Renders the production header (name, description)
3. Renders tab navigation using the `Tabs` component (line variant) with `Link` children
4. Renders `{children}` for the active route

Tab nav links:
- "Submissions" → `/productions/[id]`
- "Settings" → `/productions/[id]/settings`

Active tab determined by current pathname (use a small client component for pathname detection, or pass it as a prop pattern).

**Modify:** `src/app/(app)/productions/[id]/page.tsx`

Remove the header and settings button. Keep only the audition link section + `RolesAccordion`. The header now lives in the layout.

---

## Step 8: Default stages editor component

**New file:** `src/components/productions/default-stages-editor.tsx` (`"use client"`)

```
These are the default pipeline stages for new roles. Updating
them will not change any role pipelines that have already been created.

Applied      [fixed, muted, tooltip: "Required for all roles"]
⠿ Screening   [drag handle] [X]
⠿ Audition    [drag handle] [X]
⠿ Callback    [drag handle] [X]
[+ Add stage input]
Selected     [fixed, muted, tooltip: "Required for all roles"]
Rejected     [fixed, muted, tooltip: "Required for all roles"]
```

- `@dnd-kit/sortable` `SortableContext` wraps only custom stages
- Applied rendered above, Selected + Rejected below (outside DnD context)
- Fixed stages (Applied, Selected, Rejected) have a `Tooltip` explaining "Required for all roles"
- Fixed stages are visually muted/dimmed, no drag handle, no remove button
- On drag end → call `reorderProductionStages` with new custom stage order
- Add → call `addProductionStage`, then `router.refresh()`
- Remove → call `removeProductionStage`, then `router.refresh()`

---

## Step 9: Redesign settings page

**File:** `src/app/(app)/productions/[id]/settings/page.tsx`

Redesign to show:
1. **Production name** — Input + save button (calls `updateProductionName`)
2. **Production URL** — Slug editor (reuse pattern from existing form)
3. **Default stages** — `DefaultStagesEditor` component
4. **Role URLs** — Role slug editors (moved from existing form, only if roles exist)

Fetch production stages in the server component and pass them to the editor.

**Delete:** `src/components/productions/production-settings-form.tsx` — its slug editing logic is absorbed into the settings page directly (or extracted into reusable sub-components within the settings page).

---

## Step 10: Tab navigation client helper

**New file:** `src/components/productions/production-tab-nav.tsx` (`"use client"`)

A thin client component that renders the `Tabs`/`TabsList`/`TabsTrigger` with `Link` wrappers. Uses `usePathname()` to determine which tab is active. The layout passes `productionId` so it can construct the hrefs.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/lib/db/schema.ts` — nullable roleId, drop stages column |
| Modify | `src/lib/pipeline.ts` — new defaults, template builders |
| Modify | `src/actions/productions/create-production.ts` — seed template stages |
| Modify | `src/actions/productions/create-role.ts` — use template |
| Modify | `src/app/(app)/productions/[id]/page.tsx` — remove header, keep content |
| Modify | `src/app/(app)/productions/[id]/settings/page.tsx` — redesign |
| Create | `src/app/(app)/productions/[id]/layout.tsx` — shared header + tab nav |
| Create | `src/actions/productions/update-production-name.ts` |
| Create | `src/actions/productions/get-production-stages.ts` |
| Create | `src/actions/productions/add-production-stage.ts` |
| Create | `src/actions/productions/remove-production-stage.ts` |
| Create | `src/actions/productions/reorder-production-stages.ts` |
| Create | `src/components/productions/production-tab-nav.tsx` |
| Create | `src/components/productions/default-stages-editor.tsx` |
| Delete | `src/components/productions/production-settings-form.tsx` |

---

## Verification

1. Visit `/productions/[id]` → see tab nav with "Submissions" active, audition link + roles below
2. Click "Settings" tab → navigates to `/productions/[id]/settings`, tab UI stays
3. Settings → edit production name, save → updates
4. Settings → edit slug, save → updates
5. Default stages editor → add a custom stage → appears in list
6. Default stages editor → drag to reorder → new order persists
7. Default stages editor → remove a custom stage → gone
8. Hover fixed stages (Applied, Selected, Rejected) → tooltip "Required for all roles"
9. Create a new role → inherits production template stages
10. Existing roles → stages unchanged, per-role pipeline config still works
11. `bun run build` + `bun run lint` — clean

## Subagents

- **dev-docs** skill — look up `@dnd-kit/sortable` API
- **Code Reviewer** agent — post-implementation review
- **Librarian** agent — update `docs/FEATURES.md`
