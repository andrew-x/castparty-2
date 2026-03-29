# Feature Inventory

One file per feature domain. Each doc contains enough detail to recreate the feature from scratch.

## Index

| Feature | Status | Entry Point | Doc |
|---------|--------|-------------|-----|
| Design System | `shipped` | `src/styles/globals.scss` | [design-system.md](./design-system.md) |
| Auth Flow | `shipped` | `src/app/auth/(guest)/page.tsx` | [auth.md](./auth.md) |
| App Shell (Top Nav) | `shipped` | `src/app/(app)/layout.tsx` | [app-shell.md](./app-shell.md) |
| Onboarding | `shipped` | `src/app/onboarding/page.tsx` | [onboarding.md](./onboarding.md) |
| Organizations Management | `shipped` | `src/app/(app)/settings/page.tsx` | [organizations.md](./organizations.md) |
| Accept Invitation | `shipped` | `src/app/accept-invitation/[id]/page.tsx` | [organizations.md](./organizations.md) |
| Productions List | `shipped` | `src/app/(app)/productions/page.tsx` | [productions.md](./productions.md) |
| Production Detail | `shipped` | `src/app/(app)/productions/[id]/(production)/page.tsx` | [productions.md](./productions.md) |
| Create Production | `shipped` | `src/app/(app)/productions/new/page.tsx` | [productions.md](./productions.md) |
| Production Settings | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | [productions.md](./productions.md) |
| Role Settings | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/page.tsx` | [productions.md](./productions.md) |
| Reject Reasons | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/reject-reasons/page.tsx` | [reject-reasons.md](./reject-reasons.md) |
| Email Templates | `shipped` | `src/app/(app)/productions/[id]/(production)/settings/emails/page.tsx` | [email.md](./email.md) |
| Email Storage | `shipped` | `src/lib/db/schema.ts` (`Email` table) | [email.md](./email.md) |
| Inbound Email | `shipped` | `src/app/api/webhooks/resend/route.ts` | [email.md](./email.md) |
| Admin Panel | `shipped` | `src/app/admin/page.tsx` | [admin.md](./admin.md) |
| Candidates List | `shipped` | `src/app/(app)/candidates/page.tsx` | [candidates.md](./candidates.md) |
| Candidate Detail | `shipped` | `src/app/(app)/candidates/[candidateId]/page.tsx` | [candidates.md](./candidates.md) |
| Home Dashboard | `shipped` | `src/app/(app)/home/page.tsx` | [app-shell.md](./app-shell.md) |
| Public Submission Flow | `shipped` | `src/app/s/[orgSlug]/page.tsx` | [submissions.md](./submissions.md) |
| URL Slugs | `shipped` | `src/lib/slug.ts` | [submissions.md](./submissions.md) |
| Pipeline Stages | `shipped` | `src/lib/pipeline.ts` | [pipeline.md](./pipeline.md) |
| Custom Form Fields | `shipped` | `src/lib/types.ts` | [custom-fields.md](./custom-fields.md) |
| Role Submissions Kanban | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx` | [kanban.md](./kanban.md) |
| Stage Browse | `shipped` | `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx` | [kanban.md](./kanban.md) |
| Submission Detail Sheet | `shipped` | `src/components/productions/submission-detail-sheet.tsx` | [kanban.md](./kanban.md) |
| Submission Editing | `shipped` | `src/components/productions/submission-edit-form.tsx` | [submission-editing.md](./submission-editing.md) |
| Headshot Lightbox | `shipped` | `src/components/productions/headshot-lightbox.tsx` | [kanban.md](./kanban.md) |
| Bulk Submission Status | `shipped` | `src/actions/submissions/bulk-update-submission-status.ts` | [kanban.md](./kanban.md) |
| Comparison View | `shipped` | `src/components/productions/comparison-view.tsx` | [kanban.md](./kanban.md) |
| Comments | `shipped` | `src/actions/comments/create-comment.ts` | [comments.md](./comments.md) |
| Organization Switcher | `shipped` | `src/components/organizations/org-switcher.tsx` | [organizations.md](./organizations.md) |
| R2 File Storage | `shipped` | `src/lib/r2.ts` | [submissions.md](./submissions.md) |
| Resume Upload | `shipped` | `src/components/submissions/resume-uploader.tsx` | [submissions.md](./submissions.md) |
| Feedback Panel | `shipped` | `src/components/productions/feedback-panel.tsx` | [feedback.md](./feedback.md) |
| AutocompleteInput | `shipped` | `src/components/common/autocomplete-input.tsx` | [design-system.md](./design-system.md) |
| Drawer | `shipped` | `src/components/common/drawer.tsx` | [design-system.md](./design-system.md) |
| useCityOptions | `shipped` | `src/hooks/use-city-options.ts` | [submissions.md](./submissions.md) |
| Location Fields | `shipped` | `src/lib/schemas/production.ts` | [submissions.md](./submissions.md) |
| Landing Page | `shipped` | `src/app/page.tsx` | [app-shell.md](./app-shell.md) |
| Email Verification | `shipped` | `src/app/auth/verify-email/page.tsx` | [auth.md](./auth.md) |
| Password Reset | `shipped` | `src/app/auth/reset-password/page.tsx` | [auth.md](./auth.md) |
| Admin Organizations | `shipped` | `src/app/admin/organizations/page.tsx` | [admin.md](./admin.md) |
| Email Emulator | `dev-only` | `src/app/admin/emails/page.tsx` | [email.md](./email.md) |
| Admin: Simulate Inbound Email | `dev-only` | `src/app/admin/simulate-email/page.tsx` | [admin.md](./admin.md) |
| 404 Page | `shipped` | `src/app/not-found.tsx` | [app-shell.md](./app-shell.md) |
| Route Error Page | `shipped` | `src/app/error.tsx` | [app-shell.md](./app-shell.md) |
| Global Error Page | `shipped` | `src/app/global-error.tsx` | [app-shell.md](./app-shell.md) |

## Adding a Feature

1. Find the feature domain file in `docs/features/` that best fits your feature
2. If no existing file fits, create a new one using the template in `.claude/agents/librarian.md`
3. Add a row to the inventory table above, linking to the doc file
