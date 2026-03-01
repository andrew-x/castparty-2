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

export const metadata: Metadata = {
  title: "Candidates — Castparty",
}

export default async function CandidatesPage() {
  const candidates = await getCandidates()

  if (candidates.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-page">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No candidates yet</EmptyTitle>
            <EmptyDescription>
              Candidates will appear here as they submit for your productions.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <h1 className="font-serif text-title">Candidates</h1>
      <CandidatesTable candidates={candidates} />
    </div>
  )
}
