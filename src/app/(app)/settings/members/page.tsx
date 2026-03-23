import { redirect } from "next/navigation"
import { getOrgInvitations } from "@/actions/organizations/get-org-invitations"
import { getOrganization } from "@/actions/organizations/get-organization"
import { MembersTable } from "@/components/organizations/members-table"
import { getCurrentUser, getSession } from "@/lib/auth"

export default async function MembersSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const session = await getSession()
  const activeOrgId = session?.session?.activeOrganizationId
  if (!activeOrgId) redirect("/home")

  const [orgData, pendingInvitations] = await Promise.all([
    getOrganization(activeOrgId),
    getOrgInvitations(activeOrgId),
  ])

  return (
    <div className="mx-auto flex w-full max-w-page-content flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Members</h2>
        <MembersTable
          organizationId={activeOrgId}
          members={orgData.members}
          currentUserRole={orgData.currentUserRole}
          currentUserId={user.id}
          pendingInvitations={pendingInvitations}
        />
      </section>
    </div>
  )
}
