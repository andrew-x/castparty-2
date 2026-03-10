# Plan: Four Feature Bundle

## Context

Four improvements to the Castparty workflow:

1. **Onboarding invite step is skipped** — After creating an org, `revalidatePath("/", "layout")` re-renders the onboarding layout, which checks `hasAnyOrganization()` (now true) and redirects to `/home` before the client can show the invite-team step.
2. **New roles default to closed** — Standalone role creation doesn't set `isOpen`, so it defaults to `false`. Should default to `true`.
3. **Kanban cards lack candidate photos** — Headshot data is fetched but not displayed on cards.
4. **Production creation wizard lacks form configuration** — No steps for configuring submission/feedback forms. These already exist in settings but not in the creation flow.

---

## Feature 1: Fix onboarding invite step skip

**Root cause:** `src/app/onboarding/layout.tsx:14-15` redirects when the user has any org. The `createOrganization` action's `revalidatePath("/", "layout")` triggers this redirect after org creation.

**Fix:** Remove `revalidatePath("/", "layout")` from the `createOrganization` action. The onboarding flow's `handleFinish` already calls `router.refresh()` + `router.push("/home")` which fetches fresh data. The `/home` page is a new navigation and will render fresh server data without needing prior cache invalidation.

**Files:**
- `src/actions/organizations/create-organization.ts` — Remove `revalidatePath("/", "layout")` (line 40)

---

## Feature 2: Default `isOpen: true` for new roles

**Fix:** Add `isOpen: true` to the role insert in `createRole`. Production creation already does this (line 105 of `create-production.ts`).

**Files:**
- `src/actions/productions/create-role.ts` — Add `isOpen: true` to the `db.insert(Role).values()` call (line 49-63)

---

## Feature 3: Candidate photo thumbnails on Kanban cards

**What exists:**
- `SubmissionWithCandidate.headshots: HeadshotData[]` — already fetched, primary photo is `headshots[0]` (ordered by `order`)
- `Avatar` / `AvatarImage` / `AvatarFallback` components at `src/components/common/avatar.tsx`

**Fix:** Add an `Avatar` with the primary headshot to the `KanbanCard` component. Show initials as fallback when no headshot exists.

**Files:**
- `src/components/productions/role-submissions.tsx` — Modify `KanbanCard` (lines 210-253):
  - Import `Avatar`, `AvatarImage`, `AvatarFallback`
  - Add avatar next to the candidate name
  - Use `submission.headshots[0]?.url` for image, initials for fallback

---

## Feature 4: Submission & feedback form steps in production creation wizard

### Overview

Add 2 new steps to the production creation wizard. New step order:
1. Details
2. Casting Pipeline
3. **Submission Form** (new)
4. **Feedback Form** (new)
5. Roles

Form fields use local state (like pipeline stages), saved all at once when the production is created. The existing `FormFieldsEditor` controlled component is reused with local-state callbacks.

### 4a. Add `customFormItemSchema` to form-fields schema

**File:** `src/lib/schemas/form-fields.ts`

Add after `customFormFieldTypeSchema` (line 9):

```ts
export const customFormItemSchema = z.object({
  id: z.string().min(1),
  type: customFormFieldTypeSchema,
  label: z.string().trim().min(1).max(200),
  description: z.string().max(500),
  required: z.boolean(),
  options: z.array(z.string().max(200)),
})
```

### 4b. Extend `createProductionActionSchema`

**File:** `src/lib/schemas/production.ts`

Add to `createProductionActionSchema`:
```ts
submissionFormFields: z.array(customFormItemSchema).optional(),
feedbackFormFields: z.array(customFormItemSchema).optional(),
```

### 4c. Update `createProduction` action

**File:** `src/actions/productions/create-production.ts`

1. Destructure `submissionFormFields` and `feedbackFormFields` from `parsedInput`
2. Pass them to `db.insert(Production).values()`:
   ```ts
   submissionFormFields: submissionFormFields ?? [],
   feedbackFormFields: feedbackFormFields ?? [],
   ```
3. Copy to roles with regenerated IDs (matching what `create-role.ts` does):
   ```ts
   submissionFormFields: (submissionFormFields ?? []).map((f) => ({ ...f, id: generateId("ff") })),
   feedbackFormFields: (feedbackFormFields ?? []).map((f) => ({ ...f, id: generateId("fbf") })),
   ```

### 4d. Update production creation wizard

**File:** `src/components/productions/create-production-form.tsx`

1. **Step type:** Change to `"details" | "stages" | "submissionForm" | "feedbackForm" | "roles"`
2. **STEPS array:** `["details", "stages", "submissionForm", "feedbackForm", "roles"]`
3. **State:** Add `submissionFormFields` and `feedbackFormFields` as `useState<CustomForm[]>([])`
4. **Navigation handlers:** Add `handleNextToSubmissionForm`, `handleNextToFeedbackForm`, `handleBackToSubmissionForm`, `handleBackToFeedbackForm`
5. **Local-state callbacks:** For each form type, add `handleAdd*Field`, `handleSave*Field`, `handleRemove*Field`, `handleReorder*Fields` — these manipulate local state only, using `generateId("ff")` / `generateId("fbf")` for IDs
6. **Submit:** Pass `submissionFormFields` and `feedbackFormFields` to `action.execute()`
7. **JSX:** Add two new step sections using `<FormFieldsEditor>` with local callbacks
8. **Update stages step:** "Continue" goes to `submissionForm` instead of `roles`
9. **Update roles step:** "Back" goes to `feedbackForm` instead of `stages`

**Imports needed:**
- `FormFieldsEditor` from `@/components/productions/form-fields-editor`
- `CustomForm`, `CustomFormFieldType` from `@/lib/types`
- `generateId` from `@/lib/util`

---

## Execution Plan

Use **dispatching-parallel-agents** skill to run Features 1-3 in parallel (they are independent, simple changes). Then Feature 4 sequentially (it's the largest change).

### Parallel batch: Features 1, 2, 3
- **Agent A:** Fix onboarding revalidation (1 file, ~1 line)
- **Agent B:** Add `isOpen: true` to `createRole` (1 file, ~1 line)
- **Agent C:** Add avatar to `KanbanCard` (1 file, ~10 lines)

### Sequential: Feature 4
- Modify schema files (4a, 4b)
- Modify action (4c)
- Modify wizard component (4d)

---

## Verification

### Feature 1
- Visit `/onboarding` as a new user (no orgs)
- Create an organization
- Verify the invite-team step appears (not a redirect to `/home`)
- Skip or send invites, then continue to `/home`

### Feature 2
- Create a role from a production's role management page
- Verify the role's `isOpen` is `true` in the database or via the UI toggle

### Feature 3
- Visit a role's Kanban board with submissions that have headshots
- Verify candidate avatars appear on cards with their primary photo
- Verify initials show for candidates without headshots

### Feature 4
- Create a new production
- Step through all 5 wizard steps
- Add fields in submission and feedback form steps
- Navigate back and forward — verify fields persist in local state
- Create the production with roles
- Verify production's form fields are saved
- Verify roles inherit the form fields (with different IDs)
- Run `bun run lint` and `bun run build`
