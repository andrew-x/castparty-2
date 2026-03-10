# Plan: Wide Two-Pane Submission Detail Sheet with Feedback

## Context

The submission detail sheet is currently a narrow right-side panel (~28rem) showing candidate info in a single column. Casting directors need to review submissions and leave feedback in a single view. The Feedback DB table and feedback form field configuration already exist, but there's no UI for displaying/submitting feedback and no `create-feedback` server action.

This plan widens the sheet to ~5xl, adds a structured header with name + contact + stage selector, and splits the body into two panes: submission data (left) and feedback (right).

---

## Step 1: Feedback Zod Schemas

**Create `src/lib/schemas/feedback.ts`**

```ts
// Form schema (user-input fields only)
createFeedbackFormSchema = z.object({
  rating: z.enum(["STRONG_NO", "NO", "YES", "STRONG_YES"]),
  notes: z.string().trim().max(5000).optional().default(""),
  answers: z.record(z.string(), z.string()).default({}),
})

// Action schema (extends with server IDs)
createFeedbackActionSchema = createFeedbackFormSchema.extend({
  submissionId: z.string().min(1),
  stageId: z.string().min(1),
})
```

**Modify `src/lib/schemas/index.ts`** — add `export * from "./feedback"`.

---

## Step 2: Add `FeedbackData` Type

**Modify `src/lib/submission-helpers.ts`**

Add interface:

```ts
export interface FeedbackData {
  id: string
  rating: "STRONG_NO" | "NO" | "YES" | "STRONG_YES"
  notes: string
  formFields: CustomForm[]
  answers: CustomFormResponse[]
  createdAt: Date | string
  submittedBy: { id: string; name: string; image: string | null }
  stage: { id: string; name: string }
}
```

Add `feedback: FeedbackData[]` to `SubmissionWithCandidate`.

---

## Step 3: `create-feedback` Server Action

**Create `src/actions/feedback/create-feedback.ts`**

- `secureActionClient` with `.metadata({ action: "create-feedback" })` and `.inputSchema(createFeedbackActionSchema)`
- Verify submission belongs to the user's org (load submission with role + production)
- Resolve feedbackFormFields: role-level if non-empty, else production-level
- Convert flat `answers` record to `CustomFormResponse[]` (same pattern as `create-submission.ts`)
- Snapshot resolved formFields into `Feedback.formFields`
- Insert with `generateId("fb")`
- `revalidatePath("/", "layout")`

---

## Step 4: Extend Data Fetching

**Modify `src/actions/productions/get-role-with-submissions.ts`**

1. Add `feedback` to the submissions `with` clause:
   ```ts
   feedback: {
     with: {
       submittedBy: { columns: { id: true, name: true, image: true } },
       stage: { columns: { id: true, name: true } },
     },
     orderBy: (f, { desc }) => [desc(f.createdAt)],
   }
   ```

2. Add `feedbackFormFields: true` to the production columns selection (currently only `id`, `organizationId`)

3. Resolve feedbackFormFields with role > production fallback

4. Map feedback data into each `SubmissionWithCandidate`

5. Return `feedbackFormFields` alongside existing return shape

---

## Step 5: Wire `feedbackFormFields` Through Props

**Modify `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx`**
- Pass `feedbackFormFields={feedbackFormFields}` to `<RoleSubmissions>`

**Modify `src/components/productions/role-submissions.tsx`**
- Add `feedbackFormFields: CustomForm[]` to Props
- Pass through to `<SubmissionDetailSheet feedbackFormFields={feedbackFormFields}>`

---

## Step 6: Redesign `submission-detail-sheet.tsx`

**Modify `src/components/productions/submission-detail-sheet.tsx`**

### Width
Override via className: `<SheetContent className="sm:max-w-5xl">`

### Header (compact, single row)
- Left: candidate name (SheetTitle) + inline contact icons (email, phone, location)
- Right: stage Select dropdown

### Body (two-pane, side by side)
```
┌────────────────────────────────┬──────────────────────┐
│ Left pane (flex-1)             │ Right pane (w-96)    │
│                                │                      │
│ Headshots grid                 │ Feedback list        │
│ Resume link                    │ (each: avatar, name, │
│ Submitted date                 │  rating badge, date, │
│ Form responses                 │  notes, answers)     │
│                                │                      │
│                                │ ── separator ──      │
│                                │                      │
│                                │ New feedback form    │
│                                │ (rating toggle group,│
│                                │  notes textarea,     │
│                                │  custom form fields, │
│                                │  submit button)      │
└────────────────────────────────┴──────────────────────┘
```

Both panes independently scrollable (`overflow-y-auto`), separated by `border-l`.

---

## Step 7: Create Feedback Panel Component

**Create `src/components/productions/feedback-panel.tsx`** (`"use client"`)

### Props
```ts
interface Props {
  submission: SubmissionWithCandidate
  feedbackFormFields: CustomForm[]
}
```

### Feedback List
- Map `submission.feedback` entries
- Each entry: Avatar (initials from `submittedBy.name`), name, stage badge, rating badge, timestamp, notes, form field answers
- Rating display labels: `STRONG_YES` → "Strong yes", `YES` → "Yes", `NO` → "No", `STRONG_NO` → "Strong no"
- Rating badge colors: `STRONG_YES`/`YES` → success-ish, `NO`/`STRONG_NO` → destructive-ish
- Empty state: "No feedback yet."

### Feedback Form
- `useHookFormAction(createFeedback, formResolver(createFeedbackFormSchema), { ... })`
- **Rating**: `ToggleGroup` with `type="single"` and 4 `ToggleGroupItem`s
- **Notes**: `Textarea` component
- **Custom fields**: Iterate `feedbackFormFields`, render per type (TEXT → Input, TEXTAREA → Textarea, SELECT → Select, CHECKBOX_GROUP → checkboxes, TOGGLE → Switch)
- Submit injects `submissionId` and `stageId` from submission prop
- `onSuccess`: `router.refresh()` to reload data with new feedback

### Existing components to reuse
- `Avatar`, `AvatarFallback` from `@/components/common/avatar`
- `Badge` from `@/components/common/badge`
- `ToggleGroup`, `ToggleGroupItem` from `@/components/common/toggle-group`
- `Textarea` from `@/components/common/textarea`
- `Input` from `@/components/common/input`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/common/select`
- `Button` from `@/components/common/button`
- `Separator` from `@/components/common/separator`
- `formResolver` from `@/lib/schemas/resolve`

---

## Implementation Order

1. Schema (`feedback.ts`, `index.ts`)
2. Types (`submission-helpers.ts`)
3. Server action (`create-feedback.ts`)
4. Data fetching (`get-role-with-submissions.ts`)
5. Feedback panel component (`feedback-panel.tsx`)
6. Sheet redesign + prop wiring (`submission-detail-sheet.tsx`, `role-submissions.tsx`, `page.tsx`)

## Subagents

- Steps 1-4 (backend): Main agent, sequential
- Step 5 (feedback-panel): Main agent
- Step 6 (sheet + wiring): Main agent
- After completion: **code-reviewer** agent to review all changes

---

## Verification

1. Run `bun run lint` — all files pass Biome
2. Run `bun run build` — no type errors
3. Manual check: navigate to a role with submissions, click a candidate card
   - Sheet should open wide (~5xl)
   - Header: name + contact info inline + stage dropdown
   - Left pane: headshots, resume, date, form responses
   - Right pane: feedback list (empty initially) + feedback form
4. Submit feedback via the form → should appear in the list without page reload (router.refresh)
5. Verify feedback snapshots form fields correctly in the DB
