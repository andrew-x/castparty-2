# Miscellaneous Changes Plan

## Context

Seven independent improvements requested across the app: URL brevity, invite flow, submission page polish, Select UX, admin safety, and query simplification.

---

## 1. Rename `/submit/...` routes to `/s/...`

**Why:** Shorter, cleaner URLs for public-facing submission links.

**Files to modify:**
- **Move** `src/app/submit/` → `src/app/s/` (entire directory tree: layout, `[orgSlug]/page`, `[orgSlug]/[productionSlug]/page`, `[orgSlug]/[productionSlug]/[roleSlug]/page`)
- `src/components/organizations/org-settings-form.tsx` — update `/submit/` references
- `src/components/productions/roles-accordion.tsx` — update URL construction
- `src/components/onboarding/create-org-form.tsx` — update URL preview
- `src/app/(app)/settings/page.tsx` — update audition URL display
- `src/app/(app)/productions/[id]/page.tsx` — update production URL display
- `src/app/submit/[orgSlug]/[productionSlug]/page.tsx` — internal links to role pages use `/submit/` prefix

**Approach:** Rename directory, then find-and-replace all `/submit/` path references to `/s/`.

---

## 2. Allow inviting users without existing accounts

**Why:** Casting directors need to invite team members who haven't signed up yet. Requiring pre-registration creates unnecessary friction.

**Current state:** `invite-member.ts` checks for existing user by email and throws if not found. It uses direct DB inserts instead of better-auth's organization plugin API.

**Approach:** Use better-auth's built-in `auth.api.createInvitation()` which accepts an email and does NOT require the user to exist. This replaces the custom DB manipulation.

**Files to modify:**
- `src/actions/organizations/invite-member.ts` — rewrite to use `auth.api.createInvitation()`

**New flow:**
1. Check caller is owner/admin (keep existing check)
2. Call `auth.api.createInvitation({ body: { email, role, organizationId }, headers })` — this handles both existing and non-existing users
3. Remove the manual user-existence check, invitation insert, and member insert
4. Better-auth handles the invitation record and member creation on acceptance

**Subagent:** dev-docs agent to verify `auth.api.createInvitation` signature from better-auth organization plugin docs.

---

## 3. Submission form layout + minimal branding

**Why:** The form should feel like a standalone page, not a sidebar. Branding should be subtle — candidates are focused on their submission, not Castparty marketing.

**Files to modify:**
- `src/app/s/layout.tsx` (after rename) — move branding from header to footer, make it minimal
- `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` — remove `max-w-lg` constraint, let the form take the full container width

**Layout changes:**
- Remove the Castparty header (logo + heading)
- Add a footer at the bottom: `Powered by Castparty` with a link to the landing page
- The form container already uses `max-w-3xl` in the layout — keep that as the width constraint
- Remove `max-w-lg` from the role page wrapper so the form fills the layout width

---

## 4. "Browse other roles" in submission success state

**Why:** After submitting for one role, a candidate may want to audition for other roles in the same production.

**Files to modify:**
- `src/components/submissions/submission-form.tsx` — add props for slugs, add link in success state

**Approach:**
- Pass `orgSlug` and `productionSlug` to `SubmissionForm` as additional props
- In the success `Alert`, add a link: `Browse other roles` pointing to `/s/{orgSlug}/{productionSlug}`
- Use the `Button` component with `href` and `variant="outline"` for the link

---

## 5. Select component: add `cursor-pointer`

**Why:** Clickable elements should show a pointer cursor.

**File:** `src/components/common/select.tsx`

**Changes:**
- `SelectTrigger` (line 40): add `cursor-pointer` to the className
- `SelectItem` (line 112): change `cursor-default` to `cursor-pointer`

---

## 6. Create `adminActionClient` with IS_DEV guard

**Why:** Admin actions currently check `IS_DEV` individually inside each action handler. An `adminActionClient` centralizes this check for extra safety — if someone forgets the guard, the client itself prevents execution.

**Files to modify:**
- `src/lib/action.ts` — add `adminActionClient` that extends `publicActionClient` with an `IS_DEV` middleware check
- `src/actions/admin/create-user.ts` — switch from `publicActionClient` + manual `IS_DEV` check to `adminActionClient`
- `src/actions/admin/delete-user.ts` — same
- `src/actions/admin/change-password.ts` — same

**Implementation:**
```ts
export const adminActionClient = publicActionClient.use(async ({ next }) => {
  if (!IS_DEV) throw new Error("Not available in production")
  return next()
})
```

---

## 7. Simplify `getCandidates` query

**Why:** The submission count isn't needed from this query — we just need candidates matching the org. Simpler query, better performance.

**Current state:** Left-joins Submission table and uses `count()` + `groupBy()`.

**Files to modify:**
- `src/actions/candidates/get-candidates.ts` — remove join, count, and groupBy; use relational API or simple select
- `src/components/candidates/candidates-table.tsx` — remove "Submissions" column and `submissionCount` from interface

**New query (relational API per project conventions):**
```ts
return db.query.Candidate.findMany({
  where: (c, { eq }) => eq(c.organizationId, orgId),
  orderBy: (c, { asc }) => [asc(c.lastName), asc(c.firstName)],
})
```

---

## Execution Plan

All 7 tasks are independent. Execute using parallel subagents grouped by scope:

| Group | Tasks | Subagent |
|-------|-------|----------|
| A | 1 (route rename) + 3 (layout) + 4 (success state) | Submission pages agent |
| B | 2 (invite flow) + 6 (adminActionClient) | Auth & actions agent |
| C | 5 (Select cursor) + 7 (getCandidates) | Quick fixes agent |

---

## Verification

After implementation, run:
1. `bun run build` — confirm no broken imports or missing routes
2. `bun run lint` — confirm Biome is happy
3. Manual checks (tell user):
   - Visit `/s/{orgSlug}` and verify pages load correctly
   - Submit an audition and confirm success message shows "Browse other roles" link
   - Check Select dropdowns show pointer cursor
   - Check candidates page loads without submission count column
   - Test invite flow with a non-existent email (should not error)
