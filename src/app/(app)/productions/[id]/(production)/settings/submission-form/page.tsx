import { notFound } from "next/navigation"
import { getProduction } from "@/actions/productions/get-production"
import { DefaultFormFieldsEditor } from "@/components/productions/form-fields-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const production = await getProduction(id)
  return {
    title: production
      ? `${production.name} Submission Form — Castparty`
      : "Submission Form — Castparty",
  }
}

export default async function ProductionSubmissionFormPage({
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
        <h2 className="font-serif text-heading">Submission form</h2>
        <DefaultFormFieldsEditor
          productionId={production.id}
          fields={production.submissionFormFields}
        />
      </section>
    </div>
  )
}
