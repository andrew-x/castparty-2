import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getOrganization } from "@/actions/organizations/get-organization"
import { Separator } from "@/components/common/separator"
import { MembersTable } from "@/components/organizations/members-table"
import { OrgSettingsForm } from "@/components/organizations/org-settings-form"
import { getCurrentUser, getSession } from "@/lib/auth"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const metadata: Metadata = {
  title: "Settings — Castparty",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const session = await getSession()
  const activeOrgId = session?.session?.activeOrganizationId
  if (!activeOrgId) redirect("/home")

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.organizationId, activeOrgId), eq(member.userId, user.id)),
    )
    .limit(1)

  if (!membership || !["owner", "admin"].includes(membership.role)) {
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
