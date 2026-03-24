# Activity Log Filters

## Context

The activity log in the feedback panel currently shows all activity types (feedback, comments, emails, stage changes, submitted) with no way to filter. As the log grows with more activity types (emails were just added), users need a way to focus on specific content types. We'll add compact icon-based filters inline with the "Activity" title.

## Changes

**File: `src/components/productions/feedback-panel.tsx`**

### 1. Add filter state

Add a `useState` for the active filter type, defaulting to `"all"`:

```ts
type ActivityFilter = "all" | "feedback" | "comment" | "email"
const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
```

### 2. Update the header row

Replace the standalone `<h3>Activity</h3>` with a flex row:

```tsx
<div className="flex items-center justify-between">
  <h3 className="font-medium text-foreground text-label">Activity</h3>
  <ToggleGroup type="single" value={activityFilter} onValueChange={(v) => v && setActivityFilter(v as ActivityFilter)} size="sm">
    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="all"><ListIcon /></ToggleGroupItem></TooltipTrigger><TooltipContent>All activity</TooltipContent></Tooltip>
    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="feedback"><MessageSquareIcon /></ToggleGroupItem></TooltipTrigger><TooltipContent>Feedback</TooltipContent></Tooltip>
    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="comment"><MessageCircleIcon /></ToggleGroupItem></TooltipTrigger><TooltipContent>Comments</TooltipContent></Tooltip>
    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="email"><MailIcon /></ToggleGroupItem></TooltipTrigger><TooltipContent>Emails</TooltipContent></Tooltip>
  </ToggleGroup>
</div>
```

### 3. Filter activity items

Filter the `activityItems` array before rendering:

```ts
const filteredItems = activityFilter === "all"
  ? activityItems
  : activityItems.filter((item) => item.type === activityFilter)
```

- `"all"` shows everything (feedback, comments, emails, stage_change, submitted)
- Other filters show only that specific type
- `stage_change` and `submitted` events are only visible in `"all"` view (they don't match any other filter value)

### 4. Add imports

- `ListIcon` from `lucide-react`
- `ToggleGroup`, `ToggleGroupItem` from `@/components/common/toggle-group`
- `Tooltip`, `TooltipTrigger`, `TooltipContent` from `@/components/common/tooltip`
- Wrap the ToggleGroup in a `TooltipProvider` (or confirm one exists higher in the tree)

### 5. Update empty state

Use `filteredItems` instead of `activityItems` for the `.map()` and empty state check. Update the empty state message to reflect the active filter (e.g., "No feedback yet." vs "No activity yet.").

## Verification

1. Run `bun run build` to confirm no type errors
2. Run `bun run lint` to confirm Biome passes
3. Manual check: open a submission detail sheet, verify:
   - Filter icons appear to the right of "Activity" on the same line
   - Default view ("all") shows all activity types including stage changes
   - Clicking feedback/comments/emails filters to only that type
   - Stage changes and submitted events disappear in filtered views
   - Empty state shows appropriate message per filter
   - Tooltips appear on hover
