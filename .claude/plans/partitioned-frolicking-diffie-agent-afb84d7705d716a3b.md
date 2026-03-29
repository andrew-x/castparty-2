## TypeScript Quality Audit

### Critical
None

### Important

- **[src/components/productions/reject-reasons-editor.tsx:17]**: `action: any` in Props interface — The `action` prop is typed as `any`, bypassing all type safety. Suggested fix: define a union type of the two accepted action types, e.g. `action: typeof updateProductionRejectReasons | typeof updateRoleRejectReasons`, or define a common action interface that both satisfy.

- **[src/components/productions/reject-reasons-editor.tsx:37]**: `as never` cast on `execute()` argument — Using `as never` silences the type checker entirely, hiding potential runtime mismatches in the computed property key pattern. Suggested fix: once the `action` prop is properly typed, use a discriminated approach or generic to make the execute call type-safe.

- **[src/components/productions/create-production-form.tsx:301]**: `handleSubmit as any` — Casts the submit handler to `any` to work around a type mismatch between form schema and action schema. Suggested fix: type the `handleSubmit` callback to match what `form.handleSubmit` expects, or use a typed adapter function that maps form values to the action input.

- **[src/components/productions/feedback-panel.tsx:692]**: `register: (name: any) => any` — Both parameter and return type are `any`. Suggested fix: use the `UseFormRegister` type from react-hook-form with a proper generic, or at minimum type the return as `UseFormRegisterReturn` and the name as `string`.

- **[src/lib/types.ts:7-14]**: `type CustomForm = { ... }` — Object shape defined with `type` instead of `interface`. The typescript rule file says to prefer `interface` for object shapes. Suggested fix: change to `export interface CustomForm { ... }`.

- **[src/lib/types.ts:16-21]**: `type CustomFormResponse = { ... }` — Same issue: object shape should use `interface`. Suggested fix: change to `export interface CustomFormResponse { ... }`.

- **[src/lib/types.ts:25-31]**: `type SystemFieldConfig = { ... }` — Same issue: object shape should use `interface`. Suggested fix: change to `export interface SystemFieldConfig { ... }`.

- **[src/components/productions/form-fields-editor.tsx:107]**: `type FieldDraft = { ... }` — Object shape defined with `type` instead of `interface`. Suggested fix: change to `interface FieldDraft { ... }`.

### Minor

- **[src/lib/logger.ts:5-6]**: Relative imports `"./dayjs"` and `"./util"` — Should use `@/lib/dayjs` and `@/lib/util` per the path alias rule. Same-directory relative imports work but violate the convention of always using `@/*` within `src/`.

- **[src/lib/action.ts:8]**: Relative import `"./auth/auth-util"` — Should be `@/lib/auth/auth-util`.

- **[src/lib/schemas/index.ts:1-11]**: Barrel file uses relative `"./candidate"`, `"./comment"`, etc. — These re-exports could use `@/lib/schemas/candidate`, etc. However, barrel files are a common exception since they exist specifically to aggregate sibling modules, so this is borderline.

- **[src/actions/submissions/send-custom-email.ts:7]**: Relative import `"./send-submission-email"` — Should be `@/actions/submissions/send-submission-email`.

- **[src/components/organizations/org-switcher.tsx:22]**: Relative import `"./create-org-dialog"` — Should use `@/components/organizations/create-org-dialog`.

- **[src/components/organizations/members-table.tsx:17-20]**: Four relative imports for sibling dialog components — Should use `@/components/organizations/...` path alias.

- **[src/components/organizations/pending-invites-button.tsx:8]**: Relative import `"./pending-invites-dialog"` — Should use path alias.

- **[src/components/admin/admin-users-client.tsx:18-20]**: Three relative imports for sibling dialog components — Should use `@/components/admin/...` path alias.

- **[src/components/admin/admin-orgs-client.tsx:18]**: Relative import `"./delete-org-dialog"` — Should use path alias.

- **[src/lib/emails/template-email.tsx:2, password-reset.tsx:2, invitation.tsx:2, verify-email.tsx:2]**: Relative imports `"./components/layout"` — Should use `@/lib/emails/components/layout`.

- **[src/components/common/sidebar.tsx:34]**: `type SidebarContextProps = { ... }` — Object shape should use `interface`. Suggested fix: change to `interface SidebarContextProps { ... }`.

- **[src/components/common/pagination.tsx:39]**: `type PaginationLinkProps = { ... } & Pick<...> & ...` — This uses intersection types, which is one of the valid exceptions for using `type` over `interface`. No change needed (included for completeness, not a real issue).

### Notes on Reviewed & Cleared Patterns

The following patterns were reviewed and determined to be acceptable:

- **`as const` assertions** (pipeline.ts, auth-types.ts, email templates, etc.) — These are safe, narrowing to literal types. Not a concern.
- **`as React.CSSProperties`** (sidebar.tsx, toggle-group.tsx) — Required for CSS custom properties (`--sidebar-width`). Standard React pattern, not masking a type error.
- **`as EmailTemplates | null`** (3 locations) — The DB column is `jsonb().$type<EmailTemplates>()` without `.notNull()`, so Drizzle infers `EmailTemplates | null`. The cast is technically redundant but not harmful since it matches the actual type.
- **`as PipelineStageData["type"]`** (get-candidate.ts:122, 144) — Narrowing a string to a known union. The DB column stores the same enum values. Acceptable given Drizzle's JSONB typing limitations.
- **`as CustomForm[]`** (get-candidate.ts:71, 74) — The DB columns are typed with `$type<CustomForm[]>()` but accessed through optional-chained relations where Drizzle may widen the type. Acceptable workaround.
- **`as Node`** (autocomplete-input.tsx:52) — Standard DOM type narrowing for `contains()`. Safe.
- **`as HTMLElement`** (input-group.tsx:74) — Standard DOM type narrowing. Safe.
- **`formResolver` in resolve.ts** — Has biome-ignore comments explaining the `any` is intentional due to zod/v4 type incompatibility with the resolver adapter. This is a centralized workaround, not scattered usage.
- **`PgTableWithColumns<any>` in slug.ts:51** — Has biome-ignore comment. Drizzle's table generics are genuinely complex and this is the pragmatic approach.
