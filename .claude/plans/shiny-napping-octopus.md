# Plan: Migrate Forms to `useHookFormAction` + Centralize Schemas

## Context

All 7 next-safe-action forms currently wire `useForm` + `useAction` separately with repetitive boilerplate (manual error mapping, parallel hook setup, duplicated schemas). The `@next-safe-action/adapter-react-hook-form` adapter is already installed but unused. This migration:

1. Replaces `useForm` + `useAction` with a single `useHookFormAction` call per form
2. Centralizes Zod schemas so forms and actions share the same validation rules
3. Consolidates the two role update actions into one

**Not migrated:** Auth forms (login, signup, forgot-password) use Better Auth, not next-safe-action.

---

## Phase 1: Create Shared Schemas

Create `src/lib/schemas/` with shared Zod schemas used by both forms (via `zodResolver`) and actions (via `.inputSchema()`). Form schemas contain user-input fields only; action schemas extend them with IDs and server-only refinements.

### Files to create

**`src/lib/schemas/slug.ts`** — Shared slug validation rule
- Import `RESERVED_SLUGS` from `@/lib/slug` (already exists)
- Export `slugSchema` (base: min 3, max 60, regex) and `slugSchemaStrict` (adds numeric-only + reserved checks via `.refine()`)
- Eliminates duplication across 5+ form/action files

**`src/lib/schemas/organization.ts`**
- `createOrgFormSchema` — `{ name, slug }`
- `createOrgActionSchema` — extends with `slug.optional()`
- `updateOrgFormSchema` — `{ name, slug, description, websiteUrl, isOrganizationProfileOpen }`
- `updateOrgActionSchema` — extends with `organizationId`
- `inviteFormSchema` — `{ email }`
- `inviteActionSchema` — extends with `{ organizationId, role }`

**`src/lib/schemas/production.ts`**
- `roleItemSchema` — `{ name, description? }`
- `createProductionFormSchema` — `{ name, description?, slug?, roles[] }`
- `createProductionActionSchema` — adds `customStages[]`
- `updateProductionFormSchema` — `{ name, slug, isOpen }`
- `updateProductionActionSchema` — extends with `productionId`

**`src/lib/schemas/role.ts`**
- `updateRoleFormSchema` — `{ name, description, slug, isOpen }`
- `updateRoleActionSchema` — extends with `roleId`, all fields optional

**`src/lib/schemas/submission.ts`**
- `submissionFormSchema` — `{ firstName, lastName, email, phone? }`
- `submissionActionSchema` — extends with `{ orgId, productionId, roleId }`

**`src/lib/schemas/index.ts`** — Barrel re-export

All schemas import `z` from `"zod/v4"` (codebase convention).

**Subagent:** Explore agent to read existing inline schemas from all 7 form files and 7 action files to extract exact validation rules (error messages, max lengths, regex patterns). Then a parallel set of implementation subagents to create the schema files.

---

## Phase 2: Consolidate Role Actions

Merge `update-role-slug.ts` logic into `update-role.ts`, then delete the separate file.

### Changes to `src/actions/productions/update-role.ts`
- Add `slug` (optional) to `.inputSchema()` using `slugSchemaStrict` from shared schemas
- Import `{ and, eq, not }` from drizzle (for uniqueness check)
- When `slug` is provided, add the uniqueness check from `update-role-slug.ts` (lines 47-59): query for conflicting slug within same production, throw if found
- Add `slug` to the updates object alongside name/description/isOpen
- Fetch `productionId` in the ownership query (needed for uniqueness scope)

### Delete
- `src/actions/productions/update-role-slug.ts`

### Update action imports
- All 7 action files: replace inline schemas with imports from `@/lib/schemas/*`
- Remove any `updateRoleSlug` imports from `role-settings-form.tsx`

**Subagent:** Single implementation subagent for the consolidation + schema imports.

---

## Phase 3: Migrate Forms to `useHookFormAction`

### Migration pattern (all forms)

**Before:**
```tsx
import { useAction } from "next-safe-action/hooks"
import { useForm } from "react-hook-form"

const form = useForm({ resolver: zodResolver(schema), defaultValues: {...} })
const { execute, isPending } = useAction(action, { onSuccess, onError })
// <form onSubmit={form.handleSubmit((v) => execute(v))}>
```

**After:**
```tsx
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"

const { form, action, handleSubmitWithAction } = useHookFormAction(
  actionFn,
  zodResolver(formSchema),
  {
    formProps: { defaultValues: {...} },
    actionProps: { onSuccess, onError },
  }
)
// <form onSubmit={handleSubmitWithAction}>  (or form.handleSubmit for extra-ID forms)
```

**Key replacements throughout each form:**
- `isPending` → `action.isPending`
- `execute(...)` → `action.execute(...)` (where used in custom submit handlers)
- Remove inline schema definitions; import from `@/lib/schemas/*`
- Remove `useForm` and `useAction` imports; add `useHookFormAction` import
- Keep `form.setError("root", ...)` in `onError` for server errors (non-validation)

### Form-specific notes

#### 1. `create-org-form.tsx` (simple)
- **Can use `handleSubmitWithAction`** — form fields match action input exactly
- Remove inline `createOrgSchema`
- Slug auto-gen via `watch`/`setValue`/`useRef` stays unchanged (uses `form` from hook)

#### 2. `invite-team-form.tsx` (extra IDs)
- Must inject `organizationId` + `role: "member"` → use `form.handleSubmit((v) => action.execute({...v, organizationId, role: "member"}))`
- `form.getValues("email")` in `onSuccess` before `form.reset()` — works fine (adapter doesn't auto-reset)

#### 3. `production-settings-form.tsx` (edit + change detection + extra ID)
- Injects `productionId` → custom submit handler
- `form.watch()` for change detection stays the same

#### 4. `org-settings-form.tsx` (edit + change detection + extra ID)
- Injects `organizationId` → custom submit handler
- 5-field change detection via `watch()` unchanged

#### 5. `role-settings-form.tsx` (depends on Phase 2)
- Remove second `useAction(updateRoleSlug)` hook entirely
- Single `useHookFormAction(updateRole, ...)` replaces both hooks
- Remove conditional submit logic (roleChanged/slugChanged) — just send all fields
- Injects `roleId` → custom submit handler

#### 6. `submission-form.tsx` (public + extra IDs)
- Injects `orgId`, `productionId`, `roleId` → custom submit handler

#### 7. `create-production-form.tsx` (complex — last)
- Must use custom submit handler (transforms data: filters empty roles, converts stages, handles optional slug)
- `useFieldArray` stays the same — uses `form.control` from hook
- `form.trigger()` for step transitions stays the same
- Remove duplicated `SLUG_REGEX`, `RESERVED_SLUGS`, `slugRule` constants (now in shared schema)
- Slug auto-gen via `watch`/`setValue`/`useRef` unchanged

**Subagents:** Parallel implementation subagents grouped by complexity:
- Group 1: `create-org-form` + `invite-team-form` + `submission-form` (simple)
- Group 2: `production-settings-form` + `org-settings-form` (edit forms)
- Group 3: `role-settings-form` + `create-production-form` (complex, depends on Phase 2)

---

## Phase 4: Add Coding Rule for Form Convention

Create `.claude/rules/forms.md` to enforce the `useHookFormAction` pattern going forward. This rule ensures any new form that calls a next-safe-action action uses the adapter hook instead of wiring `useForm` + `useAction` separately.

### Rule content (`.claude/rules/forms.md`)

Key points to codify:
- **Always use `useHookFormAction`** from `@next-safe-action/adapter-react-hook-form/hooks` when building forms that submit to next-safe-action actions
- **Never use `useForm` + `useAction` separately** for action-connected forms (the adapter handles the wiring)
- **Centralized schemas**: Define form schemas in `src/lib/schemas/[feature].ts`; import into both form components and action files
- **Form schemas vs action schemas**: Form schemas contain user-input fields only. Action schemas extend form schemas with IDs and server-only refinements via `.extend()` and `.refine()`
- **`handleSubmitWithAction`**: Use when form fields match the action's input exactly. Use `form.handleSubmit((v) => action.execute({...v, extraIds}))` when injecting IDs from props/context
- **Loading state**: Use `action.isPending` (not a separate `isPending` variable)
- **Server errors**: Keep `form.setError("root", ...)` in `onError` for non-validation server errors
- **Auth forms exception**: Forms using Better Auth (`authClient`) don't use this pattern

Include a before/after code example showing the migration.

---

## Phase 5: Update Documentation (Librarian)

Spawn the librarian agent to update project docs with the new form convention:

### `docs/CONVENTIONS.md`
- Add a **"Form patterns"** section covering:
  - `useHookFormAction` as the standard hook for action-connected forms
  - Centralized schema structure (`src/lib/schemas/`)
  - Form schema vs action schema split
  - When to use `handleSubmitWithAction` vs custom submit handler
  - Error handling (auto-mapped validation errors + manual root errors for server errors)

### `docs/FEATURES.md`
- Update form-related feature entries to reference the new pattern

### `docs/ARCHITECTURE.md`
- Update the data flow section to mention the adapter layer between forms and actions

**Subagent:** Librarian agent with full context of the changes made.

---

## Phase 6: Cleanup + Verify

1. Remove unused `z` imports from form files that no longer define schemas inline
2. Remove `useForm` and `useAction` imports that were replaced
3. `bun run lint` — fix any Biome issues
4. `bun run build` — verify no type errors or build failures

**Subagent:** Code reviewer agent on all changed files.

---

## Verification

After implementation, the user should:

1. **Create org flow** (`/onboarding`) — create an org with auto-slug, verify slug validation errors from server show on the form field
2. **Invite team** (`/onboarding`) — invite an email, verify it appears in sent list, form resets
3. **Create production** (`/productions/new`) — full wizard (details → stages → roles), verify multi-step validation, slug auto-gen, role field array add/remove
4. **Production settings** — edit name/slug/isOpen, verify change detection enables save button, verify server slug conflict errors map to field
5. **Role settings** — edit all 4 fields in one save (consolidated action), verify slug uniqueness error
6. **Org settings** — edit fields, verify URL validation, change detection
7. **Submission form** (public audition page) — submit, verify success state

Also run:
```bash
bun run build
bun run lint
```
