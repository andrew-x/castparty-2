# Kanban Sort Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist within-column submission ordering in the kanban board so drag-to-reorder survives page refresh.

**Architecture:** Add a `sortOrder` text column to `Submission` using fractional indexing — every reorder touches exactly one row. The client generates sort keys optimistically; the server stores them.

**Tech Stack:** `fractional-indexing` npm package, Drizzle ORM, `@dnd-kit/react` (already installed), `next-safe-action`

**Spec:** `docs/superpowers/specs/2026-04-05-kanban-sort-order-design.md`

---

### Task 1: Install library and add schema column

**Files:**
- Modify: `package.json`
- Modify: `src/lib/db/schema.ts:412-446`

- [ ] **Step 1: Install `fractional-indexing`**

Run: `bun add fractional-indexing`

- [ ] **Step 2: Add `sortOrder` column to `Submission` table**

In `src/lib/db/schema.ts`, add `sortOrder` after the `rejectionReason` field inside the `Submission` table definition:

```ts
  rejectionReason: text(),
  sortOrder: text().notNull().default(""),
```

The `.default("")` is a migration safety net — all code paths will compute real values. Empty string sorts before any fractional-indexing key, so unmigrated rows appear at the top (visible, not hidden).

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock src/lib/db/schema.ts
git commit -m "feat: add sortOrder column to Submission and install fractional-indexing"
```

---

### Task 2: Update types, schemas, and data fetching

**Files:**
- Modify: `src/lib/submission-helpers.ts:66-102`
- Modify: `src/lib/schemas/submission.ts:84-88`
- Modify: `src/actions/productions/get-production-submissions.ts:37-41, 162-189`

- [ ] **Step 1: Add `sortOrder` to `SubmissionWithCandidate`**

In `src/lib/submission-helpers.ts`, add `sortOrder: string` to the `SubmissionWithCandidate` interface after `createdAt`:

```ts
export interface SubmissionWithCandidate {
  id: string
  roleId: string
  roleName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  createdAt: Date | string
  sortOrder: string
  stageId: string
  // ... rest unchanged
```

- [ ] **Step 2: Add `reorderSubmissionSchema` and update `updateSubmissionStatusSchema`**

In `src/lib/schemas/submission.ts`, update the `updateSubmissionStatusSchema` to accept optional `sortOrder` and add a new schema:

```ts
export const updateSubmissionStatusSchema = z.object({
  submissionId: z.string().min(1),
  stageId: z.string().min(1),
  rejectionReason: z.string().trim().min(1).max(500).optional(),
  sortOrder: z.string().min(1).optional(),
})

export const reorderSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  sortOrder: z.string().min(1),
})
```

- [ ] **Step 3: Add `orderBy` to submissions query and pass `sortOrder` through**

In `src/actions/productions/get-production-submissions.ts`, add ordering to the submissions relation:

```ts
          submissions: {
            orderBy: (s, { asc }) => [asc(s.sortOrder)],
            with: {
```

And in the object construction loop (around line 162), add `sortOrder` to the pushed object:

```ts
      submissions.push({
        id: sub.id,
        roleId: role.id,
        roleName: role.name,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        phone: sub.phone,
        location: sub.location,
        createdAt: sub.createdAt,
        sortOrder: sub.sortOrder,
        stageId: sub.stageId,
        // ... rest unchanged
```

- [ ] **Step 4: Verify types compile**

Run: `bunx tsc --noEmit 2>&1 | head -30`

Expected: There may be errors in other files that reference `SubmissionWithCandidate` (this is expected — they'll be resolved in later tasks). The three files modified in this task should have no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/submission-helpers.ts src/lib/schemas/submission.ts src/actions/productions/get-production-submissions.ts
git commit -m "feat: add sortOrder to submission types, schemas, and data fetching"
```

---

### Task 3: Create `reorderSubmission` action

**Files:**
- Create: `src/actions/submissions/reorder-submission.ts`

- [ ] **Step 1: Create the action file**

Create `src/actions/submissions/reorder-submission.ts`:

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Submission } from "@/lib/db/schema"
import { reorderSubmissionSchema } from "@/lib/schemas/submission"

export const reorderSubmission = secureActionClient
  .metadata({ action: "reorder-submission" })
  .inputSchema(reorderSubmissionSchema)
  .action(
    async ({
      parsedInput: { submissionId, sortOrder },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true },
        with: {
          role: {
            columns: { id: true },
            with: {
              production: {
                columns: { organizationId: true },
              },
            },
          },
        },
      })

      if (!submission || submission.role.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      await db
        .update(Submission)
        .set({ sortOrder })
        .where(eq(Submission.id, submissionId))

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/submissions/reorder-submission.ts
git commit -m "feat: add reorderSubmission action for within-column reordering"
```

---

### Task 4: Modify `updateSubmissionStatus` for sortOrder

**Files:**
- Modify: `src/actions/submissions/update-submission-status.ts:58-62`

- [ ] **Step 1: Accept and use `sortOrder`**

In `src/actions/submissions/update-submission-status.ts`, update the destructuring to include `sortOrder`:

```ts
    async ({
      parsedInput: { submissionId, stageId, rejectionReason, sortOrder },
      ctx: { user },
    }) => {
```

And update the `.set()` call in the transaction to conditionally include `sortOrder`:

```ts
      await db.transaction(async (tx) => {
        await tx
          .update(Submission)
          .set({
            stageId,
            rejectionReason: reason,
            updatedAt: day().toDate(),
            ...(sortOrder ? { sortOrder } : {}),
          })
          .where(eq(Submission.id, submissionId))
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/submissions/update-submission-status.ts
git commit -m "feat: accept optional sortOrder in updateSubmissionStatus"
```

---

### Task 5: Modify `bulkUpdateSubmissionStatus` for sort keys

**Files:**
- Modify: `src/actions/submissions/bulk-update-submission-status.ts`

- [ ] **Step 1: Generate sort keys for moved submissions**

In `src/actions/submissions/bulk-update-submission-status.ts`, add the import (the `drizzle-orm` imports are already present, just add `fractional-indexing`):

```ts
import { generateNKeysBetween } from "fractional-indexing"
```

After the `toMove` / `toMoveIds` computation (around line 77) and before the transaction, query the current max sort key in the target stage and generate keys:

```ts
      const toMoveIds = toMove.map((s) => s.id)

      // Find the current last sortOrder in the target stage so bulk-moved
      // submissions are appended to the end of the column.
      const lastInStage = await db.query.Submission.findFirst({
        where: (s) =>
          and(
            eq(s.productionId, submissions[0].productionId),
            eq(s.stageId, stageId),
          ),
        columns: { sortOrder: true },
        orderBy: (s, { desc }) => [desc(s.sortOrder)],
      })

      const sortKeys = generateNKeysBetween(
        lastInStage?.sortOrder || null,
        null,
        toMove.length,
      )
```

Then update the transaction to set per-submission sort orders. Replace the single bulk `UPDATE` with individual updates (since each submission gets a unique sortOrder):

```ts
      await db.transaction(async (tx) => {
        for (let i = 0; i < toMove.length; i++) {
          await tx
            .update(Submission)
            .set({
              stageId,
              rejectionReason: reason,
              sortOrder: sortKeys[i],
              updatedAt: day().toDate(),
            })
            .where(eq(Submission.id, toMove[i].id))
        }

        await tx.insert(PipelineUpdate).values(
          toMove.map((s) => ({
            id: generateId("pu"),
            organizationId: orgId,
            productionId: s.productionId,
            roleId: s.roleId,
            submissionId: s.id,
            fromStage: s.stageId,
            toStage: stageId,
            changeByUserId: user.id,
          })),
        )
      })
```

- [ ] **Step 2: Verify the modified action compiles**

Run: `bunx tsc --noEmit --pretty 2>&1 | grep bulk-update`

Expected: No errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/actions/submissions/bulk-update-submission-status.ts
git commit -m "feat: generate sort keys when bulk-moving submissions"
```

---

### Task 6: Modify `createSubmission` for sort key

**Files:**
- Modify: `src/actions/submissions/create-submission.ts`

- [ ] **Step 1: Generate sort key at top of Applied column**

In `src/actions/submissions/create-submission.ts`, add the import:

```ts
import { generateKeyBetween } from "fractional-indexing"
```

After resolving the `appliedStage` (around line 91) and before the system field validation, add a query for the current first sort key:

```ts
      if (!appliedStage) {
        throw new Error("Pipeline is not configured for this production.")
      }

      // Generate a sortOrder key that places this submission at the top of the
      // Applied column (before the current first item).
      const firstInApplied = await db.query.Submission.findFirst({
        where: (s) =>
          and(eq(s.productionId, productionId), eq(s.stageId, appliedStage.id)),
        columns: { sortOrder: true },
        orderBy: (s, { asc }) => [asc(s.sortOrder)],
      })

      const sortOrder = generateKeyBetween(
        null,
        firstInApplied?.sortOrder || null,
      )
```

Add `and` to the existing drizzle-orm import if not already there:

```ts
import { and, eq, inArray } from "drizzle-orm"
```

Then in the `tx.insert(Submission).values(...)` call (around line 319-337), add `sortOrder`:

```ts
        await tx.insert(Submission).values(
          roleIds.map((roleId, i) => ({
            id: submissionIds[i],
            productionId,
            roleId,
            candidateId: candidate.id,
            stageId: appliedStage.id,
            sortOrder,
            firstName,
            // ... rest unchanged
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/submissions/create-submission.ts
git commit -m "feat: assign sort key when creating submissions (newest on top)"
```

---

### Task 7: Modify `copySubmissionToRole` for sort key

**Files:**
- Modify: `src/actions/submissions/copy-submission-to-role.ts`

- [ ] **Step 1: Generate sort key at top of Applied column**

In `src/actions/submissions/copy-submission-to-role.ts`, add the imports:

```ts
import { and, eq } from "drizzle-orm"
import { generateKeyBetween } from "fractional-indexing"
```

After resolving the `appliedStage` (around line 81) and before creating the new submission, add:

```ts
      if (!appliedStage) {
        throw new Error("Target role's pipeline is not configured.")
      }

      const firstInApplied = await db.query.Submission.findFirst({
        where: (s) =>
          and(
            eq(s.productionId, targetRole.productionId),
            eq(s.stageId, appliedStage.id),
          ),
        columns: { sortOrder: true },
        orderBy: (s, { asc }) => [asc(s.sortOrder)],
      })

      const sortOrder = generateKeyBetween(
        null,
        firstInApplied?.sortOrder || null,
      )
```

Then in the `tx.insert(Submission).values({...})` call (around line 87-104), add `sortOrder`:

```ts
        await tx.insert(Submission).values({
          id: newSubmissionId,
          productionId: targetRole.productionId,
          roleId: targetRoleId,
          candidateId: source.candidateId,
          stageId: appliedStage.id,
          sortOrder,
          firstName: source.firstName,
          // ... rest unchanged
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/submissions/copy-submission-to-role.ts
git commit -m "feat: assign sort key when copying submission to another role"
```

---

### Task 8: Update client-side drag handlers

**Files:**
- Modify: `src/components/productions/production-submissions.tsx`

This is the largest task. The changes are:
1. Import `generateKeyBetween` and the new `reorderSubmission` action
2. Add a `useAction` hook for `reorderSubmission`
3. Add `sortOrder` to `pendingRejectRef` and `pendingSelectRef` shapes
4. Rewrite `onDragEnd` to compute sort keys and handle within-column reorders
5. Pass `sortOrder` through the reject/select dialog confirm handlers

- [ ] **Step 1: Add imports**

Add to the import block at the top of `src/components/productions/production-submissions.tsx`:

```ts
import { generateKeyBetween } from "fractional-indexing"
import { reorderSubmission } from "@/actions/submissions/reorder-submission"
```

- [ ] **Step 2: Add `useAction` for reorder**

After the existing `useAction(bulkUpdateSubmissionStatus, ...)` block (around line 222-233), add:

```ts
  const { execute: executeReorder } = useAction(reorderSubmission, {
    onError() {
      setColumns(previousColumns.current)
      router.refresh()
    },
  })
```

- [ ] **Step 3: Update ref types to include `sortOrder`**

Update `pendingRejectRef` (around line 94-98):

```ts
  const pendingRejectRef = useRef<
    | { type: "drag"; submissionId: string; stageId: string; sortOrder: string }
    | { type: "bulk"; submissionIds: string[]; stageId: string }
    | null
  >(null)
```

Update `pendingSelectRef` (around line 101-104):

```ts
  const pendingSelectRef = useRef<{
    submissionId: string
    stageId: string
    sortOrder: string
  } | null>(null)
```

- [ ] **Step 4: Rewrite `onDragEnd` handler**

Replace the entire `onDragEnd` callback (lines 507-571) with:

```ts
        onDragEnd={(event) => {
          if (event.canceled) {
            setColumns(previousColumns.current)
            movedColumns.current = null
            return
          }

          const { source } = event.operation
          if (!source) return

          const submissionId = String(source.id)
          const currentColumns = movedColumns.current
          movedColumns.current = null
          if (!currentColumns) return

          // Find original stage
          let originalStageId: string | null = null
          for (const [stageId, items] of Object.entries(
            previousColumns.current,
          )) {
            if (items.some((s) => s.id === submissionId)) {
              originalStageId = stageId
              break
            }
          }

          // Find new stage and index
          let newStageId: string | null = null
          let newIndex = -1
          for (const [stageId, items] of Object.entries(currentColumns)) {
            const idx = items.findIndex((s) => s.id === submissionId)
            if (idx !== -1) {
              newStageId = stageId
              newIndex = idx
              break
            }
          }

          if (!originalStageId || !newStageId || newIndex === -1) return

          // Check if position actually changed (same column, same index = no-op)
          if (originalStageId === newStageId) {
            const prevCol = previousColumns.current[originalStageId]
            const prevIdx = prevCol?.findIndex((s) => s.id === submissionId) ?? -1
            if (prevIdx === newIndex) return
          }

          // Compute sort order from neighbors in the new column
          const col = currentColumns[newStageId]
          const prevKey = newIndex > 0 ? col[newIndex - 1].sortOrder : null
          const nextKey =
            newIndex < col.length - 1 ? col[newIndex + 1].sortOrder : null
          const newSortOrder = generateKeyBetween(prevKey, nextKey)

          // Update local state with new sortOrder for accurate subsequent drags
          setColumns((current) => {
            const items = current[newStageId]
            if (!items) return current
            return {
              ...current,
              [newStageId]: items.map((s) =>
                s.id === submissionId
                  ? { ...s, sortOrder: newSortOrder }
                  : s,
              ),
            }
          })

          if (originalStageId !== newStageId) {
            // Cross-column move
            if (rejectedStage && newStageId === rejectedStage.id) {
              pendingRejectRef.current = {
                type: "drag",
                submissionId,
                stageId: newStageId,
                sortOrder: newSortOrder,
              }
              setRejectDialogOpen(true)
              return
            }

            if (selectedStage && newStageId === selectedStage.id) {
              pendingSelectRef.current = {
                submissionId,
                stageId: newStageId,
                sortOrder: newSortOrder,
              }
              setSelectDialogOpen(true)
              return
            }

            setPendingSubmissionId(submissionId)
            executeStatusChangeAsync({
              submissionId,
              stageId: newStageId,
              sortOrder: newSortOrder,
            })
          } else {
            // Within-column reorder
            executeReorder({ submissionId, sortOrder: newSortOrder })
          }
        }}
```

- [ ] **Step 5: Pass `sortOrder` through reject dialog confirm**

In `handleRejectConfirm` (around line 290-348), update the `pending.type === "drag"` branch to include `sortOrder`:

```ts
    if (pending.type === "drag") {
      setPendingSubmissionId(pending.submissionId)
      executeStatusChangeAsync({
        submissionId: pending.submissionId,
        stageId: pending.stageId,
        rejectionReason: reason,
        sortOrder: pending.sortOrder,
      }).then((result) => {
```

- [ ] **Step 6: Pass `sortOrder` through select dialog confirm**

In `handleSelectConfirm` (around line 360-384), update to include `sortOrder`:

```ts
    setPendingSubmissionId(pending.submissionId)
    executeStatusChangeAsync({
      submissionId: pending.submissionId,
      stageId: pending.stageId,
      sortOrder: pending.sortOrder,
    }).then((result) => {
```

- [ ] **Step 7: Verify types compile**

Run: `bunx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No type errors.

- [ ] **Step 8: Run lint**

Run: `bun run lint`

Expected: Clean or only pre-existing warnings.

- [ ] **Step 9: Commit**

```bash
git add src/components/productions/production-submissions.tsx
git commit -m "feat: persist sort order on drag-and-drop in kanban board"
```

---

### Task 9: Update seed data

**Files:**
- Modify: `src/actions/admin/seed-data.ts`

- [ ] **Step 1: Generate sort keys for seeded submissions**

In `src/actions/admin/seed-data.ts`, add the import:

```ts
import { generateNKeysBetween } from "fractional-indexing"
```

After all submissions have been built (after the `for (const cand of candidates)` loop ends, around line 515), add sort key generation. The submissions are already assigned to stages, so group them by `(productionId, stageId)` and assign keys:

```ts
    // --- Assign sortOrder keys grouped by (productionId, stageId) ---
    const submissionsByStage = new Map<string, number[]>()
    for (let i = 0; i < submissionRows.length; i++) {
      const key = `${submissionRows[i].productionId}:${submissionRows[i].stageId}`
      const indices = submissionsByStage.get(key)
      if (indices) {
        indices.push(i)
      } else {
        submissionsByStage.set(key, [i])
      }
    }

    for (const indices of submissionsByStage.values()) {
      const keys = generateNKeysBetween(null, null, indices.length)
      for (let j = 0; j < indices.length; j++) {
        submissionRows[indices[j]].sortOrder = keys[j]
      }
    }
```

Place this block right before the `// 3. Bulk insert in dependency order` comment (line 517).

- [ ] **Step 2: Commit**

```bash
git add src/actions/admin/seed-data.ts
git commit -m "feat: generate sort order keys in seed data"
```

---

### Task 10: Push DB schema, backfill, and verify build

**Files:**
- Create: `src/scripts/backfill-sort-order.ts`

- [ ] **Step 1: Push the schema change**

Run: `bun db:push`

If prompted about adding a NOT NULL column with default, accept the default. The column will be added with `default ''` for existing rows.

- [ ] **Step 2: Create backfill script**

Create `src/scripts/backfill-sort-order.ts`:

```ts
/**
 * One-time backfill: assigns fractional-indexing sort keys to existing
 * submissions that have an empty sortOrder. Run with:
 *   bun src/scripts/backfill-sort-order.ts
 */
import "dotenv/config"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { generateNKeysBetween } from "fractional-indexing"
import * as schema from "@/lib/db/schema"

const db = drizzle(process.env.DATABASE_URL!, { schema })

async function main() {
  // Find all submissions with empty sortOrder, grouped by stage
  const submissions = await db.query.Submission.findMany({
    where: (s) => eq(s.sortOrder, ""),
    columns: { id: true, productionId: true, stageId: true, createdAt: true },
    orderBy: (s, { asc }) => [asc(s.productionId), asc(s.stageId), asc(s.createdAt)],
  })

  if (submissions.length === 0) {
    console.log("No submissions need backfill.")
    process.exit(0)
  }

  // Group by (productionId, stageId)
  const groups = new Map<string, typeof submissions>()
  for (const sub of submissions) {
    const key = `${sub.productionId}:${sub.stageId}`
    const group = groups.get(key)
    if (group) {
      group.push(sub)
    } else {
      groups.set(key, [sub])
    }
  }

  let updated = 0
  for (const [, group] of groups) {
    const keys = generateNKeysBetween(null, null, group.length)
    for (let i = 0; i < group.length; i++) {
      await db
        .update(schema.Submission)
        .set({ sortOrder: keys[i] })
        .where(eq(schema.Submission.id, group[i].id))
      updated++
    }
  }

  console.log(`Backfilled ${updated} submissions across ${groups.size} stage groups.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Backfill failed:", err)
  process.exit(1)
})
```

- [ ] **Step 3: Run the backfill (if there is existing data)**

Run: `bun src/scripts/backfill-sort-order.ts`

Expected: Either "No submissions need backfill." (fresh DB) or "Backfilled N submissions across M stage groups."

- [ ] **Step 4: Run the build**

Run: `bun run build`

Expected: Build succeeds with no errors.

- [ ] **Step 5: Run lint**

Run: `bun run lint`

Expected: Clean or only pre-existing warnings.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/backfill-sort-order.ts
git commit -m "chore: add backfill script for submission sort order"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

1. `bun run build` — no type errors
2. `bun run lint` — clean
3. Start dev server, open a production's kanban board
4. Drag a card within a column, refresh — order persists
5. Drag a card to another column (including Rejected/Selected dialogs), refresh — position persists
6. Submit a new application — appears at top of Applied
7. Bulk move submissions — they appear at end of target column
8. Reset DB and run seed data — submissions display in stable order
