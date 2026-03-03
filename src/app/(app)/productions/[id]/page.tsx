import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRolesWithSubmissions } from "@/actions/productions/get-roles-with-submissions"
import { RolesAccordion } from "@/components/productions/roles-accordion"

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

  const orgSlug = production.organization.slug
  const roles = await getRolesWithSubmissions(production.id)

  return (
    <RolesAccordion
      orgSlug={orgSlug}
      productionSlug={production.slug}
      productionId={production.id}
      initialRoles={roles}
    />
  )
}
