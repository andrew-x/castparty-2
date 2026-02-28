# Plan: Remove Auto-Org Creation, Add Onboarding Flow

## Context

Currently, signing up auto-creates a "personal organization" via a `user.create.after` database hook. This creates unwanted side effects and couples user creation to org creation. We want to decouple these: signup creates only the user, and org-less users get directed to an onboarding page where they can create their first organization or wait for an invitation.

**User flow after this change:**
```
Signup → /home → (app) layout guard → has org? → Yes → render app
                                                → No  → redirect /onboarding

/onboarding: Create org (name form) or "check your email for an invite"
             → On success → /home → layout guard passes → render app
```

## Changes

### 1. Simplify `src/lib/auth.ts`

- **Delete** the entire `user.create.after` hook (lines 22-34). Signup creates only a user record.
- **Simplify** the `session.create.before` hook: remove personal-org preference logic, just pick the first membership or null. Also simplify the query — select from `member` only (no join needed).
- **Clean up** unused imports (`organization` from schema if no longer needed).

### 2. Create `src/actions/organizations/get-user-memberships.ts` (new file)

Plain server read function (not `next-safe-action`), following the convention for reads:

- `hasAnyOrganization()` — `SELECT orgId FROM member WHERE userId = ? LIMIT 1`, returns boolean. Used by the layout guard.

### 3. Create `src/actions/organizations/create-organization.ts` (new file)

`secureActionClient` write action:

- Input: `{ name: string }` (min 1 char, max 100)
- Generates a URL-safe slug from the name + short user ID suffix
- Calls `auth.api.createOrganization()` (Better Auth server API)
- Calls `auth.api.setActiveOrganization()` to update the session immediately
- Returns `{ organizationId }`

### 4. Update `src/app/(app)/layout.tsx`

After the existing `getCurrentUser()` check, add:
```
const hasOrg = await hasAnyOrganization()
if (!hasOrg) redirect("/onboarding")
```

This also handles org-deletion re-onboarding automatically — if the user's last org is deleted (cascade removes their membership), the next page load redirects them to onboarding.

### 5. Create onboarding route group (3 new files)

**`src/app/(onboarding)/layout.tsx`** — Server component layout:
- Auth guard: redirect to `/auth` if not logged in
- Reverse guard: redirect to `/home` if user already has an org
- Visual: reuses same centered-card-with-icon pattern as auth layout

**`src/app/(onboarding)/onboarding/page.tsx`** — Server component page:
- Heading: "Set up your organization"
- Body: "Create an organization to start managing your productions. If you were invited to join an existing one, check your email for the invite link."
- Renders `<CreateOrgForm />`

**`src/components/onboarding/create-org-form.tsx`** — Client component:
- Same pattern as `SignUpForm`: react-hook-form + zodResolver + Field/FieldGroup/Input/Button
- Uses `useAction(createOrganization)` from `next-safe-action/hooks`
- Single field: "Organization name" with placeholder "e.g. Riverside Community Theatre"
- On success: `router.push("/home")`

### 6. Files NOT changed

- `src/components/auth/signup-form.tsx` — Still pushes to `/home`; the layout guard handles the redirect chain
- `src/app/auth/layout.tsx` — No change; still redirects signed-in users to `/home`
- `src/lib/db/schema.ts` — No schema changes; `metadata` field stays (optional, nullable)
- `src/components/app/app-sidebar.tsx` — No change this iteration

## File Summary

| File | Action |
|------|--------|
| `src/lib/auth.ts` | Modify |
| `src/actions/organizations/get-user-memberships.ts` | Create |
| `src/actions/organizations/create-organization.ts` | Create |
| `src/app/(app)/layout.tsx` | Modify |
| `src/app/(onboarding)/layout.tsx` | Create |
| `src/app/(onboarding)/onboarding/page.tsx` | Create |
| `src/components/onboarding/create-org-form.tsx` | Create |

## Subagent Plan

1. **beads:create** — Create a beads issue for this work before starting
2. **dev-docs skill** — Look up Better Auth organization plugin API (`setActiveOrganization`, `createOrganization`) to confirm exact signatures
3. **Implementation** — Execute changes in order: auth.ts → server actions → layout guard → onboarding UI
4. **Code reviewer agent** — Run after implementation to check against project conventions
5. **Librarian agent** — Update docs after implementation

## Verification

1. `bun run build` — Confirm no TypeScript or build errors
2. `bun run lint` — Confirm Biome passes
3. Manual testing:
   - Sign up a new user → should land on `/onboarding` (not `/home`)
   - Create an org on the onboarding page → should redirect to `/home` with sidebar
   - Visit `/onboarding` while having an org → should redirect to `/home`
   - Visit any `(app)` route without an org → should redirect to `/onboarding`
