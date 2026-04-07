# Home Dashboard Design

## Context

The current home page shows a grid of production cards with basic counts. We're replacing it with a proper dashboard that gives casting directors an at-a-glance view of their active work: production pipeline health, incoming emails, and recent team activity.

**Target user**: Community theatre casting directors managing 1-5 productions at a time.

## Page Structure

**Layout**: Stacked sections — welcome header, then full-width productions widget, then emails and comments/feedback side-by-side in a 2-column grid.

**Route**: `src/app/(app)/home/page.tsx` (replaces existing implementation)

**Header**:
- Left: "Welcome, {firstName}."
- Right: "Create Production" button (links to `/productions/new`)

**Empty state**: When no open or closed productions exist, the entire dashboard is replaced with a single centered empty state using the existing `Empty` component (dashed border, clapperboard icon, "No productions yet" title, description text, CTA button to create production). The emails/comments widgets are not shown in this state.

## Widget 1: Open Productions

Full-width widget showing all non-archived productions.

**Each production row displays**:
- Production name (clickable, links to `/productions/{id}`)
- Creation date as subtitle (e.g., "Created Mar 15")
- Role count in subtitle (e.g., "5 roles")
- Colored pill badges for submission counts by pipeline stage type:
  - `{n} applied` — violet (`bg-violet-100 text-violet-700`)
  - `{n} in review` — amber (`bg-amber-100 text-amber-700`) — aggregates all CUSTOM stage submissions
  - `{n} selected` — green (`bg-green-100 text-green-700`)
  - `{n} rejected` — red (`bg-red-100 text-red-700`)

**Data query**: New `getDashboardProductions()` function that returns productions with submission counts grouped by pipeline stage type (APPLIED, CUSTOM, SELECTED, REJECTED). Builds on the existing `getProductionsWithSubmissionCounts()` pattern but adds stage-type grouping.

**Component**: `src/components/home/productions-widget.tsx`

## Widget 2: Recent Inbound Emails

Left column of the bottom 2-column grid. Shows the 10 most recent inbound emails.

**Each email row displays**:
- From email address
- Subject line (truncated)
- Relative timestamp (e.g., "2 hours ago") — use `dayjs` via project wrapper
- Link to the associated submission if `submissionId` exists

**Data query**: New `getRecentInboundEmails()` — filters `Email` table by `direction = 'inbound'` and current org, ordered by `sentAt DESC`, limit 10.

**Component**: `src/components/home/emails-widget.tsx`

## Widget 3: Recent Comments & Feedback

Right column of the bottom 2-column grid. Shows the 10 most recent comments and feedback mixed together, sorted by creation date.

**Each item displays**:
- **Comments**: Author name, comment text (truncated to ~100 chars), relative timestamp, link to submission
- **Feedback**: Author name, rating badge (STRONG_YES / YES / NO / STRONG_NO with appropriate colors), notes (truncated), relative timestamp, link to submission

**Data query**: New `getRecentActivity()` — unions `Comment` and `Feedback` tables, joins `User` for author names, joins `Submission` for production/role context, orders by `createdAt DESC`, limit 10.

**Component**: `src/components/home/activity-widget.tsx`

## File Structure

```
src/
├── actions/
│   └── dashboard/
│       └── index.ts          # getDashboardProductions, getRecentInboundEmails, getRecentActivity
├── app/(app)/home/
│   └── page.tsx              # Replace existing — server component orchestrating widgets
└── components/home/
    ├── productions-widget.tsx # Production cards with stage badges
    ├── emails-widget.tsx      # Inbound email list
    └── activity-widget.tsx    # Comments + feedback mixed list
```

## Component Reuse

- `Page`, `PageHeader`, `PageContent` from `@/components/common/page`
- `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` from `@/components/common/empty`
- `Badge` from `@/components/common/badge`
- `Button` from `@/components/common/button`
- `dayjs` from `@/lib/dayjs` for relative timestamps
- `checkAuth` from `@/lib/auth/auth-util` for auth

## Design Tokens

Use semantic spacing: `gap-section` between widgets, `gap-block` between items within a widget, `px-page` for page padding. Typography: `text-title` for welcome, `text-heading` for widget headers, `text-label` for production names, `text-caption` for metadata.

## Out of Scope

- Real-time updates / polling
- Customizable widget layout
- Summary stat cards (total candidates, weekly submissions, etc.)
- Notification badges on nav
