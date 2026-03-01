import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRoles } from "@/actions/productions/get-roles"
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

  const roles = await getRoles(production.id)

  return (
    <div className="flex flex-col gap-section px-page py-section">
      <div>
        <h1 className="font-serif text-title">{production.name}</h1>
        {production.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {production.description}
          </p>
        )}
      </div>
      <RolesList productionId={production.id} initialRoles={roles} />
    </div>
  )
}
