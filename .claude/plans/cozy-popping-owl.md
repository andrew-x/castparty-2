# Plan: Add drag-and-drop reordering to role pipeline stages

## Context

The production-level stages editor (`DefaultStagesEditor`) uses the shared `StagesEditor` component with full drag-and-drop reordering, add, and remove support. The role-level stages editor (`RoleStagesEditor`) is a separate, simpler component that only supports add and remove — no reordering. This means users can't control the order of pipeline stages on individual roles.

## Changes

### 1. Create `reorder-role-stages` server action

**New file:** `src/actions/productions/reorder-role-stages.ts`

Model after `reorder-production-stages.ts` but filter by `roleId` instead of `isNull(roleId)`:
- Input: `{ roleId: string, stageIds: string[] }`
- Verify the role belongs to the user's organization (join through production)
- Verify all stage IDs are CUSTOM stages for this role
- Update order values sequentially (1, 2, 3...)

### 2. Refactor `RoleStagesEditor` to use the shared `StagesEditor`

**Modify:** `src/components/productions/role-stages-editor.tsx`

Replace the custom implementation with a wrapper around `StagesEditor` (same pattern as `DefaultStagesEditor`):
- Import `StagesEditor` and `StageData` from `default-stages-editor`
- Wire up `addPipelineStage`, `removePipelineStage`, and the new `reorderRoleStages` actions
- Maintain optimistic local state for reorder/remove (same as `DefaultStagesEditor`)
- Map the incoming `PipelineStageData[]` to `StageData[]` (they're structurally identical)

### 3. Update role settings page props (if needed)

**File:** `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`

No changes expected — the page already passes `roleId` and `stages` to `RoleStagesEditor`.

## Key files

| File | Action |
|------|--------|
| `src/actions/productions/reorder-role-stages.ts` | Create |
| `src/actions/productions/reorder-production-stages.ts` | Reference (pattern to follow) |
| `src/components/productions/role-stages-editor.tsx` | Modify |
| `src/components/productions/default-stages-editor.tsx` | Reference (shared `StagesEditor`) |

## Verification

1. Run `bun run build` to check for type/build errors
2. Visit a role's settings page (`/productions/[id]/roles/[roleId]/settings`)
3. Verify custom stages can be dragged to reorder
4. Verify adding a stage still works
5. Verify removing a stage still works
6. Verify system stages (Applied, Selected, Rejected) remain fixed and non-draggable
