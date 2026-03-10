# Plan: Tabbed Settings + "Apply to Existing Roles"

## Context

Production settings and role settings are currently single pages with 4 sections stacked vertically. The user wants each section to become its own tab in the **existing** page-level tab navigation (`ProductionTabNav` / `RoleTabNav`), replacing the single "Settings" tab with 4 individual tabs: General, Pipeline, Submission form, Feedback form.

Production-level Pipeline, Submission form, and Feedback form tabs need an "Update existing roles" button that opens a modal for applying defaults to existing roles, with a warning about overriding current settings.

## Approach: URL-Based Route Tabs

The existing tab navs are URL-based (using `<Link>` components with pathname matching), not client-side Radix tabs. Each tab maps to a route. The approach is:

1. **Split the single settings page into 4 route pages** (one per tab)
2. **Update the tab navs** to show 5 tabs instead of 2
3. **Create the "apply to roles" dialog** and server actions for production-level defaults

### Route Structure

**Production** (current: Roles | Settings):
```
/productions/[id]                          → Roles (unchanged)
/productions/[id]/settings                 → General
/productions/[id]/settings/pipeline        → Pipeline (new route)
/productions/[id]/settings/submission-form → Submission form (new route)
/productions/[id]/settings/feedback-form   → Feedback form (new route)
```

**Role** (current: Submissions | Settings):
```
/productions/[id]/roles/[roleId]                          → Submissions (unchanged)
/productions/[id]/roles/[roleId]/settings                 → General
/productions/[id]/roles/[roleId]/settings/pipeline        → Pipeline (new route)
/productions/[id]/roles/[roleId]/settings/submission-form → Submission form (new route)
/productions/[id]/roles/[roleId]/settings/feedback-form   → Feedback form (new route)
```

## Files

| File | Action | Purpose |
|------|--------|---------|
| **Tab Navs** | | |
| `src/components/productions/production-tab-nav.tsx` | Modify | 5 tabs: Roles, General, Pipeline, Submission form, Feedback form |
| `src/components/productions/role-tab-nav.tsx` | Modify | 5 tabs: Submissions, General, Pipeline, Submission form, Feedback form |
| **Production Settings Pages** | | |
| `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | Modify | Keep only General settings (ProductionSettingsForm) |
| `src/app/(app)/productions/[id]/(production)/settings/pipeline/page.tsx` | Create | Pipeline tab: DefaultStagesEditor + ApplyToRolesDialog |
| `src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx` | Create | Submission form tab: DefaultFormFieldsEditor + ApplyToRolesDialog |
| `src/app/(app)/productions/[id]/(production)/settings/feedback-form/page.tsx` | Create | Feedback form tab: DefaultFeedbackFormFieldsEditor + ApplyToRolesDialog |
| **Role Settings Pages** | | |
| `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx` | Modify | Keep only General settings (RoleSettingsForm) |
| `src/app/(app)/productions/[id]/roles/[roleId]/settings/pipeline/page.tsx` | Create | Pipeline tab: RoleStagesEditor |
| `src/app/(app)/productions/[id]/roles/[roleId]/settings/submission-form/page.tsx` | Create | Submission form tab: RoleFormFieldsEditor |
| `src/app/(app)/productions/[id]/roles/[roleId]/settings/feedback-form/page.tsx` | Create | Feedback form tab: RoleFeedbackFormFieldsEditor |
| **Apply-to-Roles Feature** | | |
| `src/lib/schemas/form-fields.ts` | Modify | Add `applyToRolesSchema` |
| `src/actions/productions/apply-pipeline-to-roles.ts` | Create | Server action: replace pipeline stages on selected roles |
| `src/actions/productions/apply-submission-form-to-roles.ts` | Create | Server action: replace submission form on selected roles |
| `src/actions/productions/apply-feedback-form-to-roles.ts` | Create | Server action: replace feedback form on selected roles |
| `src/components/productions/apply-to-roles-dialog.tsx` | Create | Shared modal with role checklist |

## Implementation Steps

### Step 1: Update Tab Navs

**`src/components/productions/production-tab-nav.tsx`** — expand tabs array:
```ts
const tabs = [
  { label: "Roles", segment: "" },
  { label: "General", segment: "/settings" },
  { label: "Pipeline", segment: "/settings/pipeline" },
  { label: "Submission form", segment: "/settings/submission-form" },
  { label: "Feedback form", segment: "/settings/feedback-form" },
] as const
```

**Fix active-tab matching:** Current logic uses `pathname.startsWith(href)` for non-root tabs. This would cause `/settings` to match `/settings/pipeline`. Change to **exact matching** for all tabs:
```ts
const isActive = pathname === href
```

**`src/components/productions/role-tab-nav.tsx`** — same pattern:
```ts
const tabs = [
  { label: "Submissions", segment: "" },
  { label: "General", segment: "/settings" },
  { label: "Pipeline", segment: "/settings/pipeline" },
  { label: "Submission form", segment: "/settings/submission-form" },
  { label: "Feedback form", segment: "/settings/feedback-form" },
] as const
```

Same exact-matching fix.

### Step 2: Split Production Settings into 4 Pages

**`src/app/(app)/productions/[id]/(production)/settings/page.tsx`** — trim to General only:
- Keep `ProductionSettingsForm`
- Remove `Separator`, `DefaultStagesEditor`, `DefaultFormFieldsEditor`, `DefaultFeedbackFormFieldsEditor`
- Keep the `<div className="mx-auto ...">` wrapper and the `<section>` with heading

**`src/app/(app)/productions/[id]/(production)/settings/pipeline/page.tsx`** — new:
- Server component, fetches production + stages (same as current settings page)
- Also fetches roles via `getRoles(production.id)` for the apply dialog
- Renders `DefaultStagesEditor` + `ApplyToRolesDialog` (settingsType="pipeline")

**`src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx`** — new:
- Server component, fetches production + roles
- Renders `DefaultFormFieldsEditor` + `ApplyToRolesDialog` (settingsType="submission-form")

**`src/app/(app)/productions/[id]/(production)/settings/feedback-form/page.tsx`** — new:
- Server component, fetches production + roles
- Renders `DefaultFeedbackFormFieldsEditor` + `ApplyToRolesDialog` (settingsType="feedback-form")

### Step 3: Split Role Settings into 4 Pages

**`src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`** — trim to General only:
- Keep `RoleSettingsForm`
- Remove pipeline/form editors and separators

**`src/app/(app)/productions/[id]/roles/[roleId]/settings/pipeline/page.tsx`** — new:
- Server component, fetches role
- Renders `RoleStagesEditor`

**`src/app/(app)/productions/[id]/roles/[roleId]/settings/submission-form/page.tsx`** — new:
- Server component, fetches role
- Renders `RoleFormFieldsEditor`

**`src/app/(app)/productions/[id]/roles/[roleId]/settings/feedback-form/page.tsx`** — new:
- Server component, fetches role
- Renders `RoleFeedbackFormFieldsEditor`

### Step 4: Schema + Server Actions

**Schema** — add to `src/lib/schemas/form-fields.ts`:
```ts
export const applyToRolesSchema = z.object({
  productionId: z.string().min(1),
  roleIds: z.array(z.string().min(1)).min(1, "Select at least one role."),
})
```

**`src/actions/productions/apply-submission-form-to-roles.ts`** (simplest):
- `secureActionClient` with `applyToRolesSchema`
- Verify production belongs to user's org
- Verify all roleIds belong to production
- Read production's `submissionFormFields` JSONB
- For each role: update `Role.submissionFormFields` with copy (fresh IDs via `generateId("ff")`)
- `revalidatePath("/", "layout")`

**`src/actions/productions/apply-feedback-form-to-roles.ts`** — same pattern for `feedbackFormFields`.

**`src/actions/productions/apply-pipeline-to-roles.ts`** (most complex due to FK constraints):
- Verify production ownership, verify roleIds
- Fetch production template stages (where `roleId IS NULL`)
- For each selected role:
  1. Build new stages via `buildStagesFromTemplate()` from `src/lib/pipeline.ts`
  2. Insert new stages
  3. Find old APPLIED stage ID and new APPLIED stage ID
  4. Reassign `Submission.stageId` from old stages → new APPLIED stage
  5. Reassign `Feedback.stageId` from old stages → new APPLIED stage
  6. Delete old stages
- Both `Submission.stageId` and `Feedback.stageId` have `onDelete: "restrict"` — must handle both before deleting old stages

### Step 5: "Apply to Existing Roles" Dialog

**`src/components/productions/apply-to-roles-dialog.tsx`** — `"use client"`

Props:
```ts
interface Props {
  productionId: string
  roles: { id: string; name: string }[]
  settingsType: "pipeline" | "submission-form" | "feedback-form"
}
```

UI:
- Trigger: `<Button variant="outline">Update existing roles</Button>` (hidden when no roles)
- Dialog:
  - Title: "Update existing roles"
  - Description varies by settingsType (e.g., "This will replace the pipeline stages on each selected role with the current production defaults.")
  - Warning alert: "Any customizations those roles have will be lost. This cannot be undone."
  - "Select all" checkbox
  - Scrollable role list with checkboxes
  - Footer: Cancel + "Apply to N roles" (disabled when 0 selected)
- Uses `useAction` for the appropriate action based on `settingsType`
- On success: close dialog, `router.refresh()`

### Subagents for Execution

- **Agent 1:** Tab navs + production pages (Steps 1, 2)
- **Agent 2:** Role pages (Step 3)
- **Agent 3:** Schema + server actions (Step 4)
- **Agent 4:** Apply-to-roles dialog (Step 5)

Agents 1-2 can start immediately (tab navs and page splitting are independent of the dialog/actions). Agents 3-4 can also start in parallel since the dialog component references actions by import but doesn't need their implementation to compile.

## Key Files to Reuse

- `src/lib/pipeline.ts` — `buildStagesFromTemplate()` for pipeline apply action
- `src/actions/productions/get-roles.ts` — `getRoles()` for fetching role list in apply dialog
- `src/actions/productions/get-production.ts` — `getProduction()` (already used)
- `src/actions/productions/get-production-stages.ts` — `getProductionStages()` (already used)
- `src/components/common/dialog.tsx` — Dialog primitives
- `src/components/common/checkbox.tsx` — Checkbox for role list

## Verification

1. `bun run lint` — no Biome errors
2. `bun run build` — successful build
3. Manual checks (tell user):
   - Production page: should show 5 tabs (Roles, General, Pipeline, Submission form, Feedback form)
   - Each tab navigates to its own page with the correct content
   - Pipeline/Submission form/Feedback form pages show defaults message + "Update existing roles" button
   - "Update existing roles" dialog shows role checkboxes + warning
   - Role page: should show 5 tabs (Submissions, General, Pipeline, Submission form, Feedback form)
   - Each role tab navigates correctly, no "update existing roles" button
