import { LinkIcon, SettingsIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getRolesWithSubmissions } from "@/actions/productions/get-roles-with-submissions"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
import { RolesAccordion } from "@/components/productions/roles-accordion"
import { getAppUrl } from "@/lib/url"

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
    <div className="flex flex-col gap-section px-page py-section">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-title">{production.name}</h1>
          {production.description && (
            <p className="mt-2 text-body text-muted-foreground">
              {production.description}
            </p>
          )}
        </div>
        <Button
          href={`/productions/${production.id}/settings`}
          variant="outline"
          size="sm"
          leftSection={<SettingsIcon />}
        >
          Settings
        </Button>
      </div>
      <div className="flex flex-col gap-element rounded-lg border p-group">
        <p className="text-label text-muted-foreground">
          Production audition link
        </p>
        <div className="flex items-center gap-element">
          <p className="break-all font-mono text-caption text-foreground">
            /s/{orgSlug}/{production.slug}
          </p>
          <CopyButton value={getAppUrl(`/s/${orgSlug}/${production.slug}`)} />
        </div>
        <Button
          href={`/s/${orgSlug}/${production.slug}`}
          variant="outline"
          size="sm"
          leftSection={<LinkIcon />}
          className="w-fit"
        >
          View audition page
        </Button>
      </div>
      <RolesAccordion
        orgSlug={orgSlug}
        productionSlug={production.slug}
        productionId={production.id}
        initialRoles={roles}
      />
    </div>
  )
}
