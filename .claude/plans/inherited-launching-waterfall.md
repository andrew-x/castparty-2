# Candidate Detail Page Enhancements

## Context

The candidate detail page exists but contact info is buried in the page body. We want to:
1. Move contact info (email, phone, location) into the page header under the candidate's name
2. Add an "Edit" button in the header that opens a dialog to edit the candidate's name and contact info

## Changes

### 1. Move contact info into the page header

**File:** `src/components/common/page.tsx`

- Change `description` prop type from `string | null` to `React.ReactNode` so we can pass structured content (icons + text) instead of a plain string
- The existing `<p>` wrapper stays for string values; for ReactNode, render directly in a `<div>` with the same styling

### 2. Convert candidate detail page to client-managed layout

**File:** `src/app/(app)/candidates/[candidateId]/page.tsx`

- The page is currently a server component that passes data to a `CandidateDetail` client component
- Move the entire page body into `CandidateDetail` so it can manage both the edit dialog state AND render the `PageHeader` with the current (possibly just-edited) candidate data
- The server page just fetches data and passes it all to `CandidateDetail`

**File:** `src/components/candidates/candidate-detail.tsx`

- Now renders `Page` > `PageHeader` > `PageContent` itself
- `PageHeader` gets:
  - `title`: candidate full name
  - `breadcrumbs`: `[{ label: "Candidates", href: "/candidates" }, { label: fullName }]`
  - `description`: contact info row with Mail/Phone/MapPin icons (inline, horizontal)
  - `actions`: Edit button that opens `EditCandidateDialog`
- Remove the "Contact" section from the page body (it's now in the header)
- Keep the submissions table in `PageContent`
- Manage `editDialogOpen` state; on successful edit, update local candidate state via `router.refresh()` or optimistic update

### 3. New schema: candidate form/action schemas

**File:** `src/lib/schemas/candidate.ts` (new)

```ts
export const updateCandidateFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
})

export const updateCandidateActionSchema = updateCandidateFormSchema.extend({
  candidateId: z.string().min(1),
})
```

### 4. New action: `updateCandidate`

**File:** `src/actions/candidates/update-candidate.ts` (new)

- Uses `secureActionClient` with `.metadata({ action: "update-candidate" })`
- `.inputSchema(updateCandidateActionSchema)`
- Validates org ownership (candidate belongs to caller's org)
- If email changed, checks uniqueness within org (unique index: `candidate_org_email_uidx`)
- Updates `firstName`, `lastName`, `email`, `phone`, `location`, `updatedAt`
- Returns `{ success: true }`

### 5. New component: `EditCandidateDialog`

**File:** `src/components/candidates/edit-candidate-dialog.tsx` (new)

- `"use client"` dialog component
- Props: `candidate` data, `open`, `onOpenChange`
- Uses `useHookFormAction` with `updateCandidate` action + `formResolver(updateCandidateFormSchema)`
- Pre-fills form with current candidate values via `formProps.defaultValues`
- Fields: First name, Last name, Email, Phone (optional), Location (optional)
- On success: close dialog, `router.refresh()` to reload server data
- On error: `form.setError("root", ...)` for server errors
- Uses `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from common components
- Uses `Field` + `Input` for form fields (follows `invite-member-dialog` pattern)

## Key patterns

- **Form convention**: `useHookFormAction` for action-connected forms (per `.claude/rules/forms.md`)
- **Schema convention**: form schema (user fields only) + action schema (extends with ID) in `src/lib/schemas/candidate.ts`
- **Mutation pattern**: `secureActionClient` with metadata, input schema, org validation (per `update-production.ts`)
- **Dialog pattern**: `open`/`onOpenChange` controlled props, reset on open, `router.refresh()` on success

## Files to create/modify

| File | Action |
|------|--------|
| `src/components/common/page.tsx` | Modify — change `description` to `ReactNode` |
| `src/app/(app)/candidates/[candidateId]/page.tsx` | Modify — simplify to data fetch + `CandidateDetail` |
| `src/components/candidates/candidate-detail.tsx` | Modify — render PageHeader with contact info + edit action |
| `src/lib/schemas/candidate.ts` | Create — form + action Zod schemas |
| `src/actions/candidates/update-candidate.ts` | Create — mutation action |
| `src/components/candidates/edit-candidate-dialog.tsx` | Create — edit dialog component |

## Verification

1. Visit `/candidates/[id]` — contact info (email, phone, location) shows in the header under the name, with icons, inline
2. "Edit" button visible in the header actions area
3. Click Edit — dialog opens pre-filled with current candidate data
4. Submit valid changes — dialog closes, page refreshes with updated data
5. Submit with duplicate email (same org) — shows server error in dialog
6. Submit with empty required fields — shows inline validation errors
7. Cancel/close dialog — no changes made
8. Submissions table and sheet still work as before
9. `bun run build` passes, `bun run lint` has no new errors
