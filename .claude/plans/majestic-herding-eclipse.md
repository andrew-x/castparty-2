# Plan: Update Production Creation Flow

## Context

The current production creation wizard is a 2-step in-place flow (`details` → `roles`). The user wants to expand it to 3 steps and add a slug field:

1. **Details** — name, description, **+ slug** (auto-generates from name, user can override)
2. **Stages** — default pipeline stages editor (reusing existing `DefaultStagesEditor` UI)
3. **Roles** — existing roles step (moved from step 2 → step 3)

The slug is currently auto-generated server-side with a CUID suffix and only editable post-creation in Settings. Pipeline stages are seeded with hardcoded defaults and only editable post-creation.

## Approach

### 1. Extract client-safe slugify utility

**Create** `src/lib/slugify.ts`

`slug.ts` imports server-only modules (drizzle). We need a client-safe version of the base slug logic for auto-generating in the form:

```ts
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
}
```

No CUID suffix — just the human-readable base. The user sees and controls the exact slug.

### 2. Refactor DefaultStagesEditor → controlled StagesEditor

**Modify** `src/components/productions/default-stages-editor.tsx`

Extract the visual/interactive part into a controlled `StagesEditor` component:

```ts
// New controlled component — used by both creation form and settings page
interface StagesEditorProps {
  stages: StageData[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onReorder: (reordered: StageData[]) => void
  isAdding?: boolean
  description?: string
}
export function StagesEditor({ ... }: StagesEditorProps) { /* existing visual/DnD code */ }

// Existing wrapper — thin shell that provides server action callbacks
// Used by the settings page (unchanged behavior)
interface DefaultStagesEditorProps {
  productionId: string
  stages: StageData[]
}
export function DefaultStagesEditor({ productionId, stages }: DefaultStagesEditorProps) {
  // wraps StagesEditor with useAction callbacks for add/remove/reorder
}
```

The `StageData` interface stays the same: `{ id, name, order, type }`.

### 3. Update CreateProductionForm — 3-step wizard + slug

**Modify** `src/components/productions/create-production-form.tsx`

**Step type** changes from `"details" | "roles"` to `"details" | "stages" | "roles"`.

**Details step** additions:
- Slug field below description
- Auto-fills from name using `slugify()` (reacts to name changes, but only while user hasn't manually edited)
- Helper text explaining what the slug is (similar to settings: "This controls the URL for your production's audition page")
- Validation: min 3, max 60, lowercase+hyphens+numbers only (matching `validateSlug` rules)

**Stages step** (new):
- Header + description explaining pipeline stages
- Uses `StagesEditor` with local state
- Initial state: the 3 default custom stages (`Screening`, `Audition`, `Callback`) plus the fixed system stages (`Applied`, `Selected`, `Rejected`)
- Local state manages add/remove/reorder of custom stages (generating temp client-side IDs)
- Back → details, Continue → roles

**Roles step** (existing, minor updates):
- Back → stages (instead of details)
- Submit includes slug + custom stages in the payload

**Schema** update:
- Add `slug` field (optional — if blank, server auto-generates)
- Add `customStages` field (array of stage name strings, ordered)

### 4. Update createProduction server action

**Modify** `src/actions/productions/create-production.ts`

Schema changes:
```ts
slug: z.string().trim().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()
customStages: z.array(z.string().trim().min(1).max(100)).optional()
```

Logic changes:
- **Slug**: If provided, validate with `validateSlug()` + check uniqueness (error on collision). If not provided, use existing `generateUniqueSlug()`.
- **Stages**: If `customStages` provided, build template stages using those names (in order) instead of `DEFAULT_PRODUCTION_STAGES`. System stages (Applied, Selected, Rejected) are always included.

### 5. Add custom stages builder to pipeline.ts

**Modify** `src/lib/pipeline.ts`

Add a function that builds production template stages from a list of custom stage names:

```ts
export function buildCustomProductionStages(
  productionId: string,
  organizationId: string,
  customStageNames: string[],
) {
  const stages = [
    { name: "Applied", order: 0, type: "APPLIED" as const },
    ...customStageNames.map((name, i) => ({ name, order: i + 1, type: "CUSTOM" as const })),
    { name: "Selected", order: 1000, type: "SELECTED" as const },
    { name: "Rejected", order: 1001, type: "REJECTED" as const },
  ]
  return stages.map(s => ({ id: generateId("stg"), roleId: null, productionId, organizationId, ...s }))
}
```

## Files to modify

| File | Change |
|------|--------|
| `src/lib/slugify.ts` | **Create** — client-safe `slugify()` |
| `src/lib/pipeline.ts` | **Add** `buildCustomProductionStages()` |
| `src/components/productions/default-stages-editor.tsx` | **Refactor** — extract controlled `StagesEditor` + keep `DefaultStagesEditor` wrapper |
| `src/components/productions/create-production-form.tsx` | **Rewrite** — 3-step wizard, slug field, stages step |
| `src/actions/productions/create-production.ts` | **Update** — accept `slug` + `customStages` params |

## Verification

1. Run `bun run build` to verify no type/build errors
2. Run `bun run lint` to check Biome compliance
3. Manual testing (user runs `bun dev`):
   - Navigate to `/productions/new`
   - **Details step**: Enter a name → slug auto-fills. Edit slug manually → it stops auto-updating. Clear slug → it resumes auto-filling from name.
   - **Stages step**: Default custom stages shown (Screening, Audition, Callback). Add/remove/reorder stages. System stages (Applied, Selected, Rejected) are visible but not editable.
   - **Roles step**: Unchanged behavior — add/remove roles.
   - Submit → production created with custom slug and custom stages.
   - Visit `/productions/[id]/settings` → `DefaultStagesEditor` still works correctly (no regression).

## Agents

- **Subagent-driven development** for parallel implementation of independent steps (slugify utility + pipeline function can be built concurrently)
- **frontend-design** will be auto-invoked for the form UI changes
- **Code reviewer** after implementation to check conventions
