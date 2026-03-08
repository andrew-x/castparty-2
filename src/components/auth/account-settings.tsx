"use client"

import { useState } from "react"
import { Button } from "@/components/common/button"
import { authClient } from "@/lib/auth/auth-client"

export function AccountSettings({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")

  async function handleResetPassword() {
    setStatus("sending")
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/auth/reset-password",
    })
    setStatus("sent")
  }

  return (
    <div className="flex flex-col gap-group">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-element">
          <p className="font-medium text-label">Email</p>
          <p className="text-caption text-muted-foreground">{email}</p>
        </div>
        <p className="text-caption text-muted-foreground">
          To change your email, contact support.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-element">
          <p className="font-medium text-label">Password</p>
          <p className="text-caption text-muted-foreground">
            {status === "sent"
              ? "Check your inbox for a reset link."
              : "Send a reset link to your email to change your password."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={status === "sending"}
          disabled={status === "sent"}
          onClick={handleResetPassword}
        >
          {status === "sent" ? "Email sent" : "Reset password"}
        </Button>
      </div>
    </div>
  )
}
