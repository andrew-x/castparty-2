# Remove `db.transaction()` calls — Neon HTTP driver compatibility

## Context

Castparty uses the Neon HTTP serverless driver (`@neondatabase/serverless` with `drizzle-orm/neon-http`). This driver does **not** support interactive transactions — `db.transaction()` callbacks that read results and branch on them fail at runtime. The current code has 4 files using `db.transaction()`, all introduced by the submission statuses feature. These must be replaced with sequential queries.

**Why it's safe to drop transactions here:** At community theatre scale, race conditions between concurrent writes to the same role/submission are extremely unlikely. The operations are also idempotent or append-only (audit logs), so partial completion doesn't leave data in a broken state.

## Files to change

### 1. `src/actions/productions/create-role.ts` (lines 37-47)

**Current:** Transaction wrapping role insert + pipeline stage inserts.

**Fix:** Sequential `db.insert()` calls. The role insert must complete first (stages FK to it). If the stage insert fails, the role exists without stages — but `buildSystemStages` is pure computation and the insert is straightforward, so failure is unlikely. The role is still usable and stages can be backfilled.

```ts
// Before (transaction)
await db.transaction(async (tx) => {
  await tx.insert(Role).values({ ... })
  await tx.insert(PipelineStage).values(stages)
})

// After (sequential)
await db.insert(Role).values({ ... })
await db.insert(PipelineStage).values(stages)
```

### 2. `src/actions/submissions/create-submission.ts` (lines 50-94)

**Current:** Transaction wrapping candidate lookup/create + inbound stage lookup + submission insert. Has conditional logic (if candidate exists, skip insert) and reads inside the tx — the most problematic pattern for Neon HTTP.

**Fix:** Sequential queries using `db` directly instead of `tx`. Move the inbound stage lookup before the candidate logic since it doesn't depend on it.

```ts
// Before (transaction)
return db.transaction(async (tx) => {
  const existing = await tx.query.Candidate.findFirst(...)
  let candidateId
  if (existing) { candidateId = existing.id }
  else { /* insert candidate via tx */ }
  const inboundStage = await tx.query.PipelineStage.findFirst(...)
  await tx.insert(Submission).values({ ..., stageId: inboundStage?.id })
})

// After (sequential)
const inboundStage = await db.query.PipelineStage.findFirst(...)
const existing = await db.query.Candidate.findFirst(...)
let candidateId
if (existing) { candidateId = existing.id }
else { await db.insert(Candidate).values(...); candidateId = newId }
await db.insert(Submission).values({ ..., stageId: inboundStage?.id })
return { id: submissionId }
```

### 3. `src/actions/submissions/update-submission-status.ts` (lines 52-65)

**Current:** Transaction wrapping submission status update + status change audit insert.

**Fix:** Sequential queries. Update the submission first, then insert the audit record. If the audit insert fails, the status change is still recorded on the submission — the audit log is supplementary.

```ts
// Before (transaction)
await db.transaction(async (tx) => {
  await tx.update(Submission).set({ stageId, updatedAt }).where(...)
  await tx.insert(StatusChange).values({ ... })
})

// After (sequential)
await db.update(Submission).set({ stageId, updatedAt }).where(...)
await db.insert(StatusChange).values({ ... })
```

### 4. `src/actions/productions/remove-pipeline-stage.ts` (lines 48-58)

**Current:** Transaction wrapping submission reassignment + stage deletion.

**Fix:** Sequential queries. Move submissions to inbound first, then delete the stage. If deletion fails, submissions have been harmlessly moved to inbound (safe state). The `ON DELETE set null` FK on `Submission.stageId` also provides a safety net.

```ts
// Before (transaction)
await db.transaction(async (tx) => {
  await tx.update(Submission).set({ stageId: inboundStage.id }).where(...)
  await tx.delete(PipelineStage).where(...)
})

// After (sequential)
await db.update(Submission).set({ stageId: inboundStage.id }).where(...)
await db.delete(PipelineStage).where(...)
```

## Verification

1. `bun run build` — confirm no type errors
2. `bun run lint` — confirm no lint issues
3. Manual testing:
   - Create a role → verify system stages created
   - Submit a candidate → verify lands in Inbound
   - Move candidate status → verify badge + audit record
   - Add/remove custom stage → verify submissions reassigned
