# Pipeline Stages

> **Last verified:** 2026-03-29

## Overview
The casting pipeline defines the stages a submission moves through during the audition process -- from initial application through screening, auditions, and callbacks to a final decision (selected or rejected). Pipeline stages are configurable at the production level and shared by all roles within that production. This mirrors the performing arts workflow where all candidates go through the same process regardless of which role they're auditioning for.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions/[id]/settings/pipeline` | `ProductionPipelinePage` | Authenticated + active org | Full pipeline stage editor for a production |
| `/productions/new` (step 2) | `CreateProductionForm` | Authenticated + active org | Pipeline configuration during production creation |

Pipeline stages are also consumed (but not edited) on:
- `/productions/[id]` -- Kanban board columns are pipeline stages
- Submission detail sheet -- Stage moves and history

## Data Model

### PipelineStage table
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Format: `stg_*` |
| `organizationId` | `text` FK | References Organization; cascades on delete |
| `productionId` | `text` FK | References Production; cascades on delete |
| `name` | `text` | Required, max 100 chars |
| `order` | `integer` | Determines display order. System stages use reserved values (0, 1000, 1001) |
| `type` | `pipeline_stage_type` enum | `"APPLIED"` / `"CUSTOM"` / `"SELECTED"` / `"REJECTED"` |
| `createdAt` / `updatedAt` | `timestamp` | Auto-managed |

### PipelineUpdate table (audit trail)
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Format: `pu_*` |
| `organizationId` | `text` FK | |
| `productionId` | `text` FK | |
| `roleId` | `text` FK | |
| `submissionId` | `text` FK | |
| `fromStage` | `text` FK (nullable) | Previous stage (null for initial placement) |
| `toStage` | `text` FK (nullable) | Target stage |
| `changeByUserId` | `text` FK (nullable) | Who made the change; set null on user delete |
| `createdAt` | `timestamp` | |

### Key relationships
- `Production` 1:N `PipelineStage`
- `PipelineStage` 1:N `Submission` (via `stageId`)
- `PipelineStage` 1:N `PipelineUpdate` (from and to)
- `PipelineStage` 1:N `Feedback` (feedback is recorded per stage)

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | `PipelineStage`, `PipelineUpdate` table definitions, `pipelineStageTypeEnum` |
| `src/lib/pipeline.ts` | `SYSTEM_STAGES`, `DEFAULT_PRODUCTION_STAGES`, `buildProductionStages()`, `buildCustomProductionStages()` |
| `src/lib/constants.ts` | `MAX_PIPELINE_STAGES` (30) |
| `src/actions/productions/add-production-stage.ts` | Add a custom stage to an existing production |
| `src/actions/productions/remove-production-stage.ts` | Remove a custom stage (with safety checks) |
| `src/actions/productions/reorder-production-stages.ts` | Reorder custom stages |
| `src/actions/productions/get-production-stages.ts` | Fetch stages for a production |
| `src/actions/submissions/update-submission-status.ts` | Move a submission to a different stage (creates PipelineUpdate) |
| `src/actions/submissions/bulk-update-submission-status.ts` | Bulk stage move (up to 100 submissions) |
| `src/components/productions/default-stages-editor.tsx` | `StagesEditor` (controlled) + `ProductionStagesEditor` (settings wrapper) |

## How It Works

### System Stages vs Custom Stages

Every pipeline has three immutable **system stages**:

| Stage | Type | Order | Purpose |
|-------|------|-------|---------|
| Applied | `APPLIED` | 0 | Entry point -- all new submissions land here |
| Selected | `SELECTED` | 1000 | Terminal positive outcome |
| Rejected | `REJECTED` | 1001 | Terminal negative outcome |

System stages cannot be renamed, reordered, or removed. They are rendered as fixed, non-interactive entries in the UI with a "System stage" tooltip.

**Custom stages** (type `CUSTOM`) sit between Applied and Selected/Rejected. Their `order` values are sequential integers starting from 1. Default custom stages for new productions are: Screening (1), Audition (2), Callback (3).

### Stage Creation (during production creation)

In the create wizard (step 2), custom stages are managed entirely in React state:

1. Default stages (`DEFAULT_CUSTOM_STAGES`) are pre-populated: Screening, Audition, Callback
2. User can add, remove, or reorder via drag-and-drop (`@dnd-kit`)
3. On form submit, custom stage names are sent as `customStages: string[]`
4. `buildCustomProductionStages()` constructs full stage objects with IDs and system stages
5. If `customStages` is `undefined` (user skipped the step), `buildProductionStages()` seeds the defaults

### Stage Management (settings page)

The `ProductionStagesEditor` component wraps the controlled `StagesEditor` with server action bindings:

**Add stage:**
1. User types a name and clicks Add (or presses Enter)
2. `addProductionStage` action fires: verifies org ownership, checks `MAX_PIPELINE_STAGES` limit (30), finds the max custom stage order, inserts with `order = maxOrder + 1`
3. Page refreshes via `router.refresh()`

**Remove stage:**
1. User clicks X on a custom stage
2. Optimistic removal from local state
3. `removeProductionStage` action fires with safety checks:
   - Only `CUSTOM` type stages can be removed
   - If submissions exist on the stage: throws error "Move all submissions out of this stage before deleting it"
   - If feedback exists on the stage (no submissions): returns `{ confirmRequired: true, feedbackCount }` -- client shows an AlertDialog asking for confirmation
   - If force=true: deletes feedback first, then the stage, in a transaction
4. On success, page refreshes

**Reorder stages:**
1. User drags a custom stage to a new position
2. Optimistic reorder in local state
3. `reorderProductionStages` action fires: verifies all stage IDs are CUSTOM and belong to the production, updates order values sequentially (1, 2, 3...) in a transaction
4. On error, page refreshes to restore server state

### Moving Submissions Between Stages

When a submission is moved (via Kanban drag-drop, bulk action, or manual stage change):

1. `updateSubmissionStatus` action receives `submissionId` and target `stageId`
2. Verifies the target stage belongs to the same production
3. In a transaction:
   - Updates `Submission.stageId` (and `rejectionReason` if target is REJECTED, clears it otherwise)
   - Inserts a `PipelineUpdate` audit row recording from/to/who/when
4. Revalidates the page

## Business Logic

### Constraints
- **Max 30 stages** per production (including system stages), enforced by `MAX_PIPELINE_STAGES`
- **System stages are immutable**: Cannot be added, removed, renamed, or reordered
- **Deletion safety**: Cannot delete a stage with submissions on it. Feedback-only stages prompt for confirmation before force-deleting
- **Order values**: Applied = 0, custom stages = 1..N, Selected = 1000, Rejected = 1001. The gap between custom and terminal stages allows insertion without reordering terminals

### Authorization
- All actions require authentication via `secureActionClient`
- Production ownership verified by checking `organizationId` matches the user's `activeOrganizationId`

## UI States
- **Fixed stages**: Rendered with muted text and a "System stage" tooltip; no drag handle or remove button
- **Custom stages**: Drag handle + remove button; submission count shown when non-zero; remove button disabled if stage has submissions
- **At limit**: Input placeholder changes to "Stage limit reached" and input + add button are disabled
- **Removing**: Optimistic removal from local state; restored on error
- **Confirm delete (feedback)**: AlertDialog showing feedback count and warning about permanent deletion
- **Empty custom stages**: "No custom stages yet" placeholder text

## Integration Points
- [Productions](./productions.md) -- Pipeline stages belong to a production and are created alongside it
- [Reject Reasons](./reject-reasons.md) -- When moving to the Rejected stage, users select a reason from the production's reject reasons
- [Kanban](./kanban.md) -- Each pipeline stage is a column on the role submissions Kanban
- [Feedback](./feedback.md) -- Feedback entries are recorded per pipeline stage
- PipelineUpdate -- Audit trail for all stage transitions

## Architecture Decisions
- **Production-level, not role-level**: All roles share the same pipeline. This was chosen for simplicity and matches how community theatre typically runs a unified audition process. The order column gap (custom 1..N, terminals at 1000/1001) leaves room to change this.
- **Soft ordering with gaps**: System stages use order values 0, 1000, 1001 to create natural gaps. Custom stages use sequential integers between them. This avoids needing to reorder terminal stages when custom stages are added.
- **PipelineUpdate as audit trail**: Every stage transition is recorded as an immutable row, creating a full audit trail. This supports the activity log in the submission detail sheet and enables future analytics.
- **CUSTOM type enum over nullable**: Using a `pipeline_stage_type` enum (`APPLIED`/`CUSTOM`/`SELECTED`/`REJECTED`) rather than a nullable boolean makes stage identity explicit and simplifies queries that need to distinguish system from user-defined stages.
