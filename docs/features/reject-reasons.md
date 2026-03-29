# Reject Reasons

> **Last verified:** 2026-03-29

## Overview
Reject reasons are a configurable list of predefined labels that casting directors select when rejecting a candidate (moving a submission to the Rejected pipeline stage). They standardize the rejection process so the team uses consistent language and the reason is recorded on the submission for future reference. Reject reasons are stored at the production level as a JSONB string array.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions/[id]/settings/reject-reasons` | `ProductionRejectReasonsPage` | Authenticated + active org | Edit production-level reject reasons |

Reject reasons are also consumed (not edited) in:
- Submission detail sheet / Kanban -- `RejectReasonDialog` appears when moving a submission to the Rejected stage
- Bulk reject flow -- Same dialog for bulk operations

## Data Model

Reject reasons are **not a separate table**. They are stored as a JSONB `string[]` column on the `Production` table:

| Column | Type | Notes |
|--------|------|-------|
| `Production.rejectReasons` | `jsonb` (`string[]`) | Default `[]`. Seeded with `DEFAULT_REJECT_REASONS` on production creation |

When a submission is rejected, the selected reason is stored on the `Submission` row:

| Column | Type | Notes |
|--------|------|-------|
| `Submission.rejectionReason` | `text` (nullable) | Set when moving to Rejected stage, cleared when moving away |

### Default Reject Reasons
Seeded on every new production (from `src/lib/pipeline.ts`):
1. "Not the right fit for this role"
2. "Scheduling conflict"
3. "Insufficient experience"
4. "Role already filled"
5. "Did not meet audition requirements"

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | `Production.rejectReasons` column, `Submission.rejectionReason` column |
| `src/lib/pipeline.ts` | `DEFAULT_REJECT_REASONS` array |
| `src/actions/productions/update-production-reject-reasons.ts` | Server action to update production reject reasons |
| `src/actions/productions/create-production.ts` | Seeds `DEFAULT_REJECT_REASONS` on create |
| `src/actions/submissions/update-submission-status.ts` | Sets `rejectionReason` when target stage is REJECTED |
| `src/components/productions/reject-reasons-editor.tsx` | CRUD editor for reject reason labels |
| `src/components/productions/reject-reason-dialog.tsx` | Dialog shown when rejecting a submission |
| `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` | Settings route |

## How It Works

### Configuring Reject Reasons (Settings Page)

The `RejectReasonsEditor` is a reusable client component that takes an entity ID, current reasons array, a server action, and an ID field name.

**Adding a reason:**
1. User types into the input field (max 200 chars) and clicks Add or presses Enter
2. Client checks: non-empty after trim, not a duplicate of existing reasons
3. Calls `updateProductionRejectReasons` with the full updated array (`[...existing, newReason]`)
4. Action verifies org ownership, updates `Production.rejectReasons` JSONB column
5. Page refreshes via `router.refresh()`

**Removing a reason:**
1. User clicks the X button on a reason
2. Calls the action with the reason filtered out (`reasons.filter((_, i) => i !== index)`)
3. Same server action updates the column
4. Page refreshes

The editor does not support reordering -- reasons display in insertion order.

### Reject Flow (Submission Stage Move)

When a submission is moved to the Rejected stage (via Kanban drag, submission detail, or bulk action):

1. **RejectReasonDialog** opens with the production's reject reasons as radio options plus an "Other" free-text option
2. User selects a predefined reason or types a custom one
3. If email templates are configured, the dialog also shows an editable email preview with subject and body fields
4. User confirms with either "Reject" (no email), "Reject without email", or "Reject & send email"
5. The resolved reason string and email preferences are passed to the confirm callback
6. `updateSubmissionStatus` is called with `stageId` (the Rejected stage) and `rejectionReason`
7. Action stores `rejectionReason` on the `Submission` row and creates a `PipelineUpdate` audit entry

**Clearing rejection reason:** When a previously rejected submission is moved to any non-REJECTED stage, `updateSubmissionStatus` automatically sets `rejectionReason` to `null`.

### Data Flow

```
RejectReasonsEditor (settings page)
  -> updateProductionRejectReasons action
    -> UPDATE Production SET rejectReasons = $1

RejectReasonDialog (Kanban/submission detail)
  -> updateSubmissionStatus action
    -> UPDATE Submission SET stageId = $rejected, rejectionReason = $reason
    -> INSERT PipelineUpdate (audit)
```

## Business Logic

### Validation Rules
- Each reason: trimmed string, 1-200 characters
- Max 50 reasons per production (enforced by Zod schema: `z.array(...).max(50)`)
- Duplicate prevention in the client (not server-enforced)
- The "Other" option in `RejectReasonDialog` allows free-text entry (max 500 chars), so `Submission.rejectionReason` may contain values not in the predefined list

### Authorization
- `updateProductionRejectReasons` requires authentication (`secureActionClient`) and verifies the production belongs to the user's active organization
- No role-based (admin vs member) gate -- any org member can edit reject reasons

### Edge Cases
- **Empty reasons list**: The RejectReasonDialog still works -- only the "Other" free-text option is available
- **Reason deleted after use**: The `Submission.rejectionReason` column stores the actual text, not a reference. Deleting a reason from the production's list does not affect existing submissions that used it
- **Bulk reject**: Each submission in a bulk reject receives the same rejection reason via `bulk-update-submission-status`

## UI States
- **Reason list**: Rendered as a bordered, divided list with reason text and an X remove button
- **Empty list**: No list is rendered; just the add input
- **Adding**: Input + Add button at the bottom of the list; button disabled when input is empty or action is pending
- **Removing**: Remove button disabled while action is pending
- **Reject dialog (no email templates)**: Simple radio list + optional "Other" textarea + single "Reject" button
- **Reject dialog (with email templates)**: Extended dialog with editable subject/body fields and three-button footer: Cancel, "Reject without email", "Reject & send email"
- **Confirm disabled**: The confirm button(s) are disabled until a reason is selected (or "Other" text is entered)

## Integration Points
- [Productions](./productions.md) -- Reject reasons are a JSONB column on the Production table, seeded on creation
- [Pipeline Stages](./pipeline.md) -- Reject reasons are prompted when moving to the REJECTED system stage
- [Email](./email.md) -- When configured, the reject dialog includes an editable email preview
- [Kanban](./kanban.md) -- Submission detail sheet displays the rejection reason on rejected submissions

## Architecture Decisions
- **JSONB string array over normalized table**: Reject reasons are stored as `jsonb string[]` on the Production row rather than in a separate `RejectReason` table. This simplifies the schema (no joins, no FK management) and matches the access pattern: reasons are always read/written as a complete list alongside the production. The trade-off is that reason usage analytics would require scanning submission text values rather than joining on IDs.
- **Text storage on Submission, not FK**: `Submission.rejectionReason` stores the actual reason text rather than referencing a reason ID. This decouples the rejection record from the configurable list -- renaming or deleting a reason from the production list does not retroactively change historical submissions.
- **Reusable editor component**: `RejectReasonsEditor` accepts a generic action and ID field, making it reusable if per-role reject reasons are added in the future (the `idField` prop already supports `"roleId"`).
- **Email integration in reject flow**: The `RejectReasonDialog` handles both the reason selection and optional email notification in a single dialog to minimize clicks. The casting director can reject-and-notify in one action rather than two separate steps.
