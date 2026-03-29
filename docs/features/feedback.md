# Feedback

> **Last verified:** 2026-03-29

## Overview

The feedback system lets production team members record a structured rating and notes for each submission during the casting review process. Every feedback entry is anchored to the submission's current pipeline stage, creating a per-stage audit trail of team opinions. This is distinct from comments (which are stage-agnostic operational notes) -- feedback answers the question "how did we rate this person at this stage?"

Feedback supports a 4-point rating scale, optional freetext notes, and production-configured custom form fields (e.g., "Voice quality", "Movement skills"). The form lives inside the submission detail sheet as a collapsible accordion section.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| (No dedicated route) | `FeedbackPanel` inside `SubmissionDetailSheet` | Org member | Rendered in the right pane of the detail sheet when any submission is selected |

## Data Model

| Table | Key Columns | Role |
|-------|-------------|------|
| `Feedback` | `id`, `submissionId`, `submittedByUserId`, `stageId`, `rating` (enum), `notes`, `formFields` (JSONB), `answers` (JSONB), `createdAt` | One row per review |
| `PipelineStage` | `id`, `name`, `type` | Referenced by `stageId` -- anchors feedback to a specific pipeline step |
| `Production` | `feedbackFormFields` (JSONB) | Custom fields configured at production level; inherited by all roles |

**`feedbackRatingEnum`:** `STRONG_NO`, `NO`, `YES`, `STRONG_YES` (stored as Postgres enum).

**`formFields` on Feedback:** A snapshot of the production's `feedbackFormFields` at the time of submission. Ensures historical feedback entries remain readable even if fields change.

**`answers` on Feedback:** Array of `CustomFormResponse` objects: `{ fieldId, textValue, booleanValue, optionValues }`.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/productions/feedback-panel.tsx` | Client component; renders activity list (feedback + comments + emails + stage changes) and collapsible feedback/comment/email forms |
| `src/actions/feedback/create-feedback.ts` | Mutation: validates org ownership, verifies stage belongs to production, validates required custom fields, transforms flat answers, inserts `Feedback` row |
| `src/lib/schemas/feedback.ts` | `createFeedbackFormSchema` (rating + notes + answers) and `createFeedbackActionSchema` (extends with `submissionId` + `stageId`) |
| `src/lib/submission-helpers.ts` | `FeedbackData` type; `buildActivityList()` merges feedback into chronological activity stream |
| `src/lib/db/schema.ts` | `Feedback` table definition and `feedbackRatingEnum` |

## How It Works

### Feedback Creation Flow

```
FeedbackPanel (client)
  └── Accordion "Add feedback" (collapsible)
        └── form onSubmit
              ├── form.clearErrors("root")
              ├── Walk feedbackFormFields: validate required custom fields
              ├── [abort if any required field is blank]
              └── action.execute({ rating, notes, answers, submissionId, stageId })
                    │
                    ▼
              createFeedback (server action, secureActionClient)
                ├── Load submission → role → production (verify org ownership)
                ├── Verify stageId belongs to same production
                ├── Server-side required field validation
                ├── Transform flat answers → CustomFormResponse[]
                ├── db.insert(Feedback) with formFields snapshot + transformed answers
                └── revalidatePath("/", "layout")
```

### Activity List

`FeedbackPanel` renders a unified activity feed. `buildActivityList()` merges:
- Feedback entries (stage-anchored, with rating badges)
- Comments (freetext notes)
- Stage changes (pipeline transitions)
- Emails (inbound/outbound)
- Submission created event

All items sorted reverse-chronologically. A `ToggleGroup` filter lets users view all activity or filter by type.

### Rating System

| Enum value | Numeric | Label | Badge style |
|-----------|---------|-------|-------------|
| `STRONG_YES` | 4 | "4 -- Strong yes" | Green (success) |
| `YES` | 3 | "3 -- Yes" | Green (success) |
| `NO` | 2 | "2 -- No" | Red (destructive) |
| `STRONG_NO` | 1 | "1 -- Strong no" | Red (destructive) |

Radio buttons ordered 4 to 1 (top to bottom). Rating is required (custom Zod error: "Select a rating.").

## Business Logic

- **Org ownership:** Server action traverses `submission -> role -> production -> organizationId`
- **Stage validation:** `stageId` must belong to the same production
- **Stage captured at submit time:** `stageId` is read from `submission.stageId` when the form submits, not when the panel opens
- **Required field validation (dual):** Client-side walks `feedbackFormFields` and sets per-field errors. Server-side re-checks and throws if blank
- **Form field snapshot:** Production's `feedbackFormFields` stored on each `Feedback` row at creation time
- **Notes are optional:** `z.string().trim().max(5000).optional().default("")`

## UI States

| State | Behavior |
|-------|----------|
| **No activity** | "No activity yet." centered text |
| **Filtered empty** | "No feedback yet." / "No comments yet." depending on filter |
| **Feedback card** | Bordered card with avatar + name + timestamp; rating badge + stage badge; notes; custom field pairs |
| **Comment card** | Bordered card with avatar + name + timestamp; `MessageCircleIcon`; content text |
| **Stage change** | Inline row: arrow icon + "From -> To by Name" + timestamp |
| **Email item** | Bordered card; expandable body; inbound emails get blue border + "Reply" badge |
| **Form accordion** | Three mutually exclusive items: "Send email", "Add comment", "Add feedback" |
| **Submitting** | Submit button shows loading spinner |

## Integration Points

- [Kanban](./kanban.md) -- `FeedbackPanel` is rendered inside `SubmissionDetailSheet`
- [Comments](./comments.md) -- comment form and list are co-located in `FeedbackPanel`
- [Custom Fields](./custom-fields.md) -- feedback form fields configured at production level; shared `CustomFormResponse` type
- [Pipeline Stages](./pipeline.md) -- each feedback entry references a `PipelineStage`; stage badge shown on cards

## Architecture Decisions

- **Stage captured at submit time, not display time.** Ensures feedback is tagged to the exact pipeline step where the review happened.

- **Submit button always enabled.** Disabling until rating is selected adds friction. Inline validation fires on submit.

- **Feedback list as cards, not a flat list.** Each entry uses a bordered card to visually group a reviewer's complete opinion.

- **Form field snapshot on each Feedback row.** Ensures historical feedback remains fully renderable after production form changes.

- **Unified activity feed.** Feedback, comments, stage changes, and emails merged into one chronological stream. Filter toggle handles focus.
