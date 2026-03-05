# Update Candidates Table: Name, Email, Roles (with server-side sort + pagination)

## Context

The candidates table currently shows Name, Email, Phone, and Added columns using a simple static HTML table. We need to replace it with a sortable, paginated table showing Name, Email, and Roles (with production/role/stage info from submissions). Sorting and pagination are server-side with state in URL search params.

## Changes

### 1. Update `getCandidates` query (`src/actions/candidates/get-candidates.ts`)

Accept sort/pagination params and return paginated results with total count.

```ts
interface GetCandidatesParams {
  sort?: "name" | "email"
  dir?: "asc" | "desc"
  page?: number       // 1-based
  pageSize?: number   // default 25
}
```

**Query approach:** The relational API (`db.query`) doesn't support `limit`/`offset` with `count` easily. Use a two-query approach:
1. `db.select({ count: count() })` for total count
2. `db.query.Candidate.findMany()` with `limit`, `offset`, `orderBy`, and `with` for the page data

The `orderBy` maps: `"name"` → `[lastName, firstName]`, `"email"` → `[email]`.

Include submissions with role, production, and stage:
```ts
with: {
  submissions: {
    with: {
      role: { columns: { id: true, name: true } },
      production: { columns: { id: true, name: true } },
      stage: { columns: { id: true, name: true, type: true, order: true } },
    },
  },
}
```

Return `{ candidates, totalCount, page, pageSize }`.

### 2. Rewrite `CandidatesTable` (`src/components/candidates/candidates-table.tsx`)

Server component (no `"use client"`) that receives the paginated data + current sort/page state.

**Columns:** Name (sortable), Email (sortable), Roles

**Name column:** Display as "Last, First" (current behavior).

**Sort headers:** Each sortable header is an `<a>` link that updates the URL search params (`?sort=name&dir=desc&page=1`). Show `ArrowUpIcon` / `ArrowDownIcon` from lucide-react for the active sort column.

**Roles cell:** Map over submissions, rendering each as:
```
Production Name — Role Name  [Stage Badge]
```
Use `getStageBadgeProps` and `getStageLabel` from `submission-helpers.ts` for badge styling. Show "No submissions" in muted text if empty.

**Pagination:** Render the existing `Pagination` component (`src/components/common/pagination.tsx`) below the table. Each page link is an `<a>` with updated `?page=N` search params. Show Previous/Next + page numbers with ellipsis for large page counts.

### 3. Update page component (`src/app/(app)/candidates/page.tsx`)

Read `searchParams` from the page props. Parse `sort`, `dir`, `page` from them with sensible defaults (`sort=name`, `dir=asc`, `page=1`). Pass to `getCandidates()` and pass results + params to `CandidatesTable`.

```ts
export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; page?: string }>
}) {
```

## Files to modify

1. `src/actions/candidates/get-candidates.ts` — accept sort/pagination params, return paginated results with count
2. `src/components/candidates/candidates-table.tsx` — rewrite with sort links, roles column, pagination
3. `src/app/(app)/candidates/page.tsx` — read searchParams, pass to query and table

## Existing code to reuse

- `getStageBadgeProps` from `src/lib/submission-helpers.ts` — badge variant/className per stage type
- `getStageLabel` from `src/lib/submission-helpers.ts` — stage display name
- `Badge` from `@/components/common/badge`
- `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` from `@/components/common/table`
- `Pagination` / `PaginationContent` / `PaginationItem` / `PaginationLink` / `PaginationPrevious` / `PaginationNext` / `PaginationEllipsis` from `@/components/common/pagination`
- `PipelineStageData` type from `src/lib/submission-helpers.ts`

## Verification

1. Run `bun run build` to confirm no type errors
2. Visit `/candidates` — should show Name, Email, Roles columns with default sort (name asc)
3. Click Name header — URL updates to `?sort=name&dir=desc`, rows re-sort
4. Click Email header — URL updates to `?sort=email&dir=asc`, rows re-sort
5. Pagination controls appear below table; clicking page 2 updates URL to `?page=2`
6. Roles column shows production + role + stage badge per submission
7. Refresh preserves sort and page state from URL
