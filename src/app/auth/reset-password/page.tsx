import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Button } from "@/components/common/button"

export const metadata: Metadata = {
  title: "Reset your password — Castparty",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthCard>
      {token ? (
        <div className="flex flex-col gap-group">
          <h1 className="font-serif text-heading">Reset your password</h1>
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <div className="flex flex-col gap-group">
          <div className="flex flex-col gap-block">
            <h1 className="font-serif text-heading">Invalid reset link</h1>
            <p className="text-body text-muted-foreground">
              This reset link is invalid or has expired. Request a new one to
              reset your password.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/forgot-password">Request a new link</Link>
          </Button>
        </div>
      )}
    </AuthCard>
  )
}
