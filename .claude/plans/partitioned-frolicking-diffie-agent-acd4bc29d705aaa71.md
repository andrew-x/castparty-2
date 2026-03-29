## TypeScript Quality Audit

### Critical
None

### Important
- **[src/components/productions/reject-reasons-editor.tsx:17]**: `action: any` in Props interface disables type safety for the action prop. — Define a union type or generic for the two action shapes: `action: typeof updateProductionRejectReasons | typeof updateRoleRejectReasons` (or a shared base type). This also eliminates the `as RejectReasonsAction` cast on line 30 and the `as never` cast on line 37.
- **[src/components/productions/reject-reasons-editor.tsx:37]**: `as never` cast on the `execute()` call hides a type mismatch between the dynamic `[idField]` key and the action's expected input shape. — Fix by properly typing the action prop (see above) so the input shape is statically known, or use a discriminated union with a type guard.
- **[src/components/productions/create-production-form.tsx:301]**: `handleSubmit as any` casts away form submission handler types. — Narrow the form schema or adjust the `handleSubmit` function signature so the form's `onSubmit` handler type aligns without a cast. If the form schema is intentionally a subset, use `formResolver` (which already exists) and type the handler to match the form schema rather than the action schema.
- **[src/components/productions/feedback-panel.tsx:692]**: `register: (name: any) => any` — both parameter and return type are `any`. — Type the `register` parameter using `UseFormRegister<FeedbackFormValues>` from react-hook-form, or at minimum use `(name: string) => object` to preserve some type safety.
- **[src/lib/action.ts:8]**: Relative import `from "./auth/auth-util"` within `src/lib/` — should use `@/lib/auth/auth-util` per the path alias convention.
- **[src/lib/logger.ts:5-6]**: Relative imports `from "./dayjs"` and `from "./util"` within `src/lib/` — should use `@/lib/dayjs` and `@/lib/util`.

### Minor
- **[src/lib/types.ts:7]**: `type CustomForm = { ... }` is a plain object shape — should be `interface CustomForm { ... }` per the "prefer interface" rule.
- **[src/lib/types.ts:16]**: `type CustomFormResponse = { ... }` is a plain object shape — should be `interface CustomFormResponse { ... }`.
- **[src/lib/types.ts:25]**: `type SystemFieldConfig = { ... }` is a plain object shape — should be `interface SystemFieldConfig { ... }`.
- **[src/components/productions/form-fields-editor.tsx:107]**: `type FieldDraft = { ... }` is a plain object shape — should be `interface FieldDraft { ... }`.
- **[src/components/common/sidebar.tsx:34]**: `type SidebarContextProps = { ... }` is a plain object shape — should be `interface SidebarContextProps { ... }`.
- **[src/actions/submissions/create-submission.ts:169]**: `type MovedFile = { ... }` local type alias is a plain object shape — should be `interface MovedFile { ... }`.
- **[src/components/productions/form-fields-editor.tsx:378]**: `v as CustomFormFieldType` — the `Select` `onValueChange` provides `string`, cast to `CustomFormFieldType`. Could be made safer with a runtime check (e.g., validate `v` is in the set of valid types before assigning).
- **[src/components/productions/default-stages-editor.tsx:290]**: `removingStageId as string` — this is narrowing `string | null` to `string`. The null case is unlikely here (the callback only fires after `removingStageId` was set), but an explicit null guard would be cleaner: `if (!removingStageId) return;` before accessing it.
- **[src/lib/schemas/index.ts:1-11]**: Barrel file uses relative `./` re-exports — this is a barrel within `lib/schemas/` so sibling-relative is conventional for index files, but note inconsistency with the `@/*` alias convention. Low priority since barrel files typically use relative paths.

### Notes (Not Flagged)

The following patterns were reviewed and determined to be acceptable:

- **`as const` casts** (pipeline.ts, feedback-panel.tsx, etc.) — these are safe literal-narrowing casts, not type assertions that mask errors.
- **`as React.CSSProperties`** (sidebar.tsx, toggle-group.tsx) — necessary for CSS custom properties that TS doesn't know about. Standard React pattern.
- **`as unknown as { db: typeof db }`** (db.ts) and **`as unknown as { __devEmails?: StoredEmail[] }`** (email-dev-store.ts) — standard globalThis singleton pattern for dev/HMR survival. Double-cast through `unknown` is the correct approach here.
- **`as EmailTemplates | null`** casts (page.tsx, send-submission-email.tsx, get-candidate.ts) — the schema defines `emailTemplates` with `$type<EmailTemplates>()` but it's nullable; Drizzle's relational query API sometimes returns `unknown` for JSONB through joins, making these casts a pragmatic necessity.
- **`as PipelineStageData["type"]`** (get-candidate.ts) — narrowing a DB string enum to a more specific type; acceptable since the DB constrains the values.
- **`(field.value as string[]) ?? []`** (submission-form.tsx, submission-edit-form.tsx) — react-hook-form's `field.value` is typed as the union of all field types; the cast narrows for a specific field. Acceptable.
- **`as TemplateKey | null`** (email-templates-form.tsx) — `searchParams.get()` returns `string | null`; narrowing to known keys with a fallback on the next line.
- **Relative imports within email templates** (e.g., `from "./components/layout"`) — these are within `src/lib/emails/`, a cohesive module. Same-directory/child-directory relative imports are common for tightly coupled modules.
- **Relative imports within `src/components/` subdirectories** (e.g., `from "./delete-org-dialog"`) — sibling component imports within the same feature directory are conventional.
- **`src/lib/schemas/resolve.ts` `any` usage** — has biome-ignore comments and is an intentional compatibility shim between zod/v4 and the hookform resolver. The `any` is isolated to a single function.
- **`src/lib/slug.ts:51` `PgTableWithColumns<any>`** — has a biome-ignore comment; Drizzle's table types are genuinely complex generics that resist proper typing here.
