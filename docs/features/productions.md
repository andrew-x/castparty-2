# Productions

> **Last verified:** 2026-04-05

## Overview
Productions are the central organizing unit of Castparty. Each production represents a show, event, or project that an organization is casting. Productions contain roles, a configurable casting pipeline, custom forms, email templates, and reject reasons. They map to "Jobs" in the ATS analogy -- roles within a production are the individual positions being cast.

Productions serve casting directors (the primary user) by giving them a single workspace where they can configure their audition process, receive submissions, and track candidates through the pipeline.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions` | `ProductionsPage` | Authenticated + active org | `ProductionsTable` (TanStack Table) with sortable columns, search, and status filter tabs |
| `/productions/new` | `NewProductionPage` | Authenticated + active org | 5-step create wizard |
| `/productions/[id]` | `ProductionPage` (via layout) | Authenticated + active org | Production overview with submissions Kanban per role |
| `/productions/[id]/roles` | `RolesPage` | Authenticated + active org | Left-right split: role list + inline role settings form |
| `/productions/[id]/settings` | `ProductionSettingsPage` | Authenticated + active org | General settings (name, slug, location, status) |
| `/productions/[id]/settings/pipeline` | `ProductionPipelinePage` | Authenticated + active org | Pipeline stage editor |
| `/productions/[id]/settings/submission-form` | Submission form settings | Authenticated + active org | Custom field builder for submission forms |
| `/productions/[id]/settings/feedback-form` | Feedback form settings | Authenticated + active org | Custom field builder for feedback forms |
| `/productions/[id]/settings/reject-reasons` | `ProductionRejectReasonsPage` | Authenticated + active org | Configurable rejection reason labels |
| `/productions/[id]/settings/emails` | Email templates settings | Authenticated + active org | Per-production email template customization |

All routes are nested inside a `(production)` route group that provides a shared layout with breadcrumbs, share controls (URL + QR code), and a sub-nav sidebar.

## Data Model

### Production table
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Format: `prod_*` (CUID) |
| `organizationId` | `text` FK | Scoped to one org; cascades on delete |
| `name` | `text` | Required, max 100 chars |
| `slug` | `text` | Unique within org (`production_org_slug_uidx`) |
| `description` | `text` | Default `""` |
| `status` | `production_status` enum | `"open"` / `"closed"` / `"archive"`, default `"closed"` |
| `location` | `text` | Free-text, default `""` |
| `banner` | `text` | Nullable; URL of uploaded banner image stored in R2 |
| `submissionFormFields` | `jsonb` (`CustomForm[]`) | Custom fields for the public submission form |
| `systemFieldConfig` | `jsonb` (`SystemFieldConfig`) | Visibility of system fields (phone, location, headshots, resume, links) |
| `feedbackFormFields` | `jsonb` (`CustomForm[]`) | Custom fields for internal feedback forms |
| `rejectReasons` | `jsonb` (`string[]`) | Predefined rejection reason labels |
| `emailTemplates` | `jsonb` (`EmailTemplates` or null) | Templates for submission-received, rejected, and selected emails |
| `createdAt` / `updatedAt` | `timestamp` | Auto-managed |

### Role table
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Format: `role_*` |
| `productionId` | `text` FK | Always scoped to a production; cascades on delete |
| `name` | `text` | Required, max 100 chars |
| `slug` | `text` | Unique within production (`role_production_slug_uidx`) |
| `description` | `text` | Default `""` |
| `referencePhotos` | `jsonb` (`string[]`) | Array of R2 image URLs used as visual references for the role; default `[]` |
| `status` | `production_status` enum | Reuses the same enum: `"open"` / `"closed"` / `"archive"` |
| `createdAt` / `updatedAt` | `timestamp` | Auto-managed |

### Key relationships
- `Production` 1:N `Role` (roles are production-scoped)
- `Production` 1:N `PipelineStage` (pipeline is production-level)
- `Production` 1:N `Submission` (via roles)
- `Role` 1:N `Submission`

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Production, Role, PipelineStage table definitions + relations |
| `src/lib/schemas/production.ts` | Zod schemas for create/update production |
| `src/lib/schemas/role.ts` | Zod schemas for update role |
| `src/lib/pipeline.ts` | Default stage definitions, `buildProductionStages()`, `buildCustomProductionStages()` |
| `src/lib/types.ts` | `CustomForm`, `SystemFieldConfig`, `EmailTemplates` types |
| `src/lib/slug.ts` | `nameToSlug()`, `validateSlug()`, `generateUniqueSlug()` |
| `src/actions/productions/create-production.ts` | `createProduction` server action |
| `src/actions/productions/update-production.ts` | `updateProduction` server action |
| `src/actions/productions/create-role.ts` | `createRole` server action |
| `src/actions/productions/update-role.ts` | `updateRole` server action |
| `src/actions/productions/get-production.ts` | Fetch single production (with org) |
| `src/actions/productions/get-productions-with-submission-counts.ts` | List page query with role/submission counts |
| `src/actions/productions/get-production-submissions.ts` | Deep fetch for production detail page (roles, submissions, files, feedback, comments, emails) |
| `src/actions/productions/check-slug.ts` | Async slug uniqueness check during wizard |
| `src/components/productions/create-production-form.tsx` | 5-step create wizard (client component) |
| `src/components/productions/production-settings-form.tsx` | General settings form (name, slug, location, status) |
| `src/components/productions/production-card.tsx` | Card component (used in create wizard roles step; not used on the list page) |
| `src/components/productions/productions-table.tsx` | `ProductionsTable` — TanStack Table data table for the productions list page |
| `src/actions/productions/presign-banner-upload.ts` | Presigns an R2 upload URL for a production banner image |
| `src/components/productions/production-sub-nav.tsx` | Sub-navigation (8 items) |
| `src/components/productions/roles-manager.tsx` | Left-right split role list + inline settings |
| `src/components/productions/create-role-dialog.tsx` | Dialog for creating a new role |
| `src/components/productions/role-settings-form.tsx` | Role edit form (name, description, slug, status) |
| `src/components/productions/production-share-controls.tsx` | Share URL + QR code in header |

## How It Works

### Create Production Wizard (5 Steps)

The wizard is a single client component (`CreateProductionForm`) that manages five steps as local state. No data is persisted until the final submit.

1. **Details** -- Name (required), description, location (with city autocomplete), URL slug (auto-filled from name, user-editable). On "Continue," form fields are validated and the slug is checked for uniqueness via `checkSlugAvailability`.

2. **Casting Pipeline** -- Displays system stages (Applied, Selected, Rejected) as locked entries and three default custom stages (Screening, Audition, Callback) as editable/removable entries. Users can add, remove, and reorder custom stages via drag-and-drop (`@dnd-kit`). Managed entirely in local state (`customStages`).

3. **Submission Form** -- Custom field builder for the public submission form. Side-by-side layout: editor on the left, live preview on the right (desktop). Supports TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE field types.

4. **Feedback Form** -- Same field builder for internal feedback forms used by the production team when reviewing candidates. Also has a live preview.

5. **Roles** -- Dynamic list of role cards (name + optional description). Users can add/remove roles or skip this step entirely.

**Submit:** Calls `createProduction` action which runs in a transaction:
- Inserts `Production` row (status defaults to `"open"`, seeded with `DEFAULT_REJECT_REASONS`)
- Inserts `PipelineStage` rows (custom stages if user defined them, otherwise defaults)
- Inserts `Role` rows with auto-generated slugs (deduped in memory)
- Redirects to `/productions/[id]`

### Production Detail Page

The layout (`ProductionLayout`) fetches the production, renders breadcrumbs, share controls, and a sub-nav. The default page (`ProductionPage`) fetches all submissions across all roles using `getProductionSubmissions`, which performs a deep relational query and returns flattened submissions with headshots, resume, feedback, comments, stage changes, and emails.

### Production Settings

The general settings form (`ProductionSettingsForm`) shows name, location, slug, and a radio group for status (`open` / `closed` / `archive`). Each status has a clear description:
- **Open**: Accepting auditions, publicly visible
- **Closed**: Not accepting auditions, visible to team
- **Archive**: Done casting, data kept but hidden

The form has a "dirty" check -- the Save button is disabled until changes are detected.

### Role Management

Roles are managed on the `/productions/[id]/roles` page via `RolesManager`:
- **Left panel**: Scrollable role list with status badges (Open/Closed/Archived), selected role highlighted with brand border. "Show archived" toggle.
- **Right panel**: `RoleSettingsForm` for the selected role (name, description, slug, status).
- **Create**: `CreateRoleDialog` opened via "New" button. Creates role with auto-generated slug, refreshes the page.

### Productions List

`ProductionsPage` fetches productions with aggregated role and submission counts. The list renders as a `ProductionsTable` — a TanStack Table data table (`src/components/productions/productions-table.tsx`) with sortable columns (name, date, roles, submissions), full-text search, and status filter tabs (All / Open / Closed / Archive). Empty state shows a CTA to create the first production.

## Business Logic

### Status Enum
Both `Production.status` and `Role.status` use the same `production_status` pgEnum with values `"open"`, `"closed"`, `"archive"`. Default is `"closed"`. Created productions start as `"open"` (set in `createProduction` action). Created roles also start as `"open"`.

### Slug Rules
- 3-60 characters, lowercase alphanumeric + hyphens
- Cannot be purely numeric
- Cannot be a reserved slug (from `RESERVED_SLUGS` set)
- Production slugs unique within org; role slugs unique within production
- Auto-generated format: `{name-slug}-{8-char-cuid}`

### Authorization
All read actions verify `user.activeOrganizationId` matches the production's `organizationId`. All write actions use `secureActionClient` which requires authentication. There is no role-based (admin/member) authorization gate on production CRUD -- any org member can create/edit.

### Cascade Deletes
- Deleting an organization cascades to productions
- Deleting a production cascades to roles, pipeline stages, and submissions
- Deleting a role cascades to submissions

## UI States
- **Loading**: Server components render after data fetch; no explicit loading states on list/detail pages
- **Empty (productions list)**: Full-page empty state with icon, copy, and "Create production" CTA
- **Empty (roles)**: Empty state with "New role" CTA
- **Error (create form)**: Root form error displayed as a destructive Alert above the submit button
- **Error (settings)**: Root form error displayed as a destructive Alert
- **Dirty tracking**: Settings forms disable Save until changes are detected

## Integration Points
- [Pipeline Stages](./pipeline.md) -- Pipeline is production-scoped; configured in step 2 of create wizard and settings
- [Reject Reasons](./reject-reasons.md) -- Stored as JSONB on Production; seeded with defaults on create
- [Custom Fields](./custom-fields.md) -- Submission and feedback form fields stored as JSONB on Production
- [Email](./email.md) -- Email templates stored as JSONB on Production
- [Submissions](./submissions.md) -- Public submission flow uses org slug + production slug + role slug for URLs

## Architecture Decisions
- **Status enum over booleans**: `production_status` enum (`open`/`closed`/`archive`) replaced earlier `isOpen`/`isArchived` booleans to avoid impossible states and simplify queries. Both Production and Role reuse the same enum.
- **Wizard as local state**: The 5-step wizard holds all data in React state and submits atomically. This avoids partial creation states and draft management complexity.
- **Roles scoped to productions, not standalone**: Roles only exist within a production context. There is no global role entity. This matches the performing arts domain where roles are show-specific.
- **JSONB for configuration**: Submission form fields, feedback form fields, reject reasons, email templates, and system field config are stored as JSONB columns rather than normalized tables. This simplifies the schema and avoids complex joins for configuration data that is always read/written as a unit.
- **Production-level pipeline**: All roles in a production share the same pipeline stages. This was chosen over per-role pipelines for simplicity, matching how most community theatre productions run a unified audition process.
