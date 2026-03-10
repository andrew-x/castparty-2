import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { RoleFormFieldsEditor } from "@/components/productions/role-form-fields-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRole(roleId)
  return {
    title: role
      ? `${role.name} Submission Form — Castparty`
      : "Role Submission Form — Castparty",
  }
}

export default async function RoleSubmissionFormPage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { id, roleId } = await params
  const role = await getRole(roleId)

  if (!role || role.production.id !== id) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Submission form</h2>
        <RoleFormFieldsEditor
          roleId={role.id}
          fields={role.submissionFormFields}
        />
      </section>
    </div>
  )
}
