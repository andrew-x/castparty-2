# Add loading state to drag-and-drop card moves

## Context

After dropping a submission card into a new kanban column, the card appears to "freeze" momentarily while the server action persists the stage change. There's no visual feedback indicating the save is in progress. The goal is to show a subtle loading state on the moved card so the user knows the operation is completing.

## Changes

**Single file:** `src/components/productions/role-submissions.tsx`

### 1. Track which submission is being persisted

Add a `pendingSubmissionId` state and set/clear it around the server action:

```tsx
const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null)
```

In `onDragEnd`, set it before calling the action:

```tsx
if (originalStageId && newStageId && originalStageId !== newStageId) {
  setPendingSubmissionId(submissionId)
  executeStatusChange({ submissionId, stageId: newStageId })
}
```

Clear it in both `onSuccess` and `onError` of `useAction(updateSubmissionStatus)`:

```tsx
const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
  onSuccess() {
    setPendingSubmissionId(null)
    router.refresh()
  },
  onError() {
    setPendingSubmissionId(null)
    setColumns(previousColumns.current)
    router.refresh()
  },
})
```

### 2. Pass `isPending` through KanbanColumn → KanbanCard

**KanbanColumn** — add `pendingSubmissionId` prop, pass to card:

```tsx
<KanbanColumn
  ...
  pendingSubmissionId={pendingSubmissionId}
/>
```

```tsx
<KanbanCard
  ...
  isPending={submission.id === pendingSubmissionId}
/>
```

**KanbanCard** — accept `isPending` prop, add visual feedback:

```tsx
function KanbanCard({ ..., isPending }: { ...; isPending: boolean }) {
```

### 3. Visual feedback on the card

Use a subtle pulsing opacity + disable pointer events while pending. This reuses the existing `opacity-40` pattern from drag state but with animation:

```tsx
<div
  ref={ref}
  className={cn(
    "cursor-grab rounded-lg border border-border bg-card p-block hover:bg-muted/50 active:cursor-grabbing",
    isDragSource && "opacity-40",
    isPending && "pointer-events-none animate-pulse",
    isChecked && "border-primary/50 bg-brand-subtle",
  )}
>
```

`animate-pulse` gives a gentle fade-in/fade-out effect (built-in Tailwind utility). `pointer-events-none` prevents clicks during the save. No new components or imports needed.

## Verification

1. `bun run build` — confirm no type errors
2. Manual: drag card to new column → card shows pulse animation → animation stops when save completes
3. Manual: simulate slow network (DevTools throttle) → pulse is visible for the full duration
4. Manual: error case → card rolls back to original column with no lingering pulse
