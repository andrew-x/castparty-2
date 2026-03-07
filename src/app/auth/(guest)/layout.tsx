import { redirect } from "next/navigation"
import { AuthCard } from "@/components/auth/auth-card"
import { getCurrentUser } from "@/lib/auth"

export default async function GuestOnlyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (user) redirect("/home")

  return <AuthCard>{children}</AuthCard>
}
