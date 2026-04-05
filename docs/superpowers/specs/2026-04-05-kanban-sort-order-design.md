# Kanban Sort Order Design

## Context

The submission kanban board supports drag-and-drop between columns (stage changes)
via `@dnd-kit/react`, but within-column ordering is client-state only and resets on
page refresh. Users need persistent ordering so they can drag submissions to an exact
position within a column and have that order survive reloads.

**Goal:** Store per-submission sort order with minimal blast radius on updates — every
reorder operation should touch exactly one database row.

**Approach:** Fractional indexing via the `fractional-indexing` npm package. Sort keys
are lexicographically sortable strings (e.g., `"a0"`, `"a1"`, `"Zz"`) that allow
inserting between any two values without renumbering other rows. This is the same
technique used by Linear, Figma, and Notion.

## Data Model

### Schema change

Add a `sortOrder` text column to the `Submission` table in `src/lib/db/schema.ts`:

```ts
sortOrder: text().notNull(),
```

No static `.default()` — the value is computed at insert time based on what already
exists in the target column.

### Type change

Add `sortOrder: string` to `SubmissionWithCandidate` in `src/lib/submission-helpers.ts`.

### Library

Install `fractional-indexing` (npm package, ~1KB, zero dependencies). Provides:

- `generateKeyBetween(lower, upper)` — returns a key between two existing keys
- `generateNKeysBetween(lower, upper, n)` — returns `n` evenly spaced keys

Both accept `null` for open-ended ranges (before first / after last).

## Server Actions

### New: `reorderSubmission`

File: `src/actions/submissions/reorder-submission.ts`

- **Input:** `{ submissionId: string, sortOrder: string }`
- **Behavior:** Updates only `Submission.sortOrder` for the given row (1 row, 1 field)
- **Use case:** Within-column reordering (no stage change)
- **Schema:** `src/lib/schemas/submission.ts` — add `reorderSubmissionSchema`

### Modified: `updateSubmissionStatus`

File: `src/actions/submissions/update-submission-status.ts`

- Add optional `sortOrder: string` to `updateSubmissionStatusSchema`
- When provided, include `sortOrder` in the `.set()` call alongside `stageId`
- **Use case:** Cross-column drag (stage change + positioning in new column)

### Modified: `bulkUpdateSubmissionStatus`

File: `src/actions/submissions/bulk-update-submission-status.ts`

- After computing the target stage, query the current maximum `sortOrder` in that
  stage for the production
- Generate `n` sequential keys after the last existing key using
  `generateNKeysBetween(lastKey, null, n)` where `n` is the count of submissions
  being moved
- Assign one key to each moved submission
- **Use case:** Bulk move appends submissions to the end of the target column

### Modified: `createSubmission`

File: `src/actions/submissions/create-submission.ts`

- Before inserting, query the current minimum `sortOrder` among submissions in the
  Applied stage for this production
- Generate a key before it: `generateKeyBetween(null, firstKey)`
- Assign to each new submission (one per role)
- If no submissions exist yet, `generateKeyBetween(null, null)` returns `"a0"`
- **Result:** New submissions appear at the top of the Applied column

### Modified: `copySubmissionToRole`

File: `src/actions/submissions/copy-submission-to-role.ts`

- Same pattern as `createSubmission` — query the minimum `sortOrder` in the target
  production's Applied stage, generate a key before it

## Data Fetching

### `getProductionSubmissions`

File: `src/actions/productions/get-production-submissions.ts`

Add `orderBy` to the submissions relation:

```ts
submissions: {
  orderBy: (s, { asc }) => [asc(s.sortOrder)],
  with: { ... }
}
```

Submissions arrive pre-sorted. `buildColumns` in `submission-helpers.ts` distributes
them into columns preserving the array order — no client-side re-sort needed.

## Client-Side Changes

### `production-submissions.tsx`

The `fractional-indexing` package runs on the client. The client generates the new
sort key and sends it to the server. This keeps optimistic updates fast (no
round-trip to compute the key).

**`onDragEnd` handler changes:**

1. After `move()` resolves the new column state, locate the moved submission in its
   new column by index
2. Read the `sortOrder` of the neighboring items:
   - `prevKey = column[index - 1]?.sortOrder ?? null`
   - `nextKey = column[index + 1]?.sortOrder ?? null`
3. Generate: `newSortOrder = generateKeyBetween(prevKey, nextKey)`

4a. **Same-column move:** Call `reorderSubmission({ submissionId, sortOrder: newSortOrder })`

4b. **Cross-column move:** Include `sortOrder: newSortOrder` in the existing
    `updateSubmissionStatus` call (and the rejection/selection dialog flows that
    eventually call it)

### Rejection/selection dialog flows

The `pendingRejectRef` and `pendingSelectRef` refs need to carry the computed
`sortOrder` so it can be included when the dialog confirms the move. Add `sortOrder`
to the ref shape:

```ts
{ type: "drag"; submissionId: string; stageId: string; sortOrder: string }
```

### Bulk move

The bulk action bar calls `bulkUpdateSubmissionStatus` — sort order generation
happens server-side for bulk moves (the client doesn't know the target column's
current keys). No client-side change needed beyond passing through the existing flow.

## Migration

Adding the column and backfilling existing rows:

1. Add `sortOrder text` to the schema in `schema.ts` (not-null, no default)
2. Run `bun drizzle-kit push` to sync the schema (the column will be added as
   not-null — if existing rows exist, Drizzle will prompt; use a temporary default
   of `''` during push)
3. Run a one-off backfill script (`src/scripts/backfill-sort-order.ts`) that:
   - Queries all submissions grouped by `(productionId, stageId)`, ordered by
     `createdAt DESC`
   - Generates keys per group using `generateNKeysBetween(null, null, count)`
   - Batch-updates each submission's `sortOrder`

The backfill must run in JS because sort key generation uses the
`fractional-indexing` library. For a fresh database (no existing data), the
migration is just the schema change — no backfill needed.

## Seed Data

Update `src/actions/admin/seed-data.ts`:

- Import `generateNKeysBetween` from `fractional-indexing`
- After determining how many submissions go into each stage, generate sort keys
- Assign one key per submission in insertion order

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `sortOrder` column to `Submission` |
| `src/lib/submission-helpers.ts` | Add `sortOrder` to `SubmissionWithCandidate` |
| `src/lib/schemas/submission.ts` | Add `reorderSubmissionSchema`, update `updateSubmissionStatusSchema` |
| `src/actions/submissions/reorder-submission.ts` | **New file** — lightweight reorder action |
| `src/actions/submissions/update-submission-status.ts` | Accept optional `sortOrder` |
| `src/actions/submissions/bulk-update-submission-status.ts` | Generate sort keys for moved submissions |
| `src/actions/submissions/create-submission.ts` | Generate sort key at top of Applied column |
| `src/actions/submissions/copy-submission-to-role.ts` | Generate sort key at top of Applied column |
| `src/actions/productions/get-production-submissions.ts` | Add `orderBy: asc(sortOrder)` to submissions query |
| `src/components/productions/production-submissions.tsx` | Generate sort keys on drag, call reorder action |
| `src/actions/admin/seed-data.ts` | Generate sort keys for seeded submissions |
| `package.json` | Add `fractional-indexing` dependency |
| Drizzle migration | Add column + backfill |

## Verification

1. **Build:** `bun run build` passes with no type errors
2. **Lint:** `bun run lint` passes
3. **Manual test — within-column reorder:** Drag a card up/down within a column,
   refresh the page, confirm the order persists
4. **Manual test — cross-column drag:** Drag a card to a different column (including
   rejected/selected with dialogs), refresh, confirm position in new column persists
5. **Manual test — new submission:** Submit a new application, confirm it appears at
   the top of the Applied column
6. **Manual test — bulk move:** Select multiple submissions, bulk move to another
   stage, confirm they appear at the end of the target column
7. **Manual test — copy to role:** Copy a submission to another role, confirm it
   appears at the top of Applied
8. **Seed data:** Run seed generation, confirm submissions have sort order values and
   display in a stable order
