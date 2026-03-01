import { LinkIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRoles } from "@/actions/productions/get-roles"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
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
      <div className="flex flex-col gap-element rounded-lg border p-group">
        <p className="text-label text-muted-foreground">
          Production audition link
        </p>
        <div className="flex items-center gap-element">
          <p className="break-all font-mono text-caption text-foreground">
            /submit/{production.organizationId}/{production.id}
          </p>
          <CopyButton
            value={`/submit/${production.organizationId}/${production.id}`}
          />
        </div>
        <Button
          href={`/submit/${production.organizationId}/${production.id}`}
          variant="outline"
          size="sm"
          leftSection={<LinkIcon />}
          className="w-fit"
        >
          View audition page
        </Button>
      </div>
      <RolesList
        orgId={production.organizationId}
        productionId={production.id}
        initialRoles={roles}
      />
    </div>
  )
}
