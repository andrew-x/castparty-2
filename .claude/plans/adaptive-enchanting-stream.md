# Production-Level Kanban & Roles Page

## Context

The production page currently shows a roles list, forcing casting directors to drill
into each role individually to see submissions. For community theatre with 5-15 roles,
this is friction. Since pipeline stages are already production-level (shared across
roles), we can show all submissions in one kanban board at the production level.

**Spec:** `docs/superpowers/specs/2026-03-22-production-kanban-roles-page-design.md`

**What changes:**
- Production landing page → kanban board with all submissions across roles
- New `/roles` page → master-detail layout for managing role settings
- Role-level kanban routes → deleted entirely

## Phase 1: Data Layer & Types

### Step 1: Type extension + new server action

**Modify** `src/lib/submission-helpers.ts`:
- Add `roleId: string` and `roleName: string` to `SubmissionWithCandidate`
- Export `buildColumns` function (currently inlined in `role-submissions.tsx`)

**Create** `src/actions/productions/get-production-submissions.ts`:
- Modeled on `get-role-with-submissions.ts` but fetches ALL roles for a production
- Use `db.query.Production.findFirst()` with nested `roles → submissions → (candidate, stage, files, feedback, comments, pipelineUpdates)`
- Map results into `SubmissionWithCandidate[]` with `roleId`/`roleName` per submission
- Return `{ roles, pipelineStages, submissions, submissionFormFields, feedbackFormFields, rejectReasons }`
- Compute `otherRoleSubmissions` across all roles (not just one)

**Modify** `src/actions/productions/get-role-with-submissions.ts`:
- Add `roleId: role.id` and `roleName: role.name` to each mapped submission (type conformance)

**Subagent:** feature-dev
**Verify:** `bun run build` passes

### Step 2: Relax bulk move constraint

**Modify** `src/actions/submissions/bulk-update-submission-status.ts`:
- Remove "all submissions must be same role" check
- Replace with "all submissions must be same production" validation
- Remove unused `roleId` variable

**Subagent:** feature-dev (can run in parallel with Step 1)
**Verify:** `bun run build` passes

## Phase 2: Extract & Build Kanban

### Step 3: Extract KanbanColumn and KanbanCard
*Depends on: Step 1*

**Create** `src/components/productions/kanban-column.tsx`:
- Extract from `role-submissions.tsx` (lines ~545-620)
- Remove `stageHref` — stage names become plain text, not links
- Keep all existing props: stage, items, compact, searchActive, selectedIds, etc.

**Create** `src/components/productions/kanban-card.tsx`:
- Extract from `role-submissions.tsx` (lines ~620-817)
- Add optional `showRoleName?: boolean` prop
- When true, show `roleName` as muted text label below candidate name (default view) or as suffix (compact view)

**Modify** `src/components/productions/role-submissions.tsx`:
- Import from new files, remove inline definitions
- This keeps the role-level kanban working during transition

**Subagent:** frontend-design (UI components)
**Verify:** Existing role-level kanban still works; `bun run build` passes

### Step 4: Build ProductionSubmissions component
*Depends on: Steps 1, 3*

**Create** `src/components/productions/production-submissions.tsx`:
- Large client component based on `RoleSubmissions` pattern
- Props: `productionId, roles[], submissions[], pipelineStages[], submissionFormFields[], feedbackFormFields[], rejectReasons[]`
- **Toolbar additions:** role filter dropdown (shadcn `Select`, "All Roles" + each role), between search and view toggle
- **Role filter:** client-side — when a role is selected, filter submissions before building columns
- **Cards:** pass `showRoleName={selectedRole === "all"}` to `KanbanCard`
- **Detail sheet:** pass `roleId` derived from the selected submission, not a top-level prop
- **Drag-drop:** copy logic from `RoleSubmissions` — `DragDropProvider`, optimistic updates, rollback on error
- Reuse: `BulkActionBar`, `SubmissionDetailSheet`, `ComparisonView`, `RejectReasonDialog`

**Subagent:** frontend-design
**Verify:** Component compiles (`bun run build`)

### Step 5: Wire up production page + adapt detail sheet
*Depends on: Step 4*

**Modify** `src/components/productions/submission-detail-sheet.tsx`:
- Make `roleId` prop optional (`roleId?: string`)
- Fallback: derive from `submission.roleId` when prop not provided
- `ConsiderForRoleDialog` gets `currentRoleId={roleId ?? submission?.roleId ?? ""}`

**Modify** `src/app/(app)/productions/[id]/(production)/page.tsx`:
- Replace `RolesList` with `ProductionSubmissions`
- Call `getProductionSubmissions()` instead of `getRolesWithSubmissions()`
- Pass all required props

**Modify** `src/components/productions/production-sub-nav.tsx`:
- First item: label `"Submissions"` (was `"Roles"`), keep href `basePath`, keep `UsersIcon`
- Add second item: `{ label: "Roles", href: \`${basePath}/roles\`, icon: ListIcon }` (or `UserCogIcon`)
- Settings items unchanged

**Subagent:** frontend-design
**Verify:** Visit `/productions/[id]` — kanban shows all submissions. Role filter works. Drag-drop works. Detail sheet opens. Nav shows Submissions + Roles + Settings.

## Phase 3: Roles Management Page
*Can run in parallel with Phase 2 (after Step 1)*

### Step 6: Build Roles page with master-detail layout
*Depends on: Step 1*

**Create** `src/components/productions/create-role-dialog.tsx`:
- shadcn `Dialog` with form: name (required, trimmed), description (optional, trimmed)
- Uses existing `createRole` action
- On success: `router.refresh()`, callback to parent with new role slug

**Create** `src/components/productions/roles-manager.tsx`:
- Client component, two-column layout
- Props: `productionId, orgSlug, productionSlug, roles[]`
- **Left panel (~250px):** header "Roles" + "+ New Role" button, scrollable list with open/closed badges
- **Right panel:** `RoleSettingsForm` for selected role
- **URL state:** `useSearchParams` reads `?role=<slug>`, `router.replace` updates it
- Auto-select first role when no `?role` param or param doesn't match

**Create** `src/app/(app)/productions/[id]/(production)/roles/page.tsx`:
- Server component inside `(production)` route group (inherits production layout/nav)
- Fetch `getProduction(id)` + `getRoles(productionId)` (or lightweight query)
- Pass `orgSlug`, `productionSlug` to `RolesManager` (needed by `RoleSettingsForm` for URL preview)

**Subagent:** frontend-design
**Verify:** Visit `/productions/[id]/roles` — role list on left, settings on right. Create role dialog works. URL state persists on refresh.

## Phase 4: Cleanup
*Depends on: all previous phases complete and verified*

### Step 7: Delete deprecated files

**Delete route files:**
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/layout.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx`

**Delete components:**
- `src/components/productions/role-sub-nav.tsx`
- `src/components/productions/roles-list.tsx`
- `src/components/productions/role-submissions.tsx`
- `src/components/productions/stage-submissions-grid.tsx`
- `src/components/productions/stage-submission-card.tsx`
- `src/components/productions/stage-sort-select.tsx`

**Delete actions:**
- `src/actions/productions/get-role-with-submissions.ts`
- `src/actions/productions/get-role-stages-with-counts.ts` (if only used by deleted pages)

**Subagent:** feature-dev
**Verify:** `bun run build` passes. No broken imports. `/productions/[id]/roles/[roleId]` returns 404.

### Step 8: Fix ConsiderForRoleDialog navigation
*Depends on: Step 7*

**Modify** `src/components/productions/consider-for-role-dialog.tsx`:
- Change `window.open` URL from `/productions/${id}/roles/${roleId}` to `/productions/${id}` (production kanban)

**Subagent:** feature-dev
**Verify:** "Consider for role" from detail sheet opens target production's kanban.

## Parallelization

```
Step 1 (types) ──┬──→ Step 3 (extract) → Step 4 (kanban) → Step 5 (wire up) ──┐
                 │                                                               │
Step 2 (bulk) ───┼──→ Step 6 (roles page) ─────────────────────────────────────┼→ Step 7 (cleanup) → Step 8 (dialog fix)
                 └──────────────────────────────────────────────────────────────┘
```

- Steps 1 & 2: parallel
- Steps 3 & 6: parallel (both depend only on Step 1)
- Steps 4 & 6: parallel
- Step 5: depends on Step 4
- Steps 7-8: sequential, depend on everything else

## Final Verification

1. `/productions/[id]` → kanban with all submissions, role filter, search, drag-drop, bulk ops
2. `/productions/[id]/roles` → master-detail role management, create dialog, URL state
3. `/productions/[id]/roles/[roleId]` → 404
4. `bun run build` clean
5. `bun run lint` clean
