# Improve compact card layout

## Context

The compact view cards have two issues: (1) the headshot thumbnail uses `rounded-sm` but should be a circle (`rounded-full`), and (2) the checkbox and drag handle are absolutely positioned overlays that overlap the thumbnail and name text. In the compact single-line layout, these controls should be inline in the flex row so nothing overlaps.

## File to modify

`src/components/productions/role-submissions.tsx` — compact branch of `KanbanCard` (lines 675–741).

## Changes

Replace the compact card's layout from:
```
[absolutely-positioned checkbox] [thumbnail] [name] [absolutely-positioned drag handle]
```

To an inline flex row:
```
[checkbox] [circular thumbnail] [name] [drag handle]
```

### 1. Circular thumbnail
Change `rounded-sm` → `rounded-full` on the `size-8` thumbnail div (line 692).

### 2. Inline checkbox (left side)
Move the checkbox out of the absolute overlay and into the button's flex row as the first element. Keep `onPointerDown` / `onClick` stopPropagation on a wrapper `<div>` so dnd-kit doesn't steal clicks. Remove the absolute positioning classes.

### 3. Inline drag handle (right side)
Move the drag handle out of the absolute overlay and into the card's flex row as the last element (after the name, pushed to the right with `ml-auto`). Remove absolute positioning and `top-1/2 -translate-y-1/2`. Keep `opacity-0 group-hover:opacity-100` for show-on-hover behavior.

### Target compact card structure
```
┌─────────────────────────────────┐
│ [☐] [○ img] Name         [⠿]  │
└─────────────────────────────────┘
```

All elements are in a single flex row with `items-center`. No absolute positioning needed.

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — no new lint errors
3. Manual: compact cards show circular thumbnails, checkbox and drag handle don't overlap content, hover reveals drag handle, checkbox works, drag-and-drop still works
