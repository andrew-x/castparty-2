import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRolesWithSubmissions } from "@/actions/productions/get-roles-with-submissions"
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

  const roles = await getRolesWithSubmissions(production.id)

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <div>
        <p className="text-caption text-muted-foreground">{production.name}</p>
        <h1 className="font-serif text-title">Settings</h1>
      </div>

      <ProductionSettingsForm
        productionId={production.id}
        orgSlug={production.organization.slug}
        currentProductionSlug={production.slug}
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
        }))}
      />
    </div>
  )
}
