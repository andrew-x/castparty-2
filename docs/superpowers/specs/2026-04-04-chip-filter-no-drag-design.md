# Chip Role Filter & Disable Image Dragging

## Context

Two small UX issues on the submissions and candidates pages:

1. **Image dragging:** Browser-native drag on `<img>` tags creates a ghost image when users click-drag on card photos. This is distracting, especially on the Kanban board where cards are already draggable via handles.
2. **Role filter discoverability:** The current `<Select>` dropdown hides available roles behind a click. A chip row makes all options visible at a glance.

## Change 1: Disable Image Dragging

Add `draggable={false}` to all `<img>` tags in:

- `src/components/productions/kanban-card.tsx` (compact thumbnail, line 81; default headshot, line 138)
- `src/components/candidates/candidate-card.tsx` (headshot, line 43)

## Change 2: Chip Role Filter (Submissions Page)

Replace the `<Select>` dropdown in `src/components/productions/production-submissions.tsx` (lines 462-476) with a horizontal chip row.

### Behavior

- Renders an "All" chip plus one chip per role
- Single-select: clicking a chip sets `selectedRoleId`
- Active chip: `Button variant="default"` (filled primary)
- Inactive chip: `Button variant="outline"`
- Size: `xs` for compact feel
- Container: `flex flex-wrap items-center gap-element`
- Still only shown when `roles.length > 1`

### Files Modified

| File | Change |
|------|--------|
| `src/components/productions/kanban-card.tsx` | Add `draggable={false}` to 2 `<img>` tags |
| `src/components/candidates/candidate-card.tsx` | Add `draggable={false}` to 1 `<img>` tag |
| `src/components/productions/production-submissions.tsx` | Replace `<Select>` with chip `<Button>` row |

### No New Dependencies

Uses existing `Button` component from `@/components/common/button` with existing `variant` and `size` props. No new components needed.

## Verification

1. Open the submissions Kanban board for a production with multiple roles
2. Confirm the chip row appears with "All" + each role name
3. Click chips to filter -- only matching submissions should show
4. Click "All" to reset
5. Try dragging a card photo on the Kanban board -- no ghost image should appear
6. Check the candidates grid page -- dragging a headshot should also produce no ghost image
