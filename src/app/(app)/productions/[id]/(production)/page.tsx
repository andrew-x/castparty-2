import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { getProductionDashboard } from "@/actions/productions/get-production-dashboard"
import { ProductionDashboard } from "@/components/productions/dashboard/production-dashboard"
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

export default async function ProductionHomePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  const data = await getProductionDashboard(production.id)

  if (!data) {
    notFound()
  }

  const shareUrl = getAppUrl(
    `/s/${production.organization.slug}/${production.slug}`,
  )
  const shareHref = `/s/${production.organization.slug}/${production.slug}`

  return (
    <ProductionDashboard
      submissions={data.submissions}
      pipelineStages={data.pipelineStages}
      roles={data.roles}
      rejectReasons={data.rejectReasons}
      recentEmails={data.recentEmails}
      recentActivity={data.recentActivity}
      productionStatus={production.status}
      shareUrl={shareUrl}
      shareHref={shareHref}
    />
  )
}
