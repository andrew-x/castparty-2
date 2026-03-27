import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
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
