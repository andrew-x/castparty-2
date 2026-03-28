import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRoles } from "@/actions/productions/get-roles"
import { RolesManager } from "@/components/productions/roles-manager"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `Roles — ${production.name} — Castparty`
      : "Roles — Castparty",
  }
}

export default async function RolesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  const roles = await getRoles(production.id)

  return (
    <RolesManager
      productionId={production.id}
      orgSlug={production.organization.slug}
      productionSlug={production.slug}
      roles={roles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        status: r.status,
      }))}
    />
  )
}
