import Image from "next/image"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth")

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-group">
      <Image src="/icon.svg" alt="Castparty" width={48} height={48} />
      <div className="w-full rounded-xl border border-border bg-background p-section">
        {children}
      </div>
    </div>
  )
}
