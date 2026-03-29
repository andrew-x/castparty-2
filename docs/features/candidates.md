# Candidates

> **Last verified:** 2026-03-29

## Overview

Candidates represent the individual people who submit auditions across an organization's productions. The `candidate` table is deduplicated by `(organizationId, email)` -- when a performer submits for multiple roles across different productions, they appear as a single candidate with multiple submissions. This gives casting directors a cross-production view of every person who has auditioned.

**Who it serves:** Casting directors who want to see all audition activity for a performer across their entire organization, not just one production.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/candidates` | `CandidatesGrid` | authed, active org | Paginated grid of candidate cards with search and production/role filters |
| `/candidates/[candidateId]` | `CandidateDetail` | authed, active org | Individual candidate profile with submissions, feedback, and activity |

## Data Model

### `candidate`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `organizationId` | text FK | Scopes candidate to one org |
| `firstName` | text | Required |
| `lastName` | text | Required |
| `email` | text | Required |
| `phone` | text | Defaults to `""` |
| `location` | text | Defaults to `""` |
| `createdAt` / `updatedAt` | timestamp | |

**Unique constraint:** `candidate_org_email_uidx` on `(organizationId, email)`.

### Relationships
- `candidate` -> many `submission` (one per role auditioned for)
- `candidate` -> many `file` (headshots, resumes)
- Submissions store their own contact field copies (historical snapshot); candidate record reflects latest info.

## Key Files

| File | Purpose |
|------|---------|
| `src/actions/candidates/get-candidates.ts` | Paginated list with search + production/role filters |
| `src/actions/candidates/get-candidate.ts` | Single candidate with all submissions, feedback, comments, pipeline updates, emails |
| `src/actions/candidates/get-candidate-filter-options.ts` | Productions + roles for the filter combobox |
| `src/actions/candidates/update-candidate.ts` | Update contact info with email uniqueness check |
| `src/components/candidates/candidates-grid.tsx` | Server component: search, filters, card grid, pagination |
| `src/components/candidates/candidate-card.tsx` | Card with headshot thumbnail, name, email, submission badges |
| `src/components/candidates/candidate-detail.tsx` | Full detail view with submission navigator + tabbed content |
| `src/components/candidates/candidate-search.tsx` | Debounced search input (300ms), updates URL params |
| `src/components/candidates/candidate-filters.tsx` | Multi-select combobox filtering by production/role |
| `src/components/candidates/edit-candidate-dialog.tsx` | Dialog to edit contact info |
| `src/app/(app)/candidates/page.tsx` | List page |
| `src/app/(app)/candidates/[candidateId]/page.tsx` | Detail page |

## How It Works

### Candidate List

```
/candidates?page=1&search=jane&productions=prod-1&roles=role-2
  → getCandidates({ page, search, productionIds, roleIds })
    ├── WHERE organizationId = activeOrg
    ├── ILIKE on firstName/lastName/email (if search)
    ├── IN subquery on submissions (if filters)
    ├── ORDER BY lastName ASC, firstName ASC
    ├── LIMIT 24, OFFSET pagination
    └── WITH: submissions → role, production, stage, files
  → CandidatesGrid: search + filters + card grid + pagination
```

### Candidate Detail

```
/candidates/[candidateId]
  → getCandidate(candidateId)
    ├── Verify candidate in active org
    └── WITH: submissions → role, production (with stages),
              files, feedback, comments, pipelineUpdates, emails
  → CandidateDetail:
    ├── PageHeader: name, contact info, Edit button
    ├── Left sidebar: submission navigator (production/role/stage per submission)
    └── Right panel (Tabs):
          "Submission" tab: headshots, resume, links, form answers
          "Feedback" tab: FeedbackPanel (reused)
```

### Candidate Update

```
EditCandidateDialog → updateCandidate action
  ├── Verify candidate in org
  ├── Email uniqueness check (no other candidate with same email in org)
  └── UPDATE candidate SET firstName, lastName, email, phone, location
```

## Business Logic

### Deduplication
Candidates deduplicated by `(organizationId, email)`. Submission system upserts on submit. One candidate appears once in the list regardless of how many roles they've auditioned for.

### Search
Case-insensitive `ILIKE` across `firstName`, `lastName`, `email`. Substring matching with `%term%` wildcards.

### Filtering
Production/role filters use an `IN` subquery. Combined with `OR` -- matches candidates with a submission in any selected production or role.

### Pagination
24 per page. Sorted by last name, then first name. URL-driven `?page=N`.

### Email Uniqueness on Update
When editing email, checks no other candidate in the org has the same email. Preserves dedup invariant.

## UI States

- **Empty (no candidates):** "Candidates will appear here as they submit for your productions."
- **Empty (filtered):** "No candidates match your filters."
- **Card:** Headshot thumbnail (or initials), name, email, up to 2 submission badges, "+N more" overflow.
- **Detail (no submissions):** Contact info with "No submissions yet."
- **Detail (with submissions):** Left sidebar nav + right tabbed content. First submission selected by default.

## Integration Points

- [Submissions](./submissions.md) -- submission system creates/finds candidate records on submit.
- [Feedback](./feedback.md) -- candidate detail reuses `FeedbackPanel`.
- [Kanban](./kanban.md) -- submission detail sheet links to candidate detail.
- [Submission Editing](./submission-editing.md) -- edit form syncs candidate record in same transaction.
- [Organizations](./organizations.md) -- candidates scoped to active org.

## Architecture Decisions

- **Cross-production entity.** Unlike submissions (per-role), candidates live at org level. Mirrors real casting -- directors remember performers across shows.
- **Denormalized contact on submissions.** Submissions preserve historical data; candidate record reflects latest info.
- **URL-driven filtering/pagination.** All state in search params -- bookmarkable, shareable, SSR-compatible.
- **Prefixed combobox values.** `p:` and `r:` prefixes distinguish production/role filters in a single multi-select.
