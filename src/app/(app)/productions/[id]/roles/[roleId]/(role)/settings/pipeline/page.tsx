import { notFound } from "next/navigation"
import { getRole } from "@/actions/productions/get-role"
import { getRoleStagesWithCounts } from "@/actions/productions/get-role-stages-with-counts"
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

  const stagesWithCounts = await getRoleStagesWithCounts(role.id)

  const stages = stagesWithCounts.map(({ submissionCount, ...stage }) => stage)
  const submissionCounts: Record<string, number> = {}
  for (const s of stagesWithCounts) {
    submissionCounts[s.id] = s.submissionCount ?? 0
  }

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Pipeline stages</h2>
        <RoleStagesEditor
          roleId={role.id}
          stages={stages}
          submissionCounts={submissionCounts}
        />
      </section>
    </div>
  )
}
