import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { RoleStagesEditor } from "@/components/productions/role-stages-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRole(roleId)
  return {
    title: role
      ? `${role.name} Pipeline — Castparty`
      : "Role Pipeline — Castparty",
  }
}

export default async function RolePipelinePage({
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
        <h2 className="font-serif text-heading">Pipeline stages</h2>
        <RoleStagesEditor roleId={role.id} stages={role.pipelineStages} />
      </section>
    </div>
  )
}
