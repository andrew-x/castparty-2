import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCandidate } from "@/actions/candidates/get-candidate"
import { CandidateDetail } from "@/components/candidates/candidate-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ candidateId: string }>
}): Promise<Metadata> {
  const { candidateId } = await params
  const data = await getCandidate(candidateId)
  if (!data) return { title: "Candidate — Castparty" }
  return {
    title: `${data.candidate.firstName} ${data.candidate.lastName} — Castparty`,
  }
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const { candidateId } = await params
  const data = await getCandidate(candidateId)

  if (!data) notFound()

  return (
    <CandidateDetail
      candidate={data.candidate}
      submissions={data.submissions}
    />
  )
}
