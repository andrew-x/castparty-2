import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getMemberRole } from "@/actions/organizations/get-member-role"
import {
  Page,
  PageBody,
  PageContent,
  PageHeader,
} from "@/components/common/page"
import { SettingsSubNav } from "@/components/settings/settings-sub-nav"
import { getCurrentUser, getSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Settings — Castparty",
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const session = await getSession()
  const activeOrgId = session?.session?.activeOrganizationId
  if (!activeOrgId) redirect("/home")

  const role = await getMemberRole(activeOrgId, user.id)
  if (!role || !["owner", "admin"].includes(role)) {
    redirect("/home")
  }

  return (
    <Page>
      <PageHeader title="Settings" />
      <PageBody nav={<SettingsSubNav />}>
        <PageContent>{children}</PageContent>
      </PageBody>
    </Page>
  )
}
