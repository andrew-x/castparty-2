# Comments

> **Last verified:** 2026-03-29

## Overview

Production team members can leave freetext comments on any submission. Unlike feedback (which is stage-anchored with ratings and structured fields), comments are a lightweight, stage-agnostic thread of notes visible to everyone on the team. They serve a different purpose: quick coordination notes like "follow up with this person", "check availability before advancing", or "she confirmed July dates".

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| (No dedicated route) | Comment form inside `FeedbackPanel` inside `SubmissionDetailSheet` | Org member | Rendered alongside feedback in the activity feed |

## Data Model

| Table | Key Columns | Relationships |
|-------|-------------|---------------|
| `Comment` | `id` (text PK, prefix `cmt`), `submissionId` (FK -> Submission, cascade), `submittedByUserId` (FK -> User, cascade), `content` (text, not null), `createdAt`, `updatedAt` | Belongs to a Submission; belongs to a User |

**Indexes:** `comment_submissionId_idx`, `comment_submittedByUserId_idx`.

**No stage reference:** Unlike `Feedback` which has a `stageId` column, `Comment` has no stage context. This is intentional -- comments are operational notes not tied to evaluation.

## Key Files

| File | Purpose |
|------|---------|
| `src/actions/comments/create-comment.ts` | Server action (`secureActionClient`): validates org ownership via submission chain, inserts `Comment` row, revalidates path |
| `src/lib/schemas/comment.ts` | `createCommentFormSchema` (content: trimmed, min 1, max 5000) and `createCommentActionSchema` (extends with `submissionId`) |
| `src/components/productions/feedback-panel.tsx` | `CommentItem` renders a single comment card; comment form is an accordion section; `buildActivityList()` merges comments into the chronological feed |
| `src/lib/submission-helpers.ts` | `CommentData` type (id, content, createdAt, submittedBy) |
| `src/lib/db/schema.ts` | `Comment` table definition |

## How It Works

### Comment Creation Flow

```
FeedbackPanel (client)
  └── Accordion "Add comment" (collapsible, mutually exclusive with feedback + email)
        └── form onSubmit
              ├── commentForm.clearErrors("root")
              └── commentAction.execute({ content, submissionId })
                    │
                    ▼
              createComment (server action, secureActionClient)
                ├── Load submission with role -> production -> organizationId
                ├── Verify organizationId === user.activeOrganizationId
                ├── db.insert(Comment).values({
                │     id: generateId("cmt"),
                │     submissionId,
                │     submittedByUserId: user.id,
                │     content,
                │   })
                └── revalidatePath("/", "layout")
```

### Display in Activity Feed

Comments appear in the unified activity feed inside `FeedbackPanel`, sorted chronologically alongside feedback, stage changes, and emails. The `ToggleGroup` filter lets users filter to just comments.

## Business Logic

- **Org ownership:** Server action traverses `submission -> role -> production -> organizationId` and verifies it matches `user.activeOrganizationId`
- **Content validation:** Trimmed, min 1 character, max 5000 characters
- **No edit or delete:** Comments are append-only
- **No stage context:** Comments have no `stageId` -- stage-agnostic by design
- **ID prefix:** Comment IDs use `cmt` prefix via `generateId("cmt")`

## UI States

| State | Behavior |
|-------|----------|
| **No comments** | "No comments yet." via activity filter |
| **Comment card** | Bordered card; avatar + name + timestamp; `MessageCircleIcon`; content text |
| **Form collapsed** | Accordion trigger: `MessageCircleIcon` + "Add comment" |
| **Form expanded** | Textarea (3 rows, "Write a comment..." placeholder) + "Post comment" button |
| **Validation error** | Red text below textarea |
| **Server error** | Red text below textarea showing server error |
| **Submitting** | "Post comment" button shows loading spinner |

## Integration Points

- [Kanban](./kanban.md) -- comments are fetched as part of `getProductionSubmissions` and displayed within `SubmissionDetailSheet`
- [Feedback](./feedback.md) -- comments and feedback share the `FeedbackPanel` component and its unified activity feed, but are separate data models
- [Candidates](./candidates.md) -- comments also available on the candidate detail page

## Architecture Decisions

- **No stage context.** Feedback is stage-anchored for evaluation tracking. Comments are stage-agnostic for operational notes. Mixing them would pollute per-stage history.

- **5000 char limit.** Long enough for detailed notes, short enough for chat-style readability. No markdown, mentions, or threading -- intentionally minimal for community theatre.

- **Co-located with feedback in FeedbackPanel.** All communication about a submission in one scrollable timeline. Filter toggle handles focus.

- **Append-only (no edit/delete).** Simplifies the data model. For community theatre, the friction of typos is lower than the complexity of edit history.
