import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { updateRoleRejectReasons } from "@/actions/productions/update-role-reject-reasons"
import { RejectReasonsEditor } from "@/components/productions/reject-reasons-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>
}) {
  const { roleId } = await params
  const role = await getRole(roleId)
  return {
    title: role
      ? `${role.name} Reject Reasons — Castparty`
      : "Role Reject Reasons — Castparty",
  }
}

export default async function RoleRejectReasonsPage({
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
        <RejectReasonsEditor
          entityId={role.id}
          reasons={role.rejectReasons}
          action={updateRoleRejectReasons}
          idField="roleId"
        />
      </section>
    </div>
  )
}
