import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRolesWithSubmissions } from "@/actions/productions/get-roles-with-submissions"
import { RolesList } from "@/components/productions/roles-list"

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

  const roles = await getRolesWithSubmissions(production.id)

  return (
    <RolesList
      productionId={production.id}
      roles={roles.map((r) => ({
        id: r.id,
        name: r.name,
        submissionCount: r.submissions.length,
      }))}
    />
  )
}
