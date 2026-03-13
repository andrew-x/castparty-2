import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { DefaultFeedbackFormFieldsEditor } from "@/components/productions/default-feedback-form-fields-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} Feedback Form — Castparty`
      : "Feedback Form — Castparty",
  }
}

export default async function ProductionFeedbackFormPage({
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
    <DefaultFeedbackFormFieldsEditor
      productionId={production.id}
      fields={production.feedbackFormFields}
    />
  )
}
