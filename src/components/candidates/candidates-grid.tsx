import { SearchIcon } from "lucide-react"
import { CandidateCard } from "@/components/candidates/candidate-card"
import { CandidateFilters } from "@/components/candidates/candidate-filters"
import { CandidateSearch } from "@/components/candidates/candidate-search"
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
import type { PipelineStageData } from "@/lib/submission-helpers"

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
  headshotUrl: string | null
  submissions: Submission[]
}

interface FilterOption {
  id: string
  name: string
  roles: { id: string; name: string }[]
}

interface Props {
  candidates: Candidate[]
  page: number
  pageSize: number
  totalCount: number
  search: string
  productions: FilterOption[]
  selectedProductions: string[]
  selectedRoles: string[]
}

function buildSearchParams(overrides: Record<string, string | number>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, String(value))
  }
  return `?${params.toString()}`
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

export function CandidatesGrid({
  candidates,
  page,
  pageSize,
  totalCount,
  search,
  productions,
  selectedProductions,
  selectedRoles,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters = selectedProductions.length > 0 || selectedRoles.length > 0

  const paginationParams = {
    ...(search && { search }),
    ...(selectedProductions.length > 0 && {
      productions: selectedProductions.join(","),
    }),
    ...(selectedRoles.length > 0 && { roles: selectedRoles.join(",") }),
  }

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-wrap items-start gap-element">
        <CandidateSearch defaultValue={search} />
        <CandidateFilters productions={productions} />
      </div>
      {candidates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>
              {search || hasFilters
                ? "No candidates found"
                : "No candidates yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search || hasFilters
                ? "No candidates match your filters. Try different criteria."
                : "Candidates will appear here once they submit an audition."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-block sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildSearchParams({
                        page: page - 1,
                        ...paginationParams,
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
                          page: p,
                          ...paginationParams,
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
                        page: page + 1,
                        ...paginationParams,
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
