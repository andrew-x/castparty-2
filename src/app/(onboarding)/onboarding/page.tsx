import type { Metadata } from "next"
import { CreateOrgForm } from "@/components/onboarding/create-org-form"

export const metadata: Metadata = {
  title: "Get started — Castparty",
}

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-col gap-block">
        <h1 className="font-serif text-title">Set up your organization</h1>
        <p className="text-body text-muted-foreground">
          Create an organization to start managing your productions. If you were
          invited to join an existing one, check your email for the invite link.
        </p>
      </div>
      <CreateOrgForm />
    </div>
  )
}
