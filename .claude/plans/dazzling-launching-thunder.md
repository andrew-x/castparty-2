# Plan: Production Home Tab

## Context

The production page currently drops users into the submissions kanban with no overview. Adding a "Home" dashboard tab gives the production team at-a-glance stats: pipeline funnel, inbound submission trends, and rejection reason breakdown. Home becomes the default tab; submissions moves to `/submissions`.

Design spec: `docs/superpowers/specs/2026-04-06-production-home-tab-design.md`

## Step 1: Install dependencies and generate shadcn components

**Agent:** Shell commands (no subagent needed)

1. `bun add recharts`
2. `bunx shadcn@latest add chart card`

**Verify:** `src/components/common/chart.tsx` and `src/components/common/card.tsx` exist

## Step 2: Move submissions to `/submissions` route

**Agent:** Direct edit

1. Create `src/app/(app)/productions/[id]/(production)/submissions/page.tsx`
   - Copy contents of current `src/app/(app)/productions/[id]/(production)/page.tsx` verbatim

**Key files:**
- `src/app/(app)/productions/[id]/(production)/page.tsx` (source)

## Step 3: Update SubNav

**Agent:** Direct edit

Modify `src/components/productions/production-sub-nav.tsx`:
1. Add `HomeIcon` to lucide imports
2. Insert `{ label: "Home", href: basePath, icon: HomeIcon }` as first item
3. Change Submissions href from `basePath` to `` `${basePath}/submissions` ``

## Step 4: Create dashboard server action

**Agent:** Direct edit

Create `src/actions/productions/get-production-dashboard.ts`:
- Uses `db.query.Production.findFirst` with minimal column selection
- Fetches `pipelineStages` (ordered by `asc(order)`), `roles` with nested `submissions` (only `id`, `stageId`, `createdAt`, `rejectionReason` columns), and `rejectReasons`
- Flattens `roles[].submissions[]` into flat array tagged with `roleId`
- Returns `{ submissions, pipelineStages, roles, rejectReasons }`
- Pattern: follow `getProductionSubmissions` auth check and query structure

**Key files to reference:**
- `src/actions/productions/get-production-submissions.ts` (auth pattern, query pattern)
- `src/lib/db/schema.ts` (table/column names)

## Step 5: Build chart components

**Agent:** Subagent-driven development (3 parallel agents for the 3 charts, then 1 for the orchestrator)

### 5a. `src/components/productions/dashboard/funnel-chart.tsx`
- `"use client"` component
- Props: `submissions` (filtered), `pipelineStages`
- Compute stage counts: group by `stageId`, map to stage name/order
- Recharts `BarChart` with `layout="vertical"`, `Bar`, `XAxis`, `YAxis` inside `ChartContainer`
- Colors: cycle `hsl(var(--chart-N))` where N = `(index % 5) + 1`
- `ChartTooltip` with `ChartTooltipContent` for hover
- Empty state: `<Empty>` with "No submissions match this filter"

### 5b. `src/components/productions/dashboard/inbound-chart.tsx`
- `"use client"` component
- Props: `submissions` (filtered)
- Compute day buckets: use `dayjs` from `@/lib/dayjs`, generate all 7 days including zero-count
- Format labels: `day.format("MMM D")` (e.g., "Apr 1")
- Recharts `BarChart` with `Bar`, `XAxis`, `YAxis` inside `ChartContainer`
- Single color: `hsl(var(--chart-1))`
- Empty state: `<Empty>` with "No submissions in the last 7 days"

### 5c. `src/components/productions/dashboard/reject-reasons-chart.tsx`
- `"use client"` component
- Props: `submissions` (filtered), `pipelineStages` (to identify REJECTED stages), `rejectReasons`
- Filter to REJECTED-stage submissions, group by `rejectionReason`
- Null/empty reasons grouped as "No reason given"
- Recharts `PieChart` with `Pie` inside `ChartContainer`
- `ChartTooltip`, `ChartLegend` with `ChartLegendContent`
- Empty state: `<Empty>` with "No rejected submissions"

### 5d. `src/components/productions/dashboard/production-dashboard.tsx`
- `"use client"` component (needs state for role filter)
- Props: `submissions`, `pipelineStages`, `roles`, `rejectReasons`, `shareUrl`, `shareHref`
- State: `selectedRoleId` (string, default `""` = all)
- Zero submissions: render full `Empty` with share link (`ShareLink` from `@/components/common/share-link`)
- Layout with filter + 3 chart cards using `gap-section` spacing
- Funnel chart full width in a `Card`
- Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-group`) for inbound + reject reasons

## Step 6: Wire up the Home page route

**Agent:** Direct edit

Replace `src/app/(app)/productions/[id]/(production)/page.tsx` with:
- Server component importing `getProduction`, `getProductionDashboard`, `ProductionDashboard`
- Compute `shareUrl` and `shareHref` from production's org/slug
- Pass all data to `<ProductionDashboard>`
- Keep `generateMetadata` for the title

**Key files to reference:**
- `src/app/(app)/productions/[id]/(production)/layout.tsx` (how shareUrl is computed)
- `src/actions/productions/get-production.ts` (existing production fetch)

## Step 7: Update seed data

**Agent:** Direct edit

Ensure `src/actions/admin/seed-data.ts` generates enough submissions with varied:
- `createdAt` dates across the last 7 days
- `rejectionReason` values (using the seeded reject reasons)
- Distribution across stages and roles

This ensures the dashboard has meaningful data to display during development.

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — Biome passes
3. Navigate to `/productions/[id]` — Home dashboard renders
4. SubNav: "Home" highlighted, "Submissions" links to `/productions/[id]/submissions`
5. Charts display data correctly with seeded submissions
6. Role filter scopes all widgets
7. Zero-submission state shows share link
8. Filter-no-match states render per widget
