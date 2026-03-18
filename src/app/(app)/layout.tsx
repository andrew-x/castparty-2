import { redirect } from "next/navigation"
import { getUserInvitations } from "@/actions/organizations/get-user-invitations"
import { hasAnyOrganization } from "@/actions/organizations/get-user-memberships"
import { getUserOrganizations } from "@/actions/organizations/get-user-organizations"
import { TopNav } from "@/components/app/top-nav"
import { getCurrentUser, getSession } from "@/lib/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const hasOrg = await hasAnyOrganization(user.id)
  if (!hasOrg) redirect("/onboarding")

  const [session, organizations, pendingInvitations] = await Promise.all([
    getSession(),
    getUserOrganizations(),
    getUserInvitations().catch(() => []),
  ])

  const activeOrgId = session?.session?.activeOrganizationId ?? null
  const activeOrg = organizations.find((o) => o.id === activeOrgId)

  return (
    <>
      <TopNav
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        organizations={organizations}
        activeOrgId={activeOrgId}
        activeOrgRole={activeOrg?.role ?? null}
        pendingInvitations={pendingInvitations}
      />
      <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col">
        {children}
      </main>
    </>
  )
}
