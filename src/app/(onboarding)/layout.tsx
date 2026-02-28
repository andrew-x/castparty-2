import Image from "next/image"
import { redirect } from "next/navigation"
import { hasAnyOrganization } from "@/actions/organizations/get-user-memberships"
import { getCurrentUser } from "@/lib/auth"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  const hasOrg = await hasAnyOrganization(user.id)
  if (hasOrg) redirect("/home")

  return (
    <main
      data-slot="onboarding"
      className="flex min-h-svh flex-col items-center justify-center px-page"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, var(--color-brand-subtle) 0%, transparent 70%)",
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-group">
        <Image src="/icon.svg" alt="Castparty" width={48} height={48} />
        <div className="w-full rounded-xl border border-border bg-background p-section">
          {children}
        </div>
      </div>
    </main>
  )
}
