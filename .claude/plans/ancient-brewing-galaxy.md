# Organization Profile & Audition Board Visibility

## Context

The `OrganizationProfile` table already exists in the schema (`src/lib/db/schema.ts:231-243`) with `websiteUrl`, `description`, and `isAuditionBoardOpen` fields, and Drizzle relations are wired up. However, no application code creates, reads, or writes profiles. This plan wires up the full lifecycle: auto-creation, settings UI, and visibility gating on the public org page.

**User decision:** Auto-created profiles default `isAuditionBoardOpen` to `true` so existing public org pages keep working.

## Files to create

| File | Purpose |
|------|---------|
| `src/actions/organizations/get-organization-profile.ts` | Authenticated read with auto-create |
| `src/actions/submissions/get-public-org-profile.ts` | Unauthenticated read for public page gating |
| `src/actions/organizations/update-organization-profile.ts` | Secure write action (next-safe-action) |
| `src/components/organizations/org-profile-form.tsx` | Client form for profile settings |

## Files to modify

| File | Change |
|------|--------|
| `src/actions/organizations/create-organization.ts` | Insert profile row after org creation |
| `src/app/(app)/settings/page.tsx` | Add "Profile" section between General and Members |
| `src/app/s/[orgSlug]/page.tsx` | Gate with `isAuditionBoardOpen` check |

## Implementation steps

### 1. `get-organization-profile.ts` — authenticated read

Plain async function (not next-safe-action). Uses `checkAuth()`. Queries `db.query.OrganizationProfile.findFirst()` by org ID. If no row exists, inserts one with `isAuditionBoardOpen: true` using `onConflictDoNothing` + re-fetch to handle race conditions.

### 2. `get-public-org-profile.ts` — public read

No auth. Queries only `isAuditionBoardOpen` column. Same auto-create-with-`true`-default + `onConflictDoNothing` pattern. Returns `{ isAuditionBoardOpen: boolean }`.

### 3. `update-organization-profile.ts` — secure write

`secureActionClient` action. Input schema:
- `organizationId: z.string().min(1)`
- `websiteUrl: z.string().trim().url().or(z.literal(""))` — allows clearing
- `description: z.string().trim().max(500)`
- `isAuditionBoardOpen: z.boolean()`

Checks admin/owner membership. Uses `db.insert().onConflictDoUpdate()` (upsert) so it works even if no profile row exists yet. Sets `updatedAt` explicitly on conflict update.

### 4. Modify `create-organization.ts`

After `auth.api.createOrganization()` succeeds (line 37), insert a profile row:
```ts
await db.insert(OrganizationProfile).values({ id: org.id, isAuditionBoardOpen: true }).onConflictDoNothing()
```

### 5. `org-profile-form.tsx` — client component

Follows the exact pattern of `org-settings-form.tsx`:
- `react-hook-form` + `zodResolver` + `useAction`
- Three fields:
  - **About** — `Textarea` with placeholder "Tell candidates about your organization"
  - **Website** — `Input` type url with placeholder "https://your-theatre.org"
  - **Audition board** — `Switch` in a horizontal `Field` with `FieldContent` / `FieldTitle` / `FieldDescription`. Description: "When on, your organization page shows all open auditions. When off, candidates can only reach auditions via direct links."
- Dirty checking via `form.watch()` comparison to initial values
- Save button disabled when no changes, `loading={isPending}`

### 6. Modify settings `page.tsx`

Add `getOrganizationProfile(activeOrgId)` to the existing `Promise.all`. Add a "Profile" section between General and Members:

```
General (h2) → OrgSettingsForm
<Separator />
Profile (h2) → OrgProfileForm    ← new
<Separator />
Members (h2) → MembersTable
```

### 7. Modify public org page `page.tsx`

After `getPublicOrg(orgSlug)` resolves (line 34), fetch `getPublicOrgProfile(org.id)`. If `isAuditionBoardOpen` is false, render a closed-state using the existing `Empty` component pattern with a `LockIcon`, org name still visible, and message: "This organization is not currently accepting auditions. Check back later or contact the production team directly."

Production-level (`/s/[orgSlug]/[productionSlug]`) and role-level (`/s/[orgSlug]/[productionSlug]/[roleSlug]`) pages are **not** modified — they remain accessible via direct links regardless of the toggle.

## Key patterns to reuse

- **Form pattern:** `src/components/organizations/org-settings-form.tsx` — Controller, dirty checking, error alert, useAction wiring
- **Secure action pattern:** `src/actions/organizations/update-organization.ts` — membership check, secureActionClient structure
- **Public read pattern:** `src/actions/submissions/get-public-org.ts` — no auth, minimal columns
- **Empty state pattern:** `src/app/s/[orgSlug]/page.tsx:48-58` — Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription
- **Field components:** `FieldContent` + `FieldTitle` + `FieldDescription` with `orientation="horizontal"` for the switch toggle

## Subagent plan

Steps 1-4 are independent and will be executed via **parallel subagents** (dispatching-parallel-agents skill). Steps 5-7 depend on the actions from steps 1-3 and will follow sequentially.

## Verification

1. Visit `/settings` — Profile section should appear with About, Website, and Audition board toggle
2. Toggle audition board off, save, visit `/s/[orgSlug]` — should show closed-state message
3. Toggle audition board on, save, visit `/s/[orgSlug]` — should show productions as before
4. Visit `/s/[orgSlug]/[productionSlug]` with board off — should still work (not gated)
5. `bun run build` — no type errors
6. `bun run lint` — no lint errors
