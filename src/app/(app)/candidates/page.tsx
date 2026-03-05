import { UsersIcon } from "lucide-react"
import type { Metadata } from "next"
import { getCandidates } from "@/actions/candidates/get-candidates"
import { CandidatesTable } from "@/components/candidates/candidates-table"
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

const VALID_SORTS = ["name", "email"] as const
const VALID_DIRS = ["asc", "desc"] as const

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string
    dir?: string
    page?: string
    search?: string
  }>
}) {
  const params = await searchParams

  const sort = VALID_SORTS.includes(params.sort as (typeof VALID_SORTS)[number])
    ? (params.sort as (typeof VALID_SORTS)[number])
    : "name"
  const dir = VALID_DIRS.includes(params.dir as (typeof VALID_DIRS)[number])
    ? (params.dir as (typeof VALID_DIRS)[number])
    : "asc"
  const page = Math.max(1, Number(params.page) || 1)
  const search = params.search ?? ""

  const result = await getCandidates({ sort, dir, page, search })

  return (
    <Page>
      <PageHeader title="Candidates" />
      <PageContent>
        {result.totalCount === 0 && !search ? (
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
          <CandidatesTable
            candidates={result.candidates}
            sort={sort}
            dir={dir}
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            search={search}
          />
        )}
      </PageContent>
    </Page>
  )
}
