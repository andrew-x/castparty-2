# Submission Statuses (Casting Pipeline)

## Context

Castparty currently has no way to track where a candidate is in the casting process. All submissions appear in a flat list with no status. Production teams need a configurable pipeline to move candidates through stages like Inbound → Callback → Chemistry Read → Cast/Rejected.

This plan adds:
1. A `PipelineStage` table for configurable per-role pipeline stages
2. A `stageId` on submissions to track their current position
3. A `StatusChange` audit table for history
4. Tab-filtered submission lists per role
5. A status selector in the submission detail sheet
6. UI to add/remove custom pipeline stages per role

## Data Model

### New table: `PipelineStage`

```
pipeline_stage
├── id          text PK
├── roleId      text FK → role.id (cascade)
├── name        text NOT NULL        -- display name ("Callback")
├── slug        text NOT NULL        -- machine key ("callback")
├── position    integer NOT NULL     -- ordering (0=inbound, 1-999=custom, 1000=cast, 1001=rejected)
├── isSystem    boolean default false -- true for inbound/cast/rejected (can't delete)
├── isTerminal  boolean default false -- true for cast/rejected (end states)
├── createdAt   timestamp
└── updatedAt   timestamp
    UNIQUE(roleId, slug)
    INDEX(roleId)
```

### New table: `StatusChange`

```
status_change
├── id            text PK
├── submissionId  text FK → submission.id (cascade)
├── fromStageId   text FK → pipeline_stage.id (set null)
├── toStageId     text NOT NULL FK → pipeline_stage.id (set null)
├── changedById   text FK → user.id (cascade)
└── changedAt     timestamp
    INDEX(submissionId)
```

### Modified table: `Submission`

Add column: `stageId text FK → pipeline_stage.id (set null)`

Nullable — `null` is interpreted as "inbound" by the application. This makes the migration non-blocking.

### System stage constants

```ts
// src/lib/pipeline.ts
export const SYSTEM_STAGES = [
  { slug: "inbound",  name: "Inbound",  position: 0,    isTerminal: false },
  { slug: "cast",     name: "Cast",     position: 1000, isTerminal: true },
  { slug: "rejected", name: "Rejected", position: 1001, isTerminal: true },
] as const
```

## Implementation Steps

### Step 1: Schema + types + migration

**Files:**
- Edit `src/lib/db/schema.ts` — add `PipelineStage`, `StatusChange`, `Submission.stageId`, all relations
- Create `src/lib/pipeline.ts` — system stage constants and helper to create them
- Run `bunx drizzle-kit generate` to produce migration SQL

**Schema relations to add:**
- `Role` → `many(PipelineStage)` as `pipelineStages`
- `PipelineStage` → `one(Role)`, `many(Submission)`
- `Submission` → `one(PipelineStage)` as `stage`, `many(StatusChange)` as `statusChanges`
- `StatusChange` → `one(Submission)`, `one(PipelineStage)` for from/to, `one(User)` for changedBy

**Subagent:** Bash for `drizzle-kit generate`

### Step 2: Data migration

Write a migration script (or manual SQL in the generated migration file) to:
1. Insert 3 system `PipelineStage` rows for every existing `Role`
2. Set `Submission.stageId` to the inbound stage of their role

**Subagent:** Bash for `drizzle-kit migrate`

### Step 3: Backend — modify `createRole`

**File:** `src/actions/productions/create-role.ts`

Wrap in a transaction. After inserting the role, insert the 3 system pipeline stages using `SYSTEM_STAGES` from `src/lib/pipeline.ts`.

Reuse: `generateId("stg")` for stage IDs, `SYSTEM_STAGES` constant.

### Step 4: Backend — modify `createSubmission`

**File:** `src/actions/submissions/create-submission.ts`

Inside the existing transaction, look up the role's inbound stage and set `stageId` on the new submission.

### Step 5: Backend — new `updateSubmissionStatus` action

**File:** `src/actions/submissions/update-submission-status.ts` (new)

- `secureActionClient` with inputs `submissionId` + `stageId`
- Verify ownership chain: submission → role → production → org matches user's active org
- Verify target stage belongs to the same role
- Transaction: update `Submission.stageId`, insert `StatusChange` audit row
- Return updated submission

### Step 6: Backend — new pipeline management actions

**Files (new):**
- `src/actions/productions/add-pipeline-stage.ts` — add a custom stage to a role
  - Generate slug from name, calculate position (max non-terminal position + 1)
  - Verify ownership chain
- `src/actions/productions/remove-pipeline-stage.ts` — remove a custom stage
  - Block deletion of system stages (`isSystem === true`)
  - Move submissions on this stage to inbound, then delete the stage

### Step 7: Backend — modify `getRolesWithSubmissions`

**File:** `src/actions/productions/get-roles-with-submissions.ts`

Add to the query:
- `pipelineStages` relation on roles, ordered by `position` ascending
- `stage` relation on submissions

### Step 8: UI — update `RolesAccordion`

**File:** `src/components/productions/roles-accordion.tsx`

This is the largest change. Modifications:

1. **Update interfaces** — add `stageId`, `stage` to `SubmissionWithCandidate`; add `pipelineStages` to `RoleWithSubmissions`

2. **Tab-filtered list inside each accordion item** — use existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from `@/components/common/tabs`:
   - "All" tab (default) shows all submissions
   - One tab per pipeline stage, showing count badge
   - Filter logic: match `submission.stage?.slug` (or "inbound" if null)

3. **Status badge on each submission row** — show a `Badge` with the stage name next to each submission in the list. Use variant:
   - `"secondary"` for inbound (neutral)
   - Custom green class (`bg-success-light text-success-text`) for cast
   - `"destructive"` for rejected
   - `"outline"` for custom stages

4. **Status selector in submission detail Sheet** — add a `Select` dropdown (from `@/components/common/select`) showing all stages for the role. On change, call `updateSubmissionStatus` action and `router.refresh()`.

5. **Pipeline configuration section** — add a collapsible section or button (gear icon) per role that shows:
   - List of current custom stages with remove buttons
   - "Add stage" input + button
   - System stages shown but not removable
   - Calls `addPipelineStage` / `removePipelineStage` actions

**Reuses:** `Badge`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, `Button`, `Input`, `Separator` — all from `@/components/common/`

## Key Files

| File | Action |
|------|--------|
| `src/lib/db/schema.ts` | Add PipelineStage, StatusChange tables; Submission.stageId; relations |
| `src/lib/pipeline.ts` | New — system stage constants |
| `src/actions/productions/create-role.ts` | Modify — auto-create system stages |
| `src/actions/submissions/create-submission.ts` | Modify — set stageId to inbound |
| `src/actions/submissions/update-submission-status.ts` | New — move submission between stages |
| `src/actions/productions/add-pipeline-stage.ts` | New — add custom stage to a role |
| `src/actions/productions/remove-pipeline-stage.ts` | New — remove custom stage |
| `src/actions/productions/get-roles-with-submissions.ts` | Modify — include stages in query |
| `src/components/productions/roles-accordion.tsx` | Modify — tabs, badges, selector, config UI |

## Verification

1. `bun run build` — confirm no type errors
2. `bun run lint` — confirm no lint issues
3. Manual testing flow:
   - Create a production with a role → verify 3 system stages exist
   - Submit a candidate → verify they land in "Inbound"
   - Move candidate to "Cast" via the Sheet selector → verify badge updates
   - Add a custom stage "Callback" → verify it appears in tabs
   - Move candidate to "Callback" → verify filtering works
   - Remove "Callback" stage → verify submissions move back to Inbound
   - Check that system stages (Inbound/Cast/Rejected) cannot be removed
