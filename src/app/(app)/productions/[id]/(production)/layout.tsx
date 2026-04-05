import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { Badge } from "@/components/common/badge"
import {
  Page,
  PageBody,
  PageContent,
  PageHeader,
} from "@/components/common/page"
import { ProductionShareControls } from "@/components/productions/production-share-controls"
import { ProductionSubNav } from "@/components/productions/production-sub-nav"
import { getAppUrl } from "@/lib/url"

export default async function ProductionLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  const roleCounts = production.roles.reduce(
    (acc, role) => {
      acc[role.status] = (acc[role.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const roleSegments = (["open", "closed", "archive"] as const)
    .filter((s) => roleCounts[s])
    .map((s) => {
      const n = roleCounts[s]
      const label = s === "archive" ? "archived" : s
      return `${n} ${label}`
    })

  const statusLabel =
    production.status === "archive"
      ? "Archived"
      : production.status === "open"
        ? "Open"
        : "Closed"

  const statusVariant =
    production.status === "open"
      ? "default"
      : production.status === "closed"
        ? "secondary"
        : "outline"

  return (
    <Page>
      <PageHeader
        title={production.name}
        description={
          <span className="flex items-center gap-element">
            <Badge
              variant={statusVariant}
              className={
                production.status === "archive" ? "opacity-60" : undefined
              }
            >
              {statusLabel}
            </Badge>
            {roleSegments.length > 0 && (
              <span className="text-muted-foreground">
                {roleSegments.join(", ")}{" "}
                {production.roles.length === 1 ? "role" : "roles"}
              </span>
            )}
          </span>
        }
        breadcrumbs={[
          { label: "Productions", href: "/productions" },
          { label: production.name },
        ]}
        actions={
          <ProductionShareControls
            url={getAppUrl(
              `/s/${production.organization.slug}/${production.slug}`,
            )}
            href={`/s/${production.organization.slug}/${production.slug}`}
            fileName={`${production.slug}-qr`}
          />
        }
      />
      <PageBody nav={<ProductionSubNav productionId={production.id} />}>
        <PageContent>{children}</PageContent>
      </PageBody>
    </Page>
  )
}
