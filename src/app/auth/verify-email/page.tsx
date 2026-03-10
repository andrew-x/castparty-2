import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/common/button"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Verify your email — Castparty",
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let verified = false
  if (token) {
    try {
      const result = await auth.api.verifyEmail({ query: { token } })
      verified = !!result?.status
    } catch {
      // Invalid or expired token — verified stays false
    }
  }

  return (
    <AuthCard>
      {verified ? (
        <div className="flex flex-col gap-group">
          <div className="flex flex-col gap-block">
            <h1 className="font-serif text-heading">Email verified</h1>
            <p className="text-body text-muted-foreground">
              Your email has been verified. You're all set.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/home">Continue to Castparty</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-group">
          <div className="flex flex-col gap-block">
            <h1 className="font-serif text-heading">Verification failed</h1>
            <p className="text-body text-muted-foreground">
              This verification link is invalid or has expired. Request a new
              one from your settings page.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth">Go to sign in</Link>
          </Button>
        </div>
      )}
    </AuthCard>
  )
}
