# Submission Drawer Updates

## Context

The submission detail drawer has three issues:
1. The candidate name is plain text — should link to their candidate page
2. "Also submitted for" includes the currently-viewed role and its links point to `/productions/:id/roles/:roleId` which doesn't exist (no individual role route)
3. Activity log filters are ordered all → feedback → comments → emails, but should be all → emails → feedback → comments

## Changes

### 1. Candidate name as link
**File:** `src/components/productions/submission-detail-sheet.tsx` (~line 293)

Wrap `{submission.firstName} {submission.lastName}` in a `<Link>` to `/candidates/${submission.candidate.id}`. Add a small `ExternalLinkIcon` (from lucide-react) next to the name to visually indicate it's a link. Keep it inside `<SheetTitle>` so the heading semantics are preserved. Style the link with a subtle underline-on-hover so it doesn't look dramatically different from the current heading.

### 2. Fix "also submitted for" — filter current role + fix links

**a) Add `submissionId` to `OtherRoleSubmission`**
- **File:** `src/lib/submission-helpers.ts` (~line 95) — add `submissionId: string` to the interface
- **File:** `src/actions/productions/get-production-submissions.ts` (~line 170-206) — when building `otherRoleSubmissions`, also track and include the submission ID for each role

**b) Filter out current role**
- **File:** `src/components/productions/submission-detail-sheet.tsx` (~line 371) — filter `otherRoleSubmissions` to exclude entries where `roleId === submission.roleId`

**c) Fix links with callback navigation**
- **File:** `src/components/productions/submission-info-panel.tsx` — replace `<Link>` with a `<button>` that calls a new `onNavigateToSubmission(submissionId)` callback prop
- **File:** `src/components/productions/submission-detail-sheet.tsx` — accept and forward `onNavigateToSubmission` prop to `SubmissionInfoPanel`
- **File:** `src/components/productions/production-submissions.tsx` — pass a callback that looks up the submission by ID from the `submissions` array and calls `selectSubmission()`

### 3. Reorder activity log filters
**File:** `src/components/productions/feedback-panel.tsx` (~line 386-400)

Change the filter array order from `[all, feedback, comment, email]` to `[all, email, feedback, comment]`.

## Verification

1. Open a production's kanban → click a submission card to open the drawer
2. Candidate name should be a link — clicking navigates to `/candidates/:id`
3. "Also submitted for" should NOT list the role currently being viewed
4. Clicking a role name in "also submitted for" should open that submission in the drawer (no broken link / 404)
5. Activity log filter icons should be in order: All, Emails, Feedback, Comments
