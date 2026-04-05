# Role Kanban Board

> **Last verified:** 2026-04-05

## Overview

The production submissions page presents all submissions across all roles as a horizontal Kanban board. Each pipeline stage is a column; each submission is a draggable card. Casting directors can triage candidates by dragging cards between columns, selecting cards for bulk operations, comparing headshots side-by-side, searching by name, and toggling between compact, grid, and table view modes. Clicking a card or table row opens the submission detail sheet for full review.

This is the primary workflow surface for casting directors -- the board makes the entire funnel visible at once instead of forcing stage-by-stage navigation.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions/[id]` | `ProductionPage` (server) -> `ProductionSubmissions` (client) | Org member | Main Kanban board for all roles in a production |

## Data Model

| Table | Key Columns | Role |
|-------|-------------|------|
| `Submission` | `id`, `productionId`, `roleId`, `candidateId`, `stageId`, `rejectionReason`, `sortOrder`, `answers` (JSONB), `links`, `resumeText` | Core entity on every card; contact info from `Candidate` via join |
| `PipelineStage` | `id`, `productionId`, `name`, `order`, `type` (APPLIED/SELECTED/REJECTED/CUSTOM) | One column per stage |
| `PipelineUpdate` | `id`, `submissionId`, `fromStage`, `toStage`, `changeByUserId`, `createdAt` | Audit trail for every stage move |
| `File` | `id`, `submissionId`, `type` (HEADSHOT/RESUME), `url`, `filename`, `order` | Headshot thumbnails on cards |
| `Candidate` | `id`, `organizationId`, `firstName`, `lastName`, `email` | Linked per-submission |

**Relationships:** `Submission` -> `PipelineStage` (current stage), `Submission` -> `Role` -> `Production` -> `Organization` (ownership chain), `Submission` -> `File[]` (headshots + resume), `Submission` -> `Feedback[]`, `Submission` -> `Comment[]`.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/(app)/productions/[id]/(production)/page.tsx` | Server component; fetches production + submissions via `getProductionSubmissions`, renders `ProductionSubmissions` |
| `src/components/productions/production-submissions.tsx` | Client component; owns Kanban state, `DragDropProvider`, column layout, toolbar, and all sub-feature coordination |
| `src/components/productions/kanban-column.tsx` | Single stage column with `useDroppable`, header checkbox, card list, empty state |
| `src/components/productions/kanban-card.tsx` | Draggable card with `useSortable`; grid (headshot + name + date) and compact (avatar + name) modes |
| `src/components/productions/submission-table-view.tsx` | Table view mode; tanstack/react-table data table grouped by stage with drag-to-reorder rows |
| `src/components/productions/bulk-action-bar.tsx` | Fixed bottom bar with "Move to" popover, "Send email" button, "Compare" button, and "Clear" |
| `src/components/productions/bulk-email-dialog.tsx` | Dialog for composing and sending a custom email to all selected submissions via `bulkSendEmailAction` |
| `src/components/productions/consider-for-role-dialog.tsx` | Dialog to copy a submission to another role in the same production |
| `src/components/productions/comparison-view.tsx` | Full-screen dialog with side-by-side candidate comparison grid |
| `src/components/productions/submission-detail-sheet.tsx` | Right-side Sheet with full submission info, stage controls, feedback panel, comments |
| `src/components/productions/submission-info-panel.tsx` | Left pane of detail sheet: headshots, resume, links, form responses, cross-role badges |
| `src/components/productions/headshot-lightbox.tsx` | Full-screen image viewer; `yet-another-react-lightbox` with Zoom plugin; dynamically imported (no SSR) |
| `src/components/productions/stage-controls.tsx` | Stage badge + "Change stage" popover + "Reject" button |
| `src/actions/productions/get-production-submissions.ts` | Server read: fetches all roles with nested submissions, feedback, comments, pipeline updates, emails |
| `src/actions/submissions/update-submission-status.ts` | Mutation: moves one submission to a new stage; writes `PipelineUpdate` audit row |
| `src/actions/submissions/bulk-update-submission-status.ts` | Mutation: moves up to 100 submissions at once; validates all belong to same production |
| `src/actions/submissions/reorder-submission.ts` | Mutation: persists `sortOrder` change after drag-to-reorder within a column |
| `src/actions/submissions/bulk-send-email.ts` | Mutation: sends a custom email to selected submissions; writes `Email` rows for activity log |
| `src/lib/submission-helpers.ts` | Shared types (`SubmissionWithCandidate`, `PipelineStageData`, `ColumnItems`), `buildColumns()`, `buildActivityList()` |

## How It Works

### Data Flow

```
ProductionPage (server)
  └── getProductionSubmissions(productionId)
        ├── Fetches production with pipelineStages, roles, submissions
        │   (nested: feedback, comments, pipelineUpdates, emails, files)
        ├── Flattens submissions across all roles into SubmissionWithCandidate[]
        ├── Builds otherRoleSubmissions lookup (candidates in multiple roles)
        └── Returns { roles, pipelineStages, submissions, formFields, rejectReasons }

ProductionSubmissions (client)
  ├── buildColumns(submissions, pipelineStages) → Record<stageId, submissions[]>
  ├── Toolbar: search input + role chip/button row + compact/grid/table ToggleGroup
  ├── DragDropProvider (@dnd-kit/react v0.3)
  │     ├── onDragStart → snapshot columns into previousColumns ref
  │     ├── onDragOver  → move() helper updates column state optimistically
  │     └── onDragEnd   → detect cross-column move → fire server action
  │                        (REJECTED → RejectReasonDialog, SELECTED → EmailPreviewDialog)
  │                        same-column reorder → fire reorderSubmission
  ├── KanbanColumn[] | SubmissionTableView (switched by viewMode)
  │     └── KanbanCard[] (one per visible submission)
  ├── BulkActionBar (when selectedIds.size > 0)
  │     ├── "Move to" popover → bulk stage change
  │     ├── "Send email" → BulkEmailDialog → bulkSendEmailAction
  │     └── "Compare" → ComparisonView
  ├── ComparisonView (Dialog, opened from BulkActionBar)
  └── SubmissionDetailSheet (Sheet, opened on card/row click)
```

### Drag-and-Drop (Optimistic)

1. `onDragStart` -- snapshots current `columns` into `previousColumns` ref
2. `onDragOver` -- calls `move()` from `@dnd-kit/helpers`, card visually moves immediately
3. `onDragEnd` -- compares `previousColumns` vs `movedColumns` to detect cross-stage move
   - Same stage: no server call (reorder only)
   - REJECTED target: shows `RejectReasonDialog` (reason + optional email), then fires action
   - SELECTED target: shows `EmailPreviewDialog` (selected email), then fires action
   - Other target: fires `updateSubmissionStatus` immediately
4. On error: restores `previousColumns` snapshot + `router.refresh()` for prop-sync
5. Cancel (Escape): restores snapshot, no server call

### Prop-Sync Pattern

```
if (submissions !== prevSubmissions) {
  setPrevSubmissions(submissions)
  setColumns(buildColumns(submissions, pipelineStages))
}
```

When `router.refresh()` triggers a server re-fetch, new props flow in. The identity check detects the change and resets local state from server truth.

## Business Logic

- **Org ownership:** All read/write actions verify `submission -> role -> production -> organizationId === user.activeOrganizationId`
- **Stage validation:** Target stage must belong to the same production (checked server-side)
- **Terminal stages unlocked:** All stages including Selected and Rejected are valid drag targets; mistakes can be corrected
- **Rejection reason:** Moving to REJECTED triggers `RejectReasonDialog`; reason stored in `Submission.rejectionReason`; cleared when moving away from REJECTED
- **Selected email:** Moving to SELECTED triggers `EmailPreviewDialog`; optionally sends a "selected" email
- **Bulk move cap:** Maximum 100 submissions per bulk operation (enforced in Zod schema and client-side selection)
- **Audit trail:** Every stage transition writes a `PipelineUpdate` row with `fromStage`, `toStage`, `changeByUserId`
- **Search filtering:** Client-side filter on `candidate.firstName + candidate.lastName`; does not affect drag state (filtered view is derived)
- **Role filtering:** When production has multiple roles, a chip/button row above the board filters visible cards by role; "All" chip shown by default
- **Drag reorder within column:** Same-stage drop calls `reorderSubmission` to persist `Submission.sortOrder` using fractional indexing
- **Bulk email:** `BulkEmailDialog` composes a subject + body with template variables (`{{first_name}}`, `{{production_name}}`, etc.) and calls `bulkSendEmailAction`; emails are sent via `sendBatchEmail` and logged as `Email` rows

## UI States

| State | Behavior |
|-------|----------|
| **Empty (no submissions)** | `Empty` component: "No candidates yet" with description |
| **Empty column** | "No candidates" text (or "No matches" when search/filter is active) |
| **Dragging** | Source card at 40% opacity; drop target column at `bg-muted/60` |
| **Pending (single move)** | Card shows `pointer-events-none animate-pulse` |
| **Pending (bulk move)** | "Move to" button shows loading spinner |
| **Compact mode** | Single-line cards with avatar + name + inline drag handle |
| **Grid mode** | Full cards with 4:3 headshot area + name + date |
| **Table mode** | `SubmissionTableView`: tanstack/react-table grouped by stage, draggable rows, stage-change select per row |
| **Selection active** | Checkboxes visible; `BulkActionBar` appears at bottom |
| **Detail sheet open** | Right-side Sheet with left nav rail (close, prev, next) |
| **Comparison open** | Full-screen Dialog with side-by-side grid |

## Integration Points

- [Pipeline Stages](./pipeline.md) -- columns derive from `pipelineStages`; stage types control reject/select dialogs
- [Feedback](./feedback.md) -- `FeedbackPanel` rendered in right pane of `SubmissionDetailSheet`
- [Comments](./comments.md) -- comment form and list rendered within `FeedbackPanel`
- [Custom Fields](./custom-fields.md) -- submission form responses displayed in `SubmissionInfoPanel`; feedback form fields passed to `FeedbackPanel`
- [Email](./email.md) -- `RejectReasonDialog` and `EmailPreviewDialog` use production email templates
- [Reject Reasons](./reject-reasons.md) -- `RejectReasonDialog` receives configured reasons from production
- [Submissions](./submissions.md) -- headshot URLs from `File` table rendered on cards and in detail sheet

## Architecture Decisions

- **@dnd-kit/react v0.3, not @dnd-kit/core.** The React-specific package provides `DragDropProvider`, `useDroppable`, and `useSortable` as hooks. The `move()` helper from `@dnd-kit/helpers` handles cross-column reordering in one call.

- **Optimistic UI over server-driven updates.** Moving a card feels instant. The server action is fire-and-forget after the visual update. Errors roll back via `router.refresh()` + prop-sync.

- **Prop-sync pattern instead of `useEffect`.** `if (submissions !== prevSubmissions)` synchronizes server-refreshed props into local column state without an extra render cycle.

- **Production-level board, not role-level.** The board shows all submissions across all roles with an optional role chip filter. This replaced the previous per-role page because casting directors review across roles simultaneously.

- **Comparison view as Dialog, not a separate route.** Comparison is a transient mode used mid-review, not a persistent destination. A Dialog keeps the Kanban state intact underneath.
