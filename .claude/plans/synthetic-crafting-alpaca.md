# Add "Also submitted for" indicator in submission drawer

## Context

When a casting director views a candidate's submission in the detail drawer, they currently have no way to know whether that candidate also submitted for other roles in the same production. This is important context — it affects casting decisions and helps CDs notice multi-role candidates without manually cross-referencing.

## Approach

### 1. Add a batch query for cross-role submissions

**File:** `src/actions/productions/get-role-with-submissions.ts`

After the existing role query, run a single additional query to find all submissions by the same candidates to *other* roles within the same production:

- Collect all `candidateId` values from the current role's submissions
- Query `Submission` joined with `Role` where `candidateId IN (...)` AND `productionId = currentProductionId` AND `roleId != currentRoleId`
- Build a `Map<candidateId, { roleId, roleName }[]>` and return it alongside the existing data

This is one extra query per page load (not per drawer open), and it's batched across all candidates.

### 2. Thread the data through to the UI

**Files:**
- `src/lib/submission-helpers.ts` — add `OtherRoleSubmission` type (`{ roleId: string; roleName: string }`)
- `src/actions/productions/get-role-with-submissions.ts` — return a `otherRoleSubmissions: Record<string, OtherRoleSubmission[]>` alongside existing data
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` — pass `otherRoleSubmissions` to `RoleSubmissions`
- `src/components/productions/role-submissions.tsx` — accept and pass through to `SubmissionDetailSheet`
- `src/components/productions/submission-detail-sheet.tsx` — accept and pass to `SubmissionInfoPanel`
- `src/components/productions/submission-info-panel.tsx` — accept and render

### 3. Render the indicator in `SubmissionInfoPanel`

**File:** `src/components/productions/submission-info-panel.tsx`

Insert a banner **above the headshots section** (first element in the panel). Only render when the candidate has other role submissions:

- Use a subtle info-style block (e.g., `bg-muted/50 rounded-lg p-3 text-label`)
- Show text like: "Also submitted for **Romeo**, **Mercutio**"
- Use a `LayersIcon` (lucide) or similar to visually distinguish it
- Role names shown as bold text (not links — keeps it simple, no navigation needed from the drawer)

## Files to modify

| File | Change |
|------|--------|
| `src/actions/productions/get-role-with-submissions.ts` | Add cross-role query, return `otherRoleSubmissions` map |
| `src/lib/submission-helpers.ts` | Add `OtherRoleSubmission` type |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` | Pass `otherRoleSubmissions` prop |
| `src/components/productions/role-submissions.tsx` | Accept & pass through `otherRoleSubmissions` |
| `src/components/productions/submission-detail-sheet.tsx` | Accept & pass through `otherRoleSubmissions` |
| `src/components/productions/submission-info-panel.tsx` | Render the indicator above headshots |

## Verification

1. Run `bun run build` to confirm no type errors
2. Run `bun run lint` to confirm Biome is happy
3. Manual test: open a production with multiple roles, submit a candidate to 2+ roles, open the drawer for one — the indicator should appear with the other role name(s)
4. Confirm indicator does NOT appear when a candidate has only submitted to the current role
