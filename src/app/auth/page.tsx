import type { Metadata } from "next"
import { AuthTabs } from "@/components/auth/auth-tabs"

export const metadata: Metadata = {
  title: "Sign in — Castparty",
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const defaultTab = tab === "signup" ? "signup" : "login"

  return <AuthTabs defaultTab={defaultTab} />
}
