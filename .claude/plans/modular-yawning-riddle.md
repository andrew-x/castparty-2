# Codebase Audit Fixes

## Context

A full codebase audit identified issues across mutations, conventions, security, and docs. This plan addresses the 11 remaining items after triage.

---

## 1. Add `revalidatePath` to all mutation actions

**Why:** Users see stale data after every mutation. Only `set-active-organization.ts` revalidates today.

**Pattern to follow** (from `set-active-organization.ts`):
```ts
import { revalidatePath } from "next/cache"
// ... at end of action, before return:
revalidatePath("/", "layout")
```

Using `revalidatePath("/", "layout")` broadly — this is a small app and targeted paths add complexity without meaningful perf gain.

**Files to modify (mutations only — skip all `get-*` reads, `check-*`, and `presign-*`):**

Admin:
- `src/actions/admin/change-password.ts`
- `src/actions/admin/create-user.ts`
- `src/actions/admin/delete-organization.ts`
- `src/actions/admin/delete-user.ts`

Organizations:
- `src/actions/organizations/cancel-invitation.ts`
- `src/actions/organizations/create-organization.ts`
- `src/actions/organizations/invite-member.ts`
- `src/actions/organizations/remove-member.ts`
- `src/actions/organizations/transfer-ownership.ts`
- `src/actions/organizations/update-member-role.ts`
- `src/actions/organizations/update-organization-profile.ts`
- `src/actions/organizations/update-organization.ts`

Candidates:
- `src/actions/candidates/update-candidate.ts`

Productions:
- `src/actions/productions/add-pipeline-stage.ts`
- `src/actions/productions/add-production-form-field.ts`
- `src/actions/productions/add-production-stage.ts`
- `src/actions/productions/add-role-form-field.ts`
- `src/actions/productions/create-production.ts`
- `src/actions/productions/create-role.ts`
- `src/actions/productions/remove-pipeline-stage.ts`
- `src/actions/productions/remove-production-form-field.ts`
- `src/actions/productions/remove-production-stage.ts`
- `src/actions/productions/remove-role-form-field.ts`
- `src/actions/productions/reorder-production-form-fields.ts`
- `src/actions/productions/reorder-production-stages.ts`
- `src/actions/productions/reorder-role-form-fields.ts`
- `src/actions/productions/reorder-role-stages.ts`
- `src/actions/productions/toggle-production-open.ts`
- `src/actions/productions/update-production-form-field.ts`
- `src/actions/productions/update-production.ts`
- `src/actions/productions/update-role-form-field.ts`
- `src/actions/productions/update-role.ts`

Submissions:
- `src/actions/submissions/create-submission.ts`
- `src/actions/submissions/update-submission-status.ts`

**Total: 33 files.** Each gets `import { revalidatePath } from "next/cache"` and `revalidatePath("/", "layout")` before the return statement.

---

## 2. Fix candidate upsert race condition

**File:** `src/actions/submissions/create-submission.ts` (lines 129-159)

**Current pattern (race-prone):**
```ts
const existingCandidate = await db.query.Candidate.findFirst({ where: ... })
if (existingCandidate) { update } else { insert }
```

**New pattern — use Drizzle's `onConflictDoUpdate`:**
```ts
const candidateId = generateId("cand")
const [candidate] = await db
  .insert(Candidate)
  .values({
    id: candidateId,
    organizationId: orgId,
    firstName,
    lastName,
    email,
    phone: phone ?? "",
    location: location ?? "",
  })
  .onConflictDoUpdate({
    target: [Candidate.organizationId, Candidate.email],
    set: {
      firstName,
      lastName,
      phone: phone ?? "",
      location: location ?? "",
      updatedAt: new Date(),
    },
  })
  .returning({ id: Candidate.id })
```

This replaces the entire check-then-insert block (lines ~129-159) with an atomic upsert. The `returning()` gives us the ID whether it was an insert or update.

---

## 3. Refactor 5 dialog forms to `useHookFormAction`

**Reference pattern:** `src/components/productions/create-production-form.tsx` (lines 65-93)

**Utility:** `formResolver` from `@/lib/schemas/resolve`

### 3a. `src/components/organizations/create-org-dialog.tsx`
Replace `zodResolver` + `useAction` with `useHookFormAction(createOrganization, formResolver(schema), { formProps, actionProps })`. Straightforward — single action, no ID injection.

### 3b. `src/components/organizations/invite-member-dialog.tsx`
Same refactor. Injects `organizationId` from props — use `form.handleSubmit((v) => action.execute({ ...v, organizationId }))` pattern.

### 3c. `src/components/organizations/change-role-dialog.tsx`
**Special case:** Two actions (updateMemberRole + transferOwnership). Keep both `useHookFormAction` calls and conditionally execute based on selected role. The form schema is the same for both.

### 3d. `src/components/admin/add-user-dialog.tsx`
Same refactor. Has `onSuccess` callback from props — wire into `actionProps.onSuccess`.

### 3e. `src/components/admin/change-password-dialog.tsx`
Same refactor. Injects `userId` from props. Has form reset on dialog close via `useEffect` — preserve that behavior.

**For all 5:** Replace `import { zodResolver } from "@hookform/resolvers/zod"` with `import { formResolver } from "@/lib/schemas/resolve"`. Replace `import { useAction } from "next-safe-action/hooks"` with `import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"`.

---

## 4. Fix candidates table empty state

**File:** `src/components/candidates/candidates-table.tsx` (~line 151)

**Current:** Empty state only shows when `search` is truthy and no results.
**Fix:** Also show empty state when `candidates.length === 0 && !search`. Use a different message like "No candidates yet." vs the search-specific "No candidates found."

---

## 5. Replace `console.error` with logger

**File:** `src/actions/submissions/create-submission.ts` (line 241)

**Current:** `console.error("PDF parsing failed:", err)`
**Change to:** `logger.error("PDF parsing failed", err)`
**Add import:** `import logger from "@/lib/logger"`

**Note:** The logger is dev-only (no-op in production). This means PDF parse failures won't be logged in prod. This is acceptable since PDF parsing is best-effort and the submission still succeeds.

---

## 6. Fix relative import

**File:** `src/lib/db/schema.ts` (line 14)

**Current:** `from "../types"`
**Change to:** `from "@/lib/types"`

---

## 7. Add security headers

**File:** `next.config.ts`

Add `headers()` config:
```ts
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ]
},
```

---

## 8. Presigned URL file existence check

**File:** `src/lib/r2.ts`

Add a `checkFileExists` function using S3 `HeadObjectCommand`:
```ts
export async function checkFileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}
```

**File:** `src/actions/submissions/create-submission.ts`

Before calling `moveFileByKey` for headshot (~line 178) and resume (~line 206), verify the temp file exists:
```ts
const exists = await checkFileExists(headshot.key)
if (!exists) throw new ActionError("Headshot upload not found. Try uploading again.")
```

Same for resume key.

---

## 9. Documentation updates

### 9a. `docs/FEATURES.md`
- Fix auth route: `src/app/auth/page.tsx` -> `src/app/auth/(guest)/page.tsx`
- Fix forgot-password route similarly
- Add missing features: Email Verification, Password Reset, Accept Invitation, Admin Organizations, Account Settings
- Update auth description: "password-reset stub" -> fully implemented

### 9b. `docs/ARCHITECTURE.md`
- Add `src/lib/auth/auth-util.ts` to the key files list with note that `checkAuth()` lives there

### 9c. `docs/CONVENTIONS.md`
- Update barrel file note to acknowledge `src/lib/schemas/index.ts` exists but isn't used for imports
- Add `auth.ts` and `resolve.ts` to schema file list

---

## Execution Strategy

Use parallel subagents grouped by independence:

**Group A (parallel):** Items 1-2 (revalidatePath + upsert) — both in `src/actions/`
**Group B (parallel):** Items 3-4 (dialog forms + empty state) — both in `src/components/`
**Group C (parallel):** Items 5-8 (logger, import, headers, R2 check) — scattered small changes
**Group D:** Item 9 (docs) — run after code changes so docs reflect final state

---

## Verification

After all changes:
1. `bun run build` — confirm no type errors or build failures
2. `bun run lint` — confirm Biome passes
3. Manual spot-check: tell user to test submission creation, production CRUD, and org management to verify revalidation works
