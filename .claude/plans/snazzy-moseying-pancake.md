# URL Slugs for Organizations, Productions, and Roles

## Context

Public submission URLs currently use opaque IDs (`/submit/org_abc123/prod_xyz789/role_foo`). These are ugly for sharing on flyers, social media, and printed materials. This change adds human-readable slug-based URLs (`/submit/riverside-theatre-abc12345/hamlet-def67890/juliet-ghi34567`) and lets users configure slugs in settings.

**Scope:** Schema changes, slug utility, create/update actions, public submission routes, internal URL generation, and slug editing UI.

---

## Phase 1: Foundation

### 1a. Create shared slug utility

**New file: `src/lib/slug.ts`**

Extract and generalize the existing `generateSlug` from `src/actions/organizations/create-organization.ts`:

```ts
nameToSlug(name: string): string
  // lowercase, replace non-alphanumeric with hyphens, strip leading/trailing hyphens, cap at 40 chars, append 8-char CUID suffix

validateSlug(slug: string): string | null
  // 3-60 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens, not purely numeric, not reserved
  // Reserved: "new", "create", "edit", "delete", "settings", "admin", "api", "submit", "auth", "home"

generateUniqueSlug(baseName, table, slugColumn, scopeFilter?): Promise<string>
  // Generate slug from name. Check DB for collision within scope. If collision, regenerate with new CUID suffix. Return unique slug.
```

### 1b. Add slug fields to schema

**Modify: `src/lib/db/schema.ts`**

- Add `slug: text().notNull()` to `Production` table
- Add composite unique index: `uniqueIndex("production_org_slug_uidx").on(table.organizationId, table.slug)`
- Add `slug: text().notNull()` to `Role` table
- Add composite unique index: `uniqueIndex("role_production_slug_uidx").on(table.productionId, table.slug)`

### 1c. Generate and apply migration

- Run `bun drizzle-kit generate` to create migration SQL
- Hand-edit migration to add slug columns as nullable first, backfill existing records using SQL (`LOWER(REGEXP_REPLACE(...)) || '-' || LEFT(id, 8)`), then alter to NOT NULL
- Run `bun drizzle-kit migrate`

---

## Phase 2: Slug generation on create

### 2a. Update `create-organization.ts`

**Modify: `src/actions/organizations/create-organization.ts`**
- Remove inline `generateSlug` function
- Import `nameToSlug` from `@/lib/slug`
- Use `nameToSlug(name)` to generate org slug (current behavior preserved)

### 2b. Update `create-production.ts`

**Modify: `src/actions/productions/create-production.ts`**
- Import `generateUniqueSlug` from `@/lib/slug`
- Generate production slug scoped to org: `generateUniqueSlug(name, Production, Production.slug, eq(Production.organizationId, orgId))`
- Include `slug` in insert values
- For batch-created roles, generate slugs scoped to the new production (use in-memory dedup since production is new)

### 2c. Update `create-role.ts`

**Modify: `src/actions/productions/create-role.ts`**
- Import `generateUniqueSlug` from `@/lib/slug`
- Generate role slug scoped to production: `generateUniqueSlug(name, Role, Role.slug, eq(Role.productionId, productionId))`
- Include `slug` in insert values

---

## Phase 3: Public submission routes (slug-based)

### 3a. Update public query actions

**Modify: `src/actions/submissions/get-public-org.ts`**
- Change param from `orgId` to `orgSlug`
- Query by `eq(o.slug, orgSlug)` instead of `eq(o.id, orgId)`
- Return `slug` in columns

**Modify: `src/actions/submissions/get-public-productions.ts`**
- Keep accepting `orgId` (resolved from slug in the page)
- Drizzle `with: { roles: true }` will automatically include `slug` on both production and role after schema change

**Modify: `src/actions/submissions/get-public-production.ts`**
- Change to accept `(orgId: string, productionSlug: string)`
- Query by `and(eq(p.organizationId, orgId), eq(p.slug, productionSlug))`

**Modify: `src/actions/submissions/get-public-role.ts`**
- Change to accept `(productionId: string, roleSlug: string)`
- Query by `and(eq(r.productionId, productionId), eq(r.slug, roleSlug))`

**No change: `src/actions/submissions/create-submission.ts`**
- Continues to accept IDs (resolved server-side in page before passing to SubmissionForm)

### 3b. Rename route directories and update pages

Rename route directories:
- `src/app/submit/[orgId]/` → `src/app/submit/[orgSlug]/`
- `src/app/submit/[orgId]/[productionId]/` → `src/app/submit/[orgSlug]/[productionSlug]/`
- `src/app/submit/[orgId]/[productionId]/[roleId]/` → `src/app/submit/[orgSlug]/[productionSlug]/[roleSlug]/`

**Update `src/app/submit/[orgSlug]/page.tsx`:**
- Extract `orgSlug` from params
- `getPublicOrg(orgSlug)` → get org (with id)
- `getPublicProductions(org.id)` → get productions
- Build links using `production.slug` and `role.slug`

**Update `src/app/submit/[orgSlug]/[productionSlug]/page.tsx`:**
- Extract `orgSlug`, `productionSlug`
- Resolve org by slug, then production by `(org.id, productionSlug)`
- Build role links using `role.slug`

**Update `src/app/submit/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`:**
- Extract all three slugs
- Resolve chain: org → production → role
- Pass resolved IDs to `SubmissionForm` (no change to form)

---

## Phase 4: Internal URL generation

### 4a. Home page

**Modify: `src/app/(app)/home/page.tsx`**
- Fetch org slug for the active org (add a lightweight query or use `getOrganization`)
- Change display from `/submit/{orgId}` to `/submit/{org.slug}`
- Update `CopyButton` and `Button href` accordingly

### 4b. Production detail page

**Modify: `src/app/(app)/productions/[id]/page.tsx`**
- Production now has `.slug` after schema change
- Need org slug: update `getProduction` to include org data via `with: { organization: { columns: { slug: true } } }`
- Change URLs from `/submit/{orgId}/{prodId}` to `/submit/{orgSlug}/{prodSlug}`

### 4c. Roles accordion

**Modify: `src/components/productions/roles-accordion.tsx`**
- Update `Props` interface: change `orgId` → `orgSlug`, `productionId` → `productionSlug`
- Roles now include `.slug` from schema change
- Update all URL templates: `/submit/{orgSlug}/{productionSlug}/{role.slug}`
- Update `RoleWithSubmissions` interface to include `slug`

### 4d. Roles list

**Modify: `src/components/productions/roles-list.tsx`**
- Update `Props` interface: change `orgId` → `orgSlug`, `productionId` → `productionSlug`
- Update `Role` interface to include `slug`
- Update all URL templates

---

## Phase 5: Slug editing UI

### 5a. Organization slug in settings

**Modify: `src/actions/organizations/update-organization.ts`**
- Add optional `slug` field to input schema with validation (3-60 chars, regex, not reserved)
- When slug provided, check uniqueness via DB query excluding current org
- Include slug in `.set()` call

**Modify: `src/components/organizations/org-settings-form.tsx`**
- Add `currentSlug` to Props
- Add slug field to form schema and UI (below name field)
- Show URL preview: `castparty.com/submit/{slug}`
- Track `hasChanges` for both name and slug

**Modify: `src/app/(app)/settings/page.tsx`**
- Pass `currentSlug={orgData.organization.slug}` to `OrgSettingsForm`

### 5b. Production settings page

**New file: `src/app/(app)/productions/[id]/settings/page.tsx`**
- Auth-protected page for production settings
- Fetches production with org slug context
- Renders production slug editor form

**New file: `src/components/productions/production-settings-form.tsx`**
- Client component with slug input field
- Shows URL preview: `/submit/{orgSlug}/{slug}`
- Calls `updateProductionSlug` action on save

**New file: `src/actions/productions/update-production-slug.ts`**
- `secureActionClient` action accepting `productionId` and `slug`
- Validates slug format, checks uniqueness within org
- Verifies user has permission (owns production's org)

### 5c. Role slug editing (within production settings)

**Add to production settings page:**
- List of roles with their current slugs
- Inline editable slug field for each role
- Calls `updateRoleSlug` action on save

**New file: `src/actions/productions/update-role-slug.ts`**
- `secureActionClient` action accepting `roleId` and `slug`
- Validates slug format, checks uniqueness within production
- Verifies user has permission

### 5d. Navigation to production settings

**Modify: `src/app/(app)/productions/[id]/page.tsx`**
- Add a "Settings" link/button to navigate to `/productions/{id}/settings`

---

## Files Summary

### New files (5)
| File | Purpose |
|------|---------|
| `src/lib/slug.ts` | Shared slug generation, validation, uniqueness |
| `src/actions/productions/update-production-slug.ts` | Update production slug action |
| `src/actions/productions/update-role-slug.ts` | Update role slug action |
| `src/app/(app)/productions/[id]/settings/page.tsx` | Production settings page |
| `src/components/productions/production-settings-form.tsx` | Production/role slug editing form |

### Modified files (16)
| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `slug` + composite unique indexes to Production and Role |
| `src/actions/organizations/create-organization.ts` | Use shared `nameToSlug` |
| `src/actions/organizations/update-organization.ts` | Accept optional `slug` param |
| `src/actions/productions/create-production.ts` | Generate production + role slugs |
| `src/actions/productions/create-role.ts` | Generate role slug |
| `src/actions/productions/get-production.ts` | Include org slug via `with` |
| `src/actions/submissions/get-public-org.ts` | Query by slug instead of ID |
| `src/actions/submissions/get-public-productions.ts` | (auto-includes slug after schema change) |
| `src/actions/submissions/get-public-production.ts` | Query by org + production slug |
| `src/actions/submissions/get-public-role.ts` | Query by production + role slug |
| `src/app/submit/[orgSlug]/page.tsx` | Slug-based params (rename from `[orgId]`) |
| `src/app/submit/[orgSlug]/[productionSlug]/page.tsx` | Slug-based params (rename) |
| `src/app/submit/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | Slug-based params (rename) |
| `src/app/(app)/home/page.tsx` | Use org slug in audition link |
| `src/app/(app)/productions/[id]/page.tsx` | Use slugs in links, add settings link |
| `src/app/(app)/settings/page.tsx` | Pass slug to form |
| `src/components/organizations/org-settings-form.tsx` | Add slug editing field |
| `src/components/productions/roles-accordion.tsx` | Slug-based links, update props |
| `src/components/productions/roles-list.tsx` | Slug-based links, update props |

### Migration file (auto-generated + hand-edited)
| File | Purpose |
|------|---------|
| `src/lib/db/drizzle/XXXX_*.sql` | Add slug columns, backfill, unique indexes |

---

## Verification

1. **`bun run build`** — catch all type errors from the schema/prop changes
2. **`bun run lint`** — ensure Biome formatting is correct
3. **Manual testing flow:**
   - Create an org → verify slug is generated
   - Create a production with roles → verify slugs are generated
   - Visit `/submit/{orgSlug}` → verify public org page loads
   - Navigate through production → role → submission form
   - Submit a form → verify it works end-to-end with slug-based routing
   - Edit org slug in settings → verify the change takes effect
   - Edit production/role slug in production settings → verify URL updates
   - Try a duplicate slug → verify error message appears

---

## Subagents Used During Implementation

| Phase | Agent | Purpose |
|-------|-------|---------|
| 1-4 | **Parallel Task agents** | Schema changes, slug utility, action updates, route updates can be parallelized |
| 5 | **frontend-design** (auto-invoked) | Production settings page and slug editing forms |
| Post-impl | **Code reviewer** | Review all changes against project conventions |
| Post-impl | **Librarian** | Update docs with new slug utility, changed routing, new settings page |
