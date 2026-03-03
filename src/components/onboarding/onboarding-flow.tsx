"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import { Button } from "@/components/common/button"
import { CreateOrgForm } from "@/components/onboarding/create-org-form"
import { InviteTeamForm } from "@/components/onboarding/invite-team-form"
import { OnboardingInvitationList } from "@/components/onboarding/onboarding-invitation-list"

type Step =
  | "pending-invites"
  | "create-org"
  | "invite-team"
  | "accept-remaining"

interface Props {
  pendingInvitations?: UserInvitation[]
}

export function OnboardingFlow({ pendingInvitations = [] }: Props) {
  const router = useRouter()
  const hasInvitations = pendingInvitations.length > 0

  const [step, setStep] = useState<Step>(
    hasInvitations ? "pending-invites" : "create-org",
  )
  const [orgId, setOrgId] = useState("")
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [acceptedCount, setAcceptedCount] = useState(0)

  const unresolvedInvitations = pendingInvitations.filter(
    (inv) => !resolvedIds.has(inv.id),
  )

  const handleAccept = useCallback((id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id))
    setAcceptedCount((prev) => prev + 1)
  }, [])

  const handleIgnore = useCallback((id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id))
  }, [])

  function handleFinish() {
    router.refresh()
    router.push("/home")
  }

  function handleOrgCreated(organizationId: string) {
    setOrgId(organizationId)
    setStep("invite-team")
  }

  function handleInviteTeamContinue() {
    if (unresolvedInvitations.length > 0) {
      setStep("accept-remaining")
    } else {
      handleFinish()
    }
  }

  if (step === "pending-invites") {
    return (
      <div className="flex flex-col gap-group">
        <div className="flex flex-col gap-block">
          <h1 className="font-serif text-title">You've been invited</h1>
          <p className="text-body text-muted-foreground">
            You have invitations to join existing organizations.
          </p>
        </div>

        <OnboardingInvitationList
          invitations={unresolvedInvitations}
          onAccept={handleAccept}
          onIgnore={handleIgnore}
        />

        <div className="flex flex-col gap-element">
          <Button
            onClick={handleFinish}
            disabled={acceptedCount === 0}
            className="w-full"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep("create-org")}
            className="w-full"
          >
            Or create your own organization
          </Button>
        </div>
      </div>
    )
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
        <InviteTeamForm
          organizationId={orgId}
          onContinue={
            unresolvedInvitations.length > 0
              ? handleInviteTeamContinue
              : undefined
          }
        />
      </div>
    )
  }

  if (step === "accept-remaining") {
    return (
      <div className="flex flex-col gap-group">
        <div className="flex flex-col gap-block">
          <h1 className="font-serif text-title">Pending invitations</h1>
          <p className="text-body text-muted-foreground">
            You also have invitations from other organizations.
          </p>
        </div>

        <OnboardingInvitationList
          invitations={unresolvedInvitations}
          onAccept={handleAccept}
          onIgnore={handleIgnore}
        />

        <Button onClick={handleFinish} className="w-full">
          {unresolvedInvitations.length === 0 ? "Continue" : "Skip"}
        </Button>
      </div>
    )
  }

  // "create-org" step
  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-col gap-block">
        <h1 className="font-serif text-title">Set up your organization</h1>
        <p className="text-body text-muted-foreground">
          Create an organization to start managing your productions.
        </p>
      </div>
      <CreateOrgForm onComplete={handleOrgCreated} />
    </div>
  )
}
