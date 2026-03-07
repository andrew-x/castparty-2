import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset your password — Castparty",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-group">
      <h1 className="font-serif text-heading">Reset your password</h1>
      <ForgotPasswordForm />
      <Link
        href="/auth"
        className="text-label text-muted-foreground hover:text-foreground"
      >
        Back to sign in
      </Link>
    </div>
  )
}
