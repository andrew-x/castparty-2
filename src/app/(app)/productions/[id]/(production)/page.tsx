import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getProductionSubmissions } from "@/actions/productions/get-production-submissions"
import { ProductionSubmissions } from "@/components/productions/production-submissions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} — Castparty`
      : "Production — Castparty",
  }
}

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  const data = await getProductionSubmissions(production.id)

  if (!data) {
    notFound()
  }

  return (
    <ProductionSubmissions
      productionId={production.id}
      roles={data.roles}
      submissions={data.submissions}
      pipelineStages={data.pipelineStages}
      submissionFormFields={data.submissionFormFields}
      feedbackFormFields={data.feedbackFormFields}
      rejectReasons={data.rejectReasons}
      otherRoleSubmissions={data.otherRoleSubmissions}
    />
  )
}
