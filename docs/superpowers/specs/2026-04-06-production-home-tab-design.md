# Production Home Tab Design

## Context

The production page currently drops users straight into the submissions kanban. There's no high-level overview of how the production is performing. A "Home" dashboard tab gives the production team an at-a-glance summary: where submissions are in the pipeline, how fast they're coming in, and why candidates are being rejected. This is especially valuable for community theatre teams who may not check in daily and need a quick read on progress.

## Route Changes

- `/productions/[id]` renders the **Home** dashboard (new default tab)
- `/productions/[id]/submissions` renders the **Submissions** kanban (moved from root)
- SubNav updated: Home (HomeIcon) as first item, Submissions (UsersIcon) second

No redirect needed. Existing bookmarks to `/productions/[id]` land on the new Home tab, which is the desired default.

## Data Fetching

New lean server action `getProductionDashboard` in `src/actions/productions/get-production-dashboard.ts`.

Fetches only the fields the dashboard needs:
- `submissions`: `id`, `stageId`, `roleId`, `createdAt`, `rejectionReason`
- `pipelineStages`: `id`, `name`, `order`, `type`
- `roles`: `id`, `name`
- `rejectReasons`: string[] from production record

This avoids the heavyweight `getProductionSubmissions` which pulls candidates, files, feedback, comments, pipeline updates, and emails.

## Components

All dashboard components live in `src/components/productions/dashboard/`.

### `production-dashboard.tsx` (client component)

Orchestrates the filter and three widgets. Props:
- `submissions`, `pipelineStages`, `roles`, `rejectReasons`
- `shareUrl`, `shareHref` (for the zero-submissions empty state)

State: `selectedRoleId` (defaults to all roles).

Layout:
- Role filter Select at top (only shown when > 1 role)
- Funnel chart full width (most prominent widget)
- Two-column grid: inbound chart (left), reject reasons pie (right)
- Each widget wrapped in a shadcn Card with CardHeader title

### `funnel-chart.tsx`

Horizontal bar chart showing every pipeline stage in order.
- Y axis: stage names (in pipeline order)
- X axis: count of submissions currently in that stage
- Uses recharts `BarChart` with `layout="vertical"` in a shadcn `ChartContainer`
- Colors cycle through chart tokens (`--chart-1` through `--chart-5`)
- Empty state: "No submissions match this filter"

### `inbound-chart.tsx`

Bar chart showing submissions received per day over the last 7 days.
- Always shows all 7 days (including zero-count days)
- X axis: day labels (e.g., "Mar 31", "Apr 1")
- Y axis: submission count
- Uses `dayjs` from `@/lib/dayjs` for date bucketing
- Empty state: "No submissions in the last 7 days"

### `reject-reasons-chart.tsx`

Pie chart showing breakdown of rejection reasons.
- Only includes submissions in REJECTED-type stages
- Slices: one per distinct rejection reason
- Submissions with no reason grouped as "No reason given"
- Colors cycle through chart tokens
- Includes legend below the pie
- Empty state: "No rejected submissions"

## Role Filter

A Select dropdown above the charts. Options:
- "All roles" (default, value: `""`)
- One option per role (value: role ID)

Only rendered when `roles.length > 1`. Filters all three widgets simultaneously.

## Empty States

### Zero total submissions
Full-page empty state using the `Empty` component pattern:
- Icon: InboxIcon
- Title: "You don't have any submissions yet"
- Description: "Share your submission link to start receiving candidates."
- Content: Renders a `ShareLink` component with the production's public URL and copy button

### Filter yields no data
Each chart component handles its own empty state with contextual messages.

## Dependencies

- `recharts` — charting library (install via `bun add recharts`)
- shadcn `chart` component — `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` (install via `bunx shadcn@latest add chart`)
- shadcn `card` component — `Card`, `CardHeader`, `CardTitle`, `CardContent` (install via `bunx shadcn@latest add card`)

## Files

### New
| File | Purpose |
|------|---------|
| `src/actions/productions/get-production-dashboard.ts` | Lean dashboard data query |
| `src/components/productions/dashboard/production-dashboard.tsx` | Main dashboard client component |
| `src/components/productions/dashboard/funnel-chart.tsx` | Pipeline funnel bar chart |
| `src/components/productions/dashboard/inbound-chart.tsx` | Last-7-days submissions bar chart |
| `src/components/productions/dashboard/reject-reasons-chart.tsx` | Rejection reasons pie chart |
| `src/app/(app)/productions/[id]/(production)/submissions/page.tsx` | Submissions page at new route |
| `src/components/common/chart.tsx` | shadcn chart primitives (generated) |
| `src/components/common/card.tsx` | shadcn card component (generated) |

### Modified
| File | Change |
|------|--------|
| `src/app/(app)/productions/[id]/(production)/page.tsx` | Replace submissions with Home dashboard |
| `src/components/productions/production-sub-nav.tsx` | Add Home as first nav item, update Submissions href |

## Verification

1. Navigate to `/productions/[id]` — should show Home dashboard
2. SubNav should highlight "Home" as active
3. Click "Submissions" in SubNav — should show the kanban at `/productions/[id]/submissions`
4. With submissions data: funnel shows stages, inbound shows last 7 days, pie shows reject reasons
5. Role filter scopes all three widgets
6. With no submissions: shows empty state with share link
7. With submissions but filter yielding nothing: per-widget empty states
8. Run `bun run build` to verify no type errors
9. Run `bun run lint` to verify Biome compliance
