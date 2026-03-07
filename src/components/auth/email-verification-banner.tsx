"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { authClient } from "@/lib/auth/auth-client"

export function EmailVerificationBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")

  async function handleResend() {
    setStatus("sending")
    await authClient.sendVerificationEmail({
      email,
      callbackURL: "/auth/verify-email",
    })
    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <Alert>
        <AlertTitle>Verification email sent</AlertTitle>
        <AlertDescription>
          Check your inbox for a verification link.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <AlertTitle>Your email is not verified</AlertTitle>
      <AlertDescription className="flex flex-col gap-element">
        <span>
          Verify your email address to make sure you can recover your account.
        </span>
        <Button
          variant="outline"
          size="sm"
          loading={status === "sending"}
          onClick={handleResend}
          className="w-fit"
        >
          Resend verification email
        </Button>
      </AlertDescription>
    </Alert>
  )
}
