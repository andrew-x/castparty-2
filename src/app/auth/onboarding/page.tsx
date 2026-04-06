import type { Metadata } from "next"
import { getUserInvitations } from "@/actions/organizations/get-user-invitations"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"

export const metadata: Metadata = {
  title: "Get started — Castparty",
}

export default async function OnboardingPage() {
  const pendingInvitations = await getUserInvitations().catch(() => [])

  return <OnboardingFlow pendingInvitations={pendingInvitations} />
}
