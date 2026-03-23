import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
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

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">General</h2>
        <ProductionSettingsForm
          productionId={production.id}
          orgSlug={production.organization.slug}
          currentName={production.name}
          currentLocation={production.location}
          currentSlug={production.slug}
          isOpen={production.isOpen}
          isArchived={production.isArchived}
        />
      </section>
    </div>
  )
}
