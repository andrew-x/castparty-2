# Audit Fix Plan

## Context

A comprehensive codebase audit identified 17 issues. This plan fixes the 14 actionable
ones, defers 2 that are blocked by the neon-http driver (no transaction support), and
skips 1 false positive. Each fix is scoped to minimize blast radius and preserve
existing behavior.

**Constraint:** `drizzle-orm/neon-http` does not support `db.transaction()`.
Issues requiring atomicity are deferred with explanatory comments.

---

## Phase 1 — Surgical single-file fixes (6 files, zero downstream risk)

### 1a. getCandidate: add org filter to where clause

**File:** `src/actions/candidates/get-candidate.ts`

- Line 3: add `and` to import → `import { and, eq } from "drizzle-orm"`
- Line 20-21: change `where: eq(Candidate.id, candidateId)` →
  `where: (c) => and(eq(c.id, candidateId), eq(c.organizationId, orgId))`
- Line 61: simplify `if (!candidate || candidate.organizationId !== orgId)` →
  `if (!candidate)`

### 1b. getRoleStagesWithCounts: scope subquery to role

**File:** `src/actions/productions/get-role-stages-with-counts.ts`

- Between lines 28 and 29 (after `.from(Submission)`), add:
  `.where(eq(Submission.roleId, roleId))`
- No new imports needed (`eq` already imported on line 3)

### 1c. getPublicProduction: filter closed productions

**File:** `src/actions/submissions/get-public-production.ts`

- Line 25: change `return production ?? null` →
  `if (!production || !production.isOpen) return null`
  `return production`

### 1d. updateSubmissionStatus: add revalidatePath

**File:** `src/actions/submissions/update-submission-status.ts`

- Add import: `import { revalidatePath } from "next/cache"`
- Before `return { id: submissionId }` (line 72), add: `revalidatePath("/", "layout")`

### 1e. role-submissions.tsx: remove useCallback

**File:** `src/components/productions/role-submissions.tsx`

- Line 17: change `import { useCallback, useRef, useState } from "react"` →
  `import { useRef, useState } from "react"`
- Lines 113-125: replace `useCallback(...)` with a plain function declaration:
  ```ts
  function selectSubmission(submission: SubmissionWithCandidate | null) {
    setSelectedSubmission(submission)
    const params = new URLSearchParams(searchParams.toString())
    if (submission) {
      params.set("submission", submission.id)
    } else {
      params.delete("submission")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }
  ```

### 1f. schema.ts: add $onUpdate to 8 updatedAt columns

**File:** `src/lib/db/schema.ts`

Add `.$onUpdate(() => new Date())` to `updatedAt` on these tables:
- `UserProfile` (line 232)
- `OrganizationProfile` (line 246)
- `Production` (line 275)
- `Role` (line 311)
- `PipelineStage` (line 340)
- `Candidate` (line 382)
- `Submission` (line 419)
- `Feedback` (line 479)

Pattern: `timestamp().defaultNow().notNull()` → `timestamp().defaultNow().$onUpdate(() => new Date()).notNull()`

This is a Drizzle ORM-side JS callback, NOT a DB schema change. No migration needed.
Uses `new Date()` to match the existing pattern on `user`/`session`/`account`/`verification`/`Comment`.

**Verify:** `bun run lint && bun run build`

---

## Phase 2 — Two-file fixes (contained scope)

### 2a. Fix required-field validation for TOGGLE/CHECKBOX_GROUP

**Files:**
- `src/actions/submissions/create-submission.ts` (lines 99-105)
- `src/actions/feedback/create-feedback.ts` (lines 65-71)

Replace the generic validation loop in both files. In `create-submission.ts`:
```ts
for (const field of formFields) {
  if (!field.required) continue
  const value = answers[field.id]
  if (field.type === "TOGGLE") {
    if (value !== "true") throw new Error(`${field.label} is required.`)
  } else if (!value || !value.trim()) {
    throw new Error(`${field.label} is required.`)
  }
}
```

In `create-feedback.ts`, same logic but iterating `feedbackFormFields`.

**Design note:** TOGGLE required = must be checked ("true"). All other types
(TEXT, TEXTAREA, NUMBER, SELECT, CHECKBOX_GROUP) keep the existing non-empty check,
which is correct — an empty CHECKBOX_GROUP sends "" which fails the trim check.

### 2b. removePipelineStage: cascade-delete feedback with confirmation

When a stage has feedback, cascade-delete the feedback rows — but require explicit
confirmation from the user first via an AlertDialog.

**File 1: Action** — `src/actions/productions/remove-pipeline-stage.ts`

- Line 8: add `Feedback` to schema import
- Add `force: z.boolean().optional()` to input schema (alongside `stageId`)
- After the submission count check (line 57), add feedback handling:
  ```ts
  const [{ value: feedbackCount }] = await db
    .select({ value: count() })
    .from(Feedback)
    .where(eq(Feedback.stageId, stageId))

  if (feedbackCount > 0 && !force) {
    return { confirmRequired: true, feedbackCount }
  }

  if (feedbackCount > 0) {
    await db.delete(Feedback).where(eq(Feedback.stageId, stageId))
  }
  ```
- Keep the existing `db.delete(PipelineStage)` after this block
- Change return from `{ success: true }` to `{ success: true }` (no change needed)

**File 2: UI** — `src/components/productions/role-stages-editor.tsx`

- Import `AlertDialog` components from `@/components/common/alert-dialog`
- Add state: `const [confirmStage, setConfirmStage] = useState<{id: string, feedbackCount: number} | null>(null)`
- Update `useAction(removePipelineStage)` `onSuccess` handler:
  - Check if `data?.confirmRequired` → open the confirmation dialog via `setConfirmStage`
  - Otherwise proceed as before (refresh)
- Update `handleRemove`: don't optimistically remove from local state yet (move that
  to after confirmation)
- Add `handleConfirmRemove`: calls `executeRemove({ stageId: confirmStage.id, force: true })`
  and applies the optimistic local state update
- Add AlertDialog JSX (follow `remove-member-dialog.tsx` pattern):
  ```
  Title: "Delete stage"
  Description: "This stage has {feedbackCount} feedback entries. All feedback
    submitted for this stage will be permanently deleted."
  Actions: Cancel / "Delete stage" (destructive variant)
  ```

**Note:** `remove-production-stage.ts` does NOT need this fix. Template stages
(roleId IS NULL) are never referenced by Feedback rows.

**Verify:** `bun run lint && bun run build`

---

## Phase 3 — Multi-file fixes (small blast radius)

### 3a. sendEmail: make async, propagate errors, surface in verification banner

**Goal:** Emails complete before serverless functions terminate. Errors propagate
so callers can surface them (especially email verification on the settings page).

**File 1:** `src/lib/email.ts`
- Make function async, remove IIFE wrapper, **log but re-throw** errors:
  ```ts
  export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
    try {
      if (IS_DEV) {
        const { render } = await import("@react-email/components")
        const html = await render(react)
        addEmail({ to, subject, html, text })
        logger.info(`[Email] To: ${to} | Subject: ${subject}`)
        return
      }
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({ from, to, subject, react, text })
    } catch (error) {
      logger.error("[Email] Failed to send:", error)
      throw error
    }
  }
  ```

**File 2:** `src/lib/auth.ts`
- Line 24: `sendEmail({` → `await sendEmail({`
- Line 37: `sendEmail({` → `await sendEmail({`
- Line 76: `sendEmail({` → `await sendEmail({`

All three hooks are already `async`, so adding `await` is safe. When `sendEmail`
throws, the error propagates through Better Auth, which returns an error response
to the client. This is the desired behavior — the client can surface the failure.

**File 3:** `src/components/auth/email-verification-banner.tsx`
- Add error state: `const [error, setError] = useState<string | null>(null)`
- Wrap `handleResend` in try/catch:
  ```ts
  async function handleResend() {
    setStatus("sending")
    setError(null)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/auth/verify-email",
    })
    if (error) {
      setError("Failed to send verification email. Please try again.")
      setStatus("idle")
      return
    }
    setStatus("sent")
  }
  ```
- Add error display below the button (use `<p className="text-sm text-destructive">`)
- Reset error on retry

### 3b. Deduplicate RESERVED_SLUGS

**New file:** `src/lib/constants/reserved-slugs.ts`
```ts
export const RESERVED_SLUGS = new Set([
  "new",
  "create",
  "edit",
  "delete",
  "settings",
  "admin",
  "api",
  "submit",
  "auth",
  "home",
])
```

**File 2:** `src/lib/slug.ts`
- Remove lines 8-19 (local RESERVED_SLUGS declaration)
- Add: `import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs"`

**File 3:** `src/lib/schemas/slug.ts`
- Remove lines 3-16 (duplicated RESERVED_SLUGS + comment)
- Add: `import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs"`

**Verify:** `bun run lint && bun run build`

---

## Phase 4 — Cleanup (low risk, additive)

### 4a. Complete schemas barrel

**File:** `src/lib/schemas/index.ts`

Add missing re-exports:
```ts
export * from "./candidate"
export * from "./comment"
export * from "./form-fields"
export * from "./resolve"
```

**Note:** Do NOT add `./auth` to the barrel. Auth schemas use bare `"zod"` (Better
Auth compatibility) while all other schemas use `"zod/v4"`. Mixing them in a single
barrel could cause type incompatibilities. Auth schemas remain a direct import path.

### 4b. Move inline auth schemas to schema file

**File 1:** `src/lib/schemas/auth.ts` — add 3 schemas:
```ts
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
})
```

**Files 2-4:** Update components to import from `@/lib/schemas/auth`:
- `src/components/auth/signup-form.tsx`: remove inline schema, add import
- `src/components/auth/login-form.tsx`: remove inline schema + unused `z` import, add import
- `src/components/auth/forgot-password-form.tsx`: remove inline schema + unused `z` import, add import

**Verify:** `bun run lint && bun run build`

---

## Deferred (neon-http blocks transactions)

### Stage reorder atomicity
**Files:** `reorder-role-stages.ts`, `reorder-production-stages.ts`
**Action:** Add explanatory comment before `Promise.all`. No code change.

### createSubmission atomicity
**File:** `create-submission.ts`
**Action:** Add explanatory comment before Submission insert. No code change.

Both require switching to the Neon WebSocket driver (`drizzle-orm/neon-serverless`)
to enable `db.transaction()`. That's an architectural change beyond this audit scope.

---

## Skipped

- **Issue 13 (relative imports):** False positive. No relative imports found in components.
- **Issue 11 (zod vs zod/v4):** Auth files use bare `"zod"` for Better Auth/hookform
  resolver compatibility. Changing could break auth. Needs separate investigation.
- **Issue 6 (admin auto-promote):** Dev-only, guarded by `IS_DEV`. Intentional behavior.

---

## Verification

After all phases: `bun run lint && bun run build`

Manual checks to suggest to user:
- Visit a candidate detail page → data should still load (1a)
- Check role kanban stage counts → should match actual submissions (1b)
- Visit a closed production's public URL → should 404 (1c)
- Move a submission between stages → page should refresh (1d)
- Submit a form with a required unchecked toggle → should error (2a)
- Try to delete a stage that has feedback → should see confirmation dialog, feedback count (2b)
- Confirm deletion → feedback rows deleted, stage removed (2b)
- Trigger a password reset email → should actually send/appear in dev store (3a)
- Click "Resend verification email" on settings page → should show error on failure (3a)
