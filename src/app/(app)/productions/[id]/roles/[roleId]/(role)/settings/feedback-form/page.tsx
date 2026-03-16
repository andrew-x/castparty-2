import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { RoleFeedbackFormFieldsEditor } from "@/components/productions/role-feedback-form-fields-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRole(roleId)
  return {
    title: role
      ? `${role.name} Feedback Form — Castparty`
      : "Role Feedback Form — Castparty",
  }
}

export default async function RoleFeedbackFormPage({
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
    <RoleFeedbackFormFieldsEditor
      roleId={role.id}
      fields={role.feedbackFormFields}
    />
  )
}
