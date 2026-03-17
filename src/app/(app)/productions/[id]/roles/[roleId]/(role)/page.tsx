import { notFound } from "next/navigation"
import { getRoleWithSubmissions } from "@/actions/productions/get-role-with-submissions"
import { RoleSubmissions } from "@/components/productions/role-submissions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRoleWithSubmissions(roleId)
  return {
    title: role ? `${role.name} — Castparty` : "Role — Castparty",
  }
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { id, roleId } = await params
  const role = await getRoleWithSubmissions(roleId)

  if (!role || role.production.id !== id) {
    notFound()
  }

  return (
    <RoleSubmissions
      productionId={id}
      roleId={roleId}
      submissions={role.submissions}
      pipelineStages={role.pipelineStages}
      submissionFormFields={role.submissionFormFields}
      feedbackFormFields={role.feedbackFormFields}
      rejectReasons={role.rejectReasons}
    />
  )
}
