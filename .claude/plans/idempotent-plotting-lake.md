# Candidate Detail: Split Layout with Submission Nav + Tabs

## Context

The candidate detail page (`/candidates/[candidateId]`) currently shows a table of submissions. Clicking a row opens a `SubmissionDetailSheet` (75vw drawer). The user wants a permanent side-by-side layout instead: a left nav listing submissions, and a right panel with tabs for submission details and feedback.

## File to modify

**`src/components/candidates/candidate-detail.tsx`** — complete rewrite of the component body. No other files change. The server page, data fetching, and `FeedbackPanel` stay as-is.

## Layout

```
┌─────────────────────────────────────────────────────┐
│ PageHeader: candidate name, contact info, edit btn  │
├──────────────┬──────────────────────────────────────┤
│ Left nav     │ Stage header: production, role,      │
│ (w-72,       │   stage badge, change/reject buttons │
│  scrollable) ├──────────────────────────────────────┤
│              │ Tabs: [Submission] [Feedback]         │
│ • Production ├──────────────────────────────────────┤
│   Role       │ Tab content (scrollable)             │
│   Stage      │                                      │
│              │ Submission tab: headshots, resume,    │
│ • Production │   links, date, form responses        │
│   Role       │                                      │
│   Stage      │ Feedback tab: FeedbackPanel          │
│              │   (feedback list + add form)          │
└──────────────┴──────────────────────────────────────┘
```

## Implementation steps

### 1. Update imports

**Remove:** `Table`/`TableBody`/`TableCell`/`TableHead`/`TableHeader`/`TableRow`, `SubmissionDetailSheet`

**Add:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/common/tabs`
- `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/common/popover`
- `Separator` from `@/components/common/separator`
- `SocialIcon` from `@/components/common/social-icons`
- `FeedbackPanel` from `@/components/productions/feedback-panel`
- `ArrowRightLeftIcon`, `FileTextIcon`, `XCircleIcon` from `lucide-react`
- `useRouter` from `next/navigation`, `useAction` from `next-safe-action/hooks`, `useEffect` from `react`
- `updateSubmissionStatus` from `@/actions/submissions/update-submission-status`
- `prettifyUrl` from `@/lib/social-links`, `cn` from `@/lib/util`
- `dynamic` from `next/dynamic` for lazy `HeadshotLightbox`

### 2. Update component state

- Default `selectedIndex` to `0` (not `null`) — first submission auto-selected
- Add `stagePopoverOpen`, `lightboxIndex` state
- Add `useRouter` + `useAction(updateSubmissionStatus)` for stage changes
- Add `useEffect` to reset `lightboxIndex` when `selectedIndex` changes
- Add `handleStatusChange` function (ported from `submission-detail-sheet.tsx`)

### 3. Left panel — `SubmissionNav` (local component)

A `<nav>` with `w-72 shrink-0 border-r overflow-y-auto`. Each item is a button showing:
- Production name (`text-label font-medium`)
- Role name (`text-caption text-muted-foreground`)
- Stage badge

Selected item gets `bg-accent`, others get `hover:bg-muted`.

### 4. Right panel — header + tabs

**Header bar** (`border-b px-group py-block`): production name, role name, stage badge, change stage popover, reject button. Ported from the sheet header.

**Tabs** (horizontal, `variant="line"`):
- **"Submission" tab**: headshots grid, resume link, social links, submitted date, form responses. Content ported from `submission-detail-sheet.tsx` left pane (lines 193-329). Includes lazy-loaded `HeadshotLightbox`.
- **"Feedback" tab**: renders `<FeedbackPanel>` as-is.

### 5. Height management

- `PageContent` gets `className="min-h-0 overflow-hidden"` (matches pattern from role layout)
- Split container: `flex min-h-0 flex-1`
- Left panel: `overflow-y-auto`
- Tab content: `min-h-0 flex-1 overflow-y-auto` (submission) / `overflow-hidden` (feedback, since FeedbackPanel handles its own scroll)

### 6. Cleanup

Remove the `<SubmissionDetailSheet>` render and its related imports. Remove table-related code. Keep `EditCandidateDialog` as-is.

## Key decisions

- **Duplicate sheet content rather than extract shared components** — the sheet is still used on the kanban board with a different layout context. The submission content sections are ~100 lines of simple rendering. Coupling two different UI contexts isn't worth the abstraction.
- **Line variant tabs** — lighter visual weight, appropriate for in-page content switching.
- **Uncontrolled tabs (`defaultValue`)** — active tab persists when switching submissions (if you're on Feedback tab and pick another submission, you stay on Feedback). This is the natural behavior.

## Verification

After implementation, visit `/candidates/[any-candidate-id]` and check:
- First submission auto-selected, left nav highlighted
- Clicking submissions switches right panel content
- Stage change popover and reject button work
- Headshot lightbox opens/closes correctly, resets on submission switch
- Resume and social links open in new tabs
- Form responses render by field type
- Feedback tab shows history and "Add feedback" accordion works
- Both panels scroll independently
- Edit candidate dialog still works
- Run `bun run lint` to verify no lint errors
