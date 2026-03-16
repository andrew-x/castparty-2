# Block Pipeline Stage Deletion When Submissions Exist

## Problem

`removePipelineStage` silently reassigns submissions to the APPLIED stage before
deleting a custom pipeline stage. This has two issues:

1. Users can accidentally lose track of submissions by deleting a stage they didn't
   realize had submissions in it.
2. `Feedback.stageId` uses `onDelete: "restrict"`, so if any feedback references the
   stage, the delete fails with a database constraint error — the action only
   reassigns submissions, not feedback.

## Solution

Block deletion of any custom pipeline stage that still has submissions. Show
submission counts proactively in the role pipeline settings editor so users know
which stages are occupied before attempting deletion.

## Changes

### 1. Server action: `removePipelineStage`

**File:** `src/actions/productions/remove-pipeline-stage.ts`

Replace the submission-reassignment logic with a count check:

- Query `SELECT count(*) FROM Submission WHERE stageId = :stageId`
- If count > 0, throw: `"Move all submissions out of this stage before deleting it."`
- If count is 0, delete the stage directly (no reassignment needed)
- Remove the APPLIED stage lookup since we no longer reassign

This also resolves the `Feedback.stageId` restrict constraint bug — feedback belongs
to submissions, so if there are no submissions on the stage, there's no feedback
referencing it either.

`removeProductionStage` is unchanged — template stages never have submissions.

### 2. New server function: `getRoleStagesWithCounts`

**File:** `src/actions/productions/get-role-stages-with-counts.ts`

A read function (plain `"use server"`, no safe-action) that returns role pipeline
stages with their submission counts:

- Left-join `PipelineStage` with a subquery counting submissions grouped by `stageId`
- Filter to `roleId = :roleId` and verify org ownership
- Return `Array<StageData & { submissionCount: number }>`

### 3. Role pipeline settings page

**File:** `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/pipeline/page.tsx`

- Call `getRoleStagesWithCounts(roleId)` instead of using `role.pipelineStages`
- Pass `submissionCounts` (a `Record<string, number>`) to `RoleStagesEditor`

### 4. `RoleStagesEditor` component

**File:** `src/components/productions/role-stages-editor.tsx`

- Accept new prop `submissionCounts: Record<string, number>`
- Pass it through to `StagesEditor`
- On delete attempt, if `submissionCounts[stageId] > 0`, don't execute the action
  (the button is already disabled, but this is a client-side safety check)
- On error from server, show error via `router.refresh()` (existing pattern —
  the optimistic removal is rolled back)

### 5. `StagesEditor` and `SortableStage` components

**File:** `src/components/productions/default-stages-editor.tsx`

`StagesEditorProps` gets an optional `submissionCounts?: Record<string, number>`.

`SortableStage` changes:
- New prop: `submissionCount?: number`
- When `submissionCount > 0`:
  - Show count text next to stage name: `"3 submissions"` (muted, small)
  - Disable the delete button
  - Change tooltip to: `"Move all submissions out of this stage first"`
- When `submissionCount === 0` or `undefined`: current behavior (delete enabled)

The production `DefaultStagesEditor` doesn't pass `submissionCounts`, so
`SortableStage` falls back to current behavior (delete always enabled for templates).

## Files touched

| File | Change |
|------|--------|
| `src/actions/productions/remove-pipeline-stage.ts` | Replace reassignment with count check |
| `src/actions/productions/get-role-stages-with-counts.ts` | New read function |
| `src/app/.../roles/[roleId]/(role)/settings/pipeline/page.tsx` | Use new query, pass counts |
| `src/components/productions/role-stages-editor.tsx` | Accept and forward submissionCounts |
| `src/components/productions/default-stages-editor.tsx` | Show counts, disable delete |

## Not changing

- `removeProductionStage` — template stages have no submissions
- `DefaultStagesEditor` wrapper — doesn't need counts
- Kanban board — unrelated; already shows submissions per stage visually
- Database schema — `onDelete: "restrict"` on `Submission.stageId` is correct and
  now serves as a safety net rather than an undiscovered bug
