# Update codebase to match new database schema

## Context

The database schema (`src/lib/db/schema.ts`) was restructured with several breaking changes:

- **PipelineStage**: removed `slug`, `position`, `isSystem`, `isTerminal`; added `organizationId`, `productionId`, `order`, `type` enum (APPLIED/SELECTED/REJECTED/CUSTOM)
- **StatusChange table deleted** → replaced by `PipelineUpdate` with different column names and additional FK columns
- **Nullable → notNull with defaults**: `Production.description`, `Role.description`, `Candidate.phone`, `Submission.phone` all changed from nullable to `notNull().default("")`
- **Submission**: `stageId` is now required (was nullable); `resumeUrl` removed; `location` and `answers` added
- **Candidate**: `location` added; `phone` is now `notNull().default("")`
- **Production/Role**: `isOpen`, `location`, `formFields` added
- **OrganizationProfile**: `websiteUrl`/`description` now `notNull().default("")`; `isAuditionBoardOpen` added

**Type mapping** (confirmed with user):
- `APPLIED` = initial stage (was `slug: "inbound"`)
- `SELECTED` = cast terminal (was `slug: "cast"`)
- `REJECTED` = rejected terminal (was `slug: "rejected"`)
- `type !== "CUSTOM"` = system stage (can't be deleted)

---

## Changes

### 1. `src/lib/pipeline.ts` — Rewrite system stage builder

Replace `SYSTEM_STAGES` array and `buildSystemStages()` to use new column names:
- `position` → `order`
- `isSystem`/`isTerminal` → use `type` enum values
- Remove `slug` from stage definitions
- Add `organizationId` and `productionId` parameters to `buildSystemStages()`

```
SYSTEM_STAGES = [
  { name: "Inbound", order: 0, type: "APPLIED" },
  { name: "Cast", order: 1000, type: "SELECTED" },
  { name: "Rejected", order: 1001, type: "REJECTED" },
]

buildSystemStages(roleId, productionId, organizationId) → stage rows
```

Remove the `SystemStageSlug` type export (no longer applicable).

### 2. `src/actions/productions/create-role.ts` — Pass org/production IDs to stage builder

- Update `buildSystemStages()` call to include `orgId` and `productionId`
- Change `description: description || null` → `description: description || ""`

### 3. `src/actions/productions/add-pipeline-stage.ts` — Rewrite for new schema

- Remove `slug` generation and uniqueness check (no slug column)
- Replace `position` with `order` (use `max(PipelineStage.order)` instead of `max(PipelineStage.position)`)
- Replace `isSystem: false, isTerminal: false` with `type: "CUSTOM"`
- Add `organizationId` and `productionId` to insert values (resolve from role's production)

### 4. `src/actions/productions/remove-pipeline-stage.ts` — Replace isSystem check

- Replace `columns: { id: true, roleId: true, isSystem: true }` with `columns: { id: true, roleId: true, type: true }`
- Replace `stage.isSystem` check with `stage.type !== "CUSTOM"`
- Replace `slug: "inbound"` lookup with `type: "APPLIED"` lookup (find fallback stage for reassignment)
- Remove `slug` references

### 5. `src/actions/submissions/update-submission-status.ts` — Replace StatusChange with PipelineUpdate

- Change import from `StatusChange` to `PipelineUpdate`
- Replace `isTerminal` check with `type === "SELECTED" || type === "REJECTED"` check (column `type` instead of `isTerminal`)
- Update insert to use `PipelineUpdate` with new column names:
  - `fromStageId` → `fromStage`
  - `toStageId` → `toStage`
  - `changedById` → `changeByUserId`
- Add required FK fields: `organizationId`, `productionId`, `roleId` (resolve from submission relations)
- Update ID prefix from `"sc"` to `"pu"`

### 6. `src/actions/submissions/create-submission.ts` — Fix nullable fields

- Change `phone: phone ?? null` → `phone: phone ?? ""` (both candidate insert/update and submission insert)
- Change `stageId: inboundStage?.id ?? null` → throw error if no APPLIED stage found (stageId is now required)
- Replace `slug: "inbound"` lookup with `type: "APPLIED"` lookup

### 7. `src/actions/productions/get-roles-with-submissions.ts` — Fix orderBy

- Change `orderBy: (s, { asc }) => [asc(s.position)]` → `orderBy: (s, { asc }) => [asc(s.order)]`

### 8. `src/actions/productions/create-production.ts` — Fix nullable description

- Change `description: description || null` → `description: description || ""`
- Same for role values: `description: role.description || null` → `description: role.description || ""`
- When creating roles inline, also create pipeline stages for each role (currently only `create-role.ts` does this; creating roles via `create-production` skips pipeline stages)

### 9. `src/components/productions/roles-accordion.tsx` — Update interfaces and logic

**Interface changes:**
- `PipelineStageData`: remove `slug`, `position`, `isSystem`, `isTerminal`; add `order`, `type`
- `SubmissionWithCandidate`: remove `resumeUrl: string | null`; change `phone` from `string | null` to `string`; change `stageId` from `string | null` to `string`
- `RoleWithSubmissions`: change `description` from `string | null` to `string`

**Logic changes:**
- `getStageBadgeProps`: replace `stage.slug` checks with `stage.type` checks (APPLIED→secondary, SELECTED→success, REJECTED→destructive, CUSTOM→outline)
- `resolveStageSlug` → remove entirely; use `submission.stageId` for matching
- Tab values: use `stage.id` instead of `stage.slug` (slug no longer exists)
- Tab filtering: match by `submission.stageId === stage.id` instead of slug comparison
- Pipeline config: replace `stage.isSystem` checks with `stage.type !== "CUSTOM"`
- Remove the resume section (lines 588-607)

### 10. `src/components/candidates/candidates-table.tsx` — Fix phone type

- Change `phone: string | null` → `phone: string` in the Candidate interface
- Change `{candidate.phone ?? "—"}` → `{candidate.phone || "—"}`

### 11. `src/lib/constants.ts` — No changes needed

`DEFAULT_PIPELINE_STAGES = []` is a placeholder; no action required.

---

## Files modified (summary)

| File | Change type |
|------|-------------|
| `src/lib/pipeline.ts` | Rewrite |
| `src/actions/productions/add-pipeline-stage.ts` | Major update |
| `src/actions/productions/remove-pipeline-stage.ts` | Major update |
| `src/actions/productions/create-role.ts` | Minor update |
| `src/actions/productions/create-production.ts` | Minor update |
| `src/actions/productions/get-roles-with-submissions.ts` | One-line fix |
| `src/actions/submissions/update-submission-status.ts` | Major update |
| `src/actions/submissions/create-submission.ts` | Moderate update |
| `src/components/productions/roles-accordion.tsx` | Major update |
| `src/components/candidates/candidates-table.tsx` | Minor update |

## Subagents

No subagents needed — all changes are well-scoped edits to known files.

## Verification

1. Run `bun run build` to confirm no TypeScript errors
2. Run `bun run lint` to check for Biome issues
3. Manual check: visit a production page, verify roles accordion renders, pipeline tabs work, submission detail sheet renders without resume section
