import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getMemberRole } from "@/actions/organizations/get-member-role"
import { getOrganization } from "@/actions/organizations/get-organization"
import { Separator } from "@/components/common/separator"
import { MembersTable } from "@/components/organizations/members-table"
import { OrgSettingsForm } from "@/components/organizations/org-settings-form"
import { getCurrentUser, getSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Settings — Castparty",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const session = await getSession()
  const activeOrgId = session?.session?.activeOrganizationId
  if (!activeOrgId) redirect("/home")

  const role = await getMemberRole(activeOrgId, user.id)

  if (!role || !["owner", "admin"].includes(role)) {
    redirect("/home")
  }

  const orgData = await getOrganization(activeOrgId)

  return (
    <div className="flex flex-1 flex-col px-page py-page">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-section">
        <h1 className="font-serif text-title">Settings</h1>

        <section className="flex flex-col gap-group">
          <h2 className="font-serif text-heading">General</h2>
          <OrgSettingsForm
            organizationId={activeOrgId}
            currentName={orgData.organization.name}
          />
        </section>

        <Separator />

        <section className="flex flex-col gap-group">
          <h2 className="font-serif text-heading">Members</h2>
          <MembersTable
            organizationId={activeOrgId}
            members={orgData.members}
            currentUserRole={orgData.currentUserRole}
            currentUserId={user.id}
          />
        </section>
      </div>
    </div>
  )
}
