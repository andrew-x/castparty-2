import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { updateProductionRejectReasons } from "@/actions/productions/update-production-reject-reasons"
import { RejectReasonsEditor } from "@/components/productions/reject-reasons-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} Reject Reasons — Castparty`
      : "Reject Reasons — Castparty",
  }
}

export default async function ProductionRejectReasonsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)

  if (!production) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <RejectReasonsEditor
          entityId={production.id}
          reasons={production.rejectReasons}
          action={updateProductionRejectReasons}
          idField="productionId"
        />
      </section>
    </div>
  )
}
