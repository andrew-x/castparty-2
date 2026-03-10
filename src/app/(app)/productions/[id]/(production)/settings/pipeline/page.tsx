import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getProductionStages } from "@/actions/productions/get-production-stages"
import { DefaultStagesEditor } from "@/components/productions/default-stages-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} Pipeline — Castparty`
      : "Pipeline — Castparty",
  }
}

export default async function ProductionPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  const stages = await getProductionStages(production.id)

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Pipeline stages</h2>
        <DefaultStagesEditor productionId={production.id} stages={stages} />
      </section>
    </div>
  )
}
