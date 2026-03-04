# Plan: Replace Roles Accordion with Flat List + Role Detail Pages

## Context

The production page currently uses a monolithic 645-line `RolesAccordion` client component that crams everything into nested accordions: role list, pipeline config, submission tabs, and submission detail sheets. This is hard to navigate and doesn't scale. We're replacing it with a flat roles list on the production page that links to dedicated role detail pages at `/productions/[id]/roles/[roleId]`, mirroring the production page's own Submissions/Settings tab pattern.

## URL Structure

```
/productions/[id]                          -- production page (flat role list)
/productions/[id]/settings                 -- production settings (unchanged)
/productions/[id]/roles/[roleId]           -- role submissions tab (default)
/productions/[id]/roles/[roleId]/settings  -- role settings tab
```

## Implementation Phases

### Phase 1: Server Actions

Create missing data-layer functions. No UI dependencies.

**Create `src/actions/productions/get-role.ts`**
- Plain async server function (like `getProduction`)
- `checkAuth()`, then `db.query.Role.findFirst` with `where: eq(r.id, roleId)`
- Include `with: { production: { columns: { id, name, slug, organizationId }, with: { organization: { columns: { slug } } } }, pipelineStages: { orderBy: asc(order) } }`
- Verify `production.organizationId === user.activeOrganizationId`
- Returns role with production data (for breadcrumb + auth) and pipeline stages (for settings page)

**Create `src/actions/productions/get-role-with-submissions.ts`**
- Plain async server function (like `getRolesWithSubmissions` but single role)
- Include `with: { pipelineStages: { orderBy: asc(order) }, submissions: { with: { candidate: true, stage: true } } }`
- Verify org ownership via production relation

**Create `src/actions/productions/update-role.ts`**
- `secureActionClient` write action (like `updateProduction`)
- Input schema: `{ roleId, name?, description?, isOpen? }` -- all optional updates
- Verify org ownership, then `db.update(Role).set(...)` with provided fields

### Phase 2: Shared Utilities

Extract reusable logic from `roles-accordion.tsx` (lines 77-134).

**Create `src/lib/submission-helpers.ts`**
- Move `PipelineStageData` and `SubmissionWithCandidate` interfaces
- Move `getStageBadgeProps()` and `getStageLabel()` functions
- These are used by `SubmissionList`, `SubmissionDetailSheet`, and `RoleSubmissions`

### Phase 3: Production Page Changes

**Modify `src/components/productions/production-tab-nav.tsx`**
- Rename first tab from `"Submissions"` to `"Roles"` (the tab now shows a role list, not submissions directly)
- Active-state logic already works: exact match on `basePath` means the "Roles" tab won't highlight when drilling into `/roles/[roleId]`

**Modify `src/components/productions/roles-list.tsx`** (rewrite existing unused file)
- Keep the existing add-role form and empty state (lines 56-187 are already good)
- Replace the static card list (lines 189-222) with clickable `Link` rows
- Each row: role icon + role name + submission count `Badge` + chevron
- Add `submissionCount` to the `Role` interface (or accept it alongside)
- Remove `orgSlug`/`productionSlug` props (no longer showing audition links inline)

**Modify `src/app/(app)/productions/[id]/page.tsx`**
- Replace `RolesAccordion` import with `RolesList`
- Map `getRolesWithSubmissions` result to include `submissions.length` as count
- Pass simplified role data to `RolesList`

### Phase 4: Role Detail Route Skeleton

**Create `src/app/(app)/productions/[id]/roles/[roleId]/layout.tsx`**
- Server component, mirrors production layout pattern
- Fetch `getRole(roleId)`, verify `role.production.id === id`, else `notFound()`
- Render: `Breadcrumb` (link back to `/productions/[id]` labeled "Roles") + role name heading (`font-serif text-heading`) + description + `RoleTabNav` + `{children}`
- Uses existing `Breadcrumb`/`BreadcrumbList`/`BreadcrumbItem`/`BreadcrumbLink`/`BreadcrumbSeparator`/`BreadcrumbPage` from `@/components/common/breadcrumb`

**Create `src/components/productions/role-tab-nav.tsx`**
- Clone of `ProductionTabNav` with `productionId` + `roleId` props
- `basePath = /productions/${productionId}/roles/${roleId}`
- Same two tabs: `Submissions` (segment `""`) and `Settings` (segment `"/settings"`)
- Same styling and active-state logic

### Phase 5: Role Submissions Page

Extract submission display from `RolesAccordion` into dedicated components.

**Create `src/components/productions/submission-list.tsx`**
- Extract `SubmissionList` function (roles-accordion.tsx lines 594-644)
- Import `getStageBadgeProps`/`getStageLabel` from `@/lib/submission-helpers`
- Props: `{ submissions, onSelect }`

**Create `src/components/productions/submission-detail-sheet.tsx`**
- Extract Sheet UI (roles-accordion.tsx lines 506-589)
- Client component with `useAction(updateSubmissionStatus)` for status changes
- Optimistic stage update on status change (same pattern as current)
- Props: `{ submission, pipelineStages, onClose }`

**Create `src/components/productions/role-submissions.tsx`**
- Client component composing `SubmissionList` + pipeline stage tabs + `SubmissionDetailSheet`
- Pipeline stage tab filtering (All + per-stage tabs with counts, same as current)
- Empty state when no submissions
- Props: `{ submissions, pipelineStages }`

**Create `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx`**
- Server component, fetch `getRoleWithSubmissions(roleId)`
- `generateMetadata` for page title: `"[Role Name] -- Castparty"`
- Render `<RoleSubmissions submissions={...} pipelineStages={...} />`

### Phase 6: Role Settings Page

**Create `src/components/productions/role-settings-form.tsx`**
- Client component following `ProductionSettingsForm` pattern
- Single form with react-hook-form + zod + Controller
- Fields: name (Input), description (Textarea), isOpen (Switch with label "Accepting submissions"), slug (Input with preview URL)
- `ShareLink` for audition page URL
- On submit: call `updateRole` for name/description/isOpen, then `updateRoleSlug` if slug changed
- Props: `{ roleId, orgSlug, productionSlug, currentName, currentSlug, currentDescription, currentIsOpen }`

**Create `src/components/productions/role-stages-editor.tsx`**
- Extract pipeline stage editor from roles-accordion.tsx (lines 388-445)
- Uses existing `addPipelineStage` and `removePipelineStage` actions
- List stages, add/remove custom stages, "(system)" labels for non-custom
- Props: `{ roleId, stages }`

**Create `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`**
- Server component mirroring production settings page layout
- Fetch `getRole(roleId)` (includes pipelineStages)
- Two sections separated by `<Separator>`:
  1. "Role details" heading + `RoleSettingsForm`
  2. "Pipeline stages" heading + `RoleStagesEditor`
- `generateMetadata`: `"[Role Name] Settings -- Castparty"`

### Phase 7: Cleanup

- Delete `src/components/productions/roles-accordion.tsx`
- Verify no remaining imports reference it (only consumer was `productions/[id]/page.tsx`, updated in Phase 3)

## Files Summary

| Action | Path |
|--------|------|
| Create | `src/actions/productions/get-role.ts` |
| Create | `src/actions/productions/get-role-with-submissions.ts` |
| Create | `src/actions/productions/update-role.ts` |
| Create | `src/lib/submission-helpers.ts` |
| Create | `src/app/(app)/productions/[id]/roles/[roleId]/layout.tsx` |
| Create | `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx` |
| Create | `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx` |
| Create | `src/components/productions/role-tab-nav.tsx` |
| Create | `src/components/productions/role-settings-form.tsx` |
| Create | `src/components/productions/role-stages-editor.tsx` |
| Create | `src/components/productions/role-submissions.tsx` |
| Create | `src/components/productions/submission-detail-sheet.tsx` |
| Create | `src/components/productions/submission-list.tsx` |
| Modify | `src/components/productions/production-tab-nav.tsx` |
| Modify | `src/components/productions/roles-list.tsx` |
| Modify | `src/app/(app)/productions/[id]/page.tsx` |
| Delete | `src/components/productions/roles-accordion.tsx` |

## Key Patterns to Reuse

- **Tab nav**: Clone `production-tab-nav.tsx` for `role-tab-nav.tsx` (Link-based, `tabsListVariants({ variant: "line" })`)
- **Settings form**: Follow `production-settings-form.tsx` pattern (react-hook-form + zod + Controller + FieldGroup)
- **Settings page**: Follow `productions/[id]/settings/page.tsx` layout (sections + Separator)
- **Server actions**: `secureActionClient` with `.metadata()` + `.inputSchema()` for writes; plain async with `checkAuth()` for reads
- **Slug validation**: Reuse schema from `update-role-slug.ts` (min 3, max 60, lowercase+hyphens, no pure numeric, no reserved)

## Subagents for Implementation

Phases 1-2 (data layer + utils) and Phases 3-4 (production page + route skeleton) will be implemented sequentially since they build on each other. Phases 5 and 6 (submissions page + settings page) are independent and will use parallel subagents.

## Verification

After implementation:
1. `bun run build` -- ensure no type errors or build failures
2. `bun run lint` -- ensure Biome is happy
3. Manual testing:
   - Visit `/productions/[id]` -- should show flat role list with submission counts
   - Click a role -- should navigate to `/productions/[id]/roles/[roleId]`
   - Submissions tab: stage tabs filter correctly, clicking a submission opens the detail sheet, status changes work
   - Settings tab: edit name/description/slug/isOpen, save, verify changes persist
   - Pipeline stages: add/remove custom stages
   - Breadcrumb navigates back to role list
   - Production tab nav: "Roles" tab active on production page, neither tab active on role detail pages
