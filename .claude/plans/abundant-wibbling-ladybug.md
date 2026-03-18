# Add Comments Support to Submission Drawer

## Context

Casting directors need a way to leave quick notes/comments on submissions without the formality of structured feedback (which requires a rating and may include custom form fields). Comments are lightweight text entries — useful for internal notes like "Great energy, follow up after callbacks" — while feedback is structured evaluation. Both should appear in a unified chronological activity list so the team sees the full history at a glance.

## Plan

### 1. Add `Comment` table to database schema

**File:** `src/lib/db/schema.ts`

Add after the `Feedback` table (line ~485):

```
Comment table:
  id          text PK
  submissionId text FK → Submission (cascade)
  submittedByUserId text FK → User (cascade)
  content     text NOT NULL
  createdAt   timestamp default now
  updatedAt   timestamp default now

Indexes: comment_submissionId_idx, comment_submittedByUserId_idx
```

Add `commentRelations` (one → Submission, one → User).
Add `comments: many(Comment)` to existing `submissionRelations` (line 535).

ID prefix: `"cmt"` via existing `generateId()` from `src/lib/util.ts`.

### 2. Add `CommentData` type and `ActivityItem` union

**File:** `src/lib/submission-helpers.ts`

- Add `CommentData` type: `{ id, content, createdAt, submittedBy: { id, name, image } }`
- Add discriminated union: `ActivityItem = { type: "feedback", data: FeedbackData } | { type: "comment", data: CommentData }`
- Add `buildActivityList(feedback, comments)` — merges both arrays, sorts desc by `createdAt`
- Add `comments: CommentData[]` to `SubmissionWithCandidate` interface

### 3. Create comment validation schema

**New file:** `src/lib/schemas/comment.ts`

- `createCommentFormSchema`: `{ content: z.string().trim().min(1).max(5000) }`
- `createCommentActionSchema`: extends form schema with `submissionId: z.string().min(1)`

### 4. Create server action

**New file:** `src/actions/comments/create-comment.ts`

Follow exact pattern from `src/actions/feedback/create-feedback.ts`:
- `secureActionClient.metadata({ action: "create-comment" }).inputSchema().action()`
- Load submission, verify org ownership via `submission.role.production.organizationId`
- Insert into `Comment` table
- `revalidatePath("/", "layout")`

### 5. Add comments to data loading queries

**File:** `src/actions/productions/get-role-with-submissions.ts`

In the `submissions.with` block (line ~36), add `comments` relation alongside `feedback`:
```
comments: {
  with: { submittedBy: { columns: { id, name, image } } },
  orderBy: desc(createdAt),
}
```

In the `submissions.map()` transform (line ~56), map raw comments to `CommentData[]` and include in return.

**File:** `src/actions/candidates/get-candidate.ts`

Same changes — add `comments` to query (line ~30) and transform (line ~44). Include `comments` in the returned submission object.

### 6. Update FeedbackPanel component

**File:** `src/components/productions/feedback-panel.tsx`

**6a. Combined activity list** — Replace the feedback-only list with a merged list:
- Call `buildActivityList(submission.feedback, submission.comments)`
- Rename header from "Feedback" to "Activity"
- Render each item with type check: `FeedbackItem` or `CommentItem`

**6b. Extract `FeedbackItem`** — Move existing inline feedback rendering (lines 145-202) into a local function component.

**6c. Add `CommentItem`** — New local function component, visually simpler:
- Avatar + name + date (same pattern as feedback)
- Small `MessageCircleIcon` as type indicator (vs feedback's rating/stage badges)
- Plain text `content` (no rating, no stage badge, no form answers)
- No `bg-muted/30` background to visually differentiate from feedback cards

**6d. Add comment form accordion** — Insert ABOVE the existing feedback accordion:
- `MessageCircleIcon` + "Add comment" trigger
- Simple form: `Textarea` + submit button ("Post comment")
- Uses second `useHookFormAction` with `createComment` action and `createCommentFormSchema`
- Resets form and calls `router.refresh()` on success

### No other files need changes

`SubmissionDetailSheet` and `CandidateDetail` pass `submission` (which now includes `comments`) to `FeedbackPanel` — no prop signature changes needed.

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/lib/db/schema.ts` — Comment table, relations |
| Modify | `src/lib/submission-helpers.ts` — CommentData, ActivityItem, buildActivityList, update SubmissionWithCandidate |
| Create | `src/lib/schemas/comment.ts` — Zod schemas |
| Create | `src/actions/comments/create-comment.ts` — Server action |
| Modify | `src/actions/productions/get-role-with-submissions.ts` — Add comments to query + transform |
| Modify | `src/actions/candidates/get-candidate.ts` — Add comments to query + transform |
| Modify | `src/components/productions/feedback-panel.tsx` — Activity list, CommentItem, comment form accordion |

## Agents

- **Librarian** — update `docs/FEATURES.md` after implementation
- **Code Reviewer** — review changes before considering done

## Verification

1. Run `bun run db:update` to generate and apply the migration
2. Run `bun run build` to verify no type errors
3. Manual testing:
   - Open a submission drawer → verify "Activity" header with empty state ("No activity yet.")
   - Add a comment via the accordion → verify it appears in the activity list with avatar, name, date, and content
   - Add feedback → verify it appears in the same list with rating badge, stage badge, and form answers
   - Verify chronological ordering (newest first) with mixed comments and feedback
   - Open a candidate detail page → verify comments appear there too
