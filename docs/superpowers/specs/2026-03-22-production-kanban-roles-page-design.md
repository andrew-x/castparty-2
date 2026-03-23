# Production-Level Kanban & Roles Page

## Problem

The current production page shows a roles list, and the kanban board lives at the
role level (`/productions/[id]/roles/[roleId]`). This means casting directors must
navigate into each role individually to see submissions. For community theatre
productions with 5-15 roles, this creates unnecessary friction — you want to see all
auditions at a glance, not drill into each role.

## Goal

1. Move the kanban board to the production level, showing all submissions across all
   roles in one view, with a role filter dropdown.
2. Replace the roles list with a dedicated Roles page for managing role settings,
   using a master-detail side menu layout.
3. Remove the role-level kanban route entirely.

## Design Decisions

- **Role identity on cards**: Simple text label (role name), no color coding
- **Role settings scope**: Keep current basic fields only (name, slug, description,
  open/closed). Pipeline/form/feedback settings remain at production level.
- **Role-level kanban**: Remove entirely — no redirects, no deep links
- **Roles page default state**: Auto-select first role on load
- **Role URL state**: Selected role stored in `?role=<slug>` search param for deep linking
- **Role creation**: Dialog (modal) instead of inline form

## Architecture

### Route Changes

**Before:**
```
/productions/[id]                    → RolesList (list of roles)
/productions/[id]/roles/[roleId]     → RoleSubmissions (kanban for one role)
/productions/[id]/roles/[roleId]/settings → RoleSettingsForm
```

**After:**
```
/productions/[id]                    → ProductionSubmissions (kanban for ALL roles)
/productions/[id]/roles              → RolesPage (master-detail role management)
```

### Navigation

Update `ProductionSubNav` items:
- "Roles" (current default) → "Submissions" (kanban, default landing)
- Add "Roles" as second nav item → links to `/productions/[id]/roles`
- Settings items remain unchanged

### Production Kanban (`ProductionSubmissions`)

A new client component that replaces `RolesList` as the production landing page.

**Data flow:**
- New server action `getProductionSubmissions()` — fetches all roles and their full
  submissions for a production (similar to `getRoleWithSubmissions` but across all roles)
- Returns: `{ roles, pipelineStages, submissions, submissionFormFields, feedbackFormFields, rejectReasons, otherRoleSubmissions }`
- Each submission carries a `roleId` and `roleName` for filtering/display

**UI elements:**
- Search input (filters by name, existing behavior)
- Role filter dropdown: "All Roles" + each role name. Client-side filtering.
- View mode toggle: Default / Compact (existing behavior)
- Kanban columns: one per pipeline stage, ordered by `stage.order`
- Cards: headshot (default view), name, role label, date, checkbox, drag handle
- Bulk action bar (existing `BulkActionBar` component)
- Submission detail sheet (existing `SubmissionDetailSheet`)
- Reject reason dialog (existing `RejectReasonDialog`)
- Comparison view (existing `ComparisonView`)

**Key differences from current `RoleSubmissions`:**
- `roleId` is no longer a single prop — submissions span multiple roles
- Cards display role name as a text label
- Role filter dropdown added to toolbar
- `buildColumns` works identically (submissions grouped by `stageId`)
- Bulk move constraint: existing `bulkUpdateSubmissionStatus` requires same role.
  Either enforce "same role" in bulk selection, or update the action to support
  cross-role bulk moves. Simplest: allow mixed-role bulk moves since stages are
  production-level.

**Approach:** Build a new `ProductionSubmissions` component. Extract `KanbanColumn`
and `KanbanCard` (currently inline in `role-submissions.tsx`) into separate files so
both the new production kanban and any future uses can import them. Reuse existing
standalone components: `BulkActionBar`, `SubmissionDetailSheet`, `ComparisonView`,
`RejectReasonDialog`. The main thing that changes is the data layer and toolbar.

**Stage column headers:** The current `KanbanColumn` renders a clickable stage name
that links to `/productions/[id]/roles/[roleId]/stages/[stageId]` (a per-role grid
view). Since this route is being deleted, remove the clickable link from stage
headers — stage names become plain text labels. A production-level stage grid view
can be added later if needed.

**SubmissionDetailSheet adaptation:** The current sheet takes a `roleId: string` prop
(used for the "Consider for Role" dialog to exclude the current role). Since
submissions now carry `roleId` and `roleName`, change the sheet to derive the role
from the submission itself instead of a top-level prop. This also makes
`otherRoleSubmissions` simpler — it can be computed per-submission from the full
submission list (exclude roles matching `submission.roleId`).

### `SubmissionWithCandidate` Type Extension

Add `roleId` and `roleName` fields to the existing `SubmissionWithCandidate` interface
in `src/lib/submission-helpers.ts`:

```ts
export interface SubmissionWithCandidate {
  // ... existing fields ...
  roleId: string
  roleName: string
}
```

This allows the kanban card to display role context and enables client-side filtering.

### Roles Page

A new page at `/productions/[id]/roles` with master-detail layout.

**Left panel (role list):**
- Header: "Roles" + "+ New Role" button
- Scrollable list of role items
- Each item: role name + open/closed badge
- Selected role highlighted with active indicator
- Click sets `?role=<slug>` search param

**Right panel (role settings):**
- Reuse existing `RoleSettingsForm` component
- Shows: name, description, slug (with URL preview), open/closed toggle
- Save button persists changes

**Data flow:**
- Server component fetches production (with `orgSlug` and `productionSlug` needed by
  `RoleSettingsForm` for the audition URL preview) and all roles
- Reuse existing `getProduction()` + a lightweight roles query (no submissions needed)
- Client component handles selected role state via URL search params
- `useSearchParams` to read `?role=`, `router.replace` to update

**Create Role dialog:**
- Triggered by "+ New Role" button
- Fields: name (required), description (optional)
- Uses existing `createRole` server action
- On success: refreshes role list, selects the new role

### Bulk Move Cross-Role Consideration

The current `bulkUpdateSubmissionStatus` action validates all submissions belong to
the same role. With production-level kanban, users might select submissions from
different roles for bulk moves. Options:

1. **Allow cross-role bulk moves** — update the action to accept submissions from any
   role in the production (stages are shared). This is the cleanest UX.
2. **Restrict selection to one role** — if a user selects a card from Role A then
   tries to select from Role B, show a toast. This is simpler but limiting.

**Recommendation:** Option 1 — allow cross-role bulk moves. The validation change is
small (verify all submissions belong to the same production instead of same role).

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/productions/production-submissions.tsx` | Production-level kanban board |
| `src/components/productions/kanban-column.tsx` | Extracted kanban column (from `role-submissions.tsx`) |
| `src/components/productions/kanban-card.tsx` | Extracted kanban card (from `role-submissions.tsx`) |
| `src/app/(app)/productions/[id]/roles/page.tsx` | Roles management page (server component) |
| `src/components/productions/roles-manager.tsx` | Master-detail client component for roles |
| `src/components/productions/create-role-dialog.tsx` | Dialog for creating new roles |
| `src/actions/productions/get-production-submissions.ts` | Server action: all submissions for a production |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(app)/productions/[id]/(production)/page.tsx` | Render `ProductionSubmissions` instead of `RolesList` |
| `src/components/productions/production-sub-nav.tsx` | Rename "Roles" to "Submissions", add "Roles" nav item |
| `src/lib/submission-helpers.ts` | Add `roleId` and `roleName` to `SubmissionWithCandidate` |
| `src/actions/submissions/bulk-update-submission-status.ts` | Relax same-role constraint to same-production |
| `src/components/productions/submission-detail-sheet.tsx` | Derive `roleId` from submission instead of top-level prop |

## Files to Delete

| File | Reason |
|------|--------|
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` | Role-level kanban removed |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/layout.tsx` | Role-level layout no longer needed |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/page.tsx` | Settings move to roles page |
| `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx` | Stage grid view was role-level |
| `src/components/productions/role-sub-nav.tsx` | No role-level nav needed |
| `src/components/productions/roles-list.tsx` | Replaced by production kanban |
| `src/components/productions/role-submissions.tsx` | Replaced by `production-submissions.tsx` + extracted kanban components |
| `src/actions/productions/get-role-with-submissions.ts` | No longer needed (production-level query replaces it) |
| `src/components/productions/stage-submissions-grid.tsx` | Stage grid view was role-level, being removed |

## Reusable Components & Functions

These existing pieces should be reused as-is or with minimal changes:

- `BulkActionBar` — `src/components/productions/bulk-action-bar.tsx`
- `SubmissionDetailSheet` — `src/components/productions/submission-detail-sheet.tsx`
- `ComparisonView` — `src/components/productions/comparison-view.tsx`
- `RejectReasonDialog` — `src/components/productions/reject-reason-dialog.tsx`
- `RoleSettingsForm` — `src/components/productions/role-settings-form.tsx`
- `createRole` action — `src/actions/productions/create-role.ts`
- `buildColumns` function — from `role-submissions.tsx` (move to `submission-helpers.ts`)
- `SubNav` component — `src/components/common/sub-nav.tsx`
- `getProduction` action — `src/actions/productions/get-production.ts`
- `getRoles` action — `src/actions/productions/get-roles.ts` (if exists, otherwise query inline)

## Out of Scope

- **Role deletion** — deferred to a future iteration
- **Production-level stage grid view** — the per-role stage grid is removed; a production-level replacement can be added later if needed
- **Performance optimization for large productions** — the initial implementation fetches all submissions eagerly. If this becomes a bottleneck for productions with hundreds of submissions, we can lazy-load feedback/comments/stage-changes into the detail sheet on demand

## Verification

1. **Production kanban**: Visit `/productions/[id]` — should show all submissions
   across all roles in a kanban board. Search filters by name. Role dropdown filters
   by role. Drag-drop moves submissions between stages. Bulk select and move works.
   Compact view toggle works.
2. **Roles page**: Visit `/productions/[id]/roles` — should show role list on left,
   first role auto-selected, settings form on right. Change settings and save.
   Create a new role via dialog.
3. **URL state**: Selecting a role updates `?role=slug`. Refreshing preserves selection.
   Direct linking to `?role=juliet` selects that role.
4. **Deleted routes**: `/productions/[id]/roles/[roleId]` should 404.
5. **Cross-role bulk move**: Select submissions from different roles, bulk move to a
   stage — should succeed.
6. **Empty states**: Production with no submissions shows empty kanban. Production
   with no roles shows prompt to create first role on the Roles page.
