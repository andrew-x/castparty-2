# Plan: Onboarding Pending Invitations

## Context

New users who sign up and have pending invitations are forced to create an organization before they can do anything. They should be able to **accept invitations first** and skip org creation entirely, or create their org AND accept invitations.

The existing `getUserInvitations()` server function (just implemented) already fetches pending invitations via `auth.api.listUserInvitations`. The client-side better-auth calls (`authClient.organization.acceptInvitation`, `authClient.organization.rejectInvitation`) are also already wired up in the pending-invites dialog.

---

## Current Onboarding Flow

```
create-org → invite-team → /home
```

- `src/app/onboarding/page.tsx` — static page, renders `<OnboardingFlow />`
- `src/components/onboarding/onboarding-flow.tsx` — client state machine with steps: `"create-org" | "invite-team"`
- `src/components/onboarding/create-org-form.tsx` — org name + slug form
- `src/components/onboarding/invite-team-form.tsx` — email invite form, then "Skip for now" / "Continue"
- `src/app/onboarding/layout.tsx` — guards: redirect to `/auth` if not logged in, redirect to `/home` if already has an org

## New Flow

```
(has invitations?) → pending-invites → [accept all → /home]
                                     → [create org] → create-org → invite-team → (remaining invites?) → accept-remaining → /home
                                                                                                       → /home

(no invitations)  → create-org → invite-team → /home
```

Three new scenarios covered:
1. **User accepts all invites** — never needs to create an org, goes straight to `/home`
2. **User creates org first** — after invite-team step, any remaining pending invites are shown before going home
3. **No invitations** — same as current flow (unchanged)

---

## Files to Create (1)

### `src/components/onboarding/onboarding-invitation-list.tsx`

Client component that renders a list of invitation rows with Accept/Ignore buttons. Reused by both the "pending-invites" step and the "accept-remaining" step (after invite-team).

**Props:**
- `invitations: UserInvitation[]` — the current list (managed by parent)
- `onAccept(id: string): void` — callback after accepting
- `onIgnore(id: string): void` — callback after ignoring

**Per row:** org name, role badge, Accept button, Ignore button. Loading state per row. Error alert if accept/ignore fails.

Uses `authClient.organization.acceptInvitation` and `authClient.organization.rejectInvitation` directly (client-side, same pattern as `pending-invites-dialog.tsx`).

---

## Files to Modify (3)

### 1. `src/app/onboarding/page.tsx`

Make async. Fetch invitations server-side:

```tsx
const invitations = await getUserInvitations().catch(() => [])
return <OnboardingFlow pendingInvitations={invitations} />
```

Reuses existing `getUserInvitations()` from `src/actions/organizations/get-user-invitations.ts`.

### 2. `src/components/onboarding/onboarding-flow.tsx`

Major changes to the state machine:

- **New step type:** `"pending-invites" | "create-org" | "invite-team" | "accept-remaining"`
- **New prop:** `pendingInvitations: UserInvitation[]`
- **Client-side invitation state:** track which invitations have been resolved (accepted/ignored) so the list shrinks as the user acts
- **Initial step:** `pendingInvitations.length > 0 ? "pending-invites" : "create-org"`

**"pending-invites" step:**
- Headline: "You've been invited"
- Description: "You have invitations to join existing organizations."
- Renders `<OnboardingInvitationList>` with the unresolved invitations
- Below the list: "Continue" button (enabled as soon as at least 1 invitation is accepted) → `router.refresh()` + `router.push("/home")`. The user does not need to act on every invitation — they can accept one, ignore some, and leave others untouched.
- Below: "Or create your own organization" ghost button → transitions to `"create-org"` step

**"create-org" step:** unchanged — calls `handleOrgCreated` → `"invite-team"`

**"invite-team" step:** unchanged — on finish, if there are remaining unresolved invitations → transitions to `"accept-remaining"`. If none → `router.push("/home")` as before.

**"accept-remaining" step:**
- Headline: "Pending invitations"
- Description: "You also have invitations from other organizations."
- Renders `<OnboardingInvitationList>` with remaining unresolved invitations
- "Skip" / "Continue" button → `router.refresh()` + `router.push("/home")` (always enabled — user can accept some, ignore some, or skip all)

### 3. `src/components/onboarding/invite-team-form.tsx`

- Accept new optional `onContinue?: () => void` prop
- When `onContinue` is provided, call it instead of `router.push("/home")` — this lets the parent flow intercept and show remaining invitations before navigating home
- When `onContinue` is not provided, keep current behavior (`router.refresh()` + `router.push("/home")`)

---

## Key Design Decisions

**No `router.refresh()` during the flow** — Accepting an invitation creates an org membership. If we called `router.refresh()` mid-flow, the onboarding layout's `hasAnyOrganization` check would detect the new membership and redirect to `/home`, breaking the flow. We only call `router.refresh()` when the user is ready to leave onboarding.

**Client-side invitation calls** — Same pattern as the existing `pending-invites-dialog.tsx`. Uses `authClient.organization.acceptInvitation` / `rejectInvitation` directly. No server actions needed since better-auth handles these client-side.

**Separate "accept-remaining" step** — Rather than mixing "invite your team" and "accept other org invitations" on the same screen (confusing — they're opposite directions), the remaining invitations get their own step after invite-team.

---

## Verification

1. Create user A with an org. Invite user B's email.
2. Sign up as user B → should see "You've been invited" step showing the invitation
3. Accept the invitation → "Continue" button appears → click it → lands at `/home` in the accepted org
4. Sign up as user C (also invited) → click "Create your own organization" → create org → invite team → should see "Pending invitations" step with the remaining invite → accept or skip → lands at `/home`
5. Sign up as user D (no invitations) → flow is unchanged: create-org → invite-team → `/home`
6. Test error: cancel an invitation from settings, then try to accept it during onboarding → should show error and remove the row
7. `bun run lint` — no Biome issues
8. `bun run build` — no type errors
