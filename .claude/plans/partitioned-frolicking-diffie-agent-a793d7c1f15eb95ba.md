## Database Layer Audit

### Critical

- **[src/actions/organizations/transfer-ownership.ts:59-76]**: Multi-mutation action performs two sequential `db.update()` calls (demote caller, promote target) without a `db.transaction()`. The manual try/catch rollback on lines 64-76 is fragile -- if the rollback itself fails (line 73), the org ends up with no owner. Use `db.transaction()` instead, which provides atomicity guaranteed by Postgres. -- Wrap both updates in `db.transaction(async (tx) => { ... })`.

- **[src/actions/organizations/update-organization.ts:53-75]**: Multi-mutation action uses `Promise.all()` to run `db.update(organization)` and `db.insert(OrganizationProfile)` concurrently without a transaction. If one succeeds and the other fails, the data is left in an inconsistent state (e.g., name updated but profile not, or vice versa). -- Wrap both operations in `db.transaction(async (tx) => { ... })`.

### Important

- **[src/app/admin/layout.tsx:27-31]**: Database write operation (`db.update(user).set({ role: "admin" })`) lives directly in a layout file, violating the rule that all DB operations must live in `src/actions/`. The layout imports `db` and `user` from the schema directly. -- Extract this into a server function in `src/actions/admin/` (e.g., `promoteToAdmin(userId)`), even though it is dev-only.

- **[src/actions/admin/get-orphaned-orgs.ts:7-42]**: The `getOrganizations()` read function has no authentication or authorization check. It exposes all organizations with member/production counts. While the admin layout gates access via `IS_DEV`, the server function itself can be imported and called from anywhere. -- Add `if (!IS_DEV) throw new Error("Not available in production")` guard (matching the pattern in `get-users.ts`), or use `checkAuth()`.

- **[src/actions/organizations/get-member-role.ts:7-17]**: The `getMemberRole()` function has no `checkAuth()` call. It accepts arbitrary `organizationId` and `userId` parameters and queries the database without verifying the caller's identity. While it is currently only called from a server component that has already authenticated the user, the function itself is unprotected if imported elsewhere. -- Add `checkAuth()` at the top of the function for defense in depth.

- **[src/actions/organizations/get-user-memberships.ts:7-14]**: The `hasAnyOrganization()` function has no `checkAuth()` call. It accepts an arbitrary `userId` and queries member data without verifying the caller. Same risk as `get-member-role.ts`. -- Add `checkAuth()` and verify the caller matches the `userId` parameter.

### Minor

- **[src/actions/organizations/remove-member.ts:21-31,40-49]** and **[src/actions/organizations/update-member-role.ts:25-35,44-53]** and **[src/actions/organizations/invite-member.ts:24-33]** and **[src/actions/organizations/cancel-invitation.ts:25-34]** and **[src/actions/organizations/get-org-invitations.ts:22-31]** and **[src/actions/organizations/update-organization.ts:26-35]** and **[src/actions/organizations/update-organization-profile.ts:31-40]**: These files use `db.select({ role: member.role }).from(member).where(...).limit(1)` for simple single-row lookups where the relational query API (`db.query.member.findFirst(...)`) would be more idiomatic per the database conventions. The current approach works correctly but is inconsistent with the rest of the codebase's read patterns. -- Replace with `db.query.member.findFirst({ where: ..., columns: { role: true } })`.

### No Issues

The following areas were checked and found clean:

- **No DB operations in pages or components** (except the admin layout noted above)
- **No raw SQL strings** -- the `sql` template usages in `get-productions-with-submission-counts.ts` are Drizzle template expressions for aggregation/ordering, which is the appropriate fallback per conventions
- **PascalCase table references** are used correctly for data tables; Better Auth tables use lowercase names as expected per the rule
- **Multi-mutation actions are properly wrapped in `db.transaction()`** for: `create-production`, `create-submission`, `update-submission`, `copy-submission-to-role`, `update-submission-status`, `bulk-update-submission-status`, `remove-production-stage`, `reorder-production-stages`
- **All write actions use `secureActionClient` (or `adminActionClient`/`publicActionClient` where appropriate) with `metadata` and `inputSchema`**
- **All authenticated read functions use `checkAuth()`** (except the two noted above)
- **No N+1 query patterns detected** -- relational queries with `with` clauses are used effectively
- **Proper error handling** on DB operations throughout
- **`db.select()` fallback** is used appropriately for aggregations (`count()`, subqueries) that the relational API cannot express
