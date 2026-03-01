# Plan: Build Out Submission Flow

## Context

Castparty needs a **public-facing submission flow** so performers can browse open auditions and submit for roles without needing an account. Currently all routes require authentication. This builds the first public area of the app and connects it to the existing `Candidate` and `Submission` tables (schema already exists, no migration needed).

On the **app side**, production teams need to see the shareable submission URLs so they can distribute them to performers.

---

## New Files (8)

### Server Actions — `src/actions/submissions/`

**`get-public-productions.ts`** — Public read. Fetches all productions (with nested roles) for an org ID. No auth. Uses `db.query.Production.findMany({ where: eq(organizationId, orgId), with: { roles: true } })`.

**`get-public-production.ts`** — Public read. Fetches a single production with roles by ID. Validates `organizationId` matches the URL param.

**`get-public-role.ts`** — Public read. Fetches a single role with its parent production. Used by the role detail/submission page.

**`create-submission.ts`** — Public write via `publicActionClient`. Input schema:
- `orgId`, `productionId`, `roleId` (string, required)
- `firstName`, `lastName` (string, trimmed, required)
- `email` (string, trimmed, required, valid email)
- `phone` (string, trimmed, optional)

Logic:
1. Look up existing candidate in org by email: `and(eq(organizationId, orgId), eq(email, email))`
2. If found → use existing `candidateId`
3. If not found → `db.insert(Candidate)` with `generateId("cand")`
4. `db.insert(Submission)` with `generateId("sub")`, snapshot all contact fields

### Route Group — `src/app/(submission)/`

**`layout.tsx`** — Minimal public layout. No auth. Castparty logo header + clean container. Server component.

**`submit/[orgId]/page.tsx`** — Org-level browse. Lists all productions with their roles nested. Each role has a "Submit" button linking to the role page. Validates org exists via `db.query.organization.findFirst`.

**`submit/[orgId]/[productionId]/page.tsx`** — Production-level browse. Lists all roles for the production. Validates production belongs to org.

**`submit/[orgId]/[productionId]/[roleId]/page.tsx`** — Role detail + submission form. Shows role name, description, production name. Renders `<SubmissionForm>`. Validates full chain (role → production → org).

### Component — `src/components/submissions/`

**`submission-form.tsx`** — `"use client"` form component. Props: `orgId`, `productionId`, `roleId`. Uses react-hook-form + zodResolver + Controller pattern + `useAction(createSubmission)`. Fields: first name, last name, email, phone. On success: shows inline confirmation message ("Your submission has been received."). Follows exact pattern from `roles-list.tsx`.

---

## Modified Files (3)

### `src/app/(app)/home/page.tsx`
- Import `getSession` to get `activeOrganizationId`
- Add a card showing the org's submission browse URL: `/submit/{orgId}`
- Link to view the audition page

### `src/app/(app)/productions/[id]/page.tsx`
- Add a card below the production heading showing the production submission URL: `/submit/{orgId}/{productionId}`
- Pass `orgId={production.organizationId}` to `<RolesList>`

### `src/components/productions/roles-list.tsx`
- Add `orgId` to `Props` interface
- In each role card, show the role submission URL as monospace text: `/submit/{orgId}/{productionId}/{roleId}`

---

## Implementation Order

1. Server actions (reads first, then write)
2. Submission form component
3. `(submission)` layout
4. `(submission)` route pages (org → production → role)
5. App-side modifications (home, production page, roles list)
6. Lint check (`bun run lint`)

### Subagents Used
- **Parallel implementation agents** for steps 1-2 (actions + form component) and steps 3-4 (layout + pages), since they're independent
- **Code reviewer agent** after all files are written

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| URL parameter for org | Raw org ID | Consistent with production/role IDs; user preference |
| Email on form | **Required** | Avoids empty-string sentinel in NOT NULL column; enables reliable candidate lookup |
| Auth for submission pages | None (fully public) | Performers shouldn't need accounts to submit |
| Action client for write | `publicActionClient` | No auth needed; follows existing pattern |
| Candidate lookup scope | Per-organization by email | Matches schema: candidates belong to orgs |
| Success state | Inline confirmation message | No redirect needed on public pages |
| URL display format | Path only (e.g. `/submit/...`) | Full domain URLs require env var config; path is sufficient for MVP |

---

## Verification

1. `bun run lint` — no errors
2. `bun run build` — compiles successfully
3. Manual check: visit `/submit/{orgId}` — should list productions
4. Manual check: visit `/submit/{orgId}/{prodId}` — should list roles
5. Manual check: visit `/submit/{orgId}/{prodId}/{roleId}` — should show form
6. Manual check: submit the form — should create candidate + submission records
7. Manual check: submit again with same email — should reuse existing candidate
8. Manual check: `/home` shows org submission URL
9. Manual check: `/productions/:id` shows production submission URL
10. Manual check: each role in the roles list shows its submission URL
