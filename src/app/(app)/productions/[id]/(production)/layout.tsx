import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/common/breadcrumb"
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
    <div className="flex flex-col gap-group px-page py-section">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/productions">Productions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{production.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-title">{production.name}</h1>
          <PreviewLinkButtons
            url={getAppUrl(
              `/s/${production.organization.slug}/${production.slug}`,
            )}
            href={`/s/${production.organization.slug}/${production.slug}`}
          />
        </div>
        {production.description && (
          <p className="mt-2 text-body text-muted-foreground">
            {production.description}
          </p>
        )}
      </div>
      <ProductionTabNav productionId={production.id} />
      {children}
    </div>
  )
}
