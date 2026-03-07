"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { authClient } from "@/lib/auth/auth-client"

export function AcceptInvitationCard({
  invitationId,
}: {
  invitationId: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    const { error: authError } = await authClient.organization.acceptInvitation(
      { invitationId },
    )

    if (authError) {
      setError(authError.message ?? "Something went wrong. Try again.")
      setAccepting(false)
      return
    }

    router.push("/home")
  }

  async function handleDecline() {
    setDeclining(true)
    setError(null)
    const { error: authError } = await authClient.organization.rejectInvitation(
      { invitationId },
    )

    if (authError) {
      setError(authError.message ?? "Something went wrong. Try again.")
      setDeclining(false)
      return
    }

    router.push("/home")
  }

  return (
    <div className="flex flex-col gap-group">
      <h1 className="font-serif text-heading">You've been invited</h1>
      <p className="text-body text-muted-foreground">
        You have a pending invitation to join an organization on Castparty.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-element">
        <Button
          onClick={handleAccept}
          loading={accepting}
          disabled={declining}
          className="flex-1"
        >
          Accept
        </Button>
        <Button
          variant="outline"
          onClick={handleDecline}
          loading={declining}
          disabled={accepting}
          className="flex-1"
        >
          Decline
        </Button>
      </div>
    </div>
  )
}
