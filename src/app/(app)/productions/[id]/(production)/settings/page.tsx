import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getProductionStages } from "@/actions/productions/get-production-stages"
import { Separator } from "@/components/common/separator"
import { DefaultStagesEditor } from "@/components/productions/default-stages-editor"
import { ProductionSettingsForm } from "@/components/productions/production-settings-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} Settings — Castparty`
      : "Settings — Castparty",
  }
}

export default async function ProductionSettingsPage({
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
    <div className="flex flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Production</h2>
        <ProductionSettingsForm
          productionId={production.id}
          orgSlug={production.organization.slug}
          currentName={production.name}
          currentSlug={production.slug}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Pipeline Stages</h2>
        <DefaultStagesEditor productionId={production.id} stages={stages} />
      </section>
    </div>
  )
}
