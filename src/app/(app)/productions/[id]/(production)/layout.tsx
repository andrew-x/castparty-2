import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { PreviewLinkButtons } from "@/components/common/preview-link-buttons"
import { ProductionTabNav } from "@/components/productions/production-tab-nav"
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

  return (
    <Page>
      <PageHeader
        title={production.name}
        description={production.description}
        breadcrumbs={[
          { label: "Productions", href: "/productions" },
          { label: production.name },
        ]}
        actions={
          <PreviewLinkButtons
            url={getAppUrl(
              `/s/${production.organization.slug}/${production.slug}`,
            )}
            href={`/s/${production.organization.slug}/${production.slug}`}
          />
        }
        tabs={<ProductionTabNav productionId={production.id} />}
      />
      <PageContent>{children}</PageContent>
    </Page>
  )
}
