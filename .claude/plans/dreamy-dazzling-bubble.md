# Plan: Merge Candidates Feature

## Context

Duplicate candidate records are a common problem in casting workflows — the same person submits for multiple productions with slightly different info, or a production team member creates a record manually. There's currently no way to consolidate these duplicates. This feature adds a "Merge" action to the candidate detail page that moves all submissions and files from one candidate to another, then deletes the source.

**Direction of merge:** The user is viewing candidate A (source). They search for candidate B (destination). A's submissions and files move to B. A is deleted. The user lands on B's page.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/candidates/candidate-detail.tsx` | Add merge button to header actions, add merge dialog state |
| `src/components/candidates/merge-candidate-dialog.tsx` | **New** — dialog with candidate search combobox + warning + confirm |
| `src/actions/candidates/search-candidates.ts` | **New** — lightweight search endpoint returning id/name/email |
| `src/actions/candidates/merge-candidate.ts` | **New** — server action: reassign submissions + files, delete source |
| `src/lib/schemas/candidate.ts` | Add `mergeCandidateActionSchema` |

## Step 1: Search candidates server function

**File:** `src/actions/candidates/search-candidates.ts`

A plain server function (not a safe-action — it's a read):

```ts
export async function searchCandidates(query: string, excludeId: string)
```

- Auth check via `checkAuth()`, scoped to `activeOrganizationId`
- Search `firstName`, `lastName`, `email` with `ilike` `%query%` (same pattern as `getCandidates`)
- Exclude the candidate with `excludeId` (the source)
- Return `{ id, firstName, lastName, email }[]`, limit 10 results
- Order by `lastName, firstName`

## Step 2: Merge candidate server action

**File:** `src/actions/candidates/merge-candidate.ts`

A `secureActionClient` action with schema:

```ts
// In src/lib/schemas/candidate.ts
export const mergeCandidateActionSchema = z.object({
  sourceCandidateId: z.string().min(1),
  destinationCandidateId: z.string().min(1),
})
```

Action logic (single transaction):
1. Verify both candidates exist and belong to the user's active org
2. Verify source ≠ destination
3. In a `db.transaction`:
   - `UPDATE submission SET candidateId = destinationId WHERE candidateId = sourceId`
   - `UPDATE file SET candidateId = destinationId WHERE candidateId = sourceId`
   - `DELETE FROM candidate WHERE id = sourceId`
4. `revalidatePath("/", "layout")`
5. Return `{ destinationCandidateId }` so the client can redirect

## Step 3: Merge candidate dialog component

**File:** `src/components/candidates/merge-candidate-dialog.tsx`

A `Dialog` (not AlertDialog — we need complex content with a combobox).

**Props:**
```ts
interface Props {
  candidate: { id: string; firstName: string; lastName: string; email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**UI structure:**
- `DialogHeader`: Title "Merge candidate", description "Search for the candidate to merge into."
- **Combobox** section: Uses the existing `Combobox`/`ComboboxInput`/`ComboboxContent`/`ComboboxList`/`ComboboxItem` from `@/components/common/combobox`. Single-select mode. Each item renders candidate name + email.
  - Debounced search (300ms) calls `searchCandidates()` on input change
  - Shows `ComboboxEmpty` when no results
- **Warning alert** (shown once a destination is selected): `Alert` with warning about irreversibility. Copy: "This action cannot be undone. [Source name]'s submissions and files will be moved to [Destination name], and [Source name] will be deleted. [Destination name]'s name, email, and contact info will be kept."
- `DialogFooter`: Cancel button (outline) + "Merge" button (destructive variant), disabled until a destination is selected. Loading state via `action.isPending`.

**Behavior:**
- Uses `useAction` from `next-safe-action/hooks` (no form needed — just two IDs)
- On success: close dialog, `router.push(/candidates/{destinationId})` to navigate to the merged candidate
- On error: display server error in an `Alert variant="destructive"`
- Reset selection + error state when dialog opens/closes

**Combobox data flow:**
- Local state: `query` (string), `candidates` (search results array), `selected` (chosen candidate or null), `isSearching` (boolean)
- `useEffect` on `query` with a 300ms `setTimeout` debounce (clear on cleanup) — only fires `searchCandidates(query, candidate.id)` after the user stops typing for 300ms. Matches the debounce pattern in `candidate-search.tsx`.
- Combobox `items` populated from the search results
- On select: set `selected`, show the warning + enable merge button

## Step 4: Wire into candidate detail page

**File:** `src/components/candidates/candidate-detail.tsx`

Changes:
- Add `mergeDialogOpen` state alongside existing `editDialogOpen`
- Import `MergeCandidateDialog` and `GitMergeIcon` from lucide-react
- Update `actions` prop of `PageHeader` to render both Edit and Merge buttons in a fragment:

```tsx
actions={
  <>
    <Button variant="outline" size="sm" leftSection={<GitMergeIcon />} onClick={() => setMergeDialogOpen(true)}>
      Merge
    </Button>
    <Button variant="outline" size="sm" leftSection={<PencilIcon />} onClick={() => setEditDialogOpen(true)}>
      Edit
    </Button>
  </>
}
```

- Render `<MergeCandidateDialog>` alongside `<EditCandidateDialog>` at the bottom

## Verification

1. `bun run build` — ensure no type errors
2. `bun run lint` — ensure no Biome violations
3. Manual testing:
   - Navigate to a candidate detail page
   - Click "Merge" button in the header
   - Search for another candidate by name or email
   - Verify search results show name + email
   - Select a destination candidate
   - Verify warning message appears with correct names
   - Click "Merge" and verify redirect to destination candidate
   - Verify destination now has all submissions from both candidates
   - Verify source candidate no longer exists in candidates list

## Agents

| Step | Agent | Why |
|------|-------|-----|
| 1-4 | Main agent | Straightforward implementation, 5 files total |
| Post-impl | Code Reviewer agent | Validate conventions, check for edge cases |
| Post-impl | Librarian agent | Update feature docs |
