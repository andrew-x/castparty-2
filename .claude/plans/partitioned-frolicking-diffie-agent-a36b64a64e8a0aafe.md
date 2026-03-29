## Forms & Validation Audit

### Critical

- **[src/components/productions/create-role-dialog.tsx:3-6,27-30,47-66]**: Uses separate `useForm` + `useAction` instead of `useHookFormAction`, uses raw `zodResolver` instead of `formResolver`, and defines an inline schema instead of importing from `src/lib/schemas/`. This violates three form conventions at once. — Refactor to use `useHookFormAction` with `formResolver`, and move the schema to `src/lib/schemas/role.ts` (e.g. `createRoleFormSchema`). A corresponding `createRoleActionSchema` should extend it with `productionId`.

- **[src/actions/productions/create-role.ts:14-19]**: Inline `z.object()` schema defined directly in the action file instead of importing from `src/lib/schemas/`. — Extract to `src/lib/schemas/role.ts` as `createRoleActionSchema` extending a `createRoleFormSchema`.

### Important

- **[src/components/organizations/change-role-dialog.tsx:30-32]**: Inline schema `z.object({ role: z.enum(["admin", "member", "owner"]) })` defined in the component file. — Move to `src/lib/schemas/organization.ts`.

- **[src/components/organizations/invite-member-dialog.tsx:33-36]**: Inline schema duplicates `inviteFormSchema` from `src/lib/schemas/organization.ts` (same `email` + `role` fields). — Import and use the existing `inviteFormSchema` instead of redefining it inline.

- **[src/components/admin/add-user-dialog.tsx:25-29]**: Inline schema defined in the component file. — Move to `src/lib/schemas/` (e.g. `src/lib/schemas/admin.ts`) as a named export.

- **[src/components/admin/change-password-dialog.tsx:27-29]**: Inline schema defined in the component file. — Move to `src/lib/schemas/` (e.g. `src/lib/schemas/admin.ts`).

- **[src/components/organizations/create-org-dialog.tsx:26-28]**: Inline schema duplicates `createOrgFormSchema` from `src/lib/schemas/organization.ts` (same `name` field minus `slug`). — Import and use the existing `createOrgFormSchema` or create a dedicated variant.

- **[src/components/productions/email-templates-form.tsx:105]**: Passes `updateEmailTemplatesActionSchema` (the *action* schema, which includes `productionId`) to `formResolver`. The convention is to pass the *form* schema (user-input fields only) and inject IDs via `handleSubmit`. — Create a separate `updateEmailTemplatesFormSchema` in `src/lib/schemas/email-template.ts` containing only `emailTemplates`, and use that with `formResolver`. The `productionId` should be injected in the `handleSubmit` callback.

- **[src/actions/productions/add-production-stage.ts:14-18]**: Inline schema in action file. — Move to `src/lib/schemas/` (could go in a `pipeline-stage.ts` or `production.ts`).

- **[src/actions/productions/remove-production-stage.ts:12-17]**: Inline schema in action file. — Move to `src/lib/schemas/`.

- **[src/actions/productions/reorder-production-stages.ts:12-16]**: Inline schema in action file. — Move to `src/lib/schemas/`.

- **[src/actions/productions/update-production-reject-reasons.ts:12-16]**: Inline schema in action file. — Move to `src/lib/schemas/`.

- **[src/actions/admin/create-user.ts:10-16]**: Inline schema in action file. — Move to `src/lib/schemas/admin.ts`.

- **[src/actions/admin/change-password.ts:13-17]**: Inline schema in action file. — Move to `src/lib/schemas/admin.ts`.

- **[src/actions/admin/delete-organization.ts:12]**: Inline schema `z.object({ organizationId: z.string() })` in action file. — Move to `src/lib/schemas/`.

- **[src/actions/admin/delete-user.ts:12]**: Inline schema `z.object({ userId: z.string() })` in action file. — Move to `src/lib/schemas/`.

- **[src/actions/organizations/set-active-organization.ts:13-16]**: Inline schema in action file. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/update-member-role.ts:12-17]**: Inline schema in action file. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/update-organization-profile.ts:13-19]**: Inline schema in action file (duplicates fields from `updateOrgFormSchema`). — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/cancel-invitation.ts:14-18]**: Inline schema in action file. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/remove-member.ts:12-16]**: Inline schema in action file. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/organizations/transfer-ownership.ts:12-16]**: Inline schema in action file. — Move to `src/lib/schemas/organization.ts`.

- **[src/actions/submissions/presign-headshot-upload.ts:22-39]**: Inline schema in action file. — Move to `src/lib/schemas/submission.ts`.

- **[src/actions/submissions/presign-resume-upload.ts:10-20]**: Inline schema in action file. — Move to `src/lib/schemas/submission.ts`.

- **[src/actions/productions/check-slug.ts:11]**: Inline schema `z.object({ slug: z.string() })` in action file. — Move to `src/lib/schemas/slug.ts` or `src/lib/schemas/production.ts`.

- **[src/lib/schemas/form-fields.ts:17]**: `options: z.array(z.string().max(200))` -- the `z.string()` inside the array is missing `.trim()`. These are user-provided option labels for form fields. — Add `.trim()` before `.max(200)` to match the pattern used in `updateProductionFormFieldSchema.options` (line 35).

### Minor

- **[src/lib/schemas/organization.ts:5]**: `createOrgFormSchema.name` has no `.max()` constraint, while the corresponding `createOrgActionSchema.name` (line 10) has `.max(100)`. — Add `.max(100)` to the form schema for consistent client-side validation.

### No Issues

The following areas were audited and found to be compliant:

- All `useHookFormAction` forms (except `create-role-dialog`) correctly use `formResolver` from `@/lib/schemas/resolve`.
- Auth forms (`login-form`, `signup-form`, `forgot-password-form`, `reset-password-form`) correctly use standard `useForm` + raw `zodResolver` (exempt from `useHookFormAction` per rules).
- Auth schema (`src/lib/schemas/auth.ts`) correctly uses bare `zod` while all other schemas use `zod/v4`.
- All non-auth schema files import from `zod/v4`.
- All action-connected forms have `onError` handlers using `form.setError("root", ...)`.
- Confirmation-only dialogs (delete-org, delete-user, cancel-invitation, remove-member, transfer-ownership) correctly use plain `useAction` since they have no form inputs.
- `.trim()` is consistently applied on user text fields (names, emails, descriptions, locations) across all schema files.
- Passwords correctly omit `.trim()` in all schemas.
- IDs and tokens correctly omit `.trim()`.
