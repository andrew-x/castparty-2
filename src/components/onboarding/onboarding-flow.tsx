"use client"

import { useState } from "react"
import { CreateOrgForm } from "@/components/onboarding/create-org-form"
import { InviteTeamForm } from "@/components/onboarding/invite-team-form"

type Step = "create-org" | "invite-team"

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("create-org")
  const [orgId, setOrgId] = useState<string>("")

  function handleOrgCreated(organizationId: string) {
    setOrgId(organizationId)
    setStep("invite-team")
  }

  if (step === "invite-team") {
    return (
      <div className="flex flex-col gap-group">
        <div className="flex flex-col gap-block">
          <h1 className="font-serif text-title">Invite your team</h1>
          <p className="text-body text-muted-foreground">
            Add collaborators to help manage your productions. You can always do
            this later from settings.
          </p>
        </div>
        <InviteTeamForm organizationId={orgId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-col gap-block">
        <h1 className="font-serif text-title">Set up your organization</h1>
        <p className="text-body text-muted-foreground">
          Create an organization to start managing your productions. If you were
          invited to join an existing one, check your email for the invite link.
        </p>
      </div>
      <CreateOrgForm onComplete={handleOrgCreated} />
    </div>
  )
}
