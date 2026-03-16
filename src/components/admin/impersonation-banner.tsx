"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { authClient } from "@/lib/auth/auth-client"

interface Props {
  userName: string
}

export function ImpersonationBanner({ userName }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleStop() {
    setIsPending(true)
    const { error } = await authClient.admin.stopImpersonating()
    if (error) {
      setIsPending(false)
      return
    }
    router.push("/admin")
    router.refresh()
  }

  return (
    <Alert>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You are impersonating <strong>{userName}</strong>
        </span>
        <Button size="sm" disabled={isPending} onClick={handleStop}>
          {isPending ? "Stopping..." : "Stop impersonating"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
