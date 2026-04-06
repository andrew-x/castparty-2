# Fix DnD removeChild race condition

## Context

Dragging kanban cards between columns intermittently crashes the page with:
`Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`

**Root cause:** During `onDragOver`, `setColumns(move(...))` queues a React re-render. React 19 batches this update, so dnd-kit physically moves the DOM node before React reconciles. When React finally flushes, it tries to `removeChild` from the old parent, but the node is already gone.

## Changes

### Step 1: Add `flushSync` to `onDragOver`

**File:** `src/components/productions/production-submissions.tsx`

Wrap the `setColumns` call inside `onDragOver` with `flushSync` from `react-dom`. This forces React to synchronously reconcile the DOM before returning control to dnd-kit, eliminating the race window.

```tsx
import { flushSync } from "react-dom"

// In DragDropProvider:
onDragOver={(event) => {
  flushSync(() => {
    setColumns((current) => {
      const next = move(current, event)
      movedColumns.current = next
      return next
    })
  })
}}
```

**Subagent:** None needed — single-line change in a known location.

### Step 2: Add error boundary safety net

**File:** `src/components/productions/kanban-error-boundary.tsx` (new)

Create a lightweight React error boundary that wraps the `DragDropProvider`. If a DOM manipulation error still slips through (e.g., from other dnd-kit interactions), it catches the error and resets the kanban view instead of crashing the page.

The boundary should:
- Catch errors, check if they're DOM-related (`removeChild`, `insertBefore`, `appendChild`)
- On DOM errors: log a warning, reset by re-mounting children (via key increment)
- On non-DOM errors: re-throw (don't swallow real bugs)
- Expose a `resetKey` pattern so the parent can force recovery

**File:** `src/components/productions/production-submissions.tsx`

Wrap the `DragDropProvider` block with the error boundary.

**Subagent:** None needed — small new component + wrapper change.

## Verification

1. Run `bun run build` to ensure no type/compile errors
2. Run `bun run lint` to check formatting
3. Manual testing: open the kanban board, rapidly drag cards between columns, verify no crash
