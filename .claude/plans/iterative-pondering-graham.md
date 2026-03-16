# Plan: Deep-link submissions via URL query parameter

## Context

Currently, opening a submission on the role page is purely local React state — the URL doesn't change. This means you can't share a link to a specific submission, and the "View in role" link on the candidate detail page drops you on the role page without opening the right submission. Adding a `?submission=<id>` query parameter enables deep-linking and cross-page navigation.

## Changes

### 1. `src/components/productions/role-submissions.tsx`

Sync selected submission with a `?submission=<id>` URL query parameter.

- Add `useSearchParams` import from `next/navigation`
- **Initialize from URL:** When the component mounts, read `submission` from search params. If present, find the matching submission in the `submissions` array and set it as `selectedSubmission` initial state.
- **Update URL on selection:** Create a helper function that wraps `setSelectedSubmission` — when a submission is selected, also call `router.replace(...)` to set `?submission=<id>`. When closing the sheet (setting null), remove the param. This covers:
  - Clicking a kanban card (line 289: `onSelect={setSelectedSubmission}`)
  - Prev/next navigation (lines 92-105)
  - Closing the sheet (line 310: `onClose`)
- **Pattern:** Follow the existing `useSearchParams` + `router.replace` pattern from `candidate-search.tsx`
- **Scroll:** Pass `{ scroll: false }` to `router.replace` to prevent page jump

### 2. `src/components/candidates/candidate-detail.tsx`

Update the "View in role" link (line 199-205) to include the submission ID:

```
href={`/productions/${selected.productionId}/roles/${selected.roleId}?submission=${submission.id}`}
```

This is the primary cross-page link — when viewing a candidate's submission and clicking "View in role", it opens that exact submission on the role page.

### 3. `src/components/candidates/candidate-card.tsx` (no change)

The candidate card is a single `<Link>` to `/candidates/[id]`. The submission lines are metadata, not individual navigation targets. No change needed here — the deep-link from the candidate detail "View in role" covers the use case.

## Files to modify

1. `src/components/productions/role-submissions.tsx` — main change
2. `src/components/candidates/candidate-detail.tsx` — one-line link update

## Verification

1. Navigate to a role page with submissions → click a kanban card → URL updates to `?submission=<id>`
2. Copy that URL → paste in new tab → page loads with the submission sheet open
3. Navigate prev/next → URL updates to the new submission ID
4. Close the sheet → `?submission` param is removed from URL
5. On candidate detail → click "View in role" → lands on role page with submission sheet open
6. Test with an invalid/stale submission ID in the URL → sheet stays closed (graceful fallback)
7. Run `bun run build` to confirm no type errors
