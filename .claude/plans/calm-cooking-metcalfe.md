# Update Onboarding: Simplify Routes + Add Invite Step

## Context

The onboarding flow currently uses a `(onboarding)` route group wrapping a single
`onboarding/` route — unnecessary indirection. The flow is also single-step (create org
only). We want to flatten the route structure and add an invite-your-team step so new
users can onboard collaborators before entering the app.

## Changes

### 1. Flatten route structure

**Delete** the `(onboarding)` route group:
- `src/app/(onboarding)/layout.tsx`
- `src/app/(onboarding)/onboarding/page.tsx`

**Create** direct routes:
- `src/app/onboarding/layout.tsx` — same layout/guard logic (auth check, hasOrg redirect)
- `src/app/onboarding/page.tsx` — simplified, renders `OnboardingFlow`

URL stays `/onboarding`. The `(app)` layout redirect still works unchanged.

### 2. Add client-side step management

**Create** `src/components/onboarding/onboarding-flow.tsx` (client component):
- Manages `step` state: `"create-org"` | `"invite-team"`
- Tracks `orgId` returned from step 1
- Renders step-appropriate header text + form component
- Each step has its own heading/description

### 3. Modify CreateOrgForm to support callback

**Edit** `src/components/onboarding/create-org-form.tsx`:
- Add optional `onComplete?: (organizationId: string) => void` prop
- When provided, call `onComplete(data.organizationId)` on success instead of routing
- When absent, keep current behavior (`router.push("/home")`)
- Critical: do NOT call `router.refresh()` when using `onComplete` — that would trigger
  the server layout guard (user now has an org → redirect to `/home` before step 2)

### 4. Create invite team form

**Create** `src/components/onboarding/invite-team-form.tsx` (client component):
- Uses existing `inviteMember` action — no new server action needed
- Email input + "Send invite" button (outline variant)
- Hardcodes `role: "member"` (simplifies onboarding; roles adjustable later in settings)
- Tracks sent emails in state, shows list with check icons
- "Skip for now" / "Continue" primary button at bottom (label changes based on whether
  invites were sent)

### Files touched

| File | Action |
|------|--------|
| `src/app/(onboarding)/layout.tsx` | Delete |
| `src/app/(onboarding)/onboarding/page.tsx` | Delete |
| `src/app/onboarding/layout.tsx` | Create (same content as deleted layout) |
| `src/app/onboarding/page.tsx` | Create (renders OnboardingFlow) |
| `src/components/onboarding/onboarding-flow.tsx` | Create (step manager) |
| `src/components/onboarding/invite-team-form.tsx` | Create (invite form) |
| `src/components/onboarding/create-org-form.tsx` | Edit (add onComplete prop) |

### What stays unchanged

- `src/actions/organizations/invite-member.ts` — reused as-is
- `src/actions/organizations/create-organization.ts` — already returns `{ organizationId }`
- `src/app/(app)/layout.tsx` — its `redirect("/onboarding")` still works
- `src/components/organizations/invite-member-dialog.tsx` — settings page invite unaffected

## Verification

- `/onboarding` as new user → step 1 (create org)
- Submit org → step 2 (invite team) appears without page reload
- Send invite → email appears in sent list, form clears
- "Skip for now" or "Continue" → navigates to `/home`
- Refresh during step 2 → redirected to `/home` (acceptable, invite is optional)
- `/onboarding` as existing user → redirected to `/home`
- Settings page invite dialog still works independently
