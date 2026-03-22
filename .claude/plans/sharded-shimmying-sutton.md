# Plan: Switch Drizzle Driver to Enable Transactions

## Context

Castparty uses the `neon-http` Drizzle driver, which is stateless (one HTTP request per query) and **cannot support database transactions**. Nine server actions perform multi-statement mutations without atomicity, risking partial state on failure. This plan switches to the `neon-serverless` driver with `Pool`, which supports full transactions while preserving the entire Drizzle API (relational queries, query builder, etc.).

**Why `Pool` over `Client`:** `Pool` manages connection lifecycle automatically (ideal for serverless). `Client` requires explicit `connect()`/`disconnect()` calls.

**Why no `ws` package:** Node v24.12.0 has native `WebSocket` in `globalThis`. The `@neondatabase/serverless` Pool uses it automatically.

**Performance impact:** Minimal to positive. The HTTP driver makes an independent HTTP request per query. The Pool driver maintains WebSocket connections — first query has ~100-200ms handshake, subsequent queries are faster (~10-20ms vs ~50-100ms). Multi-query operations (including the new transactions) are strictly faster since they reuse the same connection.

**No changes needed to:**
- 85+ consumer files that `import db from "@/lib/db/db"` (same API surface)
- Better Auth config (`src/lib/auth.ts`) — the `drizzleAdapter` accepts any `PgDatabase` instance
- `drizzle.config.ts` — uses `dialect: "postgresql"`, independent of runtime driver
- Schema or migrations

---

## Steps

### Step 1 — Switch the driver in `src/lib/db/db.ts`

Change 4 lines:

```typescript
// Before
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
// ...
const sql = neon(databaseUrl)
const db = drizzle({ schema, client: sql, casing: "snake_case" })

// After
import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
// ...
const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle({ schema, client: pool, casing: "snake_case" })
```

Everything else stays identical (schema import, env check, global singleton, default export).

### Step 2 — Build check

Run `bun run build` to verify TypeScript compilation across all 85+ importing files.

### Step 3 — Wrap reorder actions in transactions (2 files)

**`src/actions/productions/reorder-production-stages.ts`** (lines 46-55):
Wrap the `Promise.all` in `db.transaction()`, replace `db.update()` with `tx.update()`. Remove TODO comment.

**`src/actions/productions/reorder-role-stages.ts`** (lines 50-59):
Identical pattern. Remove TODO comment.

### Step 4 — Wrap submission creation in a transaction

**`src/actions/submissions/create-submission.ts`** (lines ~154-196):
Wrap the candidate upsert + submission insert in `db.transaction()`. Return `{ candidateId, submissionId }` from the callback.

File operations (headshot moves, resume parsing) stay **outside** the transaction — external I/O should not hold a DB connection. Remove TODO comment.

### Step 5 — Wrap production/role creation in transactions (2 files)

**`src/actions/productions/create-production.ts`** (lines 78-137):
Wrap all mutations in `db.transaction()`: Production insert → template stages insert → roles insert → role stages insert. Slug generation (lines 44-76) stays outside — it's read-only validation. Use `tx` for all 4 insert calls inside.

**`src/actions/productions/create-role.ts`** (lines 51-82):
Wrap Role insert + template stage read + PipelineStage insert in `db.transaction()`. Use `tx` for the read on line 71 too (keeps everything on the same connection). Return `{ id }` from the callback.

### Step 6 — Wrap submission status updates in transactions (2 files)

**`src/actions/submissions/update-submission-status.ts`** (lines 57-71):
Wrap Submission update + PipelineUpdate insert in `db.transaction()`. Use `tx` for both.

**`src/actions/submissions/bulk-update-submission-status.ts`** (lines 81-97):
Same pattern — wrap bulk Submission update + bulk PipelineUpdate insert in `db.transaction()`. Use `tx` for both.

### Step 7 — Wrap copy-submission and remove-stage in transactions (2 files)

**`src/actions/submissions/copy-submission-to-role.ts`** (lines 82-113):
Wrap Submission insert + File insert in `db.transaction()`. Use `tx` for both.

**`src/actions/productions/remove-pipeline-stage.ts`** (lines 69-73):
Wrap Feedback delete + PipelineStage delete in `db.transaction()` (the `force=true` path). Use `tx` for both.

### Step 8 — Final verification

Run `bun run build && bun run lint`.

### Step 9 — Update docs

Update Known Issues #6 and #7 in `docs/ARCHITECTURE.md` to mark as fixed. Use the same strikethrough + "Fixed" format as #4, #5, #9.

**Subagent:** Librarian — update docs.

---

## Critical Files

| File | Change | Risk |
|------|--------|------|
| `src/lib/db/db.ts` | Switch imports + constructor (4 lines) | Low |
| `src/actions/productions/reorder-production-stages.ts` | Wrap lines 46-55 in transaction | Low |
| `src/actions/productions/reorder-role-stages.ts` | Wrap lines 50-59 in transaction | Low |
| `src/actions/submissions/create-submission.ts` | Wrap lines ~154-196 in transaction | Medium |
| `src/actions/productions/create-production.ts` | Wrap lines 78-137 in transaction | Medium |
| `src/actions/productions/create-role.ts` | Wrap lines 51-82 in transaction | Low |
| `src/actions/submissions/update-submission-status.ts` | Wrap lines 57-71 in transaction | Low |
| `src/actions/submissions/bulk-update-submission-status.ts` | Wrap lines 81-97 in transaction | Low |
| `src/actions/submissions/copy-submission-to-role.ts` | Wrap lines 82-113 in transaction | Low |
| `src/actions/productions/remove-pipeline-stage.ts` | Wrap lines 69-73 in transaction | Low |
| `docs/ARCHITECTURE.md` | Mark Known Issues #6, #7 as fixed | Low |

## Existing Utilities to Reuse

- `generateId()` from `@/lib/util` — already used across all action files
- All schema imports (`Candidate`, `Submission`, `PipelineStage`, `File`, etc.) — unchanged
- `buildProductionStages`, `buildStagesFromTemplate`, etc. from `@/lib/pipeline` — unchanged
- `db.transaction()` API — newly available after driver switch

## Verification

1. `bun run build` — confirms type compatibility across all files
2. `bun run lint` — confirms Biome compliance
3. **Manual smoke test** (user runs):
   - Sign in → verifies Better Auth still works with new driver
   - View any production → verifies relational queries work
   - Create a new production with roles → verifies `create-production.ts` transaction
   - Add a role to an existing production → verifies `create-role.ts` transaction
   - Submit an audition on a public role → verifies `create-submission.ts` transaction
   - Move a submission between stages → verifies `update-submission-status.ts` transaction
   - Bulk-move submissions → verifies `bulk-update-submission-status.ts` transaction
   - Copy a submission to another role → verifies `copy-submission-to-role.ts` transaction
   - Delete a custom pipeline stage (with feedback) → verifies `remove-pipeline-stage.ts` transaction
   - Drag-reorder pipeline stages → verifies reorder transactions
4. **Watch for:** `WebSocket is not defined` errors (unlikely with Node v24) — if seen, add `ws` package
