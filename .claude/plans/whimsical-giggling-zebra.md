# Plan: Chip Role Filter & Disable Image Dragging

## Context

Two UX fixes: (1) prevent browser-native image drag on card photos, and (2) replace the Select dropdown role filter with a visible chip row on the submissions Kanban page. Spec: `docs/superpowers/specs/2026-04-04-chip-filter-no-drag-design.md`

## Steps

### Step 1: Disable image dragging

Add `draggable={false}` to all `<img>` tags in:

- `src/components/productions/kanban-card.tsx` -- 2 images (lines 81, 138)
- `src/components/candidates/candidate-card.tsx` -- 1 image (line 43)

### Step 2: Replace Select with chip filter

In `src/components/productions/production-submissions.tsx`:

1. Remove the `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` imports (if no longer used elsewhere in the file)
2. Replace lines 462-476 (the `<Select>` block) with:

```tsx
{roles.length > 1 && (
  <div className="flex flex-wrap items-center gap-element">
    <Button
      size="xs"
      variant={selectedRoleId === "" || selectedRoleId === "all" ? "default" : "outline"}
      onClick={() => setSelectedRoleId("all")}
    >
      All
    </Button>
    {roles.map((role) => (
      <Button
        key={role.id}
        size="xs"
        variant={selectedRoleId === role.id ? "default" : "outline"}
        onClick={() => setSelectedRoleId(role.id)}
      >
        {role.name}
      </Button>
    ))}
  </div>
)}
```

3. Ensure `Button` is imported from `@/components/common/button`
4. Remove unused Select imports if applicable

## Verification

1. `bun run lint` -- passes
2. `bun run build` -- passes
3. Manual: submissions Kanban with multi-role production shows chip row, filtering works, "All" resets
4. Manual: dragging photos on Kanban cards and candidate cards produces no ghost image

## Agents

- **Main agent** executes both steps directly (3 files, ~10 line changes total -- no subagents needed)
