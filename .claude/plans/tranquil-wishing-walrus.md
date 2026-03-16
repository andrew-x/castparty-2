# Plan: Add Compact/Gallery View Toggle to Kanban Board

## Context

The Kanban cards were just redesigned with large 4:3 headshots (gallery view). Casting directors may sometimes prefer the denser compact layout to scan many candidates quickly, and other times want the prominent headshot view. Adding a toggle lets them switch on-the-fly.

## Changes

**Single file modified:** `src/components/productions/role-submissions.tsx`

### 1. Add view mode state

```tsx
const [viewMode, setViewMode] = useState<"compact" | "gallery">("gallery")
```

Default to "gallery" (the new headshot-forward design). Follows the existing `useState` pattern already used for `columns`, `selectedSubmission`, `selectedIds`.

### 2. Add toolbar row above the Kanban columns

Insert a small row between the `<>` fragment open and the `<DragDropProvider>`:

```tsx
<div className="flex items-center justify-end px-1 pb-block">
  <ToggleGroup
    type="single"
    variant="outline"
    size="sm"
    value={viewMode}
    onValueChange={(v) => { if (v) setViewMode(v as "compact" | "gallery") }}
  >
    <ToggleGroupItem value="compact" aria-label="Compact view">
      <LayoutListIcon className="size-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="gallery" aria-label="Gallery view">
      <LayoutGridIcon className="size-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</div>
```

**Components used:**
- `ToggleGroup` + `ToggleGroupItem` from `@/components/common/toggle-group` (already exists, used in system-field-toggles)
- `LayoutListIcon` + `LayoutGridIcon` from `lucide-react`

### 3. Pass `viewMode` to KanbanCard

Add `viewMode` prop to the `KanbanCard` component signature:
```tsx
function KanbanCard({
  submission, index, column, isChecked, onToggle, onSelect, viewMode,
}: {
  // ...existing props
  viewMode: "compact" | "gallery"
})
```

Thread it through from the `KanbanColumn` render of cards → `KanbanColumn` also needs the prop.

### 4. Render two card layouts based on viewMode

**Gallery view** (current design) — large 4:3 headshot, name below, checkbox overlay. Already implemented.

**Compact view** (restore old design) — horizontal row with small avatar, inline checkbox, name + date. Needs `Avatar`, `AvatarImage`, `AvatarFallback` imports restored.

```tsx
if (viewMode === "compact") {
  return (
    <div ref={ref} className={cn("cursor-grab rounded-lg border border-border bg-card p-block hover:bg-muted/50 active:cursor-grabbing", ...)}>
      <div className="flex gap-element">
        <div onPointerDown={stop} onClick={stop} className="flex h-6 items-center">
          <Checkbox ... />
        </div>
        <div className="min-w-0 flex-1">
          <button onClick={onSelect} className="group flex items-center gap-element font-medium text-label hover:text-brand-text">
            <Avatar size="sm">
              <AvatarImage src={headshotUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span>{name}</span>
          </button>
          <p className="text-caption text-muted-foreground">{date}</p>
        </div>
      </div>
    </div>
  )
}
// else: gallery view (existing code)
```

### 5. Import updates

**Add:**
- `ToggleGroup`, `ToggleGroupItem` from `@/components/common/toggle-group`
- `LayoutGridIcon`, `LayoutListIcon` from `lucide-react`

**Restore** (needed for compact view):
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/common/avatar`

### Critical files

- `src/components/productions/role-submissions.tsx` — only file modified
- `src/components/common/toggle-group.tsx` — reused as-is
- `src/components/common/avatar.tsx` — reused as-is

## Verification

1. `bun run lint` — no errors
2. `bun run build` — no type/build errors
3. Manual QA:
   - Toggle appears in top-right of Kanban area
   - Gallery view: large 4:3 headshots, checkbox overlay on hover
   - Compact view: small avatars inline, checkbox always visible
   - Switching preserves selection state and column positions
   - Drag-and-drop works in both views
   - Click-to-open detail sheet works in both views
