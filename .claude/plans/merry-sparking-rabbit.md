# Submission Drawer Navigation Strip

## Context

When reviewing candidates in the Kanban board, the user must close the drawer and click another card to view the next submission. This adds friction to the review workflow. Adding prev/next navigation lets the user move through submissions within the same column without closing the drawer.

## Design

A narrow vertical nav strip on the **left inside edge** of the `SheetContent`. It contains:
- **Prev** (ChevronUp) — only rendered when there's a previous submission in the column
- **Position label** — e.g. "3 of 12"
- **Next** (ChevronDown) — only rendered when there's a next submission in the column
- **Close** (X) — always visible, pinned to the bottom of the strip

The strip sits inside `SheetContent` as the first flex child in a horizontal layout. This ensures it participates in the sheet's slide animation naturally.

Keyboard shortcuts: ArrowUp/ArrowDown (or j/k) navigate prev/next. Gated on lightbox not being open and no input focused.

## Files to Modify

### 1. `src/components/productions/role-submissions.tsx`

**Add derived navigation state** after `selectedSubmission` state (around line 80):

```ts
const selectedColumn = selectedSubmission
  ? (columns[selectedSubmission.stageId] ?? [])
  : []
const selectedIndex = selectedSubmission
  ? selectedColumn.findIndex((s) => s.id === selectedSubmission.id)
  : -1

const handlePrev = selectedIndex > 0
  ? () => setSelectedSubmission(selectedColumn[selectedIndex - 1])
  : null
const handleNext = selectedIndex >= 0 && selectedIndex < selectedColumn.length - 1
  ? () => setSelectedSubmission(selectedColumn[selectedIndex + 1])
  : null
const navigationLabel = selectedIndex >= 0
  ? `${selectedIndex + 1} of ${selectedColumn.length}`
  : null
```

**Pass new props** to `<SubmissionDetailSheet>`:
```tsx
onPrev={handlePrev}
onNext={handleNext}
navigationLabel={navigationLabel}
```

### 2. `src/components/productions/submission-detail-sheet.tsx`

**Update Props interface** — add:
```ts
onPrev: (() => void) | null
onNext: (() => void) | null
navigationLabel: string | null
```

**Add imports:** `ChevronUpIcon`, `ChevronDownIcon`, `XIcon` from lucide-react.

**Override SheetContent layout** — change className to `"sm:max-w-[75vw] !flex-row gap-0 p-0"` to make it horizontal with no base gap/padding.

**Add nav strip** as first child inside `SheetContent`, before the existing content:
```tsx
<nav className="flex w-12 shrink-0 flex-col items-center border-r bg-muted/30 py-block">
  <div className="flex-1" />
  <div className="flex flex-col items-center gap-element">
    {onPrev && (
      <Button variant="ghost" size="icon-sm" tooltip="Previous candidate" onClick={onPrev}>
        <ChevronUpIcon />
      </Button>
    )}
    {navigationLabel && (
      <span className="text-caption text-muted-foreground select-none">
        {navigationLabel}
      </span>
    )}
    {onNext && (
      <Button variant="ghost" size="icon-sm" tooltip="Next candidate" onClick={onNext}>
        <ChevronDownIcon />
      </Button>
    )}
  </div>
  <div className="flex-1" />
  <Button variant="ghost" size="icon-sm" tooltip="Close" onClick={onClose}>
    <XIcon />
  </Button>
</nav>
```

**Wrap existing content** (SheetHeader + two-pane body) in:
```tsx
<div className="flex min-w-0 flex-1 flex-col">
  {/* existing SheetHeader + two-pane div */}
</div>
```

**Add keyboard navigation** via `useEffect`:
- ArrowUp / k → `onPrev?.()`
- ArrowDown / j → `onNext?.()`
- Gated on `lightboxIndex === null` and target not being INPUT/TEXTAREA/SELECT
- Deps: `[submission, onPrev, onNext, lightboxIndex]`

## Edge Cases

- **Stage change while open:** Submission moves columns → navigation recomputes from new column. If now alone in column, prev/next disappear.
- **Single submission in column:** Neither prev nor next renders. Only close + "1 of 1" label shown.
- **Lightbox open:** Keyboard nav disabled. Close prevented by existing guard.
- **Submission removed (server sync):** `selectedIndex` becomes -1, both callbacks null, label null.

## Verification

1. Open the role page with multiple submissions in at least one column
2. Click a submission card → drawer opens with nav strip on left
3. Verify prev/next appear only when there are adjacent submissions in the same column
4. Click next → content changes, drawer stays open
5. Navigate to last in column → next button disappears
6. Navigate to first → prev button disappears
7. Column with 1 submission → no prev/next, only close + "1 of 1"
8. Keyboard: ArrowDown moves next, ArrowUp moves prev
9. Open lightbox → arrows don't navigate submissions
10. Change stage while drawer open → nav recalculates for new column
11. Run `bun run lint` — no errors
