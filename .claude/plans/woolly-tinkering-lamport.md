# Plan: Polish "Consider for Role" Dialog Results

## Context

The dialog works functionally but the role list needs visual polish: items should look like selectable options with a check icon, the list should be more compact, and by default (no search) it should prioritize showing other roles from the current production.

## What Changes

**Only 1 file:** `src/components/productions/consider-for-role-dialog.tsx`

### Data model change

Add `productionId` and `productionName` to the `RoleOption` interface (already available from the `getOrgRolesGroupedByProduction` response) and store the current production's ID by finding which production contains `currentRoleId`.

```ts
interface RoleOption {
  id: string
  label: string          // "Role Name" (no production prefix)
  productionId: string
  productionName: string
}
```

### Default ordering: same production first

When there's **no search term**, show two sections:
1. **"This production"** — other roles from the same production as the current role (identified by finding which production contains `currentRoleId`)
2. **"Other productions"** — remaining roles, each showing "Production / Role" format

When **searching**, show a flat filtered list with "Production / Role" labels (so the user can tell which production each result belongs to).

### Item styling: compact selectable options

Each role item becomes a flex row with:
- Role name on the left (or "Production / Role" when searching or in the "Other productions" section)
- `CheckIcon` (from lucide, 16px, `text-primary`) on the right when selected
- Compact padding: `px-2 py-1` (down from `py-1.5`)
- Selected state: `bg-accent text-accent-foreground` (softer than the current `bg-primary text-primary-foreground`)
- Hover: `hover:bg-muted`
- Section headers: small muted text label above each group (e.g., "This production", "Other productions"), styled like `ComboboxLabel` — `px-2 py-1.5 text-xs text-muted-foreground`

### Max height

Keep `max-h-48` on the scrollable container (already set). The more compact items mean more roles visible at once.

### Remove FieldLabel

Drop the `<FieldLabel>Role</FieldLabel>` since the dialog title already says "Consider for another role" — the label is redundant. Keep the `<Field>` wrapper for error display.

## Verification

1. `bun run lint` + `bun run build`
2. Manual: open dialog → no search → see "This production" roles first, then "Other productions" → type to search → flat filtered list with "Production / Role" labels → click a role → CheckIcon appears → click Confirm
