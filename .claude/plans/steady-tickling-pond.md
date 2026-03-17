# Add Reject Reasons to Submissions

## Context

When casting directors reject a candidate, there's currently no way to record why. This makes it hard to review decisions later or spot patterns. We need reject reasons that are configurable per production (as defaults) and per role (inherited at creation, then independent), and a dialog that prompts for a reason whenever a candidate is moved to the Rejected stage.

### Design decisions
- Reject reason is **required** — the dialog's Confirm button is disabled until a reason is chosen
- Bulk reject shows **one dialog** — the same reason applies to all selected candidates
- New productions are **pre-populated** with default reject reasons (editable/removable)

## Overview

Three layers of work:
1. **Data layer** — DB schema changes + server actions
2. **Settings UI** — Manage default reject reasons on productions and roles
3. **Rejection dialog** — Intercept all rejection flows with a reason picker

---

## 1. Database Schema Changes

**File:** `src/lib/db/schema.ts`

### Add `rejectReasons` to Production and Role

Add a JSONB column (string array) to both tables, following the same pattern as `submissionFormFields`:

```ts
// Production table — after feedbackFormFields
rejectReasons: jsonb().$type<string[]>().notNull().default([]),

// Role table — after feedbackFormFields
rejectReasons: jsonb().$type<string[]>().notNull().default([]),
```

### Default reject reasons constant

**File:** `src/lib/pipeline.ts` (alongside `DEFAULT_PRODUCTION_STAGES`)

```ts
export const DEFAULT_REJECT_REASONS = [
  "Not the right fit for this role",
  "Scheduling conflict",
  "Insufficient experience",
  "Role already filled",
  "Did not meet audition requirements",
]
```

Used in `create-production.ts` as the default value for new productions' `rejectReasons`.

### Add `rejectionReason` to Submission

Add a nullable text column:

```ts
// Submission table — after stageId
rejectionReason: text(),
```

### Migration

Generate and run a Drizzle migration for these three new columns.

---

## 2. Inheritance: Role Inherits Production Defaults

**Files to update:**
- `src/actions/productions/create-production.ts` — set production's `rejectReasons` to `DEFAULT_REJECT_REASONS`, pass to each role created during production creation
- `src/actions/productions/create-role.ts` — copy `rejectReasons` from production when a new role is added later

Follow the exact pattern used for `submissionFormFields` (one-time copy at creation, then independent).

---

## 3. Server Actions for Managing Reject Reasons

### Production reject reasons

**New files:**
- `src/actions/productions/update-production-reject-reasons.ts` — accepts `productionId` + `rejectReasons: string[]`, updates the production

### Role reject reasons

**New file:**
- `src/actions/productions/update-role-reject-reasons.ts` — accepts `roleId` + `rejectReasons: string[]`, updates the role

Both actions follow the same pattern as `update-production-system-field-config.ts`: secure action, org ownership check, update the JSONB column.

### Update submission status with rejection reason

**Files to update:**
- `src/actions/submissions/update-submission-status.ts` — add optional `rejectionReason` field to input schema; when moving to a REJECTED stage, store the reason on the submission; when moving away from REJECTED, clear it
- `src/actions/submissions/bulk-update-submission-status.ts` — add optional `rejectionReason` field; apply the same reason to all submissions in the bulk move
- `src/lib/schemas/submission.ts` — update validation schemas to include `rejectionReason`

---

## 4. Settings UI for Default Reject Reasons

### Production settings tab

**Files:**
- `src/components/productions/production-tab-nav.tsx` — add "Reject reasons" tab: `{ label: "Reject reasons", segment: "/settings/reject-reasons" }`
- `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` — new settings page (server component fetching production's `rejectReasons`)
- `src/components/productions/reject-reasons-editor.tsx` — new client component: editable list of strings with add/remove/reorder

### Role settings tab

**Files:**
- `src/components/productions/role-tab-nav.tsx` — add "Reject reasons" tab: `{ label: "Reject reasons", segment: "/settings/reject-reasons" }`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/reject-reasons/page.tsx` — new settings page
- Reuse the same `reject-reasons-editor.tsx` component (pass role-level action instead)

### Editor component design

Simple list editor:
- Text input + "Add" button to add a new reason
- Each reason shown as a row with the text and a remove (X) button
- Auto-saves on add/remove (calls the update action with the full updated array)
- No drag reorder needed (order doesn't matter for reject reasons)

---

## 5. Reject Reason Dialog

**New file:** `src/components/productions/reject-reason-dialog.tsx`

A `Dialog` component that:
- Shows the role's configured reject reasons as selectable radio/button options
- Has an "Other" option that reveals a text input for typing a custom reason
- Has Cancel and Confirm buttons
- Reason selection is **required** — Confirm is disabled until a reason is chosen (or "Other" text is entered)
- On confirm, calls the provided `onConfirm(reason: string)` callback
- On cancel/close, calls `onCancel()` so the caller can revert optimistic state if needed

Props: `open`, `onOpenChange`, `reasons: string[]`, `onConfirm: (reason: string) => void`

### Integration points (3 places rejection happens)

#### A. Reject button in SubmissionDetailSheet

**File:** `src/components/productions/submission-detail-sheet.tsx`

Currently: clicking Reject immediately calls `handleStatusChange(rejectedStage.id)`

Change: clicking Reject opens the `RejectReasonDialog`. On confirm, call `handleStatusChange` with the reason.

The `handleStatusChange` function and `executeStatusChange` need to accept an optional `rejectionReason` parameter.

#### B. Drag-to-reject in kanban board

**File:** `src/components/productions/role-submissions.tsx`

Currently: `onDragEnd` detects cross-stage move and immediately calls `executeStatusChange`.

Change: if the target stage is REJECTED, pause the optimistic update and show the `RejectReasonDialog`. On confirm, apply the move + reason. On cancel, revert columns to `previousColumns.current`.

#### C. Bulk move to rejected

**File:** `src/components/productions/bulk-action-bar.tsx`

Currently: selecting a stage in the popover immediately calls `onMove(stageId)`.

Change: if the selected stage is REJECTED, show the `RejectReasonDialog`. On confirm, call `onMove` with the reason. The `onMove` callback signature changes to `(stageId: string, rejectionReason?: string) => void`.

This means `StageSubmissionsGrid` and `RoleSubmissions` also need their `handleBulkMove` updated.

---

## 6. Display Rejection Reason

### SubmissionDetailSheet

**File:** `src/components/productions/submission-detail-sheet.tsx`

When a submission is in the REJECTED stage, display the rejection reason below the stage badge/buttons. Simple text display: "Reason: {reason}".

### SubmissionWithCandidate type

**File:** `src/lib/submission-helpers.ts`

Add `rejectionReason: string | null` to the interface.

### Data fetching

**Files that query submissions** — ensure `rejectionReason` is included in the select columns wherever `SubmissionWithCandidate` is built. Check:
- `src/actions/submissions/get-role-submissions.ts` (or equivalent query)
- Any server component page that fetches submissions

---

## 7. Reject Reasons Passed to Dialog

The `RejectReasonDialog` needs to receive the list of available reasons. These come from the role's `rejectReasons` field.

- In `RoleSubmissions` (kanban): the parent page already fetches role data — add `rejectReasons` to what's fetched and pass it down
- In `StageSubmissionsGrid` (stage view): same pattern, pass down from the page
- Thread through to `SubmissionDetailSheet` and `BulkActionBar` as props

---

## Files Modified (Summary)

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add 3 columns |
| `src/lib/submission-helpers.ts` | Add `rejectionReason` to type |
| `src/actions/submissions/update-submission-status.ts` | Accept + store rejection reason |
| `src/actions/submissions/bulk-update-submission-status.ts` | Accept + store rejection reason |
| `src/lib/schemas/submission.ts` | Update schemas |
| `src/actions/productions/create-production.ts` | Pass rejectReasons to roles |
| `src/actions/productions/create-role.ts` | Copy rejectReasons from production |
| `src/components/productions/production-tab-nav.tsx` | Add tab |
| `src/components/productions/role-tab-nav.tsx` | Add tab |
| `src/components/productions/submission-detail-sheet.tsx` | Trigger dialog, display reason |
| `src/components/productions/role-submissions.tsx` | Intercept drag-to-reject |
| `src/components/productions/stage-submissions-grid.tsx` | Pass through props |
| `src/components/productions/bulk-action-bar.tsx` | Intercept bulk reject |

## New Files

| File | Purpose |
|------|---------|
| `src/actions/productions/update-production-reject-reasons.ts` | Server action |
| `src/actions/productions/update-role-reject-reasons.ts` | Server action |
| `src/components/productions/reject-reasons-editor.tsx` | Settings list editor |
| `src/components/productions/reject-reason-dialog.tsx` | Rejection prompt dialog |
| `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` | Settings page |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/reject-reasons/page.tsx` | Settings page |
| Drizzle migration file | Schema migration |

## Subagents

- **Explore agent**: Used above for initial codebase exploration (complete)
- **Code reviewer agent**: After implementation, review all changes for conventions compliance
- **Librarian agent**: After implementation, update `docs/FEATURES.md` with reject reasons feature

## Verification

1. **Settings flow**: Visit production settings > Reject reasons tab, add/remove reasons. Create a new role and verify it inherits the production's reasons. Edit role's reasons independently.
2. **Reject via button**: Open a submission detail sheet, click Reject, verify dialog appears with configured reasons, select one, confirm. Verify reason is stored and displayed.
3. **Reject via drag**: Drag a card to the Rejected column in kanban, verify dialog appears. Confirm with a reason. Verify the card moves and reason is stored.
4. **Bulk reject**: Select multiple candidates, click "Move to" > Rejected. Verify dialog appears. Confirm. Verify all submissions get the same reason.
5. **Cancel**: In all three flows above, cancel the dialog and verify the submission stays in its original stage.
6. **Custom reason**: Choose "Other" in the dialog, type a custom reason, confirm. Verify it's stored.
7. **Un-reject**: Move a rejected submission to another stage. Verify the rejection reason is cleared.
8. **Build**: `bun run build` passes with no errors.
9. **Lint**: `bun run lint` passes.
