import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { hasAnyOrganization } from "@/actions/organizations/get-user-memberships"
import { AppSidebar } from "@/components/app/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/common/sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const hasOrg = await hasAnyOrganization(user.id)
  if (!hasOrg) redirect("/onboarding")

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
      />
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-12 items-center px-4 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
