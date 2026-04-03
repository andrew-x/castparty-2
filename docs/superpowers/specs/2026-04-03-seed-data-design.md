# Seed Data Generation

## Context

Development and testing require realistic data across the full entity graph (orgs, productions, roles, candidates, submissions, pipeline stages, feedback, etc.). Currently there's no way to populate the system without manually creating everything through the UI. A one-click seed mechanism on the admin page eliminates this friction.

This is dev-only. It will never run in production.

## Design

### Approach

A single server action (`seedDataAction`) in `src/actions/admin/seed-data.ts` using `adminActionClient` (already gated by `IS_DEV`). Uses `@faker-js/faker` for realistic fake data. All inserts happen in a single `db.transaction()`. IDs generated via `generateId()` from `src/lib/util.ts`.

### Data Shape

Generated in dependency order within one transaction:

1. **Dev user** — `dev@test.com` / `password`, email verified, promoted to admin. Created via Better Auth's `signUpEmail` API *before* the transaction (since it's an external API call). The returned user ID is then used for all subsequent inserts inside the transaction.

2. **Organization** — faker `company.name()` as theatre company. Slug derived from name. Profile with website URL and description.

3. **Member** — dev user as `"owner"` of the org.

4. **4 Productions** (mix of statuses):
   - 2 open, 1 closed, 1 archive
   - Names: faker-generated show-like titles (e.g., `lorem.words(2-3)` capitalized)
   - Each with: description, location (`faker.location.city()`)
   - `systemFieldConfig` with varied visibility across productions
   - 1-2 `submissionFormFields`: a TEXT field ("Special skills"), a SELECT field ("Experience level" with options)
   - `feedbackFormFields`: a TEXTAREA ("Notes"), a SELECT ("Vocal range")
   - `emailTemplates` with placeholder subject/body for all 3 template types
   - `rejectReasons`: 2-3 canned reasons per production

5. **Roles** — 2-4 per production (~10 total). Character-like names with short descriptions.

6. **Pipeline stages** — per production, in order:
   - APPLIED (order 0)
   - "Callback" (CUSTOM, order 1)
   - "Final Read" (CUSTOM, order 2)
   - SELECTED (order 3)
   - REJECTED (order 4)

7. **~50 Candidates** — unique per org. `faker.person.firstName/lastName`, email (`faker.internet.email`), phone (`faker.phone.number`), location (`faker.location.city, faker.location.state`).

8. **Submissions** — each candidate gets 1-2 submissions across different productions/roles. Distributed across pipeline stages:
   - ~50% in APPLIED
   - ~25% in Callback
   - ~15% in Final Read
   - ~5% in SELECTED
   - ~5% in REJECTED
   - Denormalized candidate info copied from candidate record
   - `answers` matching the production's `submissionFormFields`
   - `links`: 0-2 URLs per submission
   - `unionStatus`: random subset from `UNION_OPTIONS` on ~30% of submissions
   - `representation`: populated on ~15% of submissions
   - `rejectionReason`: set on REJECTED submissions (picked from production's `rejectReasons`)

9. **Pipeline updates** — for every submission not in APPLIED, create transition records tracing the path from APPLIED through intermediate stages to current stage. `changeByUserId` set to the dev user.

10. **Feedback** — on ~30% of submissions. Rating from `feedbackRatingEnum`, answers matching the production's `feedbackFormFields`, notes via `faker.lorem.sentence()`. Submitted by dev user at the submission's current stage.

11. **Comments** — on ~20% of submissions. Short text via `faker.lorem.sentence()`. Submitted by dev user.

12. **Files** — placeholder data for headshots and resumes:
    - Headshots: `picsum.photos` URLs with candidate-seeded dimensions (won't match real upload keys but will render in `<img>` tags)
    - Resumes: entries with fake URLs/keys (will appear in UI lists but won't be downloadable)
    - File records reference the submission and candidate

### UI

A "Seed data" button in the admin users page header, next to the existing "Add user" button. Implementation:

- `useAction(seedDataAction)` — no form, just click-to-execute
- Shows loading state (`action.isPending`) while seeding
- On success: `router.refresh()` to reload the page
- On error: display the server error message
- Lives in `AdminUsersClient` alongside existing controls

### New Dependency

- `@faker-js/faker` — added as a dev dependency (`bun add -D @faker-js/faker`)

### Rule Update

A new rule `.claude/rules/seed-data.md` instructing that when the database schema or entity fields change, the seed data generator must be updated to match.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/actions/admin/seed-data.ts` | Create — the seed action with all generation logic |
| `src/components/admin/admin-users-client.tsx` | Modify — add "Seed data" button |
| `.claude/rules/seed-data.md` | Create — rule for keeping seed data in sync with schema |
| `package.json` | Modify — add `@faker-js/faker` dev dependency |

### Verification

1. Run `bun run build` — no type errors
2. Run `bun run lint` — no lint violations
3. Manual check: visit `/admin`, click "Seed data", confirm it completes without error
4. Manual check: navigate to the seeded org's productions, verify roles, submissions, and pipeline stages render correctly
5. Manual check: sign in as `dev@test.com` / `password` and verify org access
