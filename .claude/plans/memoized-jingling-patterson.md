# Replace `isOpen`/`isArchived` booleans with `status` enum

## Context

Productions and roles currently use two booleans (`isOpen`, `isArchived`) that create an implicit 3-state machine with business logic scattered across actions and UI to prevent the impossible 4th state (open + archived). Replacing these with a single `status` enum (`open` | `closed` | `archive`) makes the state explicit, eliminates invalid combinations at the type level, and simplifies all consumer code.

## State mapping

| Old (`isOpen`, `isArchived`) | New `status` |
|------------------------------|-------------|
| `true`, `false` | `open` — accepting submissions, visible publicly |
| `false`, `false` | `closed` — not accepting, visible internally |
| `false`, `true` | `archive` — hidden from internal lists |

## Implementation

### 1. Database schema (`src/lib/db/schema.ts`)

- Add `productionStatusEnum = pgEnum("production_status", ["open", "closed", "archive"])` near line 323 (with the other enums)
- Replace `isOpen`/`isArchived` on `Production` (lines 268-269) with `status: productionStatusEnum().default("closed").notNull()`
- Same replacement on `Role` (lines 309-310)

### 2. Migration

Run `bun drizzle-kit generate`, then hand-edit the generated SQL to insert data backfill between ADD COLUMN and DROP COLUMN:

```sql
CREATE TYPE "production_status" AS ENUM ('open', 'closed', 'archive');
ALTER TABLE "production" ADD COLUMN "status" "production_status" DEFAULT 'closed' NOT NULL;
ALTER TABLE "role" ADD COLUMN "status" "production_status" DEFAULT 'closed' NOT NULL;

UPDATE "production" SET "status" = CASE
  WHEN "is_open" = true THEN 'open'
  WHEN "is_archived" = true THEN 'archive'
  ELSE 'closed' END;
UPDATE "role" SET "status" = CASE
  WHEN "is_open" = true THEN 'open'
  WHEN "is_archived" = true THEN 'archive'
  ELSE 'closed' END;

ALTER TABLE "production" DROP COLUMN "is_open";
ALTER TABLE "production" DROP COLUMN "is_archived";
ALTER TABLE "role" DROP COLUMN "is_open";
ALTER TABLE "role" DROP COLUMN "is_archived";
```

### 3. Zod schemas

**`src/lib/schemas/production.ts`** — Add `productionStatusSchema = z.enum(["open", "closed", "archive"])`, replace `isOpen`/`isArchived` booleans with `status: productionStatusSchema` (form) / `status: productionStatusSchema.optional()` (action).

**`src/lib/schemas/role.ts`** — Import `productionStatusSchema`, same replacement.

### 4. Server actions — productions

| File | Change |
|------|--------|
| `toggle-production-open.ts` | **Delete** (dead code — never imported) |
| `update-production.ts` | Replace `isOpen`/`isArchived` logic with `status`. Cascade: if `status === "archive"`, set all roles to `"archive"`. When moving away from archive, roles stay as-is |
| `update-role.ts` | Replace `isOpen`/`isArchived` field handling with `status` |
| `create-production.ts` | `isOpen: true` → `status: "open"` (lines 93, 118) |
| `create-role.ts` | `isOpen: true` → `status: "open"` (line 50) |
| `get-productions-with-submission-counts.ts` | Replace `isOpen`/`isArchived` columns with `status`; replace `asc(Production.isArchived)` ordering with `sql` CASE to sort archived last |
| `get-org-roles-grouped.ts` | Replace `eq(p.isArchived, false)` → `not(eq(p.status, "archive"))`, same for roles |

### 5. Server actions — submissions (public)

| File | Change |
|------|--------|
| `get-public-productions.ts` | `eq(p.isOpen, true)` → `eq(p.status, "open")`, same for roles |
| `get-public-production.ts` | Same pattern; `!production.isOpen` → `production.status !== "open"` |
| `get-public-role.ts` | Check `role.status !== "open" \|\| role.production.status !== "open"` |
| `create-submission.ts` | Validate `role.production.status === "open"` and `role.status === "open"` |

### 6. Components

**`production-settings-form.tsx`** — Replace `isOpen`/`isArchived` props with single `status` prop. Replace the two `Switch` toggles (lines 158-202) with a `RadioGroup` using the existing `RadioGroup`/`RadioGroupItem` from `@/components/common/radio-group`. Three options: Open, Closed, Archive — each with a description.

**`role-settings-form.tsx`** — Same pattern as production settings form.

**`production-card.tsx`** — Replace `production.isArchived`/`production.isOpen` ternary with `production.status === "archive"` / `production.status === "open"`.

**`roles-manager.tsx`** — Replace `r.isArchived`/`r.isOpen` filtering and badge logic with `r.status === "archive"` / `r.status === "open"`. Badge labels: Open, Closed, Archived.

### 7. Pages

| File | Change |
|------|--------|
| `home/page.tsx` | `p.isArchived` → `p.status === "archive"` |
| `productions/page.tsx` | Same |
| `productions/[id]/(production)/settings/page.tsx` | `isOpen={…} isArchived={…}` → `status={production.status}` |
| `productions/[id]/(production)/roles/page.tsx` | `isOpen: r.isOpen, isArchived: r.isArchived` → `status: r.status` |
| `s/[orgSlug]/[productionSlug]/page.tsx` | `!production.isOpen` → `production.status !== "open"` |
| `s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | Same |

### 8. Cascade behavior

When a production's status changes to `archive`, all its roles also move to `archive`. When un-archiving (→ `closed` or `open`), roles stay as-is — the user decides which roles to reopen individually. This logic lives in `update-production.ts`.

## Implementation order

1. Schema + migration (schema.ts, generate + edit migration, run migration)
2. Zod schemas (production.ts, role.ts)
3. Server actions (all 11 files)
4. Components (4 files)
5. Pages (6 files)
6. Delete `toggle-production-open.ts`
7. `bun run build` + `bun run lint` to catch remaining references

## Agents used during implementation

- **Main agent** — all edits (schema, actions, components, pages)
- **Code reviewer agent** — post-implementation review before considering done
- **Librarian agent** — update docs after completion

## Verification

1. `bun run build` — confirms no type errors across the 25 modified files
2. `bun run lint` — confirms no Biome violations
3. Manual checks:
   - Visit production settings → status radio group renders with correct default
   - Change status to Open → public audition page shows the production
   - Change status to Closed → public page hides production
   - Change status to Archive → production hidden from home/productions pages; all roles also archived
   - Role settings → same radio group, same behavior
   - Submit to an open production + open role → succeeds
   - Submit to active or archived production → rejected
