import { UsersIcon } from "lucide-react"
import type { Metadata } from "next"
import { getCandidateFilterOptions } from "@/actions/candidates/get-candidate-filter-options"
import { getCandidates } from "@/actions/candidates/get-candidates"
import { CandidatesGrid } from "@/components/candidates/candidates-grid"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Page, PageContent, PageHeader } from "@/components/common/page"

export const metadata: Metadata = {
  title: "Candidates — Castparty",
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    productions?: string
    roles?: string
  }>
}) {
  const params = await searchParams

  const page = Math.max(1, Number(params.page) || 1)
  const search = params.search ?? ""
  const selectedProductions =
    params.productions?.split(",").filter(Boolean) ?? []
  const selectedRoles = params.roles?.split(",").filter(Boolean) ?? []

  const [result, filterOptions] = await Promise.all([
    getCandidates({
      page,
      search,
      productionIds:
        selectedProductions.length > 0 ? selectedProductions : undefined,
      roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
    }),
    getCandidateFilterOptions(),
  ])

  const hasFilters =
    !!search || selectedProductions.length > 0 || selectedRoles.length > 0

  return (
    <Page>
      <PageHeader title="Candidates" />
      <PageContent>
        {result.totalCount === 0 && !hasFilters ? (
          <div className="flex flex-1 items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No candidates yet</EmptyTitle>
                <EmptyDescription>
                  Candidates will appear here as they submit for your
                  productions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <CandidatesGrid
            candidates={result.candidates}
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            search={search}
            productions={filterOptions}
            selectedProductions={selectedProductions}
            selectedRoles={selectedRoles}
          />
        )}
      </PageContent>
    </Page>
  )
}
