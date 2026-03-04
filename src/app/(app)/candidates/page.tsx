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

export default async function CandidatesPage() {
  const candidates = await getCandidates()

  return (
    <Page>
      <PageHeader title="Candidates" />
      <PageContent>
        {candidates.length === 0 ? (
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
          <CandidatesTable candidates={candidates} />
        )}
      </PageContent>
    </Page>
  )
}
