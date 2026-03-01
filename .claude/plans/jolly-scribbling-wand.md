# Plan: Browse Submissions and Candidates

## Context

Production teams need to see who has submitted for their roles, view submission details, and browse all candidates in their organization. Currently the production detail page only lists roles with no submission data, the homepage is a bare greeting, and the sidebar "Performers" link goes nowhere.

This plan adds: (1) an accordion on the production detail page showing submissions per role with a detail sheet, (2) submission count badges on production cards and the homepage, and (3) a new Candidates page with a table of all candidates in the organization.

**Terminology update:** We are renaming "Performers" to "Candidates" in the UI. The schema table is already named `Candidate`. The sidebar nav item will change from "Performers" at `/performers` to "Candidates" at `/candidates`. The voice-and-tone doc (`voice-and-tone.md`) will be updated to reflect this.

---

## New Server Actions (3 files)

### `src/actions/productions/get-roles-with-submissions.ts`
Plain server function. Returns roles for a production with nested submissions and candidate data via Drizzle relational query (`with: { submissions: { with: { candidate: true } } }`).

### `src/actions/productions/get-productions-with-submission-counts.ts`
Plain server function. Returns productions for the active org with aggregated submission counts via `leftJoin` + `groupBy` + `count(Submission.id)`.

### `src/actions/candidates/get-candidates.ts`
New directory `src/actions/candidates/`. Plain server function. Returns all candidates for the org with submission counts via `leftJoin` + `groupBy`.

---

## Production Detail Page — Roles Accordion with Submissions

### New: `src/components/productions/roles-accordion.tsx` (client component)
Replaces `RolesList` on the production detail page. Contains:

- **Accordion** (`type="multiple"`) — each role is an `AccordionItem`
  - **Trigger**: role name + `Badge` showing submission count
  - **Content**: role description (if any) + list of submission rows
  - Each submission row is a clickable `<button>` showing name, email, date
  - Empty state: "No submissions yet." when a role has zero submissions
- **Sheet** (controlled via state) — opens when a submission row is clicked
  - Header: candidate name + email
  - Body: phone, resume link, submission date, candidate details
- **Add-role form** — preserved from current `RolesList` (same form logic, same `createRole` action)

### Modified: `src/app/(app)/productions/[id]/page.tsx`
- Import `getRolesWithSubmissions` instead of `getRoles`
- Import `RolesAccordion` instead of `RolesList`
- Pass `initialRoles` (with nested submissions) to `RolesAccordion`

---

## Submission Count Badges

### Modified: `src/components/productions/production-card.tsx`
- Add `submissionCount: number` to the `Props` interface
- Render a `Badge` showing the count (e.g. "3 submissions")

### Modified: `src/app/(app)/productions/page.tsx`
- Switch from `getProductions()` to `getProductionsWithSubmissionCounts()`
- Return shape matches updated `ProductionCard` props

### Modified: `src/app/(app)/home/page.tsx`
- Call `getProductionsWithSubmissionCounts()` and render a grid of `ProductionCard` components below the welcome heading
- Only show the grid when productions exist

---

## Candidates Page

### New: `src/app/(app)/candidates/page.tsx` (server component)
- Calls `getCandidates()`, renders `CandidatesTable` or empty state
- Empty state: "No candidates yet. Candidates will appear here as they submit for your productions."

### New: `src/components/candidates/candidates-table.tsx` (server component)
- Uses `Table` from common components
- Columns: Name (Last, First), Email, Phone, Submissions (Badge), Added (dayjs formatted)

### Modified: `src/components/app/app-sidebar.tsx`
- Change nav item from `{ label: "Performers", href: "/performers", icon: UsersIcon }` to `{ label: "Candidates", href: "/candidates", icon: UsersIcon }`

### Modified: `.claude/rules/voice-and-tone.md`
- Update the "Consistent Role Nouns" table: change "performer" to "candidate" for talent-side users

---

## File Summary

| Action | File | What |
|--------|------|------|
| Create | `src/actions/productions/get-roles-with-submissions.ts` | Roles + submissions + candidates query |
| Create | `src/actions/productions/get-productions-with-submission-counts.ts` | Productions with submission counts |
| Create | `src/actions/candidates/get-candidates.ts` | All candidates for org with counts |
| Create | `src/components/productions/roles-accordion.tsx` | Accordion + Sheet client component |
| Create | `src/components/candidates/candidates-table.tsx` | Candidates table |
| Create | `src/app/(app)/candidates/page.tsx` | Candidates page |
| Modify | `src/app/(app)/productions/[id]/page.tsx` | Use new action + component |
| Modify | `src/components/productions/production-card.tsx` | Add submission count badge |
| Modify | `src/app/(app)/productions/page.tsx` | Use new action with counts |
| Modify | `src/app/(app)/home/page.tsx` | Add productions grid with counts |
| Modify | `src/components/app/app-sidebar.tsx` | Rename Performers → Candidates, /performers → /candidates |
| Modify | `.claude/rules/voice-and-tone.md` | Update role noun: performer → candidate |

**Not modified:** `roles-list.tsx` (superseded, kept), `get-roles.ts` (still valid), `get-productions.ts` (still valid).

---

## Implementation Order

1. Server actions (all 3 — independent, can be parallel)
2. `candidates-table.tsx` + `candidates/page.tsx` + sidebar update (independent from production changes)
3. `roles-accordion.tsx` (new component, no page changes yet)
4. Production detail page update (swap component + action)
5. `production-card.tsx` + `productions/page.tsx` + `home/page.tsx` (coupled — do together)
6. Voice-and-tone rule update

**Subagents:** Steps 1-2 can run in parallel. Steps 3-5 are sequential.

---

## Verification

1. `bun run build` — confirm no type errors or build failures
2. Visit `/productions/[id]` — roles render as accordion items with submission counts; clicking a submission opens the Sheet
3. Visit `/productions` — each card shows submission count badge
4. Visit `/home` — productions grid with submission counts appears below welcome
5. Visit `/candidates` — table of all candidates with submission counts
6. Sidebar "Candidates" link navigates correctly
