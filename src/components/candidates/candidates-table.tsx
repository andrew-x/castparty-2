import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from "lucide-react"
import Link from "next/link"
import { CandidateSearch } from "@/components/candidates/candidate-search"
import { Badge } from "@/components/common/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/common/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import type { PipelineStageData } from "@/lib/submission-helpers"
import { getStageBadgeProps } from "@/lib/submission-helpers"

type Sort = "name" | "email"
type Dir = "asc" | "desc"

interface Submission {
  id: string
  role: { id: string; name: string } | null
  production: { id: string; name: string } | null
  stage: PipelineStageData | null
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  submissions: Submission[]
}

interface Props {
  candidates: Candidate[]
  sort: Sort
  dir: Dir
  page: number
  pageSize: number
  totalCount: number
  search: string
}

function buildSearchParams(overrides: Record<string, string | number>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, String(value))
  }
  return `?${params.toString()}`
}

function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  search,
}: {
  label: string
  column: Sort
  currentSort: Sort
  currentDir: Dir
  search: string
}) {
  const isActive = currentSort === column
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc"
  const href = buildSearchParams({
    sort: column,
    dir: nextDir,
    page: 1,
    ...(search && { search }),
  })

  return (
    <TableHead>
      <Link
        href={href}
        className="inline-flex items-center gap-element text-muted-foreground hover:text-foreground"
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3.5 opacity-40" />
        )}
      </Link>
    </TableHead>
  )
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) pages.push("ellipsis")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("ellipsis")

  pages.push(total)
  return pages
}

export function CandidatesTable({
  candidates,
  sort,
  dir,
  page,
  pageSize,
  totalCount,
  search,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="flex flex-col gap-group">
      <CandidateSearch defaultValue={search} />
      {candidates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>
              {search ? "No candidates found" : "No candidates yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? "No candidates match your search. Try a different name or email."
                : "Candidates will appear here once they submit an audition."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader
                  label="Name"
                  column="name"
                  currentSort={sort}
                  currentDir={dir}
                  search={search}
                />
                <SortHeader
                  label="Email"
                  column="email"
                  currentSort={sort}
                  currentDir={dir}
                  search={search}
                />
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium text-foreground">
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {candidate.firstName} {candidate.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {candidate.email}
                  </TableCell>
                  <TableCell>
                    {candidate.submissions.length > 0 ? (
                      <div className="flex flex-col gap-element">
                        {candidate.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-element text-label"
                          >
                            {sub.production && sub.role ? (
                              <Link
                                href={`/productions/${sub.production.id}/roles/${sub.role.id}`}
                                className="text-foreground underline-offset-4 hover:underline"
                              >
                                {sub.production.name} / {sub.role.name}
                              </Link>
                            ) : (
                              <span className="text-foreground">
                                {sub.production?.name ?? "Unknown"} /{" "}
                                {sub.role?.name ?? "Unknown"}
                              </span>
                            )}
                            {sub.stage && (
                              <Badge {...getStageBadgeProps(sub.stage)}>
                                {sub.stage.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-label text-muted-foreground">
                        No submissions
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildSearchParams({
                        sort,
                        dir,
                        page: page - 1,
                        ...(search && { search }),
                      })}
                    />
                  </PaginationItem>
                )}
                {getPageNumbers(page, totalPages).map((p, idx) =>
                  p === "ellipsis" ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items are static separators that don't reorder
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href={buildSearchParams({
                          sort,
                          dir,
                          page: p,
                          ...(search && { search }),
                        })}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={buildSearchParams({
                        sort,
                        dir,
                        page: page + 1,
                        ...(search && { search }),
                      })}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
