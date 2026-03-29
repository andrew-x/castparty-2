# Codebase Audit Report

**Scope:** 287 files audited across 6 domains
**Lint:** fail — 1 error (tsconfig.json formatting), 1 info (biome.json schema version mismatch)
**Build:** fail — `node_modules` not installed (not a code issue)

## Executive Summary

The codebase is in solid shape architecturally — auth guards are consistent, server/client boundaries are well-maintained, and most conventions are followed. The biggest areas for improvement are: **inline schemas** scattered across 20+ files instead of centralized in `src/lib/schemas/`, **raw Tailwind values** bypassing the design token system (colors and font sizes), and a **missing transaction** in the ownership transfer action that could leave an org ownerless on failure.

---

## Critical (5)

1. **src/actions/organizations/transfer-ownership.ts:56-76**: Multi-mutation without transaction
   - **Domain:** Database Layer
   - **Impact:** Two sequential `db.update(member)` calls (demote + promote). If the second fails, the manual rollback in `catch` is not atomic — a network error during rollback leaves the org with no owner.
   - **Fix:** Wrap both updates in `db.transaction()`.

2. **src/actions/admin/get-orphaned-orgs.ts:7**: Missing `IS_DEV` guard on admin read function
   - **Domain:** Architecture & Security
   - **Impact:** `"use server"` export callable directly from any client component, bypassing the admin layout guard. In production, exposes all org names, slugs, dates, and counts.
   - **Fix:** Add `if (!IS_DEV) throw new Error("Not available in production")` to match `get-users.ts`.

3. **src/app/admin/layout.tsx:27-31**: DB mutation directly in layout component
   - **Domain:** Database Layer
   - **Impact:** Violates the rule that all DB operations live in `src/actions/`. The auto-promote logic runs `db.update(user)` in a layout file.
   - **Fix:** Extract into a server action in `src/actions/admin/`.

4. **src/components/productions/create-role-dialog.tsx**: Triple form convention violation
   - **Domain:** Forms & Validation
   - **Impact:** Uses separate `useForm` + `useAction` (not `useHookFormAction`), raw `zodResolver` (not `formResolver`), and inline schema (not from `src/lib/schemas/`). Sets a bad precedent.
   - **Fix:** Refactor to `useHookFormAction` + `formResolver`, move schema to `src/lib/schemas/role.ts`.

5. **src/components/productions/email-templates-form.tsx:51,63**: "performer" instead of "candidate"
   - **Domain:** Design System & UI Copy
   - **Impact:** Violates domain terminology rule. Users see inconsistent language across the product.
   - **Fix:** Change "performer" to "candidate" in both strings.

---

## Important (18)

**TypeScript Quality (4)**
- **src/components/productions/reject-reasons-editor.tsx:17,37**: `action: any` prop + `as never` cast — Type properly with union/generic.
- **src/components/productions/create-production-form.tsx:301**: `handleSubmit as any` — Type the adapter function.
- **src/components/productions/feedback-panel.tsx:692**: `register: (name: any) => any` — Use `UseFormRegister<T>`.
- **src/lib/types.ts:7-31**: Three `type` definitions that should be `interface` (CustomForm, CustomFormResponse, SystemFieldConfig).

**Database Layer (2)**
- **src/actions/organizations/update-organization.ts:53-75**: Two mutations via `Promise.all()` without transaction — org name and profile can desync on partial failure. Wrap in `db.transaction()`.
- **src/actions/organizations/get-member-role.ts:7-17**: Accepts arbitrary `organizationId`/`userId` with no auth check — could probe any user's role in any org.

**Forms & Validation (4)**
- **6 component files with inline schemas**: change-role-dialog, invite-member-dialog, add-user-dialog, change-password-dialog, create-org-dialog, email-templates-form — Move to `src/lib/schemas/`.
- **15+ action files with inline schemas**: add-production-stage, remove-production-stage, reorder-production-stages, update-production-reject-reasons, check-slug, create-user, change-password, delete-organization, delete-user, set-active-organization, update-member-role, update-organization-profile, cancel-invitation, remove-member, transfer-ownership, presign-headshot-upload, presign-resume-upload — Move to `src/lib/schemas/`.
- **src/components/productions/email-templates-form.tsx:105**: Passes action schema (with `productionId`) to `formResolver` instead of form-only schema.
- **src/lib/schemas/form-fields.ts:17**: Missing `.trim()` on `z.string().max(200)` option labels.

**Design System & UI (6)**
- **src/components/productions/roles-manager.tsx:145**: Raw `bg-emerald-*` colors on status badge — Use semantic success token.
- **src/components/common/preview-link-buttons.tsx:40**: Raw `text-green-600` — Use semantic token.
- **src/components/app/top-nav.tsx:109, src/components/common/sidebar.tsx:263**: Icon-only buttons missing `tooltip` prop.
- **src/components/app/top-nav.tsx:168, src/components/common/sub-nav.tsx:94, src/components/organizations/org-switcher.tsx:95,98**: Arbitrary font-size values (`text-[13.5px]`, `text-[13px]`, `text-[11px]`) — Use typography tokens.
- **src/components/productions/feedback-panel.tsx:68-71, feedback-form-preview.tsx:12-15**: Em dashes in rating labels ("4 — Strong yes") — Replace with hyphens or colons.
- **~10 files**: Raw `text-sm`/`text-xs` instead of `text-label`/`text-caption` tokens.

**Architecture & Security (2)**
- **src/actions/submissions/create-submission.ts:114**: `CHECKBOX_GROUP` required-field validation uses generic `!value?.trim()` — Add explicit branch that splits on comma.
- **src/actions/submissions/presign-headshot-upload.ts:41, presign-resume-upload.ts:22**: Public presigned upload endpoints with no rate limiting — anyone can generate unlimited R2 upload URLs.

---

## Minor (10)

- **~10 files in src/lib/, src/components/, src/actions/**: Relative imports instead of `@/*` path alias.
- **src/components/productions/form-fields-editor.tsx:107**: `type FieldDraft` should be `interface`.
- **src/components/common/sidebar.tsx:34**: `type SidebarContextProps` should be `interface`.
- **src/components/productions/feedback-form-preview.tsx:1, submission-form-preview.tsx:1**: Unnecessary `"use client"` directives — no hooks/state/interactivity.
- **src/components/productions/consider-for-role-dialog.tsx:160, stage-controls.tsx:60**: Raw `<button>` for list items — consider `Button variant="ghost"`.
- **src/components/common/preview-link-buttons.tsx:34**: Raw `<button>` for copy action — use `Button variant="ghost" size="icon"`.
- **src/actions/productions/create-production.ts:50-59, check-slug.ts:18-26**: `db.select()` for simple reads instead of `db.query.*`.
- **src/lib/schemas/organization.ts:5**: Form schema missing `.max(100)` that action schema has.
- **src/components/common/calendar.tsx:93,102**: Arbitrary `text-[0.8rem]` — use typography token.
- **src/components/organizations/pending-invites-button.tsx:29, roles-manager.tsx:134,143**: Arbitrary `text-[10px]` on badges — use `text-caption`.

---

## Systemic Patterns

| Pattern | Occurrences | Severity | Example File |
|---------|-------------|----------|--------------|
| Inline schemas (not in `src/lib/schemas/`) | 20+ files | Important | `create-role-dialog.tsx`, `add-production-stage.ts` |
| Raw `text-sm`/`text-xs` instead of typography tokens | ~10 files | Important | `reject-reason-dialog.tsx`, `email-templates-form.tsx` |
| Arbitrary font-size values | 6 instances | Important | `top-nav.tsx`, `sub-nav.tsx`, `org-switcher.tsx` |
| Relative imports within `src/` | ~10 files | Minor | `logger.ts`, `action.ts`, `members-table.tsx` |
| `type` instead of `interface` for object shapes | 5 instances | Minor | `types.ts`, `form-fields-editor.tsx`, `sidebar.tsx` |

---

## Known Issues Update

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 3 | Custom field required-validation | Partially fixed | `TOGGLE` fixed; `CHECKBOX_GROUP` still uses generic path |
| 8 | `getPublicProduction` doesn't filter closed | **Fixed** | Now checks `production.status !== "open"` and returns null |
| 10 | Bare `zod` in auth schemas | Open | `src/lib/action.ts` also uses bare `zod` (likely next-safe-action compat) — document as exception |

---

## Documentation Sync

**Applied by librarian:**
- `docs/ARCHITECTURE.md`: Updated route tree (removed stale per-role routes, added `emails/` settings route)
- `docs/ARCHITECTURE.md`: Updated data model (`isOpen` boolean → `status` enum on Production and Role, added `emailTemplates` column)

**Remaining (not yet applied):**
- Mark Known Issue #8 as fixed in `docs/ARCHITECTURE.md`
- Update stale file paths in `docs/features/README.md` (3 entries reference removed per-role routes)
- Add update timestamp note

**Gaps identified:**
- Account Settings and Members Settings routes exist but aren't listed in the feature inventory table
- File path references in `docs/features/productions.md` don't include `(production)` route group (URLs are correct, filesystem paths are slightly off)

---

## Health Scores

| Domain | Grade | Summary |
|--------|-------|---------|
| TypeScript Quality | **B+** | A few `any` types and `type` vs `interface` issues, but overall clean |
| React Patterns | **A-** | Excellent. Only 2 unnecessary `"use client"` and a couple raw `<button>` uses |
| Database Layer | **B** | Strong patterns overall, but critical missing transaction in ownership transfer |
| Forms & Validation | **C+** | 20+ inline schemas, one fully non-compliant form. Core pattern is good where followed |
| Design System & UI | **C+** | Raw colors, arbitrary font sizes, and terminology inconsistency undermine the token system |
| Architecture & Security | **A-** | Auth guards solid, one unprotected admin endpoint, presign URLs lack rate limiting |
