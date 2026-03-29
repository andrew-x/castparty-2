## Database Layer Audit

### Critical

- **[src/actions/organizations/transfer-ownership.ts:56-76]**: Multi-mutation without transaction. Two `db.update(member)` calls (demote caller, promote target) are executed sequentially outside a transaction. The manual rollback in the `catch` block is not atomic -- if the rollback itself fails (e.g., network error), the org is left with no owner. — Wrap both updates in `db.transaction()`.

- **[src/actions/admin/get-orphaned-orgs.ts:7]**: Admin read function `getOrganizations()` has no auth check, no `IS_DEV` guard, and no `adminActionClient`. It is a `"use server"` function that returns all organizations with member/production counts. While the admin layout gates the page with `IS_DEV`, the server function itself can be called directly. — Add `if (!IS_DEV) throw new Error("Not available in production")` to match the pattern in `get-users.ts`.

- **[src/app/admin/layout.tsx:27-31]**: DB mutation (`db.update(user)`) directly in a layout component, violating the rule that all DB operations live in `src/actions/`. — Extract this auto-promote logic into a server action in `src/actions/admin/`.

### Important

- **[src/actions/organizations/update-organization.ts:53-75]**: Two independent mutations (`db.update(organization)` and `db.insert(OrganizationProfile).onConflictDoUpdate()`) run via `Promise.all()` without a transaction. If one fails after the other succeeds, the org name/slug and profile can be out of sync. — Wrap both mutations in `db.transaction()`.

- **[src/actions/organizations/get-member-role.ts:7-17]**: Read function accepts arbitrary `organizationId` and `userId` with no auth check. Any authenticated caller could query any user's role in any organization. Currently only called from the settings layout which passes the session user's own ID, but the function itself is unprotected. — Add `checkAuth()` and verify the caller is querying their own membership, or restrict the function to accept only the caller's userId.

- **[src/actions/organizations/get-user-memberships.ts:7-14]**: Read function `hasAnyOrganization(userId)` accepts an arbitrary `userId` with no auth check. Could be used to probe whether a given user ID belongs to any organization. Currently called from the app layout with the session user's ID, but the function itself is unprotected. — Add `checkAuth()` and verify `userId` matches the authenticated user.

### Minor

- **[src/actions/productions/get-productions-with-submission-counts.ts:38-39,49]**: Uses `sql` template literals (e.g., `` sql`coalesce(...)` `` and `` sql`CASE WHEN...` ``). While technically using Drizzle's `sql` tagged template (not raw SQL strings), this is a borderline case -- the CASE expression on line 49 could use Drizzle's `case()` helper or `sql` with column references to be more type-safe. — Consider using Drizzle's `sql` with explicit column references or the `case()` API if available; low priority since these are parameterized via Drizzle's `sql` helper.

- **[src/actions/productions/create-production.ts:50-59]**: Uses `db.select()` for a simple slug uniqueness check where `db.query.Production.findFirst()` would be more idiomatic per the convention of preferring the relational query API for reads. — Replace with `db.query.Production.findFirst({ where: ..., columns: { id: true } })`.

- **[src/actions/productions/check-slug.ts:18-26]**: Same pattern -- uses `db.select()` for a simple existence check where `db.query.Production.findFirst()` would be more idiomatic. — Replace with relational query API.

### No Issues

The following areas were audited and found to be clean:

- **No DB operations in page/component files** (except the admin layout noted above)
- **No raw SQL strings** -- all SQL uses Drizzle's `sql` tagged template helper
- **PascalCase table references** -- data tables use PascalCase consistently; Better Auth tables use lowercase in action files which is acceptable (the rule specifies PascalCase aliases for "data table definitions and relations" in the schema, not query-time references)
- **Transaction usage** -- all complex multi-mutation actions (`createProduction`, `createSubmission`, `updateSubmission`, `copySubmissionToRole`, `updateSubmissionStatus`, `bulkUpdateSubmissionStatus`, `removeProductionStage`, `reorderProductionStages`) properly use `db.transaction()`
- **Write actions use `secureActionClient`** (or `publicActionClient`/`adminActionClient` where appropriate) with `metadata` and `inputSchema`
- **Read functions use `checkAuth()`** where authentication is required (all production/role/candidate reads are properly gated)
- **No N+1 query patterns** -- relational queries use `with` for eager loading; the candidates list uses a parallel `Promise.all` for count + data
- **`src/lib/db/db.ts`** and **`src/lib/db/schema.ts`** are well-structured
