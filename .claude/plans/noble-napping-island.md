# Plan: Add Feedback Table

## Context

Production team members need to leave structured feedback on submissions (candidates auditioning for roles). Currently there's no way to record evaluations. The `feedbackFormFields` column already exists on `Production` and `Role` tables, defining what questions the feedback form asks. This plan adds the `Feedback` table to store completed evaluations.

## Schema Changes

### File: `src/lib/db/schema.ts`

**1. Add `feedbackRatingEnum`** (after `fileTypeEnum`, ~line 400):

```ts
export const feedbackRatingEnum = pgEnum("feedback_rating", [
  "STRONG_NO",  // 1
  "NO",         // 2
  "YES",        // 3
  "STRONG_YES", // 4
])
```

**2. Add `Feedback` table** (after `File` table, ~line 428):

```ts
export const Feedback = pgTable(
  "feedback",
  {
    id: text().primaryKey(),
    submissionId: text()
      .notNull()
      .references(() => Submission.id, { onDelete: "cascade" }),
    submittedByUserId: text()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    stageId: text()
      .notNull()
      .references(() => PipelineStage.id, { onDelete: "restrict" }),

    formFields: jsonb().$type<CustomForm[]>().notNull().default([]),
    answers: jsonb().$type<CustomFormResponse[]>().notNull().default([]),
    rating: feedbackRatingEnum().notNull(),
    notes: text().notNull().default(""),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("feedback_submissionId_idx").on(table.submissionId),
    index("feedback_submittedByUserId_idx").on(table.submittedByUserId),
  ],
)
```

**Key design decisions:**
- `formFields` snapshots the feedback form fields at time of creation (so historical feedback is self-contained even if the form changes later)
- `answers` uses the same `CustomFormResponse[]` type as submissions
- `stageId` tracks which pipeline stage the candidate was in when feedback was given
- `submittedByUserId` references the `User` table (Better Auth) to track who left the feedback
- Cascade delete on submission (if submission is removed, feedback goes too)
- Restrict on stage (don't allow deleting a stage that has feedback referencing it)

**3. Add `feedbackRelations`** (in the relations section):

```ts
export const feedbackRelations = relations(Feedback, ({ one }) => ({
  submission: one(Submission, {
    fields: [Feedback.submissionId],
    references: [Submission.id],
  }),
  submittedBy: one(User, {
    fields: [Feedback.submittedByUserId],
    references: [User.id],
  }),
  stage: one(PipelineStage, {
    fields: [Feedback.stageId],
    references: [PipelineStage.id],
  }),
}))
```

**4. Update existing relations** to include feedback:

- `submissionRelations`: add `feedback: many(Feedback)`
- `pipelineStageRelations`: add `feedback: many(Feedback)`

### File: `src/lib/db/drizzle/` — Generate migration

Run `bunx drizzle-kit generate` to create the migration SQL.

## Verification

1. Run `bunx drizzle-kit generate` — should produce a clean migration with the new enum and table
2. Run `bun run build` — TypeScript compilation should pass
3. Run `bun run lint` — Biome should pass
