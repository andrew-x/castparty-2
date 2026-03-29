## Forms & Validation Audit

### Critical

- **[src/components/productions/create-role-dialog.tsx:3,6,27,46-48,52]**: Uses separate `useForm` + `useAction` instead of `useHookFormAction`, imports `zodResolver` directly instead of `formResolver`, and defines schema inline instead of in `src/lib/schemas/`. This violates three rules at once. — Refactor to use `useHookFormAction` with `formResolver` from `@/lib/schemas/resolve`, and move the inline schema to `src/lib/schemas/role.ts` (a `createRoleFormSchema` alongside the existing `updateRoleFormSchema`).

- **[src/components/productions/email-templates-form.tsx:105]**: Passes the **action schema** (`updateEmailTemplatesActionSchema`) to `formResolver` instead of a form schema. The form schema/action schema split rule requires form schemas to contain user-input fields only. The action schema includes `productionId`, which is injected from props, not collected from the form. — Create a separate `emailTemplatesFormSchema` in `src/lib/schemas/email-template.ts` containing only the `emailTemplates` field, and use that with `formResolver`. Keep the action schema for the server action.

### Important

- **[src/lib/schemas/form-fields.ts:17]**: `options: z.array(z.string().max(200))` is missing `.trim()` on the inner string. These are user-entered option labels (e.g., dropdown choices). — Change to `z.array(z.string().trim().max(200))`.

- **[src/components/admin/add-user-dialog.tsx:25-29]**: Schema is defined inline in the component file instead of in `src/lib/schemas/`. — Move to a centralized schema file (e.g., `src/lib/schemas/auth.ts` as `createUserFormSchema`, or a new `src/lib/schemas/admin.ts`).

- **[src/components/organizations/create-org-dialog.tsx:26-28]**: Schema is defined inline. The existing `createOrgFormSchema` in `src/lib/schemas/organization.ts` has the same `name` field plus a `slug` field. — Either reuse `createOrgFormSchema` (if slug should be present) or create a minimal variant in `src/lib/schemas/organization.ts`. Remove the inline definition.

- **[src/components/organizations/invite-member-dialog.tsx:33-36]**: Schema is defined inline with `email` and `role` fields. `inviteFormSchema` already exists in `src/lib/schemas/organization.ts` with just `email`. — Extend the existing `inviteFormSchema` to include `role`, or create a separate form schema in `src/lib/schemas/organization.ts`. Remove the inline definition.

- **[src/components/organizations/change-role-dialog.tsx:30-32]**: Schema (`z.object({ role: z.enum(["admin", "member", "owner"]) })`) is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/components/admin/change-password-dialog.tsx:27-29]**: Schema is defined inline. — Move to a centralized schema file (e.g., `src/lib/schemas/admin.ts` or `src/lib/schemas/auth.ts`).

- **[src/actions/productions/create-role.ts:15-19]**: Action schema is defined inline in the action file. The convention requires all schemas in `src/lib/schemas/`. — Create `createRoleActionSchema` in `src/lib/schemas/role.ts` (extending the new `createRoleFormSchema` with `productionId`), and import it here.

- **[src/actions/admin/create-user.ts:11-16]**: Action schema is defined inline. — Move to a centralized schema file.

- **[src/actions/admin/change-password.ts:14-17]**: Action schema is defined inline. — Move to a centralized schema file.

- **[src/actions/productions/add-production-stage.ts:15-18]**: Action schema is defined inline. — Move to `src/lib/schemas/` (e.g., a `production.ts` or dedicated `pipeline.ts` file).

- **[src/actions/productions/remove-production-stage.ts:13-17]**: Action schema is defined inline. — Move to `src/lib/schemas/`.

- **[src/actions/productions/reorder-production-stages.ts:13-16]**: Action schema is defined inline. — Move to `src/lib/schemas/`.

- **[src/actions/productions/update-production-reject-reasons.ts:13-16]**: Action schema is defined inline. — Move to `src/lib/schemas/`.

- **[src/actions/organizations/update-member-role.ts:13-17]**: Action schema is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/transfer-ownership.ts:13-16]**: Action schema is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/cancel-invitation.ts:15-18]**: Action schema is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/remove-member.ts:13-16]**: Action schema is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/set-active-organization.ts:14-16]**: Action schema is defined inline. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/update-organization-profile.ts:14-19]**: Action schema is defined inline with user-text fields (`websiteUrl`, `description`). — Move to `src/lib/schemas/organization.ts`. (Note: the matching fields in `updateOrgFormSchema`/`updateOrgActionSchema` already exist there, so this could potentially reuse or extend those.)

- **[src/actions/admin/delete-organization.ts:12]**: Action schema `z.object({ organizationId: z.string() })` is inline. — Move to a centralized schema file.

- **[src/actions/admin/delete-user.ts:12]**: Action schema `z.object({ userId: z.string() })` is inline. — Move to a centralized schema file.

### Minor

- **[src/components/productions/email-preview-dialog.tsx:4,40-42]**: Uses `useForm` without any connection to a server action (preview-only dialog that calls `onConfirm` callback). This is acceptable since it's not an action-connected form, but the form values (subject, body) have no schema validation at all. — Consider adding a lightweight schema for client-side validation of subject/body length.

- **[src/components/productions/reject-reason-dialog.tsx:4,53-60]**: Uses `useForm` without schema validation. Similar to above -- not action-connected, uses `onConfirm` callback. — Consider adding schema validation for the custom reason field (max 500 chars is only enforced via `maxLength` HTML attribute, not Zod).

- **[src/lib/schemas/index.ts]**: Both `email-template.ts` and `simulate-inbound-email.ts` are missing from the barrel export. Consumers must import from the specific file rather than `@/lib/schemas`. — Add `export * from "./email-template"` and `export * from "./simulate-inbound-email"` to `src/lib/schemas/index.ts`.

### No Issues

The following areas passed the audit with no concerns:

- **`zod/v4` vs `zod` usage**: All schema files correctly use `zod/v4` except `auth.ts` which correctly uses bare `zod` (as specified in the checklist).
- **Auth forms**: All four auth forms (`login-form`, `signup-form`, `forgot-password-form`, `reset-password-form`) correctly use `useForm` with `zodResolver` directly -- they are exempt from `useHookFormAction` since they use Better Auth.
- **`.trim()` on user text fields**: All centralized schemas properly apply `.trim()` on user-text `z.string()` fields (names, emails, descriptions, titles, labels). Passwords and IDs correctly omit `.trim()`.
- **`formResolver` usage**: All `useHookFormAction` forms correctly use `formResolver` from `@/lib/schemas/resolve` (except the one critical finding on `create-role-dialog.tsx`).
- **`onError` handling**: All `useHookFormAction` forms properly handle server errors via `form.setError("root", ...)` in `onError`.
- **`action.isPending` usage**: All forms use `action.isPending` for loading state (no separate state variables).
